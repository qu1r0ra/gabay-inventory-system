import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import RootRouter from "./RootRouter";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ActivityLog from "./pages/ActivityLog";
import AddItem from "./pages/AddItem";
import CheckOut from "./pages/CheckOut";
import Notifications from "./pages/Notifications";
import ExpiryNotif from "./pages/Expiry_Notif";
import QtyNotif from "./pages/Qty_Notif";
import EditItem from "./pages/EditItem";  
import DeleteItem from "./pages/DeleteItem";  
import GenerateReport from "./pages/GenerateReport";
import { AuthContextProvider } from "./lib/db/db.auth";
import { SearchProvider } from "./contexts/SearchContext";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
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
        path: "/Expiry_Notif",
        element: <ExpiryNotif />,
      },
      {
        path: "/Qty_Notif",
        element: <QtyNotif />,
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
      <SearchProvider>
        <RouterProvider router={router} />
      </SearchProvider>
    </AuthContextProvider>
  </StrictMode>
);
