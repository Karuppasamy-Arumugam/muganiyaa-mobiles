CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    (SELECT auth.jwt() ->> 'aal') = 'aal2'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.status = 'active'
        AND p.role IN ('admin', 'owner', 'manager')
    );
$function$;