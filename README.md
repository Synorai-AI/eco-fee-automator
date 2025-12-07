# Eco-Fee-Automator

Automatically apply Alberta environmental handling fees (EHF / eco-fees) to eligible products at checkout using a Shopify Cart Transform Function.

---

## Overview

This Shopify app adds the correct **Alberta eco-fee** to products based on their eco-fee tag and updates the cart line item title to show the included fee.

Merchants tag their products with one of the supported categories, and the app updates pricing during checkout — no variants, extra products, or manual fees needed.

---

## Supported Tags & Fees (CAD per unit)

| Tag                       | Fee   | Category         |
|---------------------------|-------|------------------|
| `eco-ab-computers`        | $0.45 | Computers/Servers|
| `eco-ab-laptops`          | $0.30 | Laptops/Tablets  |
| `eco-ab-printers`         | $1.65 | Printers         |
| `eco-ab-small-appliances` | $0.40 | Small appliances |
| `eco-ab-av`               | $0.55 | AV / Telecom     |
| `eco-ab-tools`            | $0.65 | Tools            |
| `eco-ab-monitor-small`    | $1.30 | Monitors <30"    |
| `eco-ab-monitor-large`    | $2.75 | Monitors ≥30"    |

---

## What the Cart Transform Function Does

- Reads product tags from each line item in the cart  
- Looks up the associated Alberta eco-fee  
- Adds the fee to the **unit price**  
- Updates the line item title to:

  ```text
  Product Name (includes $X.XX AB eco fee per unit – Category)
