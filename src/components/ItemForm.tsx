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

  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string }[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    if (!matchedStock) return;

    setForm((prev) => ({
      ...prev,
      expDate: matchedStock.expiry_date?.split("T")[0] || "",
      quantity: isAdd ? "" : matchedStock.item_qty.toString(), // <-- Only autofill if not in Add mode
    }));
  };


  const handleSubmit = () => {
    setToast({
      message: `Form submission (${mode}) is currently disabled.`,
      type: "error",
    });
    setForm({
      item: "",
      lotId: "",
      quantity: "",
      expDate: "",
      newItem: "",
      newLotId: "",
    });
    setLotOptions([]);
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
              Select an existing item and lot ID to modify. Then you can update all fields.
            </p>
          </div>

          <div className="flex flex-col items-center gap-y-6 flex-grow">
            {/* Select Item */}
            <div className="w-[540px]">
              <label className="block text-xs font-bold font-Work-Sans text-black mb-1">Item Name</label>
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
            </div>

            {/* Select Lot ID */}
            <div className="w-[540px]">
              <label className="block text-xs font-bold font-Work-Sans text-black mb-1">Lot ID</label>
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
            </div>

            {/* New Item Name Input */}
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

            {/* New Lot ID Input */}
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
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}
      </>
    );
  }

  // Add or Delete Mode
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
            disabled={isDelete}
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
