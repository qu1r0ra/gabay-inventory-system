type ExpiryNotifCardProps = {
  item: {
    name: string;
    quantity: number;
    lotId: string;
    expiryDate: string;
  };
};

export default function ExpiryNotifCard({ item }: ExpiryNotifCardProps) {
  return (
    
    <div className="bg-white rounded-md shadow border border-gray-300 p-4 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{item.name}</h2>
            <div className = "space-y-4">

                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantity</span>
                    <span className="text-sm font-medium text-gray-600">x{item.quantity}</span>

                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lot ID</span>
                    <span className="text-sm font-medium text-gray-600">{item.lotId}</span>

                </div>

                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expiry Date</span>
                    <span className="text-sm font-medium text-red-600">{item.expiryDate}</span>

                </div>

            </div>
    </div>
  );
}