import { useState, useEffect } from 'react';
import NotificationCard from "../components/NotificationCard";
import { inventoryApi } from "../lib/db/db.api";

interface NotificationData {
  type: "Expiry" | "Qty";
  text: string;
  count: number;
}

function Notifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Fetch low stock items (default threshold: 10)
        const lowStockItems = await inventoryApi.getLowStockItems(10);
        
        // Fetch items expiring within 30 days
        const nearExpiryItems = await inventoryApi.getNearExpiryItems(30);
        
        // Fetch expired items
        const expiredItems = await inventoryApi.getExpiredItems();
        
        // Combine near expiry and expired items
        const totalExpiryItems = nearExpiryItems.length + expiredItems.length;
        
        const notificationData: NotificationData[] = [];
        
        // Add low stock notification if there are items
        if (lowStockItems.length > 0) {
          notificationData.push({
            type: "Qty",
            text: `Daily Alert: ${lowStockItems.length} item(s) have low stock.`,
            count: lowStockItems.length
          });
        }
        
        // Add expiry notification if there are items
        if (totalExpiryItems > 0) {
          notificationData.push({
            type: "Expiry",
            text: `Daily Alert: ${totalExpiryItems} item(s) expiring soon or expired.`,
            count: totalExpiryItems
          });
        }
        
        setNotifications(notificationData);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 justify-center p-6">
        <div className="flex justify-center items-center">
          <div className="text-lg text-gray-600">Loading notifications...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 justify-center p-6">
        <div className="flex justify-center items-center">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 justify-center p-6">
      <div className="flex flex-col space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No notifications at this time.
          </div>
        ) : (
          notifications.map((notif, index) => (
            <NotificationCard 
              key={index} 
              text={notif.text} 
              type={notif.type} 
            />
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;