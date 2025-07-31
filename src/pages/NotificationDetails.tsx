import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { inventoryApi } from "../lib/db/db.api";
import NotificationStockCard from "../components/NotificationStockCard";
import Button from "../components/General/Button";
import { Heading } from "../components/General/Heading";

function NotificationDetails() {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<any | null>(null);

  useEffect(() => {
    inventoryApi
      .getNotifications()
      .then((data) => {
        const match = data.find((n: any) => n.id === id);
        setNotification(match ?? undefined);
      })
      .catch(console.error);
  }, [id]);

  // Spinner while loading
  if (notification === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // If not found
  if (notification === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        Notification not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Heading + Back button */}
      <div className="flex items-center justify-between mb-4">
        <Heading size="md">{notification.message}</Heading>
        <Link to="/notifications">
          <Button size="xs">Back</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {notification.stocks.map((stock: any, idx: number) => (
          <NotificationStockCard
            key={idx}
            stock={{
              lot_id: stock.lot_id,
              item_qty: stock.item_qty,
              expiry_date: stock.expiry_date,
              item: stock.item,
              deleted: stock.deleted,
              invalid: stock.invalid,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default NotificationDetails;
