import React, { useState } from "react";

type NumberStepperProps = {
  min?: number;
  max?: number;
  step?: number;
  initial?: number;
  onChange?: (value: number) => void;
};

function NumberStepper({
  min = 0,
  max = 99,
  step = 1,
  initial = 0,
  onChange,
}: NumberStepperProps) {
  const [value, setValue] = useState(initial);

  const handleChange = (newValue: number) => {
    if (newValue >= min && newValue <= max) {
      setValue(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div className="flex items-center justify-center w-[85px] h-[30px] max-w-full border-black rounded-2xl overflow-hidden">
      <button
        onClick={() => handleChange(value - step)}
        className="w-[25%] h-full bg-accent hover:bg-accent/90 text-black text-sx sm:text-base disabled:opacity-50 font-Poppins font-bold"
        disabled={value - step < min}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        readOnly
        className="w-[50%] h-full text-center text-sm sm:text-base font-Poppins font-bold bg-white text-black border-x border-black" 
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
      />
      <button
        onClick={() => handleChange(value + step)}
        className="w-[25%] h-full bg-accent hover:bg-accent/90 text-black text-sm sm:text-base disabled:opacity-50 font-Poppins font-bold"
        disabled={value + step > max}
      >
        +
      </button>
    </div>
  );
}

export default NumberStepper;
