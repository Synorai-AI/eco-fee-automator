import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

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
        <p>Cart Transform logic runs inside Shopify; this server will handle app install, billing, and configuration.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Eco Fee Automator backend listening on port ${PORT}`);
});
