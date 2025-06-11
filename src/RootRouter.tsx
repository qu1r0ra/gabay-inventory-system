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

  return (
    <div>
      {session ? (
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col ml-[350px]"> 
            <Header />
            <Outlet />
          </div>
        </div>
      ) : (
        <>
          <Login onLoginSuccess={handleLoginSuccess} />
        </>
      )}
    </div>
  );
}

export default RootRouter;