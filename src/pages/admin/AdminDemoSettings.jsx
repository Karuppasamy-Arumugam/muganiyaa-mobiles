import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleHelp,
  Database,
  MessageSquare,
  Package,
  RefreshCw,
  Tag,
  Wrench,
  XCircle
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { isSupabaseConfigured, supabase } from '../../services/supabaseClient';

export default function AdminDemoSettings() {
  const { db, resetData } = useData();
  const [connection, setConnection] = useState({
    status: 'checking',
    message: 'Checking Supabase connection…',
    checkedAt: null
  });
  const [checking, setChecking] = useState(false);

  const checkSupabaseConnection = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setConnection({
        status: 'local',
        message: 'Supabase is not configured. The app is using local demo data.',
        checkedAt: new Date()
      });
      return;
    }

    setChecking(true);
    setConnection((current) => ({
      ...current,
      status: 'checking',
      message: 'Checking Supabase connection…'
    }));

    try {
      // A lightweight read verifies that the configured Supabase API responds.
      const { error } = await supabase
        .from('products')
        .select('id', { head: true, count: 'exact' });

      if (error) throw error;

      setConnection({
        status: 'connected',
        message: 'Supabase responded successfully.',
        checkedAt: new Date()
      });
    } catch (error) {
      setConnection({
        status: 'error',
        message: error?.message || 'Could not verify the Supabase connection.',
        checkedAt: new Date()
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkSupabaseConnection();
  }, [checkSupabaseConnection]);

  const handleLocalReset = () => {
    const confirmed = window.confirm(
      'Reset local browser demo data to the sample data? This does not change Supabase.'
    );

    if (!confirmed) return;

    resetData();
    window.location.reload();
  };

  const counts = [
    {
      label: 'Products loaded',
      value: (db.products || []).length,
      icon: Package
    },
    {
      label: 'Offers loaded',
      value: (db.offers || []).length,
      icon: Tag
    },
    {
      label: 'Enquiries loaded',
      value: (db.enquiries || []).length,
      icon: MessageSquare
    },
    {
      label: 'Services loaded',
      value: (db.services || []).length,
      icon: Wrench
    }
  ];

  const connectionIcon =
    connection.status === 'connected' ? CheckCircle2 :
    connection.status === 'error' ? XCircle :
    connection.status === 'local' ? CircleHelp :
    Activity;

  const ConnectionIcon = connectionIcon;
  const connectionClass =
    connection.status === 'connected' ? 'text-success' :
    connection.status === 'error' ? 'text-danger' :
    connection.status === 'local' ? 'text-muted' :
    'text-primary';

  return (
    <div className="admin-system-status pb-5">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 fs-3">System Status</h2>
          <p className="text-muted small mb-0">
            Check the app’s Supabase connection and the data currently loaded in the dashboard.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
          onClick={checkSupabaseConnection}
          disabled={checking}
        >
          <RefreshCw size={16} className={checking ? 'spin' : ''} />
          {checking ? 'Checking…' : 'Check connection'}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card p-4 border rounded-4 bg-white shadow-sm h-100">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-3 rounded-circle bg-light text-danger">
                <Database size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-1">Database connection</h5>
                <div className={`small d-flex align-items-center gap-2 ${connectionClass}`}>
                  <ConnectionIcon size={16} />
                  <span>{connection.message}</span>
                </div>
              </div>
            </div>

            {connection.checkedAt && (
              <small className="text-muted mb-4">
                Last checked: {connection.checkedAt.toLocaleString()}
              </small>
            )}

            <div className="row g-3 mt-1">
              {counts.map(({ label, value, icon: Icon }) => (
                <div className="col-6" key={label}>
                  <div className="p-3 bg-light rounded border h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <small className="text-muted">{label}</small>
                      <Icon size={17} className="text-danger" />
                    </div>
                    <div className="fs-4 fw-bold text-dark">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-muted small mt-3 mb-0">
              Counts show records currently loaded by the app. They may be limited by the
              signed-in user’s database permissions.
            </p>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card p-4 border rounded-4 bg-white shadow-sm mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-3 rounded-circle bg-light text-danger">
                <Bot size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-1">AI assistant</h5>
                <small className="text-muted">Configuration is managed on the server</small>
              </div>
            </div>

            <p className="text-muted small mb-0">
              API keys should remain in Supabase Function secrets and are not shown in this
              dashboard. To confirm the assistant works, send a test message through the public
              website chat.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="card p-4 border rounded-4 bg-white shadow-sm border-warning">
              <h5 className="fw-bold text-dark mb-2">Local demo data</h5>
              <p className="text-muted small">
                Restore the sample data saved in this browser. This action does not affect
                Supabase.
              </p>
              <button
                type="button"
                className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
                onClick={handleLocalReset}
              >
                <RefreshCw size={16} />
                Reset local sample data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}