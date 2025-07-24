import React from "react";

type InputSize = "sm" | "md" | "lg" | "xl" | "full" | "custom";

const sizeMap: Record<InputSize, string> = {
  sm: "w-40 h-8",     // ~160px x 32px
  md: "w-64 h-9",     // ~256px x 36px
  lg: "w-80 h-10",    // ~320px x 40px
  xl: "w-96 h-12",    // ~384px x 48px
  full: "w-full h-10",
  custom: "",         // no preset class; use `className` manually
};

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  size?: InputSize;
  className?: string;         // applies to wrapper <div>
  inputClassName?: string;    // applies to <input>
};

const Input: React.FC<InputProps> = ({
  label,
  size = "md",
  className = "",
  inputClassName = "",
  ...rest
}) => {
  const sizeClasses = sizeMap[size] || "";

  return (
    <div className={`flex flex-col ${sizeClasses} ${className}`}>
      {label && (
        <label
          htmlFor={rest.id}
          className="text-xs font-bold mb-1 text-black font-Work-Sans"
        >
          {label}
        </label>
      )}
      <input
        {...rest}
        className={`
          w-full h-full px-3 py-2 rounded-md border border-gray-300 shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
          font-Work-Sans text-sm ${inputClassName}
        `}
      />
    </div>
  );
};

export default Input;
