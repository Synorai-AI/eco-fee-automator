import express from "express";
import {
  shopifyApp,
  ShopifyExpress,
} from "@shopify/shopify-app-express";
import { LATEST_API_VERSION } from "@shopify/shopify-api";

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_APP_URL,
} = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SCOPES || !SHOPIFY_APP_URL) {
  // Log a clear message if env vars are missing
  console.error("Missing required Shopify environment variables.");
  console.error("Ensure SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, and SHOPIFY_APP_URL are set.");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Initialize the Shopify app configuration
const shopify = shopifyApp({
  api: {
    apiKey: SHOPIFY_API_KEY,
    apiSecretKey: SHOPIFY_API_SECRET,
    apiVersion: LATEST_API_VERSION,
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

// Mount Shopify auth routes
const shopifyExpress = ShopifyExpress(shopify);

// This sets up:
//   GET /auth           → starts OAuth
//   GET /auth/callback  → completes OAuth
//   POST /webhooks      → webhooks endpoint
app.use("/auth", shopifyExpress.auth);
app.use("/auth/callback", shopifyExpress.authCallback);
app.use("/webhooks", shopifyExpress.webhooks);

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
        <p>Use <code>/auth?shop=&lt;your-store>.myshopify.com</code> to start the install flow.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Eco Fee Automator backend listening on port ${PORT}`);
});
