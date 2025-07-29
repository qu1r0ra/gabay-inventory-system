import { useState } from "react";
import { Heading } from "./General/Heading";
import NumberStepper from "./General/NumberStepper";
import Button from "./General/Button";
import Toast from "./General/Toast";
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
  const { loading, user } = useAuth();

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
    setToast({ message: "Items removed from confirmation." });
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
    <div className="w-full max-w-[900px] min-h-[650px] bg-white border border-black/70 rounded-lg overflow-hidden flex flex-col relative">
      {/* Toast (bottom center) */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[90%] px-4">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-primary px-3 py-2 sm:px-6 sm:py-4 shrink-0 flex flex-col sm:flex-row items-center justify-between">
        <Heading
          level={3}
          size="sm"
          className="text-white mb-2 sm:mb-0 text-center sm:text-left"
        >
          Confirmation
        </Heading>
        <div className="flex gap-2 w-full sm:w-auto justify-center">
          <Button
            size="xs"
            onClick={handleRemove}
            disabled={selectedLotIds.size === 0}
            className="w-1/2 sm:w-auto px-2"
          >
            Remove
          </Button>
          <Button
            size="xs"
            onClick={handleConfirm}
            className="w-1/2 sm:w-auto px-2"
          >
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
              className="w-full min-h-24 bg-white border-b border-border flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 justify-between gap-2"
            >
              {/* Left */}
              <div className="flex items-start gap-3 w-full">
                <input
                  type="checkbox"
                  className="w-5 h-5 mt-1 accent-primary flex-shrink-0"
                  checked={selectedLotIds.has(item.lotId)}
                  onChange={() => toggleSelection(item.lotId)}
                />
                <div className="flex-1 flex flex-col min-w-0">
                  <Heading
                    level={3}
                    size="sm"
                    className="font-Work-Sans mb-1 truncate"
                  >
                    {item.name}
                  </Heading>
                  <div className="text-xs sm:text-sm text-black font-Work-Sans flex flex-wrap gap-1 sm:gap-6">
                    <span className="block w-full sm:w-[130px] truncate">
                      Exp: {item.expDate}
                    </span>
                    <span
                      className="block w-[150px] sm:w-[260px] truncate"
                      title={item.lotId}
                    >
                      ID: {item.lotId}
                    </span>

                    <span className="block w-full sm:w-[80px]">
                      Stock: {item.totalQty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div className="ml-0 sm:ml-6 w-full sm:w-auto mt-2 sm:mt-0">
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
