import { NavLink, Outlet } from "react-router";
import Style from "./Clints.module.css";

function Clints() {
  return (
    <div className={Style.clintsContainer}>
      <aside className={Style.aside}>
        <div className={Style.asideHeader}>
          <span>Client Portal</span>
        </div>
        <nav className={Style.asideNav}>
          <NavLink
            to="ClintList"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Client List
          </NavLink>
          <NavLink
            to="Offer"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Offer
          </NavLink>
          <NavLink
            to="Challan"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Challan
          </NavLink>
          <NavLink
            to="Invoice"
            className={({ isActive }) =>
              isActive ? `${Style.asideLink} ${Style.active}` : Style.asideLink
            }
          >
            Invoice
          </NavLink>
        </nav>
      </aside>

      <main className={Style.formContainer}>
        <Outlet />
      </main>
    </div>
  );
}

export default Clints;