type ButtonProps = {
  size?: "xs" | "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
  type = "button",
  size = "md",
  onClick,
  children, // needed to render text/content inside the button
  className, // allows adding extra Tailwind classes from parent component
}: ButtonProps) {
  const baseStyles =
    "bg-white border border-black rounded-4xl font-Poppins text-black " +
    "hover:bg-secondary hover:text-white hover:border-0 " +
    "active:bg-accent active:text-white active:border-0 " +
    "transition-colors duration-200 " +
    "flex items-center justify-center";

  const sizeStyles = {
    xs: "text-xs w-[100px] h-[36px] md:text-sm md:w-[120px] md:h-[40px]",
    sm: "text-sm w-[120px] h-[40px] md:text-base md:w-[150px] md:h-[50px]",
    md: "text-base w-[150px] h-[50px] md:text-lg md:w-[175px] md:h-[60px]",
    lg: "text-lg w-[175px] h-[60px] md:text-2xl md:w-[200px] md:h-[70px]",
  };

  const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${className || ""}`;

  return (
    <button type={type} onClick={onClick} className={buttonClasses}>
      {children}
    </button>
  );
}

export default Button;
