import React, { useEffect, useState } from "react";
import ActivityLogTable from "../components/ActivityLog/ActivityLogTable";
import ActivityLogCard from "../components/ActivityLog/ActivityLogCard";
import { useSearch } from "../contexts/SearchContext";
import Button from "../components/General/Button";
import { inventoryApi } from "../lib/db/db.api";

const columns = [
  { key: "actor", label: "User Name" },
  { key: "item", label: "Item Name" },
  { key: "lotId", label: "Lot ID" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "type", label: "Action" },
];

const ROWS_PER_PAGE = 9;

function ActivityLog() {
  const { query } = useSearch();
  const [rawData, setRawData] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    inventoryApi
      .getActivityLogEntries()
      .then(setRawData)
      .catch((err) => console.error("Failed to fetch activity log:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, filter, sort]);

  const filteredData = rawData
    .filter((row) => {
      switch (filter) {
        case "added":
          return row.type.startsWith("+");
        case "removed":
          return row.type.startsWith("-");
        case "corrections":
          return row.type.startsWith("=");
        case "deleted":
          return row.type === "X";
        default:
          return true;
      }
    })
    .filter((row) =>
      query.trim()
        ? Object.values(row)
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())
        : true
    )
    .sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);

      if (sort === "date_asc") return dateTimeA.getTime() - dateTimeB.getTime();
      if (sort === "date_desc")
        return dateTimeB.getTime() - dateTimeA.getTime();
      if (sort === "name") return a.item.localeCompare(b.item);
      return 0;
    });

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
              actor: "",
              item: "",
              lotId: "",
              date: "",
              time: "",
              type: "",
            })
          ),
        ]
      : visibleRows;

  return (
    <div className="flex flex-col items-center justify-start min-h-screen mt-3 p-4 gap-4">
      {/* Container */}
      <div className="w-full max-w-[1000px] border border-black/70 rounded-md overflow-hidden bg-white">
        {/* Header with dropdowns */}
        <div className="bg-primary px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2" />
          <div className="flex flex-col gap-2 md:flex-row md:gap-4">
            <select
              className="w-full md:w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="all">All</option>
              <option value="added">Added (+)</option>
              <option value="removed">Removed (-)</option>
              <option value="corrections">Corrections (=)</option>
              <option value="deleted">Deleted (X)</option>
            </select>
            <select
              className="w-full md:w-[200px] px-2 py-1 rounded text-sm text-black bg-white border border-gray-300"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="name">Item Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          {loading ? (
            <div className="flex items-center justify-center h-[450px]">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <ActivityLogTable columns={columns} data={paddedData} />
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden w-full max-w-[1000px] mx-auto flex flex-col gap-4 px-4">
        {loading ? (
          <div className="flex items-center justify-center h-[450px]">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          visibleRows.map((entry, idx) => (
            <ActivityLogCard key={idx} entry={entry} />
          ))
        )}
      </div>

      {/* Pagination */}
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

export default ActivityLog;
