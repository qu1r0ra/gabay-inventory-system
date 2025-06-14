import { NavLink } from 'react-router-dom';
import { Heading } from './Heading';

import logo from '../assets/Logo.png';

function Sidebar() {
    const sidebarItems = [
        { path: "/dashboard", text: "Dashboard" },
        { path: "/inventory", text: "Inventory" },
        { path: "/activity-log", text: "Activity Log" },
        { path: "/add-item", text: "Add Item" },
    ];

    return (
        <div className="w-0 md:w-[250px] lg:w-[350px] h-screen bg-primary overflow-y-auto overflow-x-hidden flex flex-col transition-all duration-300">
            <Heading size="3xl" className={"mt-4 text-left ml-3"}>GABAY</Heading>
            <Heading level={2} size="xs" className={"font-Work-Sans text-left mt-8 ml-4 mb-1 font-normal"}>Overview</Heading>

            {sidebarItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `font-Poppins font-bold mt-2.5 mb-2.5 text-left ml-12
                        text-sm sm:text-md md:text-lg lg:text-xl
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