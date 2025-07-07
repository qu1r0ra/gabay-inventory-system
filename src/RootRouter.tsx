import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import { useAuth } from "./lib/db/db.auth";

function RootRouter() {
  const { user } = useAuth();
  if (!user) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RootRouter;
