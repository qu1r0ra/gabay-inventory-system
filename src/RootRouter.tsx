import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";

function RootRouter() {
  const [session, setSession] = useState(false);

  const handleLoginSuccess = () => {
    setSession(true);
  };

  if (!session) return <Login onLoginSuccess={handleLoginSuccess} />;

    return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RootRouter;
