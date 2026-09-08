// Den här filen är lagermodulens publika ingång.
// Den kopplar modulens descriptor och run-metod till InventoryService.

import InventoryService from "./InventoryService.js";
import {
  InventoryApiError,
  InvalidStockMovementError
} from "./errors/InventoryError.js";

export default class InventoryModule {
  // descriptorn berättar vilka fält GenericForm ska bygga
  static descriptor = {
    name: "Lagerhantering",
    // inventoryrapporten kan visas direkt när admin öppnas
    runOnLoad: true,
    methodsAndInputs: [
      {
        method: "run",
        input: [
          {
            name: "productId",
            label: "Produkt-id",
            type: "number",
            initialValue: "",
            required: true,
            min: 1
          },
          {
            name: "type",
            label: "Lagerhändelse",
            type: "select",
            initialValue: "",
            required: true,
            options: ["delivery", "sale", "adjustment"]
          },
          {
            name: "quantity",
            label: "Antal",
            type: "number",
            initialValue: "",
            required: true
          }
        ],
        output: "Lagerrapport med aktuellt saldo, beställningspunkt och lagerstatus"
      }
    ]
  };

  // konstruktorn behöver inga argument enligt modulkontraktet
  constructor() {
    this.service = new InventoryService();
  }

  async run(values = {}, context = {}) {
    await this.service.fetchMovements();

    const hasMovementValues = [
      values.productId,
      values.type,
      values.quantity
    ].some(value => value !== "" && value !== undefined && value !== null);

    if (hasMovementValues) {
      // formulärvärden kommer som strängar, därför gör vi om quantity till Number
      const quantity = Number(values.quantity);
      if (
        values.quantity === "" ||
        values.quantity === undefined ||
        values.quantity === null ||
        !Number.isFinite(quantity)
      ) {
        throw new InvalidStockMovementError(
          "Antalet måste vara ett giltigt nummer."
        );
      }

      await this.service.saveMovement({
        ...values,
        quantity
      });
    }

    // använder produkter från context om React redan har hämtat dem
    const products = Array.isArray(context.products)
      ? context.products
      : await this.fetchProducts();

    return this.service.createReport(products);
  }

  // annars hämtar modulen produkterna själv
  async fetchProducts() {
    try {
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new InventoryApiError("Kunde inte hämta produkterna.");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof InventoryApiError) {
        throw error;
      }

      throw new InventoryApiError("Det gick inte att hämta produktdata.");
    }
  }
}
