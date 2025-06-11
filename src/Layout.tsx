import { Outlet } from "react-router";
import "./Layout.css";
import NavBar from "./components/SideNavBar";

function Layout() {
  return (
    <div className="flex">
      <nav>
        <NavBar />
      </nav>
      <main>
        <h2>Main Content</h2>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
