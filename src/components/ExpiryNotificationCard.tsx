type ExpiryNotifCardProps = {
  item: {
    name: string;
    quantity: number;
    lotId: string;
    expiryDate: string;
    isExpired?: boolean;
  };
};

export default function ExpiryNotifCard({ item }: ExpiryNotifCardProps) {
  const isExpired = item.isExpired || new Date(item.expiryDate) < new Date();
  
  const getStatusColor = () => {
    return isExpired ? "red" : "yellow";
  };
  
  const getStatusText = () => {
    return isExpired ? "Expired" : "Expiring Soon";
  };
  
  const getStatusIcon = () => {
    return isExpired ? "🚫" : "⏰";
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${
      isExpired ? "border-red-500" : "border-yellow-500"
    } border-r border-t border-b border-gray-200 p-6 hover:shadow-md transition-shadow`}>
      
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
        <span className={`${
          isExpired 
            ? "bg-red-100 text-red-800" 
            : "bg-yellow-100 text-yellow-800"
        } text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center`}>
          <span className="mr-1">{getStatusIcon()}</span>
          {getStatusText()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Quantity</span>
          <span className="text-sm font-medium text-gray-800">
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
          <span className={`text-sm font-medium ${
            isExpired ? "text-red-600" : "text-yellow-600"
          }`}>
            {item.expiryDate}
          </span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className={`flex items-center text-xs ${
          isExpired ? "text-red-600" : "text-yellow-600"
        }`}>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {isExpired ? "Immediate disposal required" : "Review expiry date"}
        </div>
      </div>
    </div>
  );
}