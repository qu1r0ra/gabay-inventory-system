import { useEffect, useState } from "react";
import { Heading } from "./Heading";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import Input from "./Input";
import Button from "./Button";
import Toast from "./Toast";
import { inventoryApi } from "../lib/db/db.api";
import { useAuth } from "../lib/db/db.auth";

interface ItemFormProps {
  mode: "add" | "edit" | "delete";
}

function ItemForm({ mode }: ItemFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    item: "",
    lotId: "",
    quantity: "",
    expDate: "",
    newItem: "",
    newLotId: "",
  });

  const [itemOptions, setItemOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [lotOptions, setLotOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [disableExpDate, setDisableExpDate] = useState(false);
  const [skipRepopulation, setSkipRepopulation] = useState(false);

  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  const fetchAndSyncItems = async () => {
    const data = await inventoryApi.getItems();

    const cleaned = data.filter((item: any) => item.item_stocks?.length > 0);

    setAllItems(cleaned);

    const names = [...new Set(cleaned.map((item: any) => item.name))];
    setItemOptions(names.map((name) => ({ value: name, label: name })));
  };

  useEffect(() => {
    fetchAndSyncItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (newValue: any) => {
    if (skipRepopulation) return; // ❌ Skip autofill if flag is active

    const name = newValue?.value || "";

    setForm((prev) => ({
      ...prev,
      item: name,
      lotId: "",
      quantity: "",
      expDate: "",
      newItem: name,
      newLotId: "",
    }));
    setDisableExpDate(false);

    const matchedItems = allItems.filter((i) => i.name === name);
    const combinedLots = matchedItems.flatMap((i) => i.item_stocks || []);
    const lotIds = [...new Set(combinedLots.map((s) => s.lot_id))];

    setLotOptions(lotIds.map((lot: string) => ({ value: lot, label: lot })));
  };

  const handleLotChange = (newValue: any) => {
    if (skipRepopulation) return;

    const lot = newValue?.value || "";

    setForm((prev) => ({
      ...prev,
      lotId: lot,
      newLotId: lot,
    }));

    const matchedStock = allItems
      .flatMap((item) => item.item_stocks || [])
      .find((s: any) => s.lot_id === lot);

    if (matchedStock) {
      setForm((prev) => ({
        ...prev,
        expDate: matchedStock.expiry_date?.split("T")[0] || "",
        quantity: isAdd ? "" : matchedStock.item_qty.toString(),
      }));
      setDisableExpDate(true);
    } else {
      setForm((prev) => ({ ...prev, expDate: "" }));
      setDisableExpDate(false);
    }
  };

  const resetForm = () => {
    setForm({
      item: "",
      lotId: "",
      quantity: "",
      expDate: "",
      newItem: "",
      newLotId: "",
    });
    setLotOptions([]);
    setDisableExpDate(false);
  };

  const handleSubmit = async () => {
    try {
      if (!user?.id) throw new Error("User not logged in.");

      if (isAdd) {
        await fetchAndSyncItems();
        if (!form.item || !form.lotId || !form.quantity) {
          throw new Error("Item name, lot ID, and quantity are required.");
        }

        const isNewItem = !itemOptions.find((opt) => opt.value === form.item);
        const matchedItem = allItems.find((i) => i.name === form.item);
        const isExistingLot = matchedItem?.item_stocks?.some(
          (s: any) => s.lot_id === form.lotId
        );
        const isNewLot = !isExistingLot && !!form.expDate;

        if (isNewItem) {
          await inventoryApi.createItem({
            name: form.item,
            initialStock: {
              userId: user.id,
              lotId: form.lotId,
              quantity: Number(form.quantity),
              expiryDate: form.expDate || undefined,
            },
          });
          setToast({ message: "New item and stock added.", type: "success" });
        } else if (isNewLot) {
          await inventoryApi.createItemStockForItem({
            itemId: matchedItem.id,
            lotId: form.lotId,
            quantity: Number(form.quantity),
            userId: user.id,
            expiryDate: form.expDate || undefined,
          });
          setToast({
            message: "New lot added to existing item.",
            type: "success",
          });
        } else {
          await inventoryApi.createTransaction({
            lotId: form.lotId,
            userId: user.id,
            quantity: Number(form.quantity),
            type: "DEPOSIT",
          });
          setToast({
            message: "Quantity added to existing lot.",
            type: "success",
          });
          await fetchAndSyncItems();
        }
      } else if (isEdit) {
        if (!form.item || !form.lotId) {
          throw new Error("Item and lot ID are required for editing.");
        }

        await fetchAndSyncItems(); // Ensure latest data

        // Search for the lot across all items
        const matchedStock = allItems
          .flatMap((i) =>
            (i.item_stocks || []).map((s: any) => ({
              ...s,
              item_id: i.id,
              item_name: i.name,
            }))
          )
          .find((s) => s.lot_id === form.lotId && s.item_name === form.item);

        if (!matchedStock) {
          throw new Error("Selected item or lot ID not found.");
        }

        const matchedItem = allItems.find((i) => i.id === matchedStock.item_id);
        if (!matchedItem) {
          throw new Error("Associated item not found.");
        }

        const newName = form.newItem.trim();
        const newLot = form.newLotId.trim();
        const newQty = Number(form.quantity);
        const newDate = form.expDate;

        const itemNameChanged = newName && newName !== matchedItem.name;
        const lotIdChanged = newLot && newLot !== matchedStock.lot_id;
        const qtyChanged = !isNaN(newQty) && newQty !== matchedStock.item_qty;
        const dateChanged =
          newDate && newDate !== matchedStock.expiry_date?.split("T")[0];

        if (!itemNameChanged && !lotIdChanged && !qtyChanged && !dateChanged) {
          throw new Error("No changes detected.");
        }

        await inventoryApi.updateItemStockDetails({
          itemId: matchedItem.id,
          oldLotId: matchedStock.lot_id,
          newItemName: itemNameChanged ? newName : undefined,
          newLotId: lotIdChanged ? newLot : undefined,
          quantity: qtyChanged ? newQty : undefined,
          expiryDate: dateChanged ? newDate : undefined,
          userId: user.id,
        });

        await fetchAndSyncItems();

        const updatedItemName = newName || form.item;
        const updatedLotId = newLot || form.lotId;

        setSkipRepopulation(true);

        setForm((prev) => ({
          ...prev,
          item: updatedItemName,
          lotId: updatedLotId,
          newItem: updatedItemName,
          newLotId: updatedLotId,
        }));

        handleItemChange({ value: updatedItemName });
        handleLotChange({ value: updatedLotId });
        resetForm();
        setSkipRepopulation(false);

        setToast({
          message: "Item stock edited successfully.",
          type: "success",
        });
      } else if (isDelete) {
        if (!form.item || !form.lotId) {
          throw new Error("Item and lot ID are required to delete.");
        }

        await inventoryApi.deleteItemStock({
          lotId: form.lotId,
          userId: user.id,
        });

        setToast({
          message: "Stock entry deleted successfully.",
          type: "success",
        });
      }

      await fetchAndSyncItems();
      resetForm();
    } catch (err: any) {
      setToast({
        message: err.message || "Something went wrong.",
        type: "error",
      });
    }
  };

  if (isEdit) {
    return (
      <>
        <div className="w-[600px] h-[750px] border border-black/70 rounded-lg bg-white p-8 flex flex-col">
          <div className="w-[540px] mb-4">
            <Heading level={2} size="lg" className="text-black mb-1">
              Edit Item Form
            </Heading>
            <p className="font-Work-Sans text-md text-border">
              Select an existing item and lot ID to modify existing fields.
            </p>
          </div>

          <div className="flex flex-col items-center gap-y-8 flex-grow">
            <div className="w-[540px]">
              <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
                Item Name
              </label>
              <Select
                isClearable
                name="item"
                options={itemOptions}
                onChange={handleItemChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select an item"
                value={
                  form.item ? { label: form.item, value: form.item } : null
                }
              />
            </div>

            <div className="w-[540px]">
              <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
                Lot ID
              </label>
              <Select
                isClearable
                name="lotId"
                options={lotOptions}
                onChange={handleLotChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select a lot ID"
                value={
                  form.lotId ? { label: form.lotId, value: form.lotId } : null
                }
              />
            </div>

            <Input
              label="New Item Name"
              id="newItem"
              name="newItem"
              type="text"
              value={form.newItem}
              onChange={handleChange}
              size="custom"
              className="w-[540px]"
              placeholder="Enter new item name"
              inputClassName="bg-white"
            />

            <Input
              label="New Lot ID"
              id="newLotId"
              name="newLotId"
              type="text"
              value={form.newLotId}
              onChange={handleChange}
              size="custom"
              className="w-[540px]"
              placeholder="Enter new lot ID"
              inputClassName="bg-white"
            />

            <Input
              label="Quantity"
              id="quantity"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              size="custom"
              className="w-[540px]"
              placeholder="Enter quantity"
              inputClassName="bg-white"
            />

            <Input
              label="Expiration Date"
              id="expDate"
              name="expDate"
              type="date"
              value={form.expDate}
              onChange={handleChange}
              size="custom"
              className="w-[540px]"
              inputClassName="bg-white"
            />
          </div>

          <div className="flex justify-center mt-4">
            <Button size="sm" onClick={handleSubmit}>
              Edit
            </Button>
          </div>
        </div>

        {toast && (
          <div className="flex justify-center mt-4">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="w-[600px] h-[600px] border border-black/70 rounded-lg bg-white p-8 flex flex-col">
        <div className="w-[540px] mb-4">
          <Heading level={2} size="lg" className="text-black mb-1">
            {isAdd ? "Add Item Form" : "Delete Item Form"}
          </Heading>
          <p className="font-Work-Sans text-md text-border">
            {isAdd
              ? "Add instances of existing items or create brand new ones."
              : "Select item and lot ID to remove from inventory."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-y-9 flex-grow">
          <div className="w-[540px]">
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Item Name
            </label>
            {isAdd ? (
              <CreatableSelect
                isClearable
                name="item"
                options={itemOptions}
                onChange={handleItemChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select or type a new item"
                value={
                  form.item ? { label: form.item, value: form.item } : null
                }
              />
            ) : (
              <Select
                isClearable
                name="item"
                options={itemOptions}
                onChange={handleItemChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select an item"
                value={
                  form.item ? { label: form.item, value: form.item } : null
                }
              />
            )}
          </div>

          <div className="w-[540px]">
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Lot ID
            </label>
            {isAdd ? (
              <CreatableSelect
                isClearable
                name="lotId"
                options={lotOptions}
                onChange={handleLotChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select or type a lot ID"
                value={
                  form.lotId ? { label: form.lotId, value: form.lotId } : null
                }
              />
            ) : (
              <Select
                isClearable
                name="lotId"
                options={lotOptions}
                onChange={handleLotChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select a lot ID"
                value={
                  form.lotId ? { label: form.lotId, value: form.lotId } : null
                }
              />
            )}
          </div>

          <Input
            label="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            size="custom"
            className="w-[540px]"
            placeholder="Enter quantity"
            inputClassName="bg-white"
            disabled={isDelete}
          />

          <Input
            label="Expiration Date"
            id="expDate"
            name="expDate"
            type="date"
            value={form.expDate}
            onChange={handleChange}
            size="custom"
            className="w-[540px]"
            inputClassName="bg-white"
            disabled={isDelete || disableExpDate}
          />
        </div>

        <div className="flex justify-center mt-4">
          <Button size="sm" onClick={handleSubmit}>
            {isAdd ? "Add" : "Delete"}
          </Button>
        </div>
      </div>

      {toast && (
        <div className="flex justify-center mt-4">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </>
  );
}

export default ItemForm;
