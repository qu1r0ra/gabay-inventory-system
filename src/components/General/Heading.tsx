import { JSX } from "react";

type HeadingProps = {
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  size?:  "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
};

export function Heading({ children, level = 1, size = "lg", className = "" }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

const sizeClasses = {
  xs: "text-[10px] sm:text-xs md:text-sm lg:text-base",
  sm: "text-sm sm:text-base md:text-lg lg:text-xl",
  md: "text-base sm:text-lg md:text-xl lg:text-2xl",
  lg: "text-lg sm:text-xl md:text-2xl lg:text-3xl",
  xl: "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
  "2xl": "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
  "3xl": "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
};



  return (
    <Tag
      className={`${sizeClasses[size]} font-medium font-Poppins ${className}`}
    >
      {children}
    </Tag>
  );
}
