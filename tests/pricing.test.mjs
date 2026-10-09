import test from "node:test";
import assert from "node:assert/strict";
import { calculateTotals, canReserve } from "../lib/pricing.mjs";

test("calculates integer LKR totals and caps discounts at the subtotal", () => {
  assert.deepEqual(calculateTotals([{ price: 4590, quantity: 2 }], 450, 1000), { subtotal: 9180, delivery: 450, discount: 1000, total: 8630 });
  assert.equal(calculateTotals([{ price: 4590, quantity: 1 }], 450, 9000).total, 450);
});

test("rejects invalid money and fractional quantities", () => {
  assert.throws(() => calculateTotals([{ price: 4590.5, quantity: 1 }], 450), RangeError);
  assert.throws(() => calculateTotals([{ price: 4590, quantity: 1.5 }], 450), RangeError);
});

test("checks reservations against available rather than on-hand stock", () => {
  assert.equal(canReserve(10, 7, 3), true);
  assert.equal(canReserve(10, 7, 4), false);
  assert.equal(canReserve(4, 5, 1), false);
});
