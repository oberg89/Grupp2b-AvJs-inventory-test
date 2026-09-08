import test from "node:test";
import assert from "node:assert/strict";

import StockItem from "../StockItem.js";
import StockMovement from "../StockMovement.js";
import InventoryService from "../InventoryService.js";
import InventoryModule from "../index.js";

import {
  InvalidStockMovementError
} from "../errors/InventoryError.js";


test("delivery ökar lagersaldot", () => {
  const movement = new StockMovement({
    productId: "1",
    type: "delivery",
    quantity: 10
  });

  assert.equal(
    movement.getQuantityChange(),
    10
  );
});


test("sale minskar lagersaldot", () => {
  const movement = new StockMovement({
    productId: "1",
    type: "sale",
    quantity: 3
  });

  assert.equal(
    movement.getQuantityChange(),
    -3
  );
});


test("adjustment kan minska lagersaldot", () => {
  const movement = new StockMovement({
    productId: "1",
    type: "adjustment",
    quantity: -2
  });

  assert.equal(
    movement.getQuantityChange(),
    -2
  );
});


test("fel lagertyp kastar eget fel", () => {
  assert.throws(
    () => {
      new StockMovement({
        productId: "1",
        type: "fel",
        quantity: 5
      });
    },
    InvalidStockMovementError
  );
});


test("InventoryService räknar rätt lagersaldo", () => {
  const service = new InventoryService();

  service.movements = [
    new StockMovement({
      productId: "1",
      type: "delivery",
      quantity: 10
    }),
    new StockMovement({
      productId: "1",
      type: "sale",
      quantity: 3
    }),
    new StockMovement({
      productId: "1",
      type: "adjustment",
      quantity: -2
    })
  ];

  const stock = service.calculateStock("1");

  assert.equal(stock, 5);
});


test("bara rätt produkts lagerhändelser räknas", () => {
  const service = new InventoryService();

  service.movements = [
    new StockMovement({
      productId: "1",
      type: "delivery",
      quantity: 10
    }),
    new StockMovement({
      productId: "2",
      type: "delivery",
      quantity: 20
    }),
    new StockMovement({
      productId: "1",
      type: "sale",
      quantity: 2
    })
  ];

  assert.equal(
    service.calculateStock("1"),
    8
  );
});


test("StockItem varnar vid låg lagernivå", () => {
  const item = new StockItem({
    productId: "1",
    name: "Laptop",
    reorderPoint: 5,
    salesRate: 0
  });

  assert.equal(
    item.isLowStock(5),
    true
  );
});


test("StockItem varnar inte när lagret är över beställningspunkten", () => {
  const item = new StockItem({
    productId: "1",
    name: "Laptop",
    reorderPoint: 5,
    salesRate: 0
  });

  assert.equal(
    item.isLowStock(10),
    false
  );
});


test("försäljningstakt kan höja beställningspunkten", () => {
  const item = new StockItem({
    productId: "1",
    name: "Laptop",
    reorderPoint: 3,
    salesRate: 2
  });

  assert.equal(
    item.getEffectiveReorderPoint(7),
    14
  );
});


test("InventoryModule har ett publikt run-kontrakt", () => {
  const module = new InventoryModule();
  const runDefinition = InventoryModule.descriptor.methodsAndInputs.find(
    definition => definition.method === "run"
  );

  assert.ok(module);
  assert.ok(InventoryModule.descriptor);
  assert.equal(runDefinition.input.length, 3);
});


test("InventoryModule visar rapport och gör quantity till Number", async () => {
  const originalFetch = globalThis.fetch;
  const postBodies = [];

  globalThis.fetch = async (url, options = {}) => {
    if (url === "/api/inventory" && options.method === "POST") {
      postBodies.push(JSON.parse(options.body));
      return {
        ok: true,
        json: async () => ({
          productId: "1",
          type: "delivery",
          quantity: 4,
          timestamp: "2026-09-08T00:00:00.000Z"
        })
      };
    }

    return {
      ok: true,
      json: async () => []
    };
  };

  try {
    const module = new InventoryModule();
    const products = [{ id: "1", name: "Test", reorderPoint: 3 }];
    const initialReport = await module.run({}, { products });
    const updatedReport = await module.run(
      { productId: "1", type: "delivery", quantity: "4" },
      { products }
    );

    assert.equal(initialReport[0].stock, 0);
    assert.equal(updatedReport[0].stock, 4);
    assert.equal(postBodies[0].quantity, 4);
    assert.equal(typeof postBodies[0].quantity, "number");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
