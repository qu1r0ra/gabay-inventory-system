import Input from "./Input";
import Button from "./Button";
import { Heading } from "./Heading";
import { useAuth } from "../lib/db/db.auth";
import { Navigate, useNavigate } from "react-router-dom";

function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="h-[90px] bg-white sticky top-0 w-full z-10 flex items-center justify-between px-6 border-b border-border">
      <div>
        <Heading size="xs" className="text-border">Welcome Back!</Heading>
        <Heading size="sm" className="text-black">{user?.email?.split("@")[0]}</Heading>
      </div>

      <div className="flex items-center gap-8">
        <Input
          id="search"
          placeholder="Search..."
          size="custom"
          className="w-[500px] h-10"
          inputClassName="border-border"
        />
      
        <Button size="sm" onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  );
}

export default Header;
