import express from "express";
import shopifyAppPkg from "@shopify/shopify-app-express";

const { shopifyApp } = shopifyAppPkg;

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_APP_URL,
} = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SCOPES || !SHOPIFY_APP_URL) {
  console.error("Missing required Shopify environment variables.");
  console.error("Ensure SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, and SHOPIFY_APP_URL are set.");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Configure the Shopify app
const shopify = shopifyApp({
  api: {
    apiKey: SHOPIFY_API_KEY,
    apiSecretKey: SHOPIFY_API_SECRET,
    // Fixed recent Admin API version
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

// OAuth start
app.get(shopify.config.auth.path, shopify.auth.begin());

// OAuth callback
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot(),
);

// Webhooks endpoint (no handlers yet, but required)
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} }),
);

// Simple landing / health route
app.get("/", (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>Eco Fee Automator</title>
        <meta charset="utf-8" />
      </head>
      <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem;">
        <h1>Eco Fee Automator backend is running ✅</h1>
        <p>This is the backend for the Eco Fee Automator Shopify app.</p>
        <p>Use <code>/auth?shop=&lt;your-store&gt;.myshopify.com</code> to start the install flow.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Eco Fee Automator backend listening on port ${PORT}`);
});
