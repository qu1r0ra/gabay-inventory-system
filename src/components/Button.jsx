
function Button({
  children, // needed to render text/content inside the button
  onClick,
  type = 'button',
  size = 'md', 
  className, // allows adding extra Tailwind classes from parent component
}) {

  const baseStyles = 'bg-primary rounded-4xl font-Poppins font-bold text-white ' +
                   'hover:bg-secondary active:bg-accent ' + 
                   'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 ' +
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