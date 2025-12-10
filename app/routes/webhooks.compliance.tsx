import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Simple GET handler so we can confirm the route exists in a browser
export async function loader({ request }: LoaderFunctionArgs) {
  return new Response("Synorai EcoCharge compliance webhook endpoint", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const authResult = await authenticate.webhook(request);

  // If authenticate.webhook returns a Response (e.g. 401 on bad HMAC),
  // just return it directly so Shopify sees the correct status.
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
