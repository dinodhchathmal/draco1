export type PricingLine = { price: number; quantity: number };
export function calculateTotals(items: PricingLine[], deliveryCharge: number, discount?: number): { subtotal: number; delivery: number; discount: number; total: number };
export function canReserve(stock: number, reserved: number, quantity: number): boolean;
