import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { Heading } from "./Heading";

function AddItemForm() {
  const [form, setForm] = useState({
    item: "",
    name: "",
    quantity: "",
    lotId: "",
    expDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-primary w-[940px] h-[650px] p-10 rounded-lg">
        <Heading level={2} size="lg" className="mb-6 text-center">
          Add Item
        </Heading>

        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          {/* ITEM (Dropdown) */}
          <div>
            <label
              htmlFor="item"
              className="block text-white text-xs font-bold mb-2 font-Work-Sans"
            >
              Item
            </label>
            <select
              id="item"
              name="item"
              value={form.item}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-black-300 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
            >
              <option value="">Select an item</option>
              <option value="bandage">Bandage</option>
              <option value="alcohol">Alcohol Wipes</option>
              <option value="gloves">Surgical Gloves</option>
              <option value="ointment">Antibiotic Ointment</option>
              {/* Add more options as needed */}
            </select>
          </div>

          {/* NAME */}
          <Input
            label="Name"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            inputClassName="bg-white"
          />

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
