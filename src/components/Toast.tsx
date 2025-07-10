import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // match transition duration
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out
        transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        w-fit px-4 py-2 rounded-lg shadow-md text-sm font-semibold font-Work-Sans
        ${type === "success" ? "bg-white text-green-900 border border-green-900" : "bg-white text-primary border border-primary"}
      `}
    >
      {message}
    </div>
  );
}
