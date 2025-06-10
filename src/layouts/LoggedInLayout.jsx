import { Outlet } from "react-router";
import "./Layout.css";
import NavBar from "../components/NavBar";

function LoggedInLayout() {
  return (
    <div class="flex">
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

export default LoggedInLayout;
