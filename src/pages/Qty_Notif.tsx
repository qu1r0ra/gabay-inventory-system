import { useState, useEffect } from 'react';
import QtyNotificationCard from "../components/QtyNotificationCard";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../lib/db/db.api";

interface LowStockItem {
  name: string;
  quantity: number;
  lotId: string;
  expiryDate: string;
}

function Qty_Notif() {
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        setLoading(true);
        
        // Fetch items with low stock (threshold: 10)
        const items = await inventoryApi.getLowStockItems(10);
        
        // Transform the data to match the component's expected format
        const transformedItems: LowStockItem[] = items.map((item: any) => ({
          name: item.items?.name || 'Unknown Item',
          quantity: item.item_qty,
          lotId: item.lot_id,
          expiryDate: item.expiry_date ? 
            new Date(item.expiry_date).toLocaleDateString() : 
            'No expiry date'
        }));
        
        setLowStockItems(transformedItems);
        setError(null);
      } catch (err) {
        console.error('Error fetching low stock items:', err);
        setError('Failed to load low stock items');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
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
          <div className="text-lg text-gray-600">Loading low stock items...</div>
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
        <h1 className="text-2xl font-bold text-gray-800">Low Stock Items</h1>
        <p className="text-gray-600">{lowStockItems.length} item(s) with low stock</p>
      </div>

      <div className="flex flex-col gap-4">
        {lowStockItems.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            No low stock items found.
          </div>
        ) : (
          lowStockItems.map((item, index) => (
            <QtyNotificationCard key={index} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

export default Qty_Notif;