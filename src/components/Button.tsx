type ButtonProps = {
  size?: "xs" | "sm" | "md" | "lg",
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function Button({
  type = 'button',
  size = 'md', 
  onClick,
  children, // needed to render text/content inside the button
  className, // allows adding extra Tailwind classes from parent component
}: ButtonProps) {

const baseStyles =
  'bg-white border border-black rounded-4xl font-Poppins text-black ' +
  'hover:bg-secondary hover:text-white hover:border-0 ' +
  'active:bg-accent active:text-white active:border-0 ' +
  'transition-colors duration-200 ' +
  'flex items-center justify-center';

  const sizeStyles = {
    xs: 'text-sm w-[120px] h-[40px]', 
    sm: 'text-base w-[150px] h-[50px]', 
    md: 'text-lg w-[175px] h-[60px]', 
    lg: 'text-2xl w-[200px] h-[70px]', 
  };

  const buttonClasses = `${baseStyles} ${sizeStyles[size]} ${className || ''}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={buttonClasses}
    >
      {children} 
    </button>
  );
}

export default Button;