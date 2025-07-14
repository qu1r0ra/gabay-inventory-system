import React, { useEffect, useState } from "react";
import InventoryTable from "../components/InventoryTable";
import Button from "../components/Button";
import { inventoryApi } from "../lib/db/db.api";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../contexts/SearchContext";
import { useSearchParams } from "react-router-dom";

const columns = [
  { key: "name", label: "Item Name" },
  { key: "lotId", label: "Lot ID" },
  { key: "qty", label: "Qty" },
  { key: "expDate", label: "Expiration Date" },
  { key: "lastModified", label: "Last Modified" },
  { key: "action", label: "Action" },
];

const ROWS_PER_PAGE = 14;

function Inventory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { query } = useSearch();
  const [rawData, setRawData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filter, setFilter] = useState(
    () => searchParams.get("filter") || "all"
  );
  const [sort, setSort] = useState("mod_desc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        let result;

        if (filter === "low") {
          const lowStocks = await inventoryApi.getLowStockItems(); // default threshold = 10
          result = lowStocks.map((stock: any) => ({
            name: stock.items.name,
            lotId: stock.lot_id,
            qty: stock.item_qty,
            expDate: stock.expiry_date?.split("T")[0] || "N/A",
            lastModified: stock.updated_at?.split("T")[0] || "N/A",
            lastModifiedRaw: stock.updated_at || "",
            action: "",
          }));
        } else if (filter === "expiring") {
          const expiringStocks = await inventoryApi.getNearExpiryItems(); // default = 30 days
          result = expiringStocks.map((stock: any) => ({
            name: stock.items.name,
            lotId: stock.lot_id,
            qty: stock.item_qty,
            expDate: stock.expiry_date?.split("T")[0] || "N/A",
            lastModified: stock.updated_at?.split("T")[0] || "N/A",
            lastModifiedRaw: stock.updated_at || "",
            action: "",
          }));
        } else if (filter === "expired") {
          const expiredStocks = await inventoryApi.getExpiredItems();
          result = expiredStocks.map((stock: any) => ({
            name: stock.items.name,
            lotId: stock.lot_id,
            qty: stock.item_qty,
            expDate: stock.expiry_date?.split("T")[0] || "N/A",
            lastModified: stock.updated_at?.split("T")[0] || "N/A",
            lastModifiedRaw: stock.updated_at || "",
            action: "",
          }));
        } else {
          const items = await inventoryApi.getItems();
          result = items.flatMap((item: any) =>
            item.item_stocks
              .filter((stock: any) => !stock.is_deleted)
              .map((stock: any) => ({
                name: item.name,
                lotId: stock.lot_id,
                qty: stock.item_qty,
                expDate: stock.expiry_date?.split("T")[0] || "N/A",
                lastModified: stock.updated_at?.split("T")[0] || "N/A",
                lastModifiedRaw: stock.updated_at || "",
                action: "",
              }))
          );
        }

        setRawData(result);
      } catch (error) {
        console.error("Error loading items:", error);
      }
    };

    fetchItems();
  }, [filter]);

  // Search, Sort

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    navigate(`/inventory?${params.toString()}`, { replace: true });
  }, [filter]);

  useEffect(() => {
    let result = [...rawData];

    // Search
    if (query.trim() !== "") {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.lotId.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.expDate);
      const dateB = new Date(b.expDate);
      const modA = new Date(a.lastModifiedRaw);
      const modB = new Date(b.lastModifiedRaw);

      if (sort === "qty_asc") return a.qty - b.qty;
      if (sort === "qty_desc") return b.qty - a.qty;
      if (sort === "exp_asc") {
        if (a.expDate === "N/A") return 1;
        if (b.expDate === "N/A") return -1;
        return dateA > dateB ? 1 : -1;
      }
      if (sort === "exp_desc") {
        if (a.expDate === "N/A") return -1;
        if (b.expDate === "N/A") return 1;
        return dateA < dateB ? 1 : -1;
      }
      if (sort === "mod_asc") return modA.getTime() - modB.getTime();
      if (sort === "mod_desc") return modB.getTime() - modA.getTime();
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    setFilteredData(result);
    setPage(0);
  }, [rawData, sort, query]); // 🟡 Note: `filter` removed from deps since it's used in rawData fetching now

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const startIdx = page * ROWS_PER_PAGE;
  const endIdx = startIdx + ROWS_PER_PAGE;
  const visibleRows = filteredData.slice(startIdx, endIdx);

  const paddedData =
    visibleRows.length < ROWS_PER_PAGE
      ? [
          ...visibleRows,
          ...Array.from({ length: ROWS_PER_PAGE - visibleRows.length }).map(
            () => ({
              name: "",
              lotId: "",
              qty: "",
              expDate: "",
              lastModified: "",
              action: "",
            })
          ),
        ]
      : visibleRows;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 gap-4">
      <div className="w-[1000px] border border-black/70 rounded-md overflow-hidden bg-white">
        {/* Header */}
        <div className="h-[70px] bg-primary px-4 py-3 flex justify-between items-center">
          <div className="flex gap-2">
            <Button size="xs" onClick={() => navigate("/add-item")}>
              Add Item
            </Button>
            <Button size="xs" onClick={() => navigate("/check-out")}>
              Confirm
            </Button>
          </div>
          <div className="flex gap-4">
            <select
              className="w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="low">Low Quantity</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <select
              className="w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="mod_desc">Last Modified: Latest First</option>
              <option value="mod_asc">Last Modified: Oldest First</option>
              <option value="qty_asc">Qty: Low to High</option>
              <option value="qty_desc">Qty: High to Low</option>
              <option value="exp_asc">Expiry: Soonest First</option>
              <option value="exp_desc">Expiry: Latest First</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <InventoryTable columns={columns} data={paddedData} />
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-6">
          <Button
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Back
          </Button>
          <Button
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          >
            Next
          </Button>
        </div>
        <span className="text-sm text-black font-Work-Sans">
          Page {page + 1} of {totalPages || 1}
        </span>
      </div>
    </div>
  );
}

export default Inventory;
