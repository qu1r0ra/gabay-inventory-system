import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import "./index.css";
import RootRouter from "./RootRouter";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ActivityLog from "./pages/ActivityLog";
import AddItem from "./pages/AddItem";
import CheckOut from "./pages/CheckOut";
import GenerateReport from "./pages/GenerateReport";

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
        path: "/generate-report",
        element: <GenerateReport />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </StrictMode>
);
