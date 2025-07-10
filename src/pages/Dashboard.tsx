import React from "react";
import DashboardCard from "../components/DashboardCard";
import ReportCard from "../components/ReportCard";

function Dashboard() {
  return (
    <div className="w-full flex flex-col items-center py-10 gap-12 bg-gray-100">
      {/* Grid for Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <DashboardCard
          to="/inventory"
          title="Total Items"
          value="1,234"
          label="Current Stock Quantity"
        />

        <DashboardCard
          to="/inventory?filter=low"
          title="Low Quantity"
          value={12}
          label="Items Running Low | <= 10"
        />

        <DashboardCard
          to="/inventory?filter=expiring"
          title="Expiring Soon"
          value={5}
          label="Expiring Within 30 Days"
        />

        <DashboardCard
          to="/inventory?filter=expired"
          title="Expired"
          value={3}
          label="Past Expiration Date"
        />
      </div>

      {/* Centered Report Card below */}
      <ReportCard itemsAdded={800} itemsTaken={50}/>
    </div>
  );
}

export default Dashboard;
