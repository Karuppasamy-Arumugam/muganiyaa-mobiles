SET local check_function_bodies = off;

REVOKE ALL ("email") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("message") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("name") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("phone") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("product_id") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("subject") ON TABLE "public"."enquiries" FROM "anon";

REVOKE ALL ("email") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("message") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("name") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("product_id") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("subject") ON TABLE "public"."enquiries" FROM "authenticated";

REVOKE ALL ("brand") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("customer_name") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("device_type") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("model") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("phone") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("preferred_contact_method") ON TABLE "public"."repair_requests" FROM "anon";

REVOKE ALL ("problem_description") ON TABLE "public"."repair_requests" FROM "anon";

DROP POLICY "public submit enquiries" ON "public"."enquiries";

ALTER TABLE "public"."offers"
  DROP COLUMN "description";

CREATE TABLE "public"."brands" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "slug"       text                     NOT NULL,
  "is_active"  boolean                  NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "brands_pkey" PRIMARY KEY (id),
  CONSTRAINT "brands_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."brands"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chat_rate_limits" (
  "fingerprint"       text                     NOT NULL,
  "window_started_at" timestamp with time zone NOT NULL DEFAULT now(),
  "request_count"     integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "chat_rate_limits_pkey" PRIMARY KEY (fingerprint)
);

ALTER TABLE "public"."chat_rate_limits"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."chat_rate_limits" FROM "anon", "authenticated";

CREATE TABLE "public"."enquiry_rate_limits" (
  "fingerprint"       text                     NOT NULL,
  "window_started_at" timestamp with time zone NOT NULL,
  "request_count"     integer                  NOT NULL DEFAULT 1,
  CONSTRAINT "enquiry_rate_limits_pkey" PRIMARY KEY (fingerprint)
);

ALTER TABLE "public"."enquiry_rate_limits"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."enquiry_rate_limits" FROM "anon", "authenticated";

ALTER TABLE "public"."enquiries"
  ADD COLUMN "request_id" uuid;

CREATE OR REPLACE FUNCTION public.consume_chat_rate_limit (
  p_fingerprint text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_count integer;
begin
  if p_fingerprint is null
     or length(p_fingerprint) < 20
     or length(p_fingerprint) > 128 then
    return false;
  end if;

  insert into public.chat_rate_limits as limits (
    fingerprint,
    window_started_at,
    request_count
  )
  values (p_fingerprint, now(), 1)
  on conflict (fingerprint) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - interval '1 minute' then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - interval '1 minute' then 1
      else limits.request_count + 1
    end
  returning request_count into v_count;

  delete from public.chat_rate_limits
  where window_started_at < now() - interval '1 day';

  return v_count <= 10;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."consume_chat_rate_limit"(text) FROM PUBLIC, "anon", "authenticated";

CREATE OR REPLACE FUNCTION public.consume_enquiry_rate_limit (
  p_fingerprint text
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_count integer;
begin
  insert into public.enquiry_rate_limits as limits (
    fingerprint,
    window_started_at,
    request_count
  )
  values (p_fingerprint, now(), 1)
  on conflict (fingerprint) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - interval '15 minutes'
        then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - interval '15 minutes'
        then 1
      else limits.request_count + 1
    end
  returning request_count into v_count;

  delete from public.enquiry_rate_limits
  where window_started_at < now() - interval '1 day';

  return v_count <= 3;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."consume_enquiry_rate_limit"(text) FROM PUBLIC, "anon", "authenticated";

CREATE UNIQUE INDEX brands_name_lower_uidx ON public.brands USING btree (lower(name));

CREATE UNIQUE INDEX enquiries_request_id_unique ON public.enquiries USING btree (request_id)
  WHERE (request_id IS NOT NULL);

CREATE POLICY "Admins can delete brands" ON "public"."brands"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Admins can insert brands" ON "public"."brands"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Admins can update brands" ON "public"."brands"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_admin() AS is_admin))
  WITH CHECK (( SELECT public.is_admin() AS is_admin));

CREATE POLICY "Public can read active brands" ON "public"."brands"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_active OR ( SELECT public.is_admin() AS is_admin)));

