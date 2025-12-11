import express from "express";
import crypto from "crypto";
import shopifyAppPkg from "@shopify/shopify-app-express";

const { shopifyApp } = shopifyAppPkg;

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_APP_URL,
  PORT: ENV_PORT,
} = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SCOPES || !SHOPIFY_APP_URL) {
  console.error("❌ Missing required Shopify environment variables.");
  console.error(
    "Ensure SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, and SHOPIFY_APP_URL are set.",
  );
  process.exit(1);
}

const PORT = ENV_PORT || 3000;

// Core Shopify app configuration
const shopify = shopifyApp({
  api: {
    apiKey: SHOPIFY_API_KEY,
    apiSecretKey: SHOPIFY_API_SECRET,
    apiVersion: "2025-01",
    scopes: SHOPIFY_SCOPES.split(",").map((s) => s.trim()),
    hostScheme: "https",
    hostName: SHOPIFY_APP_URL.replace(/^https?:\/\//, ""),
  },
  auth: {
    path: "/auth",
    callbackPath: "/auth/callback",
  },
  webhooks: {
    path: "/webhooks",
  },
});

const app = express();

/**
 * Helper: verify Shopify webhook HMAC for /webhooks/compliance
 */
function verifyShopifyHmac(req) {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  if (!hmacHeader || !SHOPIFY_API_SECRET) {
    return false;
  }

  const body = req.body || "";

  const generatedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(body, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHmac, "utf8"),
      Buffer.from(hmacHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

/**
 * OAuth start
 * /auth?shop=<shop>.myshopify.com
 */
app.get(shopify.config.auth.path, shopify.auth.begin());

/**
 * OAuth callback + Cart Transform auto-registration.
 *
 * Pattern:
 *   app.get(callbackPath, shopify.auth.callback(), ourMiddleware, shopify.redirectToShopifyOrAppRoot())
 */
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const locals = res.locals.shopify || {};
      const session = locals.session;

      console.log("[AUTH CALLBACK] reached");
      console.log("[AUTH CALLBACK] res.locals.shopify:", {
        hasShopifyLocals: !!locals,
        hasSession: !!session,
        shop: session?.shop,
        isOnline: session?.isOnline,
        scope: session?.scope,
      });

      if (!session) {
        console.error("❌ No Shopify session found in auth callback");
        return next();
      }

      try {
        // GraphQL Admin client using this shop's session
        const client = new shopify.api.clients.Graphql({ session });

        const mutation = `
          mutation CartTransformCreate(
            $functionHandle: String!
            $blockOnFailure: Boolean!
          ) {
            cartTransformCreate(
              functionHandle: $functionHandle
              blockOnFailure: $blockOnFailure
            ) {
              cartTransform {
                id
                functionId
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        console.log("[CART TRANSFORM] Registering transform for shop:", session.shop);

        const response = await client.query({
          data: {
            query: mutation,
            variables: {
              functionHandle: "eco-fee-cart-transform",
              blockOnFailure: false,
            },
          },
        });

        console.log(
          "[CART TRANSFORM] Raw response body:",
          JSON.stringify(response?.body, null, 2),
        );

        const payload = response?.body?.data?.cartTransformCreate;

        if (!payload) {
          console.error("❌ cartTransformCreate returned no payload");
        } else if (payload.userErrors && payload.userErrors.length > 0) {
          console.error(
            "❌ cartTransformCreate userErrors:",
            JSON.stringify(payload.userErrors, null, 2),
          );
        } else {
          console.log("✅ Cart transform registered for shop:", {
            shop: session.shop,
            cartTransform: payload.cartTransform,
          });
        }
      } catch (err) {
        console.error("❌ Error calling cartTransformCreate:", err);
      }

      return next();
    } catch (error) {
      console.error("❌ Error in auth callback middleware:", error);
      return next(error);
    }
  },
  shopify.redirectToShopifyOrAppRoot(),
);

/**
 * Webhooks endpoint (general webhooks – currently none configured)
 */
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} }),
);

/**
 * Mandatory GDPR compliance webhook endpoint
 */
app.post(
  "/webhooks/compliance",
  express.text({ type: "*/*" }),
  (req, res) => {
    const isValid = verifyShopifyHmac(req);

    if (!isValid) {
      console.error("❌ Invalid HMAC for /webhooks/compliance");
      return res.status(401).send("Unauthorized");
    }

    const topic = req.get("X-Shopify-Topic");
    const shop = req.get("X-Shopify-Shop-Domain");

    console.log("✅ GDPR webhook received", { topic, shop });

    return res.status(200).send("OK");
  },
);

/**
 * Simple landing / health route
 */
app.get("/", (_req, res) => {
  res.send(
    `
    <html>
      <head>
        <title>Synorai EcoCharge</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem;">
        <h1>Synorai EcoCharge backend is running ✅</h1>
        <p>This is the backend for the Synorai EcoCharge Shopify app.</p>
        <p>Use <code>/auth?shop=&lt;your-store&gt;.myshopify.com</code> to start the install flow.</p>
      </body>
    </html>
    `.trim(),
  );
});

/**
 * Privacy Policy Route
 */
app.get("/privacy", (req, res) => {
  res.send(
    `
    <html>
      <head>
        <title>Privacy Policy - Synorai Inc.</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: auto; }
          h1, h2 { color: #222; }
        </style>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> March 2025</p>
        <p><strong>Company:</strong> Synorai Inc.</p>
        <p><strong>App:</strong> Synorai EcoCharge</p>
        <hr />
        <h2>1. Information We Collect</h2>
        <p>We access limited store and product information solely to apply environmental handling fees using Shopify Functions.</p>
        <h2>2. Customer Data</h2>
        <p>The app does not access or store customer personal data.</p>
        <h2>3. Data Storage</h2>
        <p>We do not store merchant or customer data outside Shopify infrastructure.</p>
        <h2>4. Contact</h2>
        <p>Email: synoraiai@gmail.com – Alberta, Canada</p>
      </body>
    </html>
    `.trim(),
  );
});

app.listen(PORT, () => {
  console.log(`Synorai EcoCharge backend listening on port ${PORT}`);
});

