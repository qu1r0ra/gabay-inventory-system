import { useState, useRef, useEffect } from "react";
import ActivityLogTable from "../components/ActivityLogTable";
import Button from "../components/Button";

const columns = [
  { key: "icon", label: "ICON" },
  { key: "name", label: "NAME" },
  { key: "item", label: "ITEM" },
  { key: "date", label: "DATE" },
  { key: "time", label: "TIME" },
  { key: "action", label: "ACTION" },
];

const initialData = [
  { icon: "", name: "John Doe", item: "Canned Beans", date: "2025-06-17", time: "10:24 AM", action: "Add 2" },
  { icon: "", name: "Jane Smith", item: "Rice Sack", date: "2025-06-16", time: "03:45 PM", action: "Remove 1" },
  { icon: "", name: "Alex Cruz", item: "Bottled Water", date: "2025-06-15", time: "09:30 AM", action: "Add 5" },
  { icon: "", name: "Emily Tan", item: "First Aid Kit", date: "2025-06-14", time: "12:10 PM", action: "Remove 3" },
  { icon: "", name: "Carlos Reyes", item: "Blanket", date: "2025-06-13", time: "08:00 AM", action: "Add 1" },
  { icon: "", name: "Mia Lopez", item: "Cooking Oil", date: "2025-06-12", time: "02:45 PM", action: "Remove 2" },
  { icon: "", name: "Liam Santos", item: "Noodles", date: "2025-06-11", time: "11:25 AM", action: "Add 10" },
  { icon: "", name: "Ava Dela Cruz", item: "Medicine", date: "2025-06-10", time: "04:30 PM", action: "Remove 1" },
  { icon: "", name: "Noah Garcia", item: "Milk Powder", date: "2025-06-09", time: "07:15 AM", action: "Add 3" },
  { icon: "", name: "Sophia Ramos", item: "Flashlight", date: "2025-06-08", time: "06:50 PM", action: "Remove 1" },
  { icon: "", name: "Ethan Navarro", item: "Towels", date: "2025-06-07", time: "09:00 AM", action: "Add 4" },
  { icon: "", name: "Isla Enriquez", item: "Soap Bars", date: "2025-06-06", time: "03:05 PM", action: "Remove 5" },
];

function ActivityLog() {
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const calculateRows = () => {
      const containerHeight = containerRef.current?.offsetHeight ?? 650;
      const rowHeight = 50;
      const theadHeight = 50;
      const footerPadding = 20;
      const available = containerHeight - theadHeight - footerPadding;
      const newRowsPerPage = Math.floor(available / rowHeight) || 1;

      setRowsPerPage(newRowsPerPage);

      const maxPage = Math.max(0, Math.floor((initialData.length - 1) / newRowsPerPage));
      setCurrentPage(prev => Math.min(prev, maxPage));
    };

    calculateRows();
    window.addEventListener("resize", calculateRows);
    return () => window.removeEventListener("resize", calculateRows);
  }, []);

  const totalPages = Math.ceil(initialData.length / rowsPerPage);
  const startIdx = currentPage * rowsPerPage;
  const endIdx = Math.min(startIdx + rowsPerPage, initialData.length);
  const visibleData = initialData.slice(startIdx, endIdx);

  const hasNext = currentPage < totalPages - 1;
  const hasPrev = currentPage > 0;

  return (
    <div className="flex justify-center min-h-screen p-4 flex-col items-center">
      <div ref={containerRef} className="w-full max-w-[940px] h-[650px]">
        <ActivityLogTable columns={columns} data={visibleData} />
      </div>

      <div className="flex justify-center items-center gap-12 mt-4">
        <Button size="sm" disabled={!hasPrev} onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}>
          BACK
        </Button>
        <span className="text-primary text-sm font-semibold font-Work-Sans">
            {currentPage + 1} of {totalPages}
        </span>
        <Button size="sm" disabled={!hasNext} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}>
          NEXT
        </Button>
      </div>
    </div>
  );
}

export default ActivityLog;
