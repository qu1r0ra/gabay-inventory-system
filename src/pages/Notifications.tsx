// src/pages/Notifications.tsx
import React, { useEffect, useState } from "react";
import NotificationCard from "../components/NotificationCard";
import { inventoryApi } from "../lib/db/db.api";

function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    inventoryApi
      .getNotifications()
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notif={notif}
              onDelete={(id) =>
                setNotifications((prev) => prev.filter((n) => n.id !== id))
              }
            />
          ))
        ) : (
          <p className="text-center text-gray-600">No notifications found.</p>
        )}
      </div>
    </div>
  );
}

export default Notifications;
