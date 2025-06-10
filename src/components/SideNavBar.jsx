import { Link } from "react-router";

function SideNavBar() {
  return (
    <>
      <nav>
        <h1>GABAY</h1>
        <ul>
          {["dashboard", "inventory", "activity-log", "add-item"].map(
            (element, i) => (
              <li key={i}>
                <Link to={element}>{element}</Link>
              </li>
            )
          )}
          <li>
            <a href="/">Log out</a>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default SideNavBar;
