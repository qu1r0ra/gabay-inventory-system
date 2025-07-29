import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./lib/db/db.auth";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

function RootRouter() {
  const { loading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!loading && !user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-col flex-1">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-0 bg-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RootRouter;
