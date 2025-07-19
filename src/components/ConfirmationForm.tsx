import { useState } from "react";
import { Heading } from "./Heading";
import NumberStepper from "./NumberStepper";
import Button from "./Button";
import Toast from "./Toast";
import { useItemSelection } from "../contexts/ItemSelectionContext";
import { useAuth } from "../lib/db/db.auth";
import { inventoryApi } from "../lib/db/db.api";

type ConfirmedItem = {
  lotId: string;
  name: string;
  expDate: string;
  totalQty: number;
  qtyTaken: number;
};

function ConfirmationForm() {
  const { confirmedItems, removeConfirmedItems, updateConfirmedItemQty } =
    useItemSelection();
  const items = Object.values(confirmedItems) as ConfirmedItem[];

  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const toggleSelection = (lotId: string) => {
    setSelectedLotIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(lotId) ? newSet.delete(lotId) : newSet.add(lotId);
      return newSet;
    });
  };

  const handleRemove = () => {
    removeConfirmedItems(Array.from(selectedLotIds));
    setSelectedLotIds(new Set());
    setToast({ message: "Items removed successfully." });
  };

  const handleConfirm = async () => {
    if (!user) {
      setToast({ message: "User not authenticated.", type: "error" });
      return;
    }

    const selectedItems = items.filter((item) =>
      selectedLotIds.has(item.lotId)
    );

    if (selectedItems.length === 0) {
      setToast({ message: "Please select items to confirm.", type: "error" });
      return;
    }

    try {
      for (const item of selectedItems) {
        await inventoryApi.createTransaction({
          lotId: item.lotId,
          userId: user.id,
          quantity: item.qtyTaken,
          type: "DISTRIBUTE",
        });
      }

      setToast({ message: "Transactions successful!" });
      removeConfirmedItems(selectedItems.map((i) => i.lotId));
      setSelectedLotIds(new Set());
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to create transactions.", type: "error" });
    }
  };

  return (
    <div className="w-[900px] h-[650px] bg-white border border-black/70 rounded-lg overflow-hidden flex flex-col relative">
      {/* Toast (bottom center) */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-primary px-6 py-4 shrink-0 flex items-center justify-between">
        <Heading level={3} size="sm" className="text-white">
          Confirmation
        </Heading>
        <div className="flex gap-2">
          <Button
            size="xs"
            onClick={handleRemove}
            disabled={selectedLotIds.size === 0}
          >
            Remove
          </Button>
          <Button size="xs" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No confirmed items.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.lotId}
              className="w-full h-24 bg-white border-t border-border flex items-center px-4 justify-between"
            >
              {/* Left */}
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  className="w-5 h-5 mt-1 accent-primary"
                  checked={selectedLotIds.has(item.lotId)}
                  onChange={() => toggleSelection(item.lotId)}
                />
                <div className="flex flex-col">
                  <Heading level={3} size="md" className="font-Work-Sans mb-1">
                    {item.name}
                  </Heading>
                  <div className="text-sm text-black font-Work-Sans flex gap-6">
                    <span className="w-[130px]">Exp: {item.expDate}</span>
                    <span className="w-[260px]">ID: {item.lotId}</span>
                    <span className="w-[80px]">Stock: {item.totalQty}</span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="ml-6">
                <NumberStepper
                  initial={item.qtyTaken}
                  min={1}
                  max={item.totalQty}
                  onChange={(newQty) =>
                    updateConfirmedItemQty(item.lotId, newQty)
                  }
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConfirmationForm;
