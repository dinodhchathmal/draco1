export const storeConfig = {
  brand: "DRACO",
  currency: "LKR",
  initialPrice: 4590,
  deliveryCharge: 450,
  whatsapp: "+94741389234",
  launchLabel: "DRACO / AUTUMN—WINTER 2026",
};

export function formatLkr(amount: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(amount);
}
