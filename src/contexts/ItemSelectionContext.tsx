import React, { createContext, useContext, useState, ReactNode } from "react";

type SelectedItem = {
  lotId: string;
  name: string;
  qtyTaken: number; // ✅ user's selected quantity
  totalQty: number; // ✅ actual stock available
  expDate: string;
  lastModified: string;
};

type ItemSelectionContextType = {
  selectedItems: Record<string, SelectedItem>;
  confirmedItems: Record<string, SelectedItem>;
  updateItemQty: (lotId: string, item: SelectedItem) => void;
  resetSelections: () => void;
  confirmSelection: () => void;
  removeConfirmedItems: (lotIds: string[]) => void;
  updateConfirmedItemQty: (lotId: string, newQty: number) => void;
};

const ItemSelectionContext = createContext<
  ItemSelectionContextType | undefined
>(undefined);

export const ItemSelectionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [selectedItems, setSelectedItems] = useState<
    Record<string, SelectedItem>
  >({});
  const [confirmedItems, setConfirmedItems] = useState<
    Record<string, SelectedItem>
  >({});

  const removeConfirmedItems = (lotIds: string[]) => {
    setConfirmedItems((prev) => {
      const updated = { ...prev };
      lotIds.forEach((lotId) => {
        delete updated[lotId];
      });
      return updated;
    });
  };

  const confirmSelection = () => {
    setConfirmedItems((prev) => {
      const newConfirmed = { ...prev };
      Object.values(selectedItems).forEach((item) => {
        if (item.qtyTaken > 0) {
          if (newConfirmed[item.lotId]) {
            newConfirmed[item.lotId].qtyTaken += item.qtyTaken;
          } else {
            newConfirmed[item.lotId] = {
              ...item,
              totalQty: item.totalQty, // ✅ preserve totalQty
            };
          }
        }
      });
      return newConfirmed;
    });

    setSelectedItems({});
  };

  const updateItemQty = (lotId: string, item: SelectedItem) => {
    setSelectedItems((prev) => {
      const newState = { ...prev };

      if (item.qtyTaken <= 0) {
        delete newState[lotId];
      } else {
        newState[lotId] = {
          ...item,
          totalQty: item.totalQty, // ✅ ensure totalQty is included
        };
      }

      return newState;
    });
  };

  const updateConfirmedItemQty = (lotId: string, newQty: number) => {
    setConfirmedItems((prev) => {
      const updated = { ...prev };
      if (updated[lotId]) {
        updated[lotId] = {
          ...updated[lotId],
          qtyTaken: newQty, // ✅ update qtyTaken only
        };
      }
      return updated;
    });
  };

  const resetSelections = () => setSelectedItems({});

  return (
    <ItemSelectionContext.Provider
      value={{
        selectedItems,
        confirmedItems,
        updateItemQty,
        resetSelections,
        confirmSelection,
        removeConfirmedItems,
        updateConfirmedItemQty,
      }}
    >
      {children}
    </ItemSelectionContext.Provider>
  );
};

export const useItemSelection = () => {
  const context = useContext(ItemSelectionContext);
  if (!context) {
    throw new Error(
      "useItemSelection must be used within an ItemSelectionProvider"
    );
  }
  return context;
};
