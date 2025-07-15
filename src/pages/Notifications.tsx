import NotificationCard from "../components/NotificationCard";

function Notifications() {

  const notifications = [
      {type: "Expiry", Text: "Daily Alert: 5 item(s) expiring soon."},
      {type: "Qty", Text: "Daily Alert: 10 item(s) have low stock."}
    ];

  return (
    <div className="min-h-screen bg-gray-100 justify-center p-6">
      <div className = "flex flex-col space-y-4" >
        {notifications.map((notif, index) => (
          <NotificationCard key = {notif.index} text = {notif.Text} type = {notif.type} />
        
        ))}
        
    </div>
   </div>   
      
  );
  
}

export default Notifications;