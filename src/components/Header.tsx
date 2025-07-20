import Input from "./Input";
import Button from "./Button";
import menu from "../assets/hamburger.png";
import { Heading } from "./Heading";
import { useAuth } from "../lib/db/db.auth";
import { Navigate } from "react-router-dom";
import { useSearch } from "../contexts/SearchContext";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { query, setQuery } = useSearch();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="h-[60px] md:h-[90px] bg-white sticky top-0 w-full z-10 flex items-center md:justify-between px-3 md:px-6 border-b border-border">
      <div>
        <img
          src={menu}
          className="w-[20px] h-[20px] md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        />
        <div className="hidden md:block">
          <Heading size="xs" className="text-border">
            Welcome Back!
          </Heading>
          <Heading size="sm" className="text-black">
            {user?.email?.split("@")[0]}
          </Heading>
        </div>
      </div>

      <div className="flex items-center ml-6 mbm:ml-12 mbl:ml-25 tbs:ml-90 gap-2 md:gap-8">
        <Input
          id="search"
          placeholder="Search..."
          size="custom"
          className="w-[140px] mbm:w-[175px] h-8 md:w-[500px] md:h-10"
          inputClassName="border-border"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Button size="xs" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
export default Header;
