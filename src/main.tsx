import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import RootRouter from "./RootRouter";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ActivityLog from "./pages/ActivityLog";
import AddItem from "./pages/AddItem";
import CheckOut from "./pages/CheckOut";
import Notifications from "./pages/Notifications";
import EditItem from "./pages/EditItem";  
import DeleteItem from "./pages/DeleteItem";  
import GenerateReport from "./pages/GenerateReport";
import { AuthContextProvider } from "./lib/db/db.auth";

const router = createBrowserRouter([
  {
    element: <RootRouter />,
    path: "/",
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/inventory",
        element: <Inventory />,
      },
      {
        path: "/activity-log",
        element: <ActivityLog />,
      },
      {
        path: "/add-item",
        element: <AddItem />,
      },
      {
        path: "/check-out",
        element: <CheckOut />,
      },
      {
        path: "/notifications",
        element: <Notifications />,
      },
      {
        path: "/edit-item",
        element: <EditItem />,  
      },
      {
        path: "/delete-item",
        element: <DeleteItem />,  
      },
      {
        path: "/generate-report",
        element: <GenerateReport />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthContextProvider>
      <RouterProvider router={router}></RouterProvider>
    </AuthContextProvider>
  </StrictMode>
);
