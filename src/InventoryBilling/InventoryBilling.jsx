import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import Style from "./Inventory.module.css";

function InventoryBilling() {
  // Sidebar Open/Collapsed state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={Style.inventoryContainer}>
      {/* Sidebar Section */}
      <aside className={`${Style.aside} ${!isSidebarOpen ? Style.asideCollapsed : ""}`}>
        <div className={Style.asideHeader}>
          {isSidebarOpen && <span className={Style.titleText}>Inventory & Billing</span>}
          <button
            type="button"
            className={Style.toggleBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className={Style.asideNav}>
          <NavLink
            to="Purchase"
            title="Purchase"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            <span className={Style.navIcon}>🛒</span>
            {isSidebarOpen && <span className={Style.linkText}>Purchase</span>}
          </NavLink>

          <NavLink
            to="Sales"
            title="Sales"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            <span className={Style.navIcon}>💰</span>
            {isSidebarOpen && <span className={Style.linkText}>Sales</span>}
          </NavLink>

          <NavLink
            to="TotalPurchase"
            title="Total Purchase"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            <span className={Style.navIcon}>📊</span>
            {isSidebarOpen && <span className={Style.linkText}>Total Purchase</span>}
          </NavLink>

          <NavLink
            to="Stocks"
            title="Stocks"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            <span className={Style.navIcon}>📦</span>
            {isSidebarOpen && <span className={Style.linkText}>Stocks</span>}
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={Style.inventoryFormContainer}>
        <Outlet />
      </main>
    </div>
  );
}

export default InventoryBilling;