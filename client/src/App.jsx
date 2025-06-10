import { Link } from 'react-router'
import './App.css'

function App() {
  return (
    <>
      <h1>Gabay Inventory System</h1>
      <nav>
        <ul>
        {
          ["login", "sign-up", "dashboard", "activity-log", "add-item"].map((element, i) =>
              <li key={i}>
                <Link to={element}>{element}</Link>
              </li>
          )
        }
        </ul>
      </nav>
    </>
  )
}

export default App
