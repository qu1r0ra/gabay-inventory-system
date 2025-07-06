import { inventoryApi } from "./db.api";
import { logger } from "../utils/console.js";

export async function runInventoryApiTests() {
  logger.test("Starting Inventory API Tests");

  let itemId: string | null = null;
  let lotId: string | null = null;

  try {
    // 1. CREATE an item
    logger.info("Testing createItem...");
    const newItemData = {
      name: `Test Item ${Date.now()}`,
      initialStock: {
        quantity: 100,
        expiryDate: "2025-12-31",
      },
    };
    const createdItem = await inventoryApi.createItem(newItemData);
    itemId = createdItem.id; // Save the ID for cleanup
    logger.success("createItem SUCCESS");

    // 2. READ all items
    logger.info("Testing getItems...");
    const allItems = await inventoryApi.getItems();
    logger.success(`getItems SUCCESS - Found ${allItems.length} items`);
    if (!allItems.some((item) => item.id === itemId)) {
      throw new Error("Created item not found in getItems list!");
    }

    // 3. READ a single item
    logger.info("Testing getItem...");
    if (!itemId) throw new Error("No item ID available");
    const singleItem = await inventoryApi.getItem(itemId);
    logger.success("getItem SUCCESS");
    if (singleItem.name !== newItemData.name) {
      throw new Error("getItem returned an item with the wrong name!");
    }

    // 4. GET stock by lot ID
    logger.info("Testing getStockByLotId...");
    if (singleItem.item_stocks && singleItem.item_stocks.length > 0) {
      lotId = singleItem.item_stocks[0].lot_id;
      if (lotId) {
        const stock = await inventoryApi.getStockByLotId(lotId);
        logger.success("getStockByLotId SUCCESS");
        if (stock.item_qty !== 100) {
          throw new Error("Stock quantity mismatch!");
        }
      }
    } else {
      logger.warning("No stock found for item, skipping getStockByLotId test");
    }

    // 5. UPDATE an item
    logger.info("Testing updateItem...");
    if (!itemId) throw new Error("No item ID available");
    const updatedItemData = { name: `${newItemData.name} (Updated)` };
    const updatedItem = await inventoryApi.updateItem(itemId, updatedItemData);
    logger.success("updateItem SUCCESS");
    if (updatedItem.name !== updatedItemData.name) {
      throw new Error("updateItem did not update the name correctly!");
    }

    // 6. UPDATE stock
    logger.info("Testing updateStock...");
    if (lotId) {
      // IMPORTANT: Replace with a real user ID from your project's Supabase dashboard
      // Go to Authentication -> Users -> Copy a User ID
      const userId = "your-real-user-id-from-supabase";

      if (userId === "your-real-user-id-from-supabase") {
        logger.warning("updateStock SKIPPED: Please provide a valid user ID in the test script.");
      } else {
        await inventoryApi.updateStock(lotId, 150, userId);
        const itemAfterStockUpdate = await inventoryApi.getItem(itemId);
        logger.success("updateStock SUCCESS");
        if (itemAfterStockUpdate.item_stocks[0]?.item_qty !== 150) {
          throw new Error("updateStock did not update the quantity correctly!");
        }
      }
    } else {
      logger.warning("updateStock SKIPPED: No lot_id found for the created item.");
    }

    // 7. TEST utility functions
    logger.info("Testing utility functions...");
    const lowStockItems = await inventoryApi.getLowStockItems();
    const expiringItems = await inventoryApi.getExpiringItems();
    logger.success(`Utility functions SUCCESS - Low stock: ${lowStockItems.length}, Expiring: ${expiringItems.length}`);

    // 8. DELETE the item
    logger.info("Testing deleteItem...");
    if (!itemId) throw new Error("No item ID available");
    await inventoryApi.deleteItem(itemId);
    logger.success("deleteItem SUCCESS");
    itemId = null;

    try {
      if (!itemId) throw new Error("No item ID to verify deletion");
      await inventoryApi.getItem(itemId);
      logger.error("VERIFY DELETE FAILED: Item still exists after deletion.");
    } catch (error) {
      logger.success("VERIFY DELETE SUCCESS: Item not found after deletion (this is expected).");
    }
  } catch (error) {
    logger.error("API Test Failed");
    console.error(error);
  } finally {
    // Cleanup
    if (itemId) {
      logger.info("Cleaning up created test item...");
      await inventoryApi.deleteItem(itemId);
      logger.success("Cleanup complete.");
    }
    logger.success("Inventory API Tests Finished");
  }
}
