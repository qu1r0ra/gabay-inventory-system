import React, { useEffect, useState } from "react";
import DashboardCard from "../components/Dashboard/DashboardCard";
import ReportCard from "../components/Dashboard/ReportCard";
import { inventoryApi } from "../lib/db/db.api";

function Dashboard() {
  const [totalItems, setTotalItems] = useState(0);
  const [lowQuantity, setLowQuantity] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [expired, setExpired] = useState(0);
  const [itemsAdded, setItemsAdded] = useState(0);
  const [itemsTaken, setItemsTaken] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const items = await inventoryApi.getItems(); // flattened item_stocks
        const flattened = items.flatMap((item: any) =>
          item.item_stocks.filter((s: any) => !s.is_deleted)
        );
        setTotalItems(flattened.length);

        const low = await inventoryApi.getLowStockItems();
        setLowQuantity(low.length);

        const expiring = await inventoryApi.getNearExpiryItems();
        setExpiringSoon(expiring.length);

        const expiredItems = await inventoryApi.getExpiredItems();
        setExpired(expiredItems.length);

        const { itemsAdded, itemsTaken } =
          await inventoryApi.getMonthlyTransactionSummary();
        setItemsAdded(itemsAdded);
        setItemsTaken(itemsTaken);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="w-full flex flex-col items-center py-6 sm:py-10 gap-8 sm:gap-12 bg-gray-100 px-4">
      {/* Grid for Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 justify-items-center w-full max-w-[900px]">
        <DashboardCard
          to="/inventory"
          title="Total Items"
          value={totalItems}
          label="Current Stock Quantity"
        />
        <DashboardCard
          to="/inventory?filter=low"
          title="Low Quantity"
          value={lowQuantity}
          label="Items Running Low"
        />
        <DashboardCard
          to="/inventory?filter=expiring"
          title="Expiring Soon"
          value={expiringSoon}
          label="Expiring Within 30 Days"
        />
        <DashboardCard
          to="/inventory?filter=expired"
          title="Expired"
          value={expired}
          label="Past Expiration Date"
        />
      </div>

      {/* Centered Report Card below */}
      <div className="w-full max-w-[900px] flex justify-center">
        <ReportCard itemsAdded={itemsAdded} itemsTaken={itemsTaken} />
      </div>
    </div>
  );
}

export default Dashboard;
