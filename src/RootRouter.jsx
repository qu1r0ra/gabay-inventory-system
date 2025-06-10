import { useState } from "react";
import { Outlet } from "react-router";
import SideNavBar from "./components/SideNavBar";
import TopNavBar from "./components/TopNavBar";
import LandingPage from "./pages/LandingPage";

function RootRouter() {
  // ! debug only: replace this when implementing auth
  let [session, setSession] = useState(false);
  const toggleSession = () => {
    setSession(!session);
  };
  // ! ---

  return (
    <div>
      {session ? (
        <div className="flex">
          <SideNavBar />
          <div>
            <TopNavBar />
            <Outlet />
          </div>
        </div>
      ) : (
        <>
          <LandingPage />
          <br />
          <button to="/dashboard" onClick={toggleSession}>
            Set session (pretend to log in)
          </button>
        </>
      )}
    </div>
  );
}

export default RootRouter;
