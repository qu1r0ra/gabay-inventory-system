// Header.jsx

import Input from "./Input";
import Button from "./Button";
import logo from '../assets/Logo.png';

function Header() {
  return (
    <>
      <div className="h-[100px] bg-white sticky top-0 w-full z-10 flex flex-row items-center px-6">
        <Input
          label=""
          id="search-input"
          name="searchQuery"
          type="search"
          placeholder="Search..."
          className="flex-grow max-w-lg"  
          inputClassName="rounded-2xl"   
        />
        <Button size="xs" className="ml-64 mb-3">
          LOGOUT
        </Button>
        <div className="w-[2px] h-1/2 bg-gray-400 ml-6 mb-3"></div>
        <img src={logo} className="rounded-full w-10 h-10 ml-4 mb-3"></img>
        <h2 className="font-Poppins font-bold text-md ml-4 mb-3"> Stephen Co</h2>
      </div>
    </>
  );
}

export default Header;