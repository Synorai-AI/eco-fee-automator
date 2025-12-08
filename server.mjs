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

// Privacy Policy Route
app.get("/privacy", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Privacy Policy - Synorai Inc.</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: auto; }
          h1, h2 { color: #222; }
        </style>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> March 2025</p>
        <p><strong>Company:</strong> Synorai Inc.</p>
        <p><strong>App:</strong> Eco Fee Automator</p>
        <hr />
        <h2>1. Information We Collect</h2>
<h3>Merchant Data</h3>
<p>
When you install the App, Shopify automatically provides us with access to your store’s domain, shop ID, basic shop metadata, and product tags. We use this information solely to apply environmental handling fees to products using Shopify Functions.
</p>

<p>We do not collect or store:</p>
<ul>
  <li>Customer names</li>
  <li>Customer addresses</li>
  <li>Customer emails</li>
  <li>Order information</li>
  <li>Payment information</li>
</ul>

<h3>Customer Data</h3>
<p>
The App does not access, collect, store, or process any customer personal data.
</p>

<h3>Product Data</h3>
<p>
We read product tags to determine whether environmental fees apply. No product data is stored outside Shopify.
</p>

<h2>2. How We Use the Information</h2>
<p>
We use store and product information only to identify product tags and apply the correct environmental handling fees via Shopify Functions. We do not use this information for analytics, marketing, or any other purpose.
</p>

<h2>3. Data Storage & Security</h2>
<p>
We do not store merchant or customer data on external servers. All processing occurs within Shopify’s secure infrastructure. Our Render-hosted backend only confirms that the App is online, and does not store any data.
</p>

<h2>4. Sharing Your Data</h2>
<p>
We do not share merchant or customer data with third parties, advertising networks, analytics services, or affiliates. The only systems involved are Shopify and Render. Render does not handle any personal data.
</p>

<h2>5. Data Retention</h2>
<p>
Because we do not store personal or business data, there is no retained information. Uninstalling the App immediately revokes all permissions via Shopify.
</p>

<h2>6. Your Rights</h2>
<p>
You may request clarification about how your data is used or uninstall the App at any time to revoke access. You may also contact us with any privacy-related inquiries.
</p>

<h2>7. Changes to the Policy</h2>
<p>
We may update this Policy periodically. Any updates will be posted to this page and marked with a revised “Last updated” date.
</p>

<h2>8. Contact Us</h2>
<p>
<b>Synorai Inc.</b><br/>
Email: synoraiai@gmail.com <br/>
Alberta, Canada
</p>
      </body>
    </html>
  `);
});
