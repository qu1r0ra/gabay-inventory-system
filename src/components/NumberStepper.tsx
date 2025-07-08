import React from "react";

type Props = {
  min?: number;
  max?: number;
  initial?: number;
  onChange?: (value: number) => void;
};

function NumberStepper({ min = 0, max = 999, initial = 0, onChange }: Props) {
  const [value, setValue] = React.useState<number>(initial);

  const updateValue = (newValue: number) => {
    const clamped = Math.min(max, Math.max(min, newValue));
    setValue(clamped);
    onChange?.(clamped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setValue(NaN); // allow clearing
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) updateValue(parsed);
  };

  const handleBlur = () => {
    if (isNaN(value)) updateValue(min); // reset to min if cleared
  };

  const handleStep = (delta: number) => {
    updateValue((value || 0) + delta);
  };

  return (
    <div className="flex items-center border border-gray-300 rounded w-[100px] h-8 overflow-hidden bg-white">
      <button
        className="flex-1 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
        onClick={() => handleStep(-1)}
        disabled={value <= min}
      >
        −
      </button>
      <input
        type="number"
        value={isNaN(value) ? "" : value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-10 text-center border-x border-gray-300 text-sm outline-none font-medium appearance-none"
        min={min}
        max={max}
      />
      <button
        className="flex-1 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-30"
        onClick={() => handleStep(1)}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

export default NumberStepper;
