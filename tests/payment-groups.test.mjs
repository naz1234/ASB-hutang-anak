import assert from "node:assert/strict";
import test from "node:test";

import { groupPaymentsByChild } from "../app/payment-groups.ts";

test("creates one chronological payment group per child without changing source data", () => {
  const children = [
    { id: "tasneem", name: "Tasneem" },
    { id: "azra", name: "Azra" },
    { id: "naurah", name: "Naurah" },
  ];
  const payments = [
    { id: "older", childId: "azra", amount: 111, date: "2026-04-01" },
    { id: "newer", childId: "azra", amount: 1112, date: "2026-06-01" },
    { id: "tasneem", childId: "tasneem", amount: 111, date: "2026-09-01" },
    { id: "orphan", childId: "unknown", amount: 50, date: "2026-09-02" },
  ];
  const originalPaymentOrder = payments.map((payment) => payment.id);

  const groups = groupPaymentsByChild(children, payments);

  assert.deepEqual(groups.map((group) => group.child.name), ["Tasneem", "Azra", "Naurah"]);
  assert.deepEqual(groups.map((group) => group.payments.map((payment) => payment.id)), [
    ["tasneem"],
    ["newer", "older"],
    [],
  ]);
  assert.deepEqual(groups.map((group) => group.total), [111, 1223, 0]);
  assert.deepEqual(payments.map((payment) => payment.id), originalPaymentOrder);
});
