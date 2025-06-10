import { NavLink } from 'react-router-dom';

import logo from '../assets/Logo.png';

function Sidebar() {
    const sidebarItems = [
        { path: "/dashboard", text: "Dashboard" },
        { path: "/inventory", text: "Inventory" },
        { path: "/activity-log", text: "Activity Log" },
        { path: "/add-item", text: "Add Item" },
    ];

    return (
        <div className="w-[350px] h-screen fixed top-0 left-0 bg-primary overflow-y-auto overflow-x-hidden flex flex-col"> 
            <h1 className="text-white font-Poppins text-6xl font-bold mt-4 w-[300px] text-left ml-3">
                GABAY
            </h1>

            <p className="w-[100px] text-white font-Work-Sans text-xs text-left mt-12 ml-4 mb-1">
                Overview
            </p>

            {sidebarItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `font-Poppins font-bold mt-2.5 mb-2.5 text-left ml-12
                        hover:scale-105 transition-transform duration-200 ease-in-out origin-left
                        ${isActive ? 'text-accent' : 'text-white'}`
                    }
                >
                    {item.text}
                </NavLink>
            ))}

            <img src={logo} className="w-[135px] h-[135px] self-center mt-auto mb-4"></img>
        </div>
    );
}

export default Sidebar;