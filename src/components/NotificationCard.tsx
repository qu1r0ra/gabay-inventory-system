import React from "react";
import { Link } from "react-router-dom";
import { Heading } from "./General/Heading";
import Button from "./General/Button";
import { inventoryApi } from "../lib/db/db.api";

type Notification = {
  id: number;
  type: string;
  message: string;
  created_at: string;
};

type Props = {
  notif?: Notification;
  onDelete?: (id: number) => void; // Optional callback to update parent state
};

function NotificationCard({ notif, onDelete }: Props) {
  if (!notif) return null;
  const { id, type, message, created_at } = notif;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    try {
      await inventoryApi.deleteNotification(String(id));
      onDelete?.(id); // notify parent if callback exists
    } catch (err: any) {
      console.error("Failed to delete notification", err.message);
    }
  };

  return (
    <Link to={`/notifications/${id}`}>
      <div className="flex justify-between items-center bg-white border border-black/70 rounded-lg p-5 shadow-lg hover:bg-gray-100 cursor-pointer transition font-work-sans">
        <div>
          <Heading size="md" className="text-black uppercase">
            {type}
          </Heading>
          <p className="text-black font-Work-Sans text-sm">{message}</p>
          <p className="text-xs text-black mt-1 font-Work-Sans">
            {new Date(created_at).toLocaleString()}
          </p>
        </div>
        <Button size="xs" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </Link>
  );
}

export default NotificationCard;
