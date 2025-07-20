import React from "react";
import NumberStepper from "./NumberStepper";
import { useItemSelection } from "../contexts/ItemSelectionContext";

interface InventoryCardProps {
  item: {
    name: string;
    lotId: string;
    qty: number;
    expDate: string;
    lastModified: string;
  };
}

function InventoryCard({ item }: InventoryCardProps) {
  const { selectedItems, updateItemQty } = useItemSelection();
  const initialQty = selectedItems[item.lotId]?.qtyTaken || 0;

  const handleChange = (newQty: number) => {
    updateItemQty(item.lotId, {
      lotId: item.lotId,
      name: item.name,
      expDate: item.expDate,
      lastModified: item.lastModified,
      totalQty: item.qty,
      qtyTaken: newQty,
    });
  };

  return (
    <div className="w-full h-[150px] bg-white border border-[rgba(0,0,0,0.7)] shadow rounded-2xl p-4 flex flex-col justify-between font-Work-Sans text-black">
      <div>
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-lg font-semibold truncate">{item.name}</h2>
          <span className="text-sm max-w-[80px] truncate" title={item.lotId}>
            {item.lotId.slice(0, 5)}…
          </span>
        </div>
        <p className="text-sm">Qty: {item.qty}</p>
        <p className="text-sm">Expiry: {item.expDate}</p>
      </div>

      <div className="flex justify-between items-end">
        <div className="text-xs">Updated: {item.lastModified}</div>
        <NumberStepper
          key={item.lotId}
          min={0}
          max={999}
          initial={initialQty}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

export default InventoryCard;
