import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

const NO_CHANGES: CartTransformRunResult = {
  operations: [],
};

/**
 * Map from the GraphQL boolean fields (aliases) to the eco-fee per unit.
 * These keys MUST match the field names in cart_transform_run.graphql.
 */
const ECO_FEE_BY_FLAG: Record<string, number> = {
  hasEcoAbComputers: 0.45,        // eco-ab-computers
  hasEcoAbLaptops: 0.30,          // eco-ab-laptops
  hasEcoAbPrinters: 1.65,         // eco-ab-printers
  hasEcoAbSmallAppliances: 0.40,  // eco-ab-small-appliances
  hasEcoAbAv: 0.55,               // eco-ab-av
  hasEcoAbTools: 0.65,            // eco-ab-tools
  hasEcoAbMonitorSmall: 1.30,     // eco-ab-monitor-small
  hasEcoAbMonitorLarge: 2.75,     // eco-ab-monitor-large
};

/**
 * Given a merchandise object for a cart line, determine the eco-fee per unit,
 * based on the boolean flags returned from the GraphQL query.
 *
 * Returns:
 *   - number (fee per unit) if any eco tag applies
 *   - null if no eco tag applies
 */
function getEcoFeePerUnit(
  merchandise: CartTransformRunInput["cart"]["lines"][number]["merchandise"]
): number | null {
  if (merchandise.__typename !== "ProductVariant") {
    return null;
  }

  const product = merchandise.product;
  if (!product) {
    return null;
  }

  // Priority is the order below; first matching flag wins.
  // This keeps behavior predictable if a product is (incorrectly) given multiple eco tags.
  const priorityOrder: (keyof typeof ECO_FEE_BY_FLAG)[] = [
    "hasEcoAbComputers",
    "hasEcoAbLaptops",
    "hasEcoAbPrinters",
    "hasEcoAbSmallAppliances",
    "hasEcoAbAv",
    "hasEcoAbTools",
    "hasEcoAbMonitorSmall",
    "hasEcoAbMonitorLarge",
  ];

  for (const flagName of priorityOrder) {
    const flagValue = (product as any)[flagName];
    if (flagValue === true) {
      return ECO_FEE_BY_FLAG[flagName];
    }
  }

  return null;
}

export function cartTransformRun(
  input: CartTransformRunInput
): CartTransformRunResult {
  const operations: Operation[] = [];

  for (const line of input.cart.lines) {
    const { merchandise, cost } = line;

    // Determine if this line qualifies for an eco fee
    const ecoFeePerUnit = getEcoFeePerUnit(merchandise);
    if (ecoFeePerUnit == null) {
      // No eco tag -> no changes to this line
      continue;
    }

    const baseAmountRaw = cost.amountPerQuantity.amount;
    const baseAmountNumber = parseFloat(baseAmountRaw);

    if (Number.isNaN(baseAmountNumber)) {
      // If we can't read the base price, don't touch the line
      continue;
    }

    // New per-unit price = base price + eco fee per unit
    const newAmountNumber = baseAmountNumber + ecoFeePerUnit;
    const newAmountPerUnit = newAmountNumber.toFixed(2);

    const productTitle =
      merchandise.__typename === "ProductVariant"
        ? merchandise.product?.title ?? "Product"
        : "Product";

    // Option C: emoji-spiced, clear, simple label in the title.
    // Example:
    //   "Gaming Laptop – ♻️ AB Environmental Fee $0.45/unit included"
    const ecoLabel = `♻️ AB Environmental Fee $${ecoFeePerUnit.toFixed(
      2
    )}/unit included`;
    const newTitle = `${productTitle} – ${ecoLabel}`;

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        title: newTitle,
        image: undefined,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: newAmountPerUnit,
            },
          },
        },
      },
    });
  }

  return operations.length > 0 ? { operations } : NO_CHANGES;
}
