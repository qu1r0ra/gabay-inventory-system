import { useState, useRef, useEffect } from "react";
import InventoryTable from "../components/InventoryTable";
import Button from "../components/Button";
import { Link } from "react-router-dom";

const columns = [
  { key: "icon", label: "ICON" },
  { key: "name", label: "ITEM NAME" },
  { key: "qty", label: "QTY" },
  { key: "lotId", label: "LOT ID" },
  { key: "expDate", label: "EXP DATE" },
  { key: "lastModified", label: "LAST MODIFIED" },
  { key: "action", label: "ACTION" },
];

const initialData = [
  { icon: "", name: "Bandage", qty: 120, lotId: "A001", expDate: "2026-01-01", lastModified: "2025-06-12", action: "" },
  { icon: "", name: "Alcohol Wipes", qty: 80, lotId: "B002", expDate: "2025-12-01", lastModified: "2025-06-10", action: "" },
  { icon: "", name: "Gauze Pads", qty: 50, lotId: "C003", expDate: "2027-03-15", lastModified: "2025-06-08", action: "" },
  { icon: "", name: "Antibiotic Ointment", qty: 70, lotId: "D004", expDate: "2025-09-10", lastModified: "2025-06-06", action: "" },
  { icon: "", name: "Surgical Gloves", qty: 200, lotId: "E005", expDate: "2026-11-20", lastModified: "2025-06-05", action: "" },
  { icon: "", name: "Thermometer", qty: 30, lotId: "F006", expDate: "N/A", lastModified: "2025-06-03", action: "" },
  { icon: "", name: "Face Masks", qty: 500, lotId: "G007", expDate: "2026-06-30", lastModified: "2025-06-02", action: "" },
  { icon: "", name: "Scissors", qty: 25, lotId: "H008", expDate: "N/A", lastModified: "2025-06-01", action: "" },
  { icon: "", name: "Cotton Balls", qty: 150, lotId: "I009", expDate: "2025-10-05", lastModified: "2025-05-30", action: "" },
  { icon: "", name: "Eye Drops", qty: 60, lotId: "J010", expDate: "2025-08-08", lastModified: "2025-05-28", action: "" },
  { icon: "", name: "Burn Cream", qty: 90, lotId: "K011", expDate: "2026-02-15", lastModified: "2025-05-25", action: "" },
  { icon: "", name: "Medical Tape", qty: 110, lotId: "L012", expDate: "2026-04-01", lastModified: "2025-05-22", action: "" },
];

function Inventory() {
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
    <div className="flex justify-center min-h-screen p-4">
      <div className="w-full max-w-[940px] flex flex-col">

        <Link to="/add-item">
          <Button size="xs" className="mb-4 self-start">ADD ITEM</Button>
        </Link>

        <div ref={containerRef} className="h-[650px]">
          <InventoryTable columns={columns} data={visibleData} />
        </div>

        <div className="flex justify-center items-center gap-12 mt-4">
          <Button size="sm" disabled={!hasPrev} onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}>
            BACK
          </Button>
          <span className="text-white text-sm">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button size="sm" disabled={!hasNext} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages - 1))}>
            NEXT
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
