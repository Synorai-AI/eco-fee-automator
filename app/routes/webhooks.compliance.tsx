import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    // This verifies the HMAC and throws if invalid
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log("✅ GDPR webhook received", { topic, shop, payload });

    switch (topic) {
      case "customers/data_request":
        // TODO: handle customer data request
        break;

      case "customers/redact":
        // TODO: handle customer data redaction
        break;

      case "shop/redact":
        // TODO: handle shop data redaction
        break;
    }

    // Valid HMAC → 200 OK
    return new Response(undefined, { status: 200 });
  } catch (error) {
    // Invalid HMAC (or other verification issue) → 401 Unauthorized
    console.error("❌ GDPR webhook HMAC verification failed", error);
    return new Response("Unauthorized", { status: 401 });
  }
}
