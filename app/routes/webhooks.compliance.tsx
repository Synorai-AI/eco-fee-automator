import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  // authenticate.webhook will:
  // - return a Response (e.g. 401) if verification fails
  // - return { topic, shop, payload } if verification succeeds
  const authResult = await authenticate.webhook(request);

  // If we got a Response back, it's already the correct status (401, etc.)
  // Just return it directly so Shopify sees the proper HTTP code.
  if (authResult instanceof Response) {
    return authResult;
  }

  const { topic, shop, payload } = authResult;

  console.log("✅ GDPR webhook received", { topic, shop, payload });

  switch (topic) {
    case "customers/data_request":
      // TODO: handle customer data request if needed
      break;

    case "customers/redact":
      // TODO: handle customer data redaction if needed
      break;

    case "shop/redact":
      // TODO: handle shop data redaction if needed
      break;
  }

  // Valid HMAC → 200 OK
  return new Response(undefined, { status: 200 });
}
