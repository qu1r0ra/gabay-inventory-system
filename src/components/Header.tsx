import Input from "./Input";
import Button from "./Button";
import logo from "../assets/Logo.png";
import { useAuth } from "../lib/db/db.auth";
import { useNavigate } from "react-router-dom";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="h-[100px] bg-white sticky top-0 w-full z-10 flex items-center px-6 border-b border-black">
      <Input
        label=""
        id="search-input"
        name="searchQuery"
        type="search"
        placeholder="Search..."
        className="flex-grow max-w-lg"
        inputClassName="rounded-2xl"
      />

      <div className="flex items-center gap-4 ml-auto">
        <Button size="xs" onClick={handleLogout}>
          LOGOUT
        </Button>
        <div className="w-[2px] h-8 bg-gray-400" />
        <img src={logo} className="rounded-full w-10 h-10" alt="Profile" />
        <h2 className="font-Poppins font-bold text-md">{user?.email}</h2>
      </div>
    </div>
  );
}

export default Header;
