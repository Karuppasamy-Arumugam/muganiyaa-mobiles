import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);
const ADMIN_ROLES = ['admin', 'owner', 'manager'];

async function checkAdminProfile(userId) {
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Could not verify admin profile:', error.message);
    return false;
  }

  return data?.status === 'active' && ADMIN_ROLES.includes(data.role);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaStep, setMfaStep] = useState(null);
  const [authError, setAuthError] = useState('');

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setMfaStep(null);
    setAuthError('');
    setIsLoading(false);
  }, []);

  const startMfa = useCallback(async () => {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      return { success: false, error: factorsError.message };
    }

    const verifiedTotpFactor = (factorsData?.totp || []).find(
      (factor) => factor.status === 'verified'
    );

    if (verifiedTotpFactor) {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedTotpFactor.id
        });

      if (challengeError) {
        return { success: false, error: challengeError.message };
      }

      setMfaStep({
        kind: 'challenge',
        factorId: verifiedTotpFactor.id,
        challengeId: challengeData.id
      });
      setIsAuthenticated(false);
      setIsLoading(false);

      return { success: true, requiresMfa: true };
    }

    // Remove abandoned, unverified enrollments so the admin can start a fresh setup.
    const unverifiedFactors = (factorsData?.totp || []).filter(
      (factor) => factor.status !== 'verified'
    );

    for (const factor of unverifiedFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });

      if (unenrollError) {
        return { success: false, error: unenrollError.message };
      }
    }

    const { data: enrollData, error: enrollError } =
      await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Muganiyaa Mobiles Admin'
      });

    if (enrollError) {
      return { success: false, error: enrollError.message };
    }

    setMfaStep({
      kind: 'enroll',
      factorId: enrollData.id,
      qrCode: enrollData.totp.qr_code,
      secret: enrollData.totp.secret
    });
    setIsAuthenticated(false);
    setIsLoading(false);

    return { success: true, requiresMfaEnrollment: true };
  }, []);

  const restoreSession = useCallback(async (session) => {
    if (!session?.user) {
      clearAuthState();
      return;
    }

    setIsLoading(true);
    setAuthError('');

    const allowed = await checkAdminProfile(session.user.id);

    if (!allowed) {
      await supabase.auth.signOut();
      clearAuthState();
      setAuthError('This account does not have an active admin profile.');
      return;
    }

    const { data: assuranceData, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      setIsAuthenticated(false);
      setMfaStep(null);
      setAuthError('Could not verify your sign-in security level. Please sign in again.');
      setIsLoading(false);
      return;
    }

    if (assuranceData?.currentLevel === 'aal2') {
      setIsAuthenticated(true);
      setMfaStep(null);
      setIsLoading(false);
      return;
    }

    const result = await startMfa();

    if (!result.success) {
      setIsAuthenticated(false);
      setMfaStep(null);
      setAuthError(result.error || 'Could not start multi-factor authentication.');
    }
  }, [clearAuthState, startMfa]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Avoid calling Supabase Auth APIs inside its auth-state callback.
        setTimeout(() => {
          if (!isMounted) return;

          if (event === 'SIGNED_OUT') {
            clearAuthState();
            return;
          }

          if (event === 'INITIAL_SESSION' && session) {
            void restoreSession(session);
          }

          if (event === 'INITIAL_SESSION' && !session) {
            clearAuthState();
          }
        }, 0);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, restoreSession]);

  async function login(email, password) {
    if (!supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    setAuthError('');
    setMfaStep(null);
    setIsAuthenticated(false);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const allowed = await checkAdminProfile(data.user?.id);

    if (!allowed) {
      await supabase.auth.signOut();
      clearAuthState();

      return {
        success: false,
        error: 'This account does not have an active admin profile.'
      };
    }

    const result = await startMfa();

    if (!result.success) {
      setAuthError(result.error || 'Could not start multi-factor authentication.');
      return result;
    }

    return result;
  }

  async function verifyMfaCode(code) {
    if (!supabase || !mfaStep) {
      return { success: false, error: 'There is no active verification step.' };
    }

    const cleanedCode = String(code || '').replace(/\s/g, '');

    if (!/^\d{6}$/.test(cleanedCode)) {
      return { success: false, error: 'Enter the 6-digit code from your authenticator app.' };
    }

    let challengeId = mfaStep.challengeId;

    if (mfaStep.kind === 'enroll') {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: mfaStep.factorId
        });

      if (challengeError) {
        return { success: false, error: challengeError.message };
      }

      challengeId = challengeData.id;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaStep.factorId,
      challengeId,
      code: cleanedCode
    });

    if (verifyError) {
      return { success: false, error: verifyError.message };
    }

    const { data: assuranceData, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError || assuranceData?.currentLevel !== 'aal2') {
      return {
        success: false,
        error: 'The second verification step could not be confirmed. Please try again.'
      };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return { success: false, error: 'Your session expired. Please sign in again.' };
    }

    const allowed = await checkAdminProfile(userData.user.id);

    if (!allowed) {
      await supabase.auth.signOut();
      clearAuthState();

      return {
        success: false,
        error: 'This account does not have an active admin profile.'
      };
    }

    setMfaStep(null);
    setAuthError('');
    setIsAuthenticated(true);
    setIsLoading(false);

    return { success: true };
  }

  async function cancelMfa() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearAuthState();
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearAuthState();
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        mfaStep,
        authError,
        login,
        verifyMfaCode,
        cancelMfa,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}