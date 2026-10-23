import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";

type EnquiryPayload = {
  requestId?: unknown;
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  enquiryType?: unknown;
  selectedProductOrService?: unknown;
  message?: unknown;
  website?: unknown;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getIndianMobileDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // Accept a 10-digit Indian mobile number, or the same number with +91.
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Unable to submit the enquiry." },
            { status: 405 },
          );
        }

        const requestText = await req.text();

        if (new TextEncoder().encode(requestText).byteLength > 12_000) {
          return Response.json(
            { error: "The enquiry is too large." },
            { status: 413 },
          );
        }

        let parsedBody: unknown;

        try {
          parsedBody = JSON.parse(requestText);
        } catch {
          return Response.json(
            { error: "Please check your enquiry details and try again." },
            { status: 400 },
          );
        }

        if (
          typeof parsedBody !== "object" ||
          parsedBody === null ||
          Array.isArray(parsedBody)
        ) {
          return Response.json(
            { error: "Please check your enquiry details and try again." },
            { status: 400 },
          );
        }

        const body = parsedBody as EnquiryPayload;

        // Silently accept bot submissions without saving or emailing.
        if (clean(body.website)) {
          return Response.json({
            success: true,
            saved: false,
            emailSent: false,
          });
        }

        const requestId = clean(body.requestId);

        if (!UUID_PATTERN.test(requestId)) {
          return Response.json(
            { error: "Please refresh the page and submit your enquiry again." },
            { status: 400 },
          );
        }

        const customerName = clean(body.customerName);
        const phone = clean(body.phone);
        const email = clean(body.email);
        const enquiryType =
          clean(body.enquiryType).slice(0, 100) || "General Enquiry";
        const productOrService =
          clean(body.selectedProductOrService).slice(0, 160);
        const message = clean(body.message);

        const nameLength = Array.from(customerName).length;
        const mobileDigits = getIndianMobileDigits(phone);

        if (!customerName || nameLength < 6 || nameLength > 120) {
          return Response.json(
            { error: "Name must be between 6 and 120 characters." },
            { status: 400 },
          );
        }

        if (!/^[6-9]\d{9}$/.test(mobileDigits)) {
          return Response.json(
            { error: "Enter a valid 10-digit mobile number." },
            { status: 400 },
          );
        }

        if (email.length > 254 || (email && !isValidEmail(email))) {
          return Response.json(
            { error: "Enter a valid email address." },
            { status: 400 },
          );
        }

        const messageLength = Array.from(message).length;

        if (messageLength < 10 || messageLength > 2000) {
          return Response.json(
            { error: "Message must be between 10 and 2,000 characters." },
            { status: 400 },
          );
        }

        if (
          clean(body.enquiryType).length > 100 ||
          clean(body.selectedProductOrService).length > 160
        ) {
          return Response.json(
            { error: "Please check your enquiry details and try again." },
            { status: 400 },
          );
        }

        // If this request ID has already been saved, acknowledge it without
        // creating another row or sending another notification email.
        const { data: existingEnquiry, error: lookupError } =
          await ctx.supabaseAdmin
            .from("enquiries")
            .select("id")
            .eq("request_id", requestId)
            .maybeSingle();

        if (lookupError) {
          console.error(
            "Could not check enquiry request ID:",
            lookupError.message,
          );
          return Response.json(
            { error: "Enquiry submission is temporarily unavailable." },
            { status: 503 },
          );
        }

        if (existingEnquiry) {
          return Response.json({
            success: true,
            saved: true,
            duplicate: true,
          });
        }

        const forwardedFor = req.headers.get("x-forwarded-for");
        const ipAddress =
          forwardedFor?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip")?.trim();

        if (!ipAddress) {
          console.error("Could not determine request IP for rate limiting.");
          return Response.json(
            { error: "Enquiry submission is temporarily unavailable." },
            { status: 503 },
          );
        }

        const fingerprint = await sha256(`enquiry-email:${ipAddress}`);
        const { data: allowed, error: limitError } =
          await ctx.supabaseAdmin.rpc("consume_enquiry_rate_limit", {
            p_fingerprint: fingerprint,
          });

        if (limitError) {
          console.error(
            "Enquiry rate-limit check failed:",
            limitError.message,
          );
          return Response.json(
            { error: "Enquiry submission is temporarily unavailable." },
            { status: 503 },
          );
        }

        if (allowed !== true) {
          return Response.json(
            { error: "Too many submissions. Please try again later." },
            {
              status: 429,
              headers: { "Retry-After": "900" },
            },
          );
        }

        const subject = [enquiryType, productOrService]
          .filter(Boolean)
          .join(" — ");

        // Save server-side. The private database row is not returned to the visitor.
        const { error: saveError } = await ctx.supabaseAdmin
          .from("enquiries")
          .insert({
            request_id: requestId,
            name: customerName,
            phone,
            email: email || null,
            subject,
            message,
          });

        if (saveError) {
          // A concurrent retry may pass the lookup above, but the unique
          // index ensures only one request can insert this request ID.
          if (saveError.code === "23505") {
            return Response.json({
              success: true,
              saved: true,
              duplicate: true,
            });
          }

          console.error("Could not save enquiry:", saveError.message);
          return Response.json(
            { error: "We could not submit your enquiry. Please try again." },
            { status: 500 },
          );
        }

        const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");

        if (!accessKey) {
          console.error("WEB3FORMS_ACCESS_KEY is not configured.");
          return Response.json({
            success: true,
            saved: true,
            emailSent: false,
          });
        }

        try {
          const emailResponse = await fetch(
            "https://api.web3forms.com/submit",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                access_key: accessKey,
                name: customerName,
                phone,
                email,
                subject: `Website enquiry: ${enquiryType}`,
                enquiry_type: enquiryType,
                product_or_service: productOrService,
                message,
                from_name: "Muganiyaa-Mobiles Website",
              }),
              signal: AbortSignal.timeout(10_000),
            },
          );

          const result = await emailResponse.json();

          if (!emailResponse.ok || !result.success) {
            console.error("Web3Forms notification request failed.");
            return Response.json({
              success: true,
              saved: true,
              emailSent: false,
            });
          }

          return Response.json({
            success: true,
            saved: true,
            emailSent: true,
          });
        } catch (emailError) {
          console.error(
            "Enquiry saved, but email notification failed:",
            emailError instanceof Error ? emailError.message : emailError,
          );

          return Response.json({
            success: true,
            saved: true,
            emailSent: false,
          });
        }
      } catch (error) {
        console.error(
          "Enquiry function error:",
          error instanceof Error ? error.message : error,
        );

        return Response.json(
          { error: "We could not submit your enquiry. Please try again." },
          { status: 500 },
        );
      }
    },
  ),
};