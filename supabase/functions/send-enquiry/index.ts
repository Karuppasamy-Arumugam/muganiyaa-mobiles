import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type EnquiryEmail = {
  customerName?: unknown;
  phone?: unknown;
  email?: unknown;
  enquiryType?: unknown;
  selectedProductOrService?: unknown;
  message?: unknown;
  website?: unknown;
};

function clean(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Use POST to submit an enquiry notification." },
            { status: 405 },
          );
        }

        const contentLength = Number(req.headers.get("content-length") || 0);
        if (contentLength > 12_000) {
          return Response.json(
            { error: "The enquiry is too large." },
            { status: 413 },
          );
        }

        const accessKey = Deno.env.get("WEB3FORMS_ACCESS_KEY");
        if (!accessKey) {
          console.error("WEB3FORMS_ACCESS_KEY is not configured.");
          return Response.json(
            { error: "Email notifications are not configured." },
            { status: 503 },
          );
        }

        let body: EnquiryEmail;
        try {
          body = await req.json();
        } catch {
          return Response.json(
            { error: "The request must contain valid JSON." },
            { status: 400 },
          );
        }

        // Honeypot field: silently accept bot submissions without emailing.
        if (clean(body.website, 200)) {
          return Response.json({ success: true });
        }

        const customerName = clean(body.customerName, 120);
        const phone = clean(body.phone, 40);
        const email = clean(body.email, 254);
        const enquiryType = clean(body.enquiryType, 100) || "General Enquiry";
        const productOrService = clean(body.selectedProductOrService, 160);
        const message = clean(body.message, 2000);

        if (!customerName || !phone || !message) {
          return Response.json(
            { error: "Name, phone number, and message are required." },
            { status: 400 },
          );
        }

        if (phone.replace(/\D/g, "").length < 10) {
          return Response.json(
            { error: "Please provide a valid phone number." },
            { status: 400 },
          );
        }

        if (email && !isValidEmail(email)) {
          return Response.json(
            { error: "Please provide a valid email address." },
            { status: 400 },
          );
        }

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
          },
        );

        const result = await emailResponse.json();

        if (!emailResponse.ok || !result.success) {
          console.error("Web3Forms notification request failed.");
          return Response.json(
            { error: "The email notification could not be sent." },
            { status: 502 },
          );
        }

        return Response.json({ success: true });
      } catch (error) {
        console.error(
          "Enquiry email function error:",
          error instanceof Error ? error.message : error,
        );

        return Response.json(
          { error: "Something went wrong while sending the notification." },
          { status: 500 },
        );
      }
    },
  ),
};