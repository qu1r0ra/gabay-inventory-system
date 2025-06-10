import { Link } from "react-router";

function NavBar() {
  return (
    <nav>
      <h1>GABAY</h1>
      <ul>
        {[
          "login",
          "sign-up",
          "dashboard",
          "inventory",
          "activity-log",
          "add-item",
        ].map((element, i) => (
          <li key={i}>
            <Link to={element}>{element}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default NavBar;
