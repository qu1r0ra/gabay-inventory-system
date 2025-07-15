type QtyNotifCardProps = {
  item: {
    name: string;
    quantity: number;
    lotId: string;
    expiryDate: string;
  };
};

export default function QtyNotifCard({ item }: QtyNotifCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          Low Stock
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Quantity</span>
          <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
            {item.quantity} units
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Lot ID</span>
          <span className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
            {item.lotId}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Expiry Date</span>
          <span className="text-sm text-gray-800">
            {item.expiryDate}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Restock recommended
        </div>
      </div>
    </div>
  );
}