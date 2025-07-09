import { useEffect, useState } from "react";
import { Heading } from "./Heading";
import CreatableSelect from "react-select/creatable";
import Input from "./Input";
import Button from "./Button";
import Toast from "./Toast";
import { inventoryApi } from "../lib/db/db.api";
import { useAuth } from "../lib/db/db.auth";

function AddItemForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    item: "",
    quantity: "",
    lotId: "",
    expDate: "",
  });

  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
  const [lotOptions, setLotOptions] = useState<{ value: string; label: string }[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    setForm((prev) => ({ ...prev, item: name, lotId: "", expDate: "" }));

    const matched = allItems.find((i) => i.name === name);
    console.log("Matched item", matched);

    if (matched) {
      const lots = matched.item_stocks?.map((s: any) => s.lot_id);
      console.log("Extracted lots", lots);
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
    if (matchedStock?.expiry_date) {
      setForm((prev) => ({
        ...prev,
        expDate: matchedStock.expiry_date.split("T")[0],
      }));
    }
  };

  const handleSubmit = () => {
    setToast({
      message: "Form submission is currently disabled.",
      type: "error",
    });

    setForm({ item: "", quantity: "", lotId: "", expDate: "" });
    setLotOptions([]);
  };

  return (
    <>
      <div className="w-[600px] h-[600px] border border-black/70 rounded-lg bg-white p-8 flex flex-col">
        <div className="w-[540px] mb-4">
          <Heading level={2} size="lg" className="text-black mb-1">
            Add Item Form
          </Heading>
          <p className="font-Work-Sans text-md text-border">
            Add instances of existing items or create brand new ones.
          </p>
        </div>

        <div className="flex flex-col items-center gap-y-8 flex-grow">
          <div className="w-[540px]">
            <label htmlFor="item" className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Item Name
            </label>
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
          />

          <div className="w-[540px]">
            <label htmlFor="lotId" className="block text-xs font-bold font-Work-Sans text-black mb-1">
              Lot ID
            </label>
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
          </div>

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
            Add
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

export default AddItemForm;
