import ExpiryNotificationCard from "../components/ExpiryNotificationCard";
import { useNavigate } from "react-router-dom";

function Expiry_Notif() {
  
  const navigate = useNavigate();


  const nearExpiryItems = [
      {
        name: "Default Item 1",
        quantity: 2,
        lotId: "AA13",
        expiryDate: "12/25/2005",
      },
      {
        name: "Default Item 2",
        quantity: 2,
        lotId: "AA13",
        expiryDate: "12/25/2005",
      },
      {
        name: "Default Item 3",
        quantity: 2,
        lotId: "AA13",
        expiryDate: "12/25/2005",
      },
    ];
  
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mb-4">
          
          <button 
          onClick={() => navigate("/Notifications")}
          className="text-blue-600 hover:text-blue-800 font-medium">← Back to Notifications</button>
        </div>
        
        <div className="flex flex-col gap-4">
          {nearExpiryItems.map((item, index) => (
            <ExpiryNotificationCard key={index} item={item} />
          ))}
        </div>
      </div>
    );
  }

export default Expiry_Notif;