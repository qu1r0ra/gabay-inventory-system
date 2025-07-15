import { useState, useEffect } from 'react';
import ExpiryNotificationCard from "../components/ExpiryNotificationCard";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../lib/db/db.api";

interface ExpiryItem {
  name: string;
  quantity: number;
  lotId: string;
  expiryDate: string;
  isExpired: boolean;
}

function Expiry_Notif() {
  const navigate = useNavigate();
  const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpiryItems = async () => {
      try {
        setLoading(true);
        
        // Fetch items expiring within 30 days
        const nearExpiryItems = await inventoryApi.getNearExpiryItems(30);
        
        // Fetch already expired items
        const expiredItems = await inventoryApi.getExpiredItems();
        
        // Transform near expiry items
        const transformedNearExpiry: ExpiryItem[] = nearExpiryItems.map((item: any) => ({
          name: item.items?.name || 'Unknown Item',
          quantity: item.item_qty,
          lotId: item.lot_id,
          expiryDate: item.expiry_date ? 
            new Date(item.expiry_date).toLocaleDateString() : 
            'No expiry date',
          isExpired: false
        }));
        
        // Transform expired items
        const transformedExpired: ExpiryItem[] = expiredItems.map((item: any) => ({
          name: item.items?.name || 'Unknown Item',
          quantity: item.item_qty,
          lotId: item.lot_id,
          expiryDate: item.expiry_date ? 
            new Date(item.expiry_date).toLocaleDateString() : 
            'No expiry date',
          isExpired: true
        }));
        
        // Combine and sort: expired items first, then near expiry
        const allItems = [...transformedExpired, ...transformedNearExpiry];
        allItems.sort((a, b) => {
          // Sort by expiry status first (expired first), then by date
          if (a.isExpired && !b.isExpired) return -1;
          if (!a.isExpired && b.isExpired) return 1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
        
        setExpiryItems(allItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching expiry items:', err);
        setError('Failed to load expiry items');
      } finally {
        setLoading(false);
      }
    };

    fetchExpiryItems();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mb-4">
          <button 
            onClick={() => navigate("/Notifications")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Notifications
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-gray-600">Loading expiry items...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mb-4">
          <button 
            onClick={() => navigate("/Notifications")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Notifications
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const expiredCount = expiryItems.filter(item => item.isExpired).length;
  const nearExpiryCount = expiryItems.filter(item => !item.isExpired).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-4">
        <button 
          onClick={() => navigate("/Notifications")}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Notifications
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Expiry Items</h1>
        <p className="text-gray-600">
          {expiredCount} expired item(s) • {nearExpiryCount} expiring soon
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {expiryItems.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No items expiring soon or expired.
          </div>
        ) : (
          expiryItems.map((item, index) => (
            <div key={index} className="relative">
              {item.isExpired && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
                  EXPIRED
                </div>
              )}
              <ExpiryNotificationCard item={item} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Expiry_Notif;