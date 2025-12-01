import type {
  CartTransformRunInput,
  CartTransformRunResult,
  Operation,
} from "../generated/api";

const NO_CHANGES: CartTransformRunResult = {
  operations: [],
};

/**
 * Eco-fee flags we read from the Product in GraphQL.
 * Each one corresponds to a specific Alberta tag, e.g.
 *  - hasEcoAbComputers -> tag "eco-ab-computers"
 */
type EcoFeeFlagField =
  | "hasEcoAbComputers"
  | "hasEcoAbLaptops"
  | "hasEcoAbPrinters"
  | "hasEcoAbSmallAppliances"
  | "hasEcoAbAv"
  | "hasEcoAbTools"
  | "hasEcoAbMonitorSmall"
  | "hasEcoAbMonitorLarge";

type EcoFeeConfig = {
  flagField: EcoFeeFlagField;
  amount: number; // fee PER UNIT, in store currency (CAD)
  label: string;  // category label for the title
};

/**
 * Alberta eco-fee config (per unit).
 * Assumes store currency is CAD.
 */
const ECO_FEES_AB: EcoFeeConfig[] = [
  {
    flagField: "hasEcoAbComputers",
    amount: 0.45,
    label: "Computers and Servers",
  },
  {
    flagField: "hasEcoAbLaptops",
    amount: 0.30,
    label: "Laptops, Tablets, Notebooks",
  },
  {
    flagField: "hasEcoAbPrinters",
    amount: 1.65,
    label: "Printers, Copiers, Scanners, Fax",
  },
  {
    flagField: "hasEcoAbSmallAppliances",
    amount: 0.40,
    label: "Small Home Appliances",
  },
  {
    flagField: "hasEcoAbAv",
    amount: 0.55,
    label: "AV, Telecom, Toys, Music",
  },
  {
    flagField: "hasEcoAbTools",
    amount: 0.65,
    label: "Tools, Lawn, Garden",
  },
  {
    flagField: "hasEcoAbMonitorSmall",
    amount: 1.30,
    label: 'Displays < 30"',
  },
  {
    flagField: "hasEcoAbMonitorLarge",
    amount: 2.75,
    label: 'Displays > 30"',
  },
];

/**
 * Helper to convert a number to a money string with 2 decimal places.
 */
function toMoneyString(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Behavior (AB-only v1):
 * - Merchant controls which products are subject to AB eco-fees
 *   by tagging them with "eco-ab-..." tags.
 * - For each cart line:
 *   - If merchandise is a ProductVariant
 *   - And its product has one of the AB eco-fee tags
 *   → Increase the line’s fixed price per unit by the fee amount,
 *     and annotate the title so the fee is clearly visible.
 */
export function cartTransformRun(
  input: CartTransformRunInput
): CartTransformRunResult {
  const operations: Operation[] = [];

  for (const line of input.cart.lines) {
    const { merchandise, cost } = line;

    // Only operate on ProductVariant lines
    if (merchandise.__typename !== "ProductVariant") {
      continue;
    }

    const product = merchandise.product;
    if (!product) {
      continue;
    }

    // Find matching eco-fee config based on the tag flags from GraphQL
    const matchingConfig = ECO_FEES_AB.find((config) => {
      // We know these fields are booleans provided by GraphQL.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productAny = product as any;
      return productAny[config.flagField] === true;
    });

    if (!matchingConfig || matchingConfig.amount <= 0) {
      // No AB eco-fee tags for this product, or fee not configured
      continue;
    }

    // Shopify sends amount as a string, e.g. "95.0"
    const baseAmountRaw = cost.amountPerQuantity.amount;
    const baseAmountNumber = parseFloat(baseAmountRaw);

    // If parse fails, don't touch this line
    if (Number.isNaN(baseAmountNumber)) {
      continue;
    }

    const newAmountNumber = baseAmountNumber + matchingConfig.amount;
    const newAmountPerUnit = toMoneyString(newAmountNumber); // e.g. "95.30"

    // Title that clearly indicates eco-fee inclusion
    const ecoFeePerUnitLabel = matchingConfig.amount.toFixed(2); // "0.30"
    const newTitle = `${product.title} (includes $${ecoFeePerUnitLabel} AB eco fee per unit - ${matchingConfig.label})`;

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
