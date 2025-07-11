import { useEffect, useState } from "react";
import { Heading } from "./Heading";
import { inventoryApi } from "../lib/db/db.api";
import { supabase } from "../lib/db";
import { useAuth } from "../lib/db/db.auth";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import Input from "./Input";
import Button from "./Button";
import Toast from "./Toast";


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

  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string }[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [disableExpDate, setDisableExpDate] = useState(false);

  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const isDelete = mode === "delete";

  useEffect(() => {
    const fetchItems = async () => {
      const data = await inventoryApi.getItems();
      setAllItems(data);
      const names = [...new Set(data.map((item: any) => item.name))];
      setItemOptions(names.map((name) => ({ value: name, label: name })));
    };
    fetchItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (newValue: any) => {
    const name = newValue?.value || "";
    setForm((prev) => ({
      ...prev,
      item: name,
      lotId: "",
      quantity: "",
      expDate: "",
      newItem: "",
      newLotId: "",
    }));
    setDisableExpDate(false);

    const matched = allItems.find((i) => i.name === name);
    if (matched) {
      const lots = matched.item_stocks?.map((s: any) => s.lot_id);
      setLotOptions((lots || []).map((lot: string) => ({ value: lot, label: lot })));
    } else {
      setLotOptions([]);
    }
  };

  const handleLotChange = (newValue: any) => {
    const lot = newValue?.value || "";
    setForm((prev) => ({ ...prev, lotId: lot }));

    const matchedItem = allItems.find((i) => i.name === form.item);
    const matchedStock = matchedItem?.item_stocks?.find((s: any) => s.lot_id === lot);

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

  const handleSubmit = async () => {
    if (!isAdd) {
      setToast({
        message: `Form submission (${mode}) is currently disabled.`,
        type: "error",
      });
      return;
    }

    try {
      if (!user?.id) throw new Error("User not logged in.");
      if (!form.item || !form.lotId || !form.quantity) {
        throw new Error("Item name, lot ID, and quantity are required.");
      }

      const isNewItem = !itemOptions.find((opt) => opt.value === form.item);
      const matchedItem = allItems.find((i) => i.name === form.item);
      const isExistingLot = matchedItem?.item_stocks?.some((s: any) => s.lot_id === form.lotId);
      const isNewLot = !isExistingLot && !!form.expDate;

      // Scenario 1: New item + new lot
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
      }

      // Scenario 2: Existing item + new lot
      else if (isNewLot) {
        if (!matchedItem) throw new Error("Item not found in database.");

        const { error: insertError } = await supabase.from("item_stocks").insert({
          item_id: matchedItem.id,
          lot_id: form.lotId,
          item_qty: 0,
          expiry_date: form.expDate || null,
        });

        if (insertError) throw insertError;

        await inventoryApi.createTransaction({
          lotId: form.lotId,
          userId: user.id,
          quantity: Number(form.quantity),
          type: "DEPOSIT",
        });

        setToast({ message: "New lot added to existing item.", type: "success" });
      }

      // Scenario 3: Existing item + existing lot
      else {
        await inventoryApi.createTransaction({
          lotId: form.lotId,
          userId: user.id,
          quantity: Number(form.quantity),
          type: "DEPOSIT",
        });

        setToast({ message: "Quantity added to existing lot.", type: "success" });
      }

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
    } catch (err: any) {
      setToast({ message: err.message || "Something went wrong.", type: "error" });
    }
  };

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
          {/* Item Name */}
          <div className="w-[540px]">
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">Item Name</label>
            {isAdd ? (
              <CreatableSelect
                isClearable
                name="item"
                options={itemOptions}
                onChange={handleItemChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select or type a new item"
                value={form.item ? { label: form.item, value: form.item } : null}
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
                value={form.item ? { label: form.item, value: form.item } : null}
              />
            )}
          </div>

          {/* Lot ID */}
          <div className="w-[540px]">
            <label className="block text-xs font-bold font-Work-Sans text-black mb-1">Lot ID</label>
            {isAdd ? (
              <CreatableSelect
                isClearable
                name="lotId"
                options={lotOptions}
                onChange={handleLotChange}
                className="text-sm"
                classNamePrefix="select"
                placeholder="Select or type a lot ID"
                value={form.lotId ? { label: form.lotId, value: form.lotId } : null}
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
                value={form.lotId ? { label: form.lotId, value: form.lotId } : null}
              />
            )}
          </div>

          {/* Quantity */}
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

          {/* Expiration Date */}
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
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}

export default ItemForm;
