import React, { useEffect, useState } from "react";
import InventoryTable from "../components/Inventory/InventoryTable";
import Button from "../components/General/Button";
import { inventoryApi } from "../lib/db/db.api";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../contexts/SearchContext";
import { useSearchParams } from "react-router-dom";
import { useItemSelection } from "../contexts/ItemSelectionContext";
import InventoryCard from "../components/Inventory/InventoryCard";

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
  const { confirmSelection, selectedItems } = useItemSelection();
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

        if (filter === "selected") {
          const confirmed = Object.values(selectedItems).map((item: any) => ({
            name: item.name,
            lotId: item.lotId,
            qty: item.totalQty,
            expDate: item.expDate,
            lastModified: item.lastModified || "N/A",
            lastModifiedRaw: item.lastModified || "",
            action: "",
          }));
          result = confirmed;
        } else if (filter === "low") {
          const lowStocks = await inventoryApi.getLowStockItems();
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
          const expiringStocks = await inventoryApi.getNearExpiryItems();
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
  }, [rawData, sort, query]);

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
      {/* Container */}
      <div className="w-full max-w-[1000px] border border-black/70 rounded-md overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-primary px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {/* Left side - Buttons */}
          <div className="flex flex-row gap-2 justify-between">
            <Button size="xs" onClick={() => navigate("/add-item")}>
              Add Item
            </Button>
            <Button
              size="xs"
              onClick={() => {
                confirmSelection();
                navigate("/check-out");
              }}
            >
              Confirm
            </Button>
          </div>

          {/* Right side - Filters */}
          <div className="flex flex-col gap-2 md:flex-row md:gap-4">
            <select
              className="w-full md:w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="selected">Selected</option>
              <option value="low">Low Quantity</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
            <select
              className="w-full md:w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
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

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <InventoryTable columns={columns} data={paddedData} />
        </div>
      </div>

      {/* Mobile Card View (outside container) */}
      <div className="md:hidden w-full max-w-[1000px] mx-auto flex items-center flex-col gap-4 px-4">
        {visibleRows.map((item, idx) => (
          <InventoryCard key={idx} item={item} />
        ))}
      </div>

      {/* Pagination (visible on all screen sizes) */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-6">
          <Button
            size="xs"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Back
          </Button>
          <Button
            size="xs"
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
