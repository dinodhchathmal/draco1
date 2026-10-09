export function calculateTotals(items, deliveryCharge, discount = 0) {
  if (!Number.isSafeInteger(deliveryCharge) || deliveryCharge < 0) throw new RangeError("Invalid delivery charge");
  const subtotal = items.reduce((sum, item) => {
    if (!Number.isSafeInteger(item.price) || item.price < 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new RangeError("Invalid order line");
    const line = item.price * item.quantity;
    if (!Number.isSafeInteger(line) || !Number.isSafeInteger(sum + line)) throw new RangeError("Order total exceeds supported range");
    return sum + line;
  }, 0);
  if (!Number.isSafeInteger(discount) || discount < 0) throw new RangeError("Invalid discount");
  const appliedDiscount = Math.min(subtotal, discount);
  return { subtotal, delivery: deliveryCharge, discount: appliedDiscount, total: subtotal + deliveryCharge - appliedDiscount };
}

export function canReserve(stock, reserved, quantity) {
  return Number.isSafeInteger(stock) && Number.isSafeInteger(reserved) && Number.isSafeInteger(quantity) && stock >= 0 && reserved >= 0 && reserved <= stock && quantity > 0 && quantity <= stock - reserved;
}
