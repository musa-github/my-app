import { NavLink, Outlet } from "react-router";
import Style from "./Inventory.module.css";

function InventoryBilling() {
  return (
    <div className={Style.inventoryContainer}>
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Inventory & Billing</span>
        </div>
        <nav className={Style.asideNav}>
          <NavLink
            to="Purchase"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Purchase
          </NavLink>
          <NavLink
            to="Sales"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Sales
          </NavLink>
          <NavLink
            to="TotalPurchase"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Total Purchase
          </NavLink>
          <NavLink
            to="Stocks"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Stocks
          </NavLink>
        </nav>
      </aside>

      <main className={Style.inventoryFormContainer}>
        <Outlet />
      </main>
    </div>
  );
}

export default InventoryBilling;