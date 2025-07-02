// ! Blank

import { runInventoryApiTests } from "../lib/db/api.test";

function Dashboard() {
  const handleTestClick = () => {
    console.log(
      "Running API tests... Check the browser's developer console for output."
    );
    runInventoryApiTests();
  };

  return (
    <>
      <p>Dashboard</p>

      {/* TEMPORARY TEST BUTTON - REMOVE LATER */}
      <button
        onClick={handleTestClick}
        style={{
          backgroundColor: "#d9534f",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Run Inventory API Tests
      </button>
    </>
  );
}

export default Dashboard;
