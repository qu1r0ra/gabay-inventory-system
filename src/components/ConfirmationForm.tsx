
import { Heading } from "./Heading";
import Button from "./Button";


interface Item {
  id: string;
  name: string;
  expiration: string;
  quantity: number;
  imageUrl?: string;
}

interface ConfirmItemsProps {
  items?: Item[];
}

const ConfirmItems: React.FC<ConfirmItemsProps> = ({ items = [] }) => {


  return (
    <div className="w-full max-w-4xl mx-auto">
      
      <div className="bg-white border border-gray-300 flex flex-col h-150">
        
        <div className="bg-primary text-white text-center py-4 flex-shrink-0">
          <h1 className="text-2xl font-semibold">Confirm Items</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-gray-800">
            {items.map((item) => (
              <div key={item.id} className="flex items-center p-4 bg-red-50">
                <div className="w-16 h-16 bg-white border border-gray-300 flex items-center justify-center mr-4 flex-shrink-0">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-700">
                    Expiration: {item.expiration || ''}
                  </p>
                </div>                                
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    Total Qty: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-8 flex gap-12 justify-center">
        <Button size="sm">
          GO BACK
        </Button>
        <Button size="sm">
          CONFIRM
        </Button>
      </div>
    </div>
  );
};

export default ConfirmItems;


