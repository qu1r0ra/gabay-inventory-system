// src/components/NotificationCard.tsx
import { Link } from "react-router-dom";

type NotificationCardProps = {
  text: string;
  type: "Qty" | "Expiry";
};

export default function NotificationCard({ text, type }: NotificationCardProps) {
  const linkPath =
    type === "Qty" ? "/Qty_Notif" : type === "Expiry" ? "/Expiry_Notif" : "#";

  return (
    <Link to={linkPath}>
      <div className="flex justify-between items-center bg-white border border-gray-300 rounded-lg p-5 shadow-sm hover:bg-gray-100 cursor-pointer transition">
        <span className="text-gray-700">{text}</span>
        <button
          onClick={(e) => {
            e.preventDefault(); 
            console.log("Handle delete here");
          }}
          className="border border-gray-400 text-sm px-4 py-1 rounded-full hover:bg-gray-200"
        >
          Delete
        </button>
      </div>
    </Link>
  );
}
