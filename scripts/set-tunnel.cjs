// scripts/set-tunnel.cjs
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const tunnelUrl = args[0];

if (!tunnelUrl) {
  console.error("Usage: npm run set-tunnel -- https://your-tunnel-url");
  process.exit(1);
}

if (!/^https?:\/\/.+/i.test(tunnelUrl)) {
  console.error("Provided tunnel URL does not look like a valid URL:", tunnelUrl);
  process.exit(1);
}

const rootDir = process.cwd();
const templatePath = path.join(rootDir, "shopify.app.template.toml");
const outputPath = path.join(rootDir, "shopify.app.toml");

if (!fs.existsSync(templatePath)) {
  console.error("Template file not found:", templatePath);
  process.exit(1);
}

let template = fs.readFileSync(templatePath, "utf8");

// Strip trailing slashes from tunnel URL
const cleanTunnelUrl = tunnelUrl.replace(/\/+$/, "");

// Replace placeholders
template = template.replace(/{{TUNNEL_URL}}/g, cleanTunnelUrl);
template = template.replace(/TUNNEL_URL/g, cleanTunnelUrl);

fs.writeFileSync(outputPath, template, "utf8");

console.log("✅ Generated shopify.app.toml with tunnel URL:", cleanTunnelUrl);
console.log("   ->", outputPath);
