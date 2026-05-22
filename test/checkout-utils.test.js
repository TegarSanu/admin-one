import assert from "node:assert";
import { describe, it } from "node:test";
import { computeCashDistribution } from "../lib/checkoutUtils.js";

describe("computeCashDistribution", () => {
  it("assigns exact cash for a single store without change", () => {
    const result = computeCashDistribution(
      [{ storeId: "store-1", storeTotal: 150000 }],
      150000,
    );

    assert.deepStrictEqual(result, [
      {
        storeId: "store-1",
        storeTotal: 150000,
        cashReceived: 150000,
        changeDue: 0,
      },
    ]);
  });

  it("assigns extra cash to the last store as change for multiple stores", () => {
    const result = computeCashDistribution(
      [
        { storeId: "store-1", storeTotal: 100000 },
        { storeId: "store-2", storeTotal: 50000 },
      ],
      180000,
    );

    assert.deepStrictEqual(result, [
      {
        storeId: "store-1",
        storeTotal: 100000,
        cashReceived: 100000,
        changeDue: 0,
      },
      {
        storeId: "store-2",
        storeTotal: 50000,
        cashReceived: 80000,
        changeDue: 30000,
      },
    ]);
  });

  it("throws when cash received is insufficient", () => {
    assert.throws(
      () => {
        computeCashDistribution(
          [{ storeId: "store-1", storeTotal: 200000 }],
          150000,
        );
      },
      {
        message: "Uang tunai tidak mencukupi. Total yang harus dibayar: 200000",
      },
    );
  });
});
