import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";
import { createClient } from "npm:@supabase/supabase-js@2";

type ChatMessage = {
  role?: string;
  content?: string;
  text?: string;
};

type ChatRequest = {
  message?: unknown;
  history?: unknown;
};

type RankedProduct = {
  row: any;
  category: any;
  variants: any[];
  specifications: any[];
  images: string[];
  score: number;
};

const MAX_REQUEST_BYTES = 20_000;

function getMessageText(message: ChatMessage): string {
  return String(message.content || message.text || "").trim();
}

function getSearchWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9₹]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

async function makeFingerprint(ip: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );

  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

class RequestBodyTooLargeError extends Error {
  constructor() {
    super("BODY_TOO_LARGE");
  }
}

async function readLimitedBody(
  req: Request,
  maxBytes: number,
): Promise<string> {
  const reader = req.body?.getReader();

  if (!reader) {
    throw new Error("EMPTY_BODY");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }

    chunks.push(value);
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bodyBytes);
}

function publicImageUrl(
  storagePath: string | null | undefined,
  storage: any,
): string {
  if (!storagePath) return "";
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const { data } = storage
    .from("product-images")
    .getPublicUrl(storagePath);

  return data?.publicUrl || "";
}

function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default {
  fetch: withSupabase(
    { auth: ["publishable"] },
    async (req, ctx) => {
      try {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Use POST to send a chat message." },
            { status: 405 },
          );
        }

        // Reject oversized requests early when Content-Length is available.
        // The streamed body check below also handles missing or inaccurate headers.
        const contentLength = Number(req.headers.get("content-length") || 0);

        if (contentLength > MAX_REQUEST_BYTES) {
          return Response.json(
            {
              error:
                "The chat request is too large. Please shorten it and try again.",
            },
            { status: 413 },
          );
        }

        // Use the trusted proxy header in production. For local Supabase only,
        // use one shared development bucket if that header is unavailable.
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const isLocalSupabase =
          /localhost|127\.0\.0\.1|:\/\/kong(?::|\/)|supabase_kong_/i.test(
            supabaseUrl,
          );

        const clientIp =
          req.headers.get("cf-connecting-ip")?.trim() ||
          (isLocalSupabase ? "local-development" : null);

        if (!clientIp) {
          console.error(
            "Chat request rejected: trusted client IP header is missing.",
          );

          return Response.json(
            { error: "Could not verify the request source." },
            { status: 503 },
          );
        }

        const adminClient = getSupabaseAdminClient();

        if (!adminClient) {
          console.error("Supabase server credentials are unavailable.");

          return Response.json(
            { error: "The assistant is temporarily unavailable." },
            { status: 503 },
          );
        }

        const fingerprint = await makeFingerprint(clientIp);
        const { data: allowed, error: rateLimitError } = await adminClient.rpc(
          "consume_chat_rate_limit",
          { p_fingerprint: fingerprint },
        );

        if (rateLimitError) {
          console.error(
            "Chat rate-limit check failed:",
            rateLimitError.message,
          );

          return Response.json(
            { error: "The assistant is temporarily unavailable." },
            { status: 503 },
          );
        }

        if (!allowed) {
          return Response.json(
            {
              error: "Too many messages. Please wait a minute and try again.",
            },
            {
              status: 429,
              headers: { "Retry-After": "60" },
            },
          );
        }

        let rawBody: string;

        try {
          rawBody = await readLimitedBody(req, MAX_REQUEST_BYTES);
        } catch (error) {
          if (error instanceof RequestBodyTooLargeError) {
            return Response.json(
              {
                error:
                  "The chat request is too large. Please shorten it and try again.",
              },
              { status: 413 },
            );
          }

          return Response.json(
            { error: "The request body must be valid JSON." },
            { status: 400 },
          );
        }

        let body: ChatRequest;

        try {
          body = JSON.parse(rawBody);
        } catch {
          return Response.json(
            { error: "The request body must be valid JSON." },
            { status: 400 },
          );
        }

        const message =
          typeof body.message === "string" ? body.message.trim() : "";

        const history = Array.isArray(body.history)
          ? body.history
              .filter(
                (item): item is ChatMessage =>
                  Boolean(item) &&
                  typeof item === "object" &&
                  !Array.isArray(item),
              )
              .slice(-8)
          : [];

        if (!message) {
          return Response.json(
            { error: "Please enter a message." },
            { status: 400 },
          );
        }

        if (message.length > 1000) {
          return Response.json(
            { error: "Please keep your message under 1000 characters." },
            { status: 400 },
          );
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
          console.error("GEMINI_API_KEY is not configured.");

          return Response.json(
            { error: "The assistant is not configured yet." },
            { status: 503 },
          );
        }

        const [
          productsResult,
          categoriesResult,
          variantsResult,
          imagesResult,
          specsResult,
          offersResult,
          servicesResult,
          storeSettingsResult,
        ] = await Promise.all([
          ctx.supabase
            .from("products")
            .select(
              "id, category_id, name, slug, brand, description, base_price, original_price, status, is_active, is_featured, highlights",
            )
            .eq("is_active", true)
            .eq("status", "active")
            .order("name"),

          ctx.supabase
            .from("categories")
            .select("id, name, slug"),

          ctx.supabase
            .from("product_variants")
            .select(
              "id, product_id, sku, color_name, color_hex, ram, storage, price, original_price, stock_quantity, is_available",
            ),

          ctx.supabase
            .from("product_images")
            .select("product_id, storage_path, sort_order, is_primary")
            .order("sort_order"),

          ctx.supabase
            .from("product_specifications")
            .select("product_id, group_name, name, value, sort_order")
            .order("sort_order"),

          ctx.supabase
            .from("offers")
            .select(
              "id, title, offer_type, discount_value, start_at, end_at, terms, is_active",
            )
            .eq("is_active", true),

          // Select all service columns because the table does not have a "title" column.
          ctx.supabase.from("services").select("*"),

          ctx.supabase
            .from("store_settings")
            .select("phone, whatsapp, email, address, opening_hours, map_url")
            .eq("id", true)
            .maybeSingle(),
        ]);

        const failedQuery = [
          productsResult,
          categoriesResult,
          variantsResult,
          imagesResult,
          specsResult,
          offersResult,
          servicesResult,
          storeSettingsResult,
        ].find((result) => result.error);

        if (failedQuery?.error) {
          console.error(
            "Store information query failed:",
            failedQuery.error.message,
          );

          return Response.json(
            {
              error:
                "I couldn't load the store information. Please try again.",
            },
            { status: 500 },
          );
        }

        const products = productsResult.data || [];
        const categories = categoriesResult.data || [];
        const variants = variantsResult.data || [];
        const images = imagesResult.data || [];
        const specifications = specsResult.data || [];
        const now = Date.now();

        const activeOffers = (offersResult.data || [])
          .filter((offer) => {
            const startsAt = offer.start_at
              ? new Date(offer.start_at).getTime()
              : null;
            const endsAt = offer.end_at
              ? new Date(offer.end_at).getTime()
              : null;

            return (!startsAt || startsAt <= now) &&
              (!endsAt || endsAt >= now);
          })
          .map((offer) => ({
            title: offer.title || "",
            type: offer.offer_type || "",
            discountValue: offer.discount_value == null
              ? null
              : Number(offer.discount_value),
            startsAt: offer.start_at,
            endsAt: offer.end_at,
            terms: offer.terms || "",
          }));

        const activeServices = (servicesResult.data || [])
          .filter((service) => service.is_active !== false)
          .sort(
            (a, b) =>
              Number(a.sort_order || 0) - Number(b.sort_order || 0),
          )
          .map((service) => ({
            title:
              service.title ||
              service.name ||
              service.service_name ||
              "",
            description: service.description || "",
            features: Array.isArray(service.features)
              ? service.features
              : [],
            enquiryTag:
              service.enquiry_tag ||
              service.enquiry_service ||
              service.slug ||
              "",
          }));

        const storeSettings = storeSettingsResult.data || {};
        const publicContact = {
          phone: storeSettings.phone || "",
          whatsapp: storeSettings.whatsapp || "",
        };

        const words = getSearchWords(message);

        const rankedProducts: RankedProduct[] = products
          .map((product) => {
            const category = categories.find(
              (item) => item.id === product.category_id,
            );

            const productVariants = variants.filter(
              (variant) => variant.product_id === product.id,
            );

            const productSpecs = specifications.filter(
              (spec) => spec.product_id === product.id,
            );

            const productImages = images
              .filter((image) => image.product_id === product.id)
              .sort(
                (a, b) =>
                  Number(Boolean(b.is_primary)) -
                    Number(Boolean(a.is_primary)) ||
                  a.sort_order - b.sort_order,
              )
              .map((image) =>
                publicImageUrl(image.storage_path, ctx.supabase.storage)
              )
              .filter(Boolean);

            const searchableText = [
              product.name,
              product.brand,
              product.description,
              category?.name,
              ...(product.highlights || []),
              ...productVariants.flatMap((variant) => [
                variant.color_name,
                variant.ram,
                variant.storage,
              ]),
              ...productSpecs.flatMap((spec) => [spec.name, spec.value]),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            const score = words.reduce(
              (total, word) =>
                total + (searchableText.includes(word) ? 1 : 0),
              0,
            );

            return {
              row: product,
              category,
              variants: productVariants,
              specifications: productSpecs,
              images: productImages,
              score,
            };
          })
          .sort(
            (a, b) =>
              b.score - a.score ||
              Number(Boolean(b.row.is_featured)) -
                Number(Boolean(a.row.is_featured)),
          );

        const catalogueForGemini = rankedProducts.slice(0, 12).map((item) => ({
          id: item.row.id,
          name: item.row.name,
          brand: item.row.brand,
          category: item.category?.name || "",
          description: item.row.description || "",
          price: Number(item.row.base_price || 0),
          originalPrice: Number(
            item.row.original_price ?? item.row.base_price ?? 0,
          ),
          highlights: item.row.highlights || [],
          variants: item.variants.map((variant) => ({
            color: variant.color_name || "",
            ram: variant.ram || "",
            storage: variant.storage || "",
            price: Number(variant.price || item.row.base_price || 0),
            inStock:
              Boolean(variant.is_available) &&
              Number(variant.stock_quantity || 0) > 0,
          })),
          specifications: item.specifications.map((spec) => ({
            group: spec.group_name || "",
            name: spec.name,
            value: spec.value,
          })),
        }));

        const conversation = history
          .map((item) => {
            const text = getMessageText(item);
            if (!text) return null;

            const role =
              item.role === "assistant" || item.role === "model"
                ? "model"
                : item.role === "user"
                  ? "user"
                  : null;

            return role
              ? { role, parts: [{ text: text.slice(0, 1000) }] }
              : null;
          })
          .filter(Boolean) as Array<{
          role: "user" | "model";
          parts: Array<{ text: string }>;
        }>;

        conversation.push({
          role: "user",
          parts: [
            {
              text:
                `Customer message:\n${message}\n\n` +
                `Store catalogue (use only these facts):\n${JSON.stringify(catalogueForGemini)}\n\n` +
                `Currently active store offers and EMI information:\n${JSON.stringify(activeOffers)}\n\n` +
                `Store services:\n${JSON.stringify(activeServices)}\n\n` +
                `Store contact and hours:\n${JSON.stringify({
                  phone: storeSettings.phone || "",
                  whatsapp: storeSettings.whatsapp || "",
                  email: storeSettings.email || "",
                  address: storeSettings.address || "",
                  openingHours: storeSettings.opening_hours || "",
                  mapUrl: storeSettings.map_url || "",
                })}\n\n` +
                `Return JSON with exactly these keys: "reply" (concise, helpful answer), ` +
                `"recommendedProductIds" (array of catalogue product IDs, maximum 3), ` +
                `and "showContactLinks" (boolean). Set showContactLinks true when the customer asks how to contact the store, asks for a call or WhatsApp, or when you direct them to the store because information is unavailable. ` +
                `If an exact product is unavailable, recommend the closest matching products in the catalogue. ` +
                `Never invent prices, stock, specifications, offer terms, services, contact details, or products. ` +
                `Use the supplied offers for EMI/discount questions, services for repair questions, and contact data for contact, hours, or location questions. ` +
                `If relevant information is absent, say so and invite the customer to contact the store. Do not start with a greeting.`,
            },
          ],
        });

        const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text:
                      "You are the helpful product assistant for Muganiyaa-Mobiles in Tenkasi, Tamil Nadu. " +
                      "The chat widget already displays a welcome greeting, so do not start replies with a greeting. " +
                      "Answer in the customer's language when practical. The current message contains live catalogue, active offers, services, and store contact/settings data; use the relevant section as your only source of store facts. " +
                      "Never invent prices, stock, specifications, offer terms, services, contact details, or products. " +
                      "Use active offers for EMI and discount questions, services for repair questions, and store settings for hours, address, phone, and WhatsApp questions. " +
                      "When asked for a category collection, list only matching products found in the catalogue. " +
                      "If supplied data lacks the answer, say so and offer contact links. Return valid JSON with reply, recommendedProductIds, and showContactLinks.",
                  },
                ],
              },
              contents: conversation,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini request failed:", errorText);

          return Response.json(
            {
              error:
                "The assistant couldn't respond right now. Please try again.",
            },
            { status: 502 },
          );
        }

        const geminiData = await geminiResponse.json();
        const rawText =
          geminiData.candidates?.[0]?.content?.parts
            ?.map((part: { text?: string }) => part.text || "")
            .join("") || "";

        let aiResult: {
          reply?: string;
          recommendedProductIds?: string[];
          showContactLinks?: boolean;
        };

        try {
          aiResult = JSON.parse(rawText);
        } catch {
          console.error("Gemini returned invalid JSON.");

          return Response.json(
            {
              error:
                "The assistant returned an unreadable response. Please try again.",
            },
            { status: 502 },
          );
        }

        const allowedIds = new Set(
          catalogueForGemini.map((product) => product.id),
        );

        const recommendedIds = Array.isArray(aiResult.recommendedProductIds)
          ? aiResult.recommendedProductIds
              .filter((id) => allowedIds.has(id))
              .slice(0, 3)
          : [];

        const recommendedProducts = recommendedIds
          .map((id) => rankedProducts.find((item) => item.row.id === id))
          .filter(Boolean)
          .map((item: any) => {
            const productVariants = item.variants.map((variant: any) => ({
              id: variant.id,
              sku: variant.sku || "",
              color: variant.color_name || "",
              ram: variant.ram || "",
              storage: variant.storage || "",
              sellingPrice: Number(
                variant.price || item.row.base_price || 0,
              ),
              originalPrice: Number(
                variant.original_price ??
                  item.row.original_price ??
                  variant.price ??
                  0,
              ),
              stockStatus:
                variant.is_available &&
                Number(variant.stock_quantity || 0) > 0
                  ? "In Stock"
                  : "Out of Stock",
            }));

            const specs = Object.fromEntries(
              item.specifications.map((spec: any) => [
                spec.name,
                spec.value,
              ]),
            );

            return {
              id: item.row.id,
              slug: item.row.slug,
              name: item.row.name,
              brand: item.row.brand || "",
              category: item.category?.name || "",
              description: item.row.description || "",
              sellingPrice:
                productVariants[0]?.sellingPrice ??
                Number(item.row.base_price || 0),
              originalPrice: Number(
                item.row.original_price ?? item.row.base_price ?? 0,
              ),
              status: "published",
              isFeatured: Boolean(item.row.is_featured),
              highlights: item.row.highlights || [],
              variants: productVariants,
              stockStatus: productVariants.some(
                (variant: any) => variant.stockStatus === "In Stock",
              )
                ? "In Stock"
                : "Out of Stock",
              specifications: specs,
              images: item.images,
              coverImage: item.images[0] || "",
            };
          });

        return Response.json({
          text: String(
            aiResult.reply || "How can I help you find a product?",
          ),
          products: recommendedProducts,
          cta: null,
          contact: aiResult.showContactLinks ? publicContact : null,
        });
      } catch (error) {
        console.error(
          "Assistant function error:",
          error instanceof Error ? error.message : error,
        );

        return Response.json(
          { error: "Something went wrong. Please try again." },
          { status: 500 },
        );
      }
    },
  ),
};