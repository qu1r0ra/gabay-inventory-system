import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { Heading } from "./Heading";
import CreatableSelect from "react-select/creatable";

function AddItemForm() {
  const [form, setForm] = useState({
    item: "",
    quantity: "",
    lotId: "",
    expDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (newValue: any) => {
    setForm((prev) => ({ ...prev, item: newValue?.value || "" }));
  };

  const itemOptions = [
    { value: "Bandage", label: "Bandage" },
    { value: "Alcohol Wipes", label: "Alcohol Wipes" },
    { value: "Surgical Gloves", label: "Surgical Gloves" },
    { value: "Antibiotic Ointment", label: "Antibiotic Ointment" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-primary w-[940px] h-[600px] p-10 rounded-lg flex flex-col">
        <Heading level={2} size="lg" className="mb-6 text-center">
          Add Item
        </Heading>

        <div className="flex flex-col justify-between h-full w-full max-w-md mx-auto">
          {/* ITEM NAME (select or type new) */}
          <div>
            <label
              htmlFor="item"
              className="block text-white text-xs font-bold mb-2 font-Work-Sans"
            >
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
            />
          </div>

          {/* QUANTITY */}
          <Input
            label="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            inputClassName="bg-white"
          />

          {/* LOT ID */}
          <Input
            label="Lot ID"
            id="lotId"
            name="lotId"
            value={form.lotId}
            onChange={handleChange}
            inputClassName="bg-white"
          />

          {/* EXPIRATION DATE */}
          <Input
            label="Expiration Date"
            id="expDate"
            name="expDate"
            type="date"
            value={form.expDate}
            onChange={handleChange}
            inputClassName="bg-white"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button size="md" onClick={() => console.log("Form submitted:", form)}>
          Confirm
        </Button>
      </div>
    </div>
  );
}

export default AddItemForm;