REVOKE ALL ON FUNCTION "public"."consume_chat_rate_limit"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."consume_chat_rate_limit"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."consume_chat_rate_limit"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."consume_enquiry_rate_limit"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."consume_enquiry_rate_limit"(text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."consume_enquiry_rate_limit"(text) TO "service_role";

REVOKE ALL ON TABLE "public"."banners" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."banners" TO "anon";

REVOKE ALL ON TABLE "public"."banners" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."banners" TO "authenticated";

REVOKE ALL ON TABLE "public"."banners" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."banners" TO "service_role";

REVOKE ALL ON TABLE "public"."brands" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."brands" TO "anon";

REVOKE ALL ON TABLE "public"."brands" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."brands" TO "authenticated";

REVOKE ALL ON TABLE "public"."brands" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."brands" TO "postgres";

REVOKE ALL ON TABLE "public"."brands" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."brands" TO "service_role";

REVOKE ALL ON TABLE "public"."categories" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."categories" TO "anon";

REVOKE ALL ON TABLE "public"."categories" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."categories" TO "authenticated";

REVOKE ALL ON TABLE "public"."categories" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."categories" TO "service_role";

REVOKE ALL ON TABLE "public"."chat_rate_limits" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_rate_limits" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_rate_limits" TO "service_role";

REVOKE ALL ON TABLE "public"."chatbot_faqs" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."chatbot_faqs" TO "anon";

REVOKE ALL ON TABLE "public"."chatbot_faqs" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."chatbot_faqs" TO "authenticated";

REVOKE ALL ON TABLE "public"."chatbot_faqs" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."chatbot_faqs" TO "service_role";

REVOKE ALL ON TABLE "public"."enquiries" FROM "anon";

GRANT MAINTAIN ON TABLE "public"."enquiries" TO "anon";

REVOKE ALL ON TABLE "public"."enquiries" FROM "authenticated";

GRANT DELETE, MAINTAIN, SELECT, UPDATE ON TABLE "public"."enquiries" TO "authenticated";

REVOKE ALL ON TABLE "public"."enquiries" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."enquiries" TO "service_role";

REVOKE ALL ON TABLE "public"."enquiry_rate_limits" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."enquiry_rate_limits" TO "postgres";

REVOKE ALL ON TABLE "public"."enquiry_rate_limits" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."enquiry_rate_limits" TO "service_role";

REVOKE ALL ON TABLE "public"."offers" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."offers" TO "anon";

REVOKE ALL ON TABLE "public"."offers" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."offers" TO "authenticated";

REVOKE ALL ON TABLE "public"."offers" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."offers" TO "service_role";

REVOKE ALL ON TABLE "public"."product_images" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."product_images" TO "anon";

REVOKE ALL ON TABLE "public"."product_images" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_images" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_images" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_images" TO "service_role";

REVOKE ALL ON TABLE "public"."product_offers" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."product_offers" TO "anon";

REVOKE ALL ON TABLE "public"."product_offers" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_offers" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_offers" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_offers" TO "service_role";

REVOKE ALL ON TABLE "public"."product_specifications" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."product_specifications" TO "anon";

REVOKE ALL ON TABLE "public"."product_specifications" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_specifications" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_specifications" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_specifications" TO "service_role";

REVOKE ALL ON TABLE "public"."product_variants" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."product_variants" TO "anon";

REVOKE ALL ON TABLE "public"."product_variants" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_variants" TO "authenticated";

REVOKE ALL ON TABLE "public"."product_variants" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."product_variants" TO "service_role";

REVOKE ALL ON TABLE "public"."products" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."products" TO "anon";

REVOKE ALL ON TABLE "public"."products" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."products" TO "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."products" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."repair_requests" FROM "anon";

GRANT INSERT, MAINTAIN, SELECT ON TABLE "public"."repair_requests" TO "anon";

REVOKE ALL ON TABLE "public"."repair_requests" FROM "authenticated";

REVOKE ALL ("brand") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("brand") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("customer_name") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("customer_name") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("device_type") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("device_type") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("model") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("model") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("phone") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("preferred_contact_method") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("preferred_contact_method") ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ("problem_description") ON TABLE "public"."repair_requests" FROM "authenticated";

GRANT INSERT ("problem_description") ON TABLE "public"."repair_requests" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."repair_requests" TO "authenticated";

REVOKE ALL ON TABLE "public"."repair_requests" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."repair_requests" TO "service_role";

REVOKE ALL ON TABLE "public"."security_events" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."security_events" TO "anon";

REVOKE ALL ON TABLE "public"."security_events" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."security_events" TO "authenticated";

REVOKE ALL ON TABLE "public"."security_events" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."security_events" TO "service_role";

REVOKE ALL ON TABLE "public"."services" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."services" TO "anon";

REVOKE ALL ON TABLE "public"."services" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."services" TO "authenticated";

REVOKE ALL ON TABLE "public"."services" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."services" TO "service_role";

REVOKE ALL ON TABLE "public"."store_settings" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."store_settings" TO "anon";

REVOKE ALL ON TABLE "public"."store_settings" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."store_settings" TO "authenticated";

REVOKE ALL ON TABLE "public"."store_settings" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."store_settings" TO "service_role";

REVOKE ALL ON TABLE "public"."website_content" FROM "anon";

GRANT MAINTAIN, SELECT ON TABLE "public"."website_content" TO "anon";

REVOKE ALL ON TABLE "public"."website_content" FROM "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."website_content" TO "authenticated";

REVOKE ALL ON TABLE "public"."website_content" FROM "service_role";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."website_content" TO "service_role";

-- Profiles: signed-in users can read only what RLS allows; no browser writes.
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM authenticated;

-- Security events: keep reads restricted by the admin RLS policy; no browser writes.
REVOKE SELECT ON TABLE public.security_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.security_events FROM authenticated;

-- Public repair submissions may be inserted, but not listed.
REVOKE SELECT ON TABLE public.repair_requests FROM anon;

REVOKE MAINTAIN ON ALL TABLES IN SCHEMA public FROM anon, authenticated;