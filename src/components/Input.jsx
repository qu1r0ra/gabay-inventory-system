// Input.jsx

function Input({
  label,
  id,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  className,      
  inputClassName, 
}) {
  return (
    <div className={`mb-4 ${className || ''}`}>
      <label htmlFor={id} className="block text-black-700 text-xs font-bold mb-2 font-Work-Sans">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`block w-full px-3 py-2
                   border border-black-300 
                   shadow-sm
                   focus:outline-none focus:ring-primary-500 focus:border-primary-500
                   sm:text-sm
                   ${inputClassName || ''}`}
      />
    </div>
  );
}

export default Input;