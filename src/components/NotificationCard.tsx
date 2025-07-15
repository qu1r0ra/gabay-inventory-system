import { Link } from "react-router-dom";
import { useState } from "react";

type NotificationCardProps = {
  text: string;
  type: "Qty" | "Expiry";
  onDelete?: () => void;
};

export default function NotificationCard({ text, type, onDelete }: NotificationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const linkPath = type === "Qty" ? "/Qty_Notif" : "/Expiry_Notif";
  
  const getIconColor = () => {
    return type === "Qty" ? "text-orange-500" : "text-red-500";
  };
  
  const getIcon = () => {
    return type === "Qty" ? "⚠️" : "⏰";
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete();
      } catch (error) {
        console.error("Error deleting notification:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Link to={linkPath} className="block">
      <div className={`flex justify-between items-center bg-white border-l-4 ${
        type === "Qty" ? "border-orange-500" : "border-red-500"
      } border-r border-t border-b border-gray-200 rounded-r-lg p-4 shadow-sm hover:shadow-md hover:bg-gray-50 cursor-pointer transition-all duration-200`}>
        
        <div className="flex items-center space-x-3">
          <span className={`text-xl ${getIconColor()}`}>{getIcon()}</span>
          <div>
            <span className="text-gray-800 font-medium">{text}</span>
            <div className="text-xs text-gray-500 mt-1">
              {type === "Qty" ? "Stock Alert" : "Expiry Alert"}
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`border border-gray-300 text-sm px-3 py-1 rounded-full transition-colors ${
            isDeleting 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          }`}
        >
          {isDeleting ? "..." : "Dismiss"}
        </button>
      </div>
    </Link>
  );
}