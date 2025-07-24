import { NavLink } from "react-router-dom";
import { Heading } from "./General/Heading";
import logo from "../assets/Logo.png";
import { useAuth } from "../lib/db/db.auth";

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const { user, isAdmin } = useAuth();
  const sidebarItems = [
    { path: "/dashboard", text: "Dashboard" },
    { path: "/inventory", text: "Inventory" },
    { path: "/activity-log", text: "Activity Log" },
    { path: "/add-item", text: "Add Item" },
    { path: "/check-out", text: "Confirmation" },
  ];

  const adminItems = [
    { path: "/notifications", text: "Notifications" },
    { path: "/edit-item", text: "Edit Item" },
    { path: "/delete-item", text: "Delete Item" },
    { path: "/generate-report", text: "Generate Report" },
  ];

  return (
    <>
      {/* Dim background on mobile when sidebar is open */}
      <div
        className={`fixed inset-0 z-30 bg-black/10 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] bg-white border-r border-border shadow-md transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:block`}
      >
        <div className="h-[90px] border-b border-border flex items-center justify-center gap-3">
          <img src={logo} alt="Logo" className="w-12 h-12" />
          <Heading size="xl" className="text-black">
            GABAY
          </Heading>
        </div>

        <div className="p-2 flex flex-col mt-2 pl-6">
          <Heading size="xs" className="text-black mb-2">
            Menu
          </Heading>
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

        {isAdmin && (
          <div className="p-2 flex flex-col mt-2 pl-6">
            <Heading size="xs" className="text-black mb-2">
              Admin
            </Heading>
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
        )}
      </aside>
    </>
  );
}
