// src/components/NotificationStockCard.tsx
import React from "react";
import { Heading } from "./General/Heading";

type Stock = {
  lot_id: string;
  item_qty: number;
  expiry_date?: string;
  item?: { name?: string };
  deleted?: boolean;
};

type Props = { stock: Stock };

export default function NotificationStockCard({ stock }: Props) {
  const { lot_id, item_qty, expiry_date, item, deleted } = stock;

  // Truncate lot ID for small screens
  const displayLotId = lot_id;

  return (
    <div className="bg-white rounded-md shadow-lg border border-black/70 p-4 space-y-2 font-work-sans">
      <Heading size="sm" className="text-black">
        {item?.name ?? "-"}
      </Heading>

      <div className="flex justify-between text-sm text-black">
        <span>Quantity</span>
        <span className="font-medium text-black">{item_qty ?? "-"}</span>
      </div>

      <div className="flex justify-between text-sm text-black">
        <span>Lot ID</span>
        <span className="block truncate w-20 sm:w-auto">{displayLotId}</span>
      </div>

      <div className="flex justify-between text-sm text-black">
        <span>Expiry Date</span>
        <span className="text-black">{expiry_date?.split("T")[0] ?? "-"}</span>
      </div>

      <div className="flex justify-between text-sm text-black">
        <span>Status</span>
        <span
          className={
            deleted
              ? "font-medium text-secondary"
              : "font-medium text-green-600"
          }
        >
          {deleted ? "Deleted" : "Active"}
        </span>
      </div>
    </div>
  );
}
