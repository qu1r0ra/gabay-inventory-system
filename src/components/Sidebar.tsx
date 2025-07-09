import { NavLink } from 'react-router-dom';
import { Heading } from './Heading';

import logo from '../assets/Logo.png';

function Sidebar() {
    const sidebarItems = [
        { path: "/dashboard", text: "Dashboard" },
        { path: "/inventory", text: "Inventory" },
        { path: "/activity-log", text: "Activity Log" },
        { path: "/add-item", text: "Add Item" },
        { path: "/check-out", text: "Confirmation" },
        ];

    const adminItems = [
        {path: "/notifications", text: "Notifications"},
        {path: "edit-item", text: "Edit Item"},
        {path: "delete-item", text: "Delete Item"},
        {path: "generate-report", text: "Generate Report"},
    ];


    return (
      <div className='w-[250px] border-r border-border'>

            <div className='h-[90px] border-b border-border flex items-center justify-center gap-3'>
                <img src={logo} alt="Logo" className="w-12 h-12" />
                <Heading size="xl" className="text-black">GABAY</Heading>
            </div>

            <div className="p-2 flex flex-col mt-2 pl-6">
                <Heading size="xs" className="text-black mb-2">Menu</Heading>
                <div className="flex flex-col space-y-2 pl-4">
                    {sidebarItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                        `text-border font-Work-Sans ${
                            isActive ? "text-secondary font-semibold" : ""
                        }`
                        }
                    >
                        {item.text}
                    </NavLink>
                    ))}
                </div>
            </div>

               <div className="p-2 flex flex-col mt-2 pl-6">
                <Heading size="xs" className="text-black mb-2">Admin</Heading>
                <div className="flex flex-col space-y-2 pl-4">
                    {adminItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                        `text-border font-Work-Sans ${
                            isActive ? "text-secondary font-semibold" : ""
                        }`
                        }
                    >
                        {item.text}
                    </NavLink>
                    ))}
                </div>
            </div>


        </div>
    );
}

export default Sidebar;