import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  console.log("✅ GDPR webhook received", { topic, shop });

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

  return new Response(undefined, { status: 200 });
}
