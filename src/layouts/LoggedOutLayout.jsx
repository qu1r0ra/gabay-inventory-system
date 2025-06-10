import { Outlet, Link } from "react-router";
import "./Layout.css";

function LoggedInLayout() {
  return (
    <div class="flex">
      <main>
        <h2>Main Content</h2>
        <Outlet />
        <Link to="/dashboard">Go to dashboard</Link>
      </main>
      <div>
        <p>Insert image of Gabay or tagline.</p>
      </div>
    </div>
  );
}

export default LoggedInLayout;
