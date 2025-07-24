import { Link } from "react-router-dom";
import ConfirmItems from "../components/ConfirmationForm";
import Button from "../components/General/Button";

// CheckOut.jsx
function CheckOut() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-6 py-8 px-4">
      <ConfirmItems />
      <Link to="/inventory">
        <Button size="md">Back</Button>
      </Link>
    </div>
  );
}

export default CheckOut;
