import { inventoryApi } from "./db.api";

export async function runInventoryApiTests() {
  console.log("--- Starting Inventory API Tests ---");

  let itemId: string | null = null;

  try {
    // 1. CREATE an item
    console.log("Testing createItem...");
    const newItemData = {
      name: `Test Item ${Date.now()}`,
      initialStock: {
        quantity: 100,
        expiryDate: "2025-12-31",
      },
    };
    const createdItem = await inventoryApi.createItem(newItemData);
    itemId = createdItem.id; // Save the ID for cleanup
    console.log("createItem SUCCESS:", createdItem);

    // 2. READ all items
    console.log("\nTesting getItems...");
    const allItems = await inventoryApi.getItems();
    console.log("getItems SUCCESS (first 5):", allItems.slice(0, 5));
    if (!allItems.some((item) => item.id === itemId)) {
      throw new Error("Created item not found in getItems list!");
    }

    // 3. READ a single item
    console.log("\nTesting getItem...");
    const singleItem = await inventoryApi.getItem(itemId);
    console.log("getItem SUCCESS:", singleItem);
    if (singleItem.name !== newItemData.name) {
      throw new Error("getItem returned an item with the wrong name!");
    }

    // 4. UPDATE an item
    console.log("\nTesting updateItem...");
    const updatedItemData = { name: `${newItemData.name} (Updated)` };
    const updatedItem = await inventoryApi.updateItem(itemId, updatedItemData);
    console.log("updateItem SUCCESS:", updatedItem);
    if (updatedItem.name !== updatedItemData.name) {
      throw new Error("updateItem did not update the name correctly!");
    }

    // 5. UPDATE stock
    console.log("\nTesting updateStock...");
    const lotId = singleItem.item_stocks[0]?.lot_id;
    if (lotId) {
      // IMPORTANT: Replace with a real user ID from your project's Supabase dashboard
      // Go to Authentication -> Users -> Copy a User ID
      const userId = "your-real-user-id-from-supabase";

      if (userId === "your-real-user-id-from-supabase") {
        console.warn(
          "updateStock SKIPPED: Please provide a valid user ID in the test script."
        );
      } else {
        await inventoryApi.updateStock(lotId, 150, userId);
        const itemAfterStockUpdate = await inventoryApi.getItem(itemId);
        console.log("updateStock SUCCESS:", itemAfterStockUpdate);
        if (itemAfterStockUpdate.item_stocks[0]?.item_qty !== 150) {
          throw new Error("updateStock did not update the quantity correctly!");
        }
      }
    } else {
      console.warn(
        "updateStock SKIPPED: No lot_id found for the created item."
      );
    }

    // 6. DELETE the item
    console.log("\nTesting deleteItem...");
    await inventoryApi.deleteItem(itemId);
    console.log("deleteItem SUCCESS");
    itemId = null;

    try {
      await inventoryApi.getItem(itemId!);
      console.error("VERIFY DELETE FAILED: Item still exists after deletion.");
    } catch (error) {
      console.log(
        "VERIFY DELETE SUCCESS: Item not found after deletion (this is expected)."
      );
    }
  } catch (error) {
    console.error("--- API Test Failed ---");
    console.error(error);
  } finally {
    // Cleanup
    if (itemId) {
      console.log("\n--- Cleaning up created test item... ---");
      await inventoryApi.deleteItem(itemId);
      console.log("--- Cleanup complete. ---");
    }
    console.log("\n--- Inventory API Tests Finished ---");
  }
}
