import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink } from "react-router";
import logo from "../assets/main-logo.png";
import { logoutUser } from "../Fetures/Inventory/authSlice";
import { auth, db } from "../Firebase/Firebase";
import { Avatar } from "../LoginData/Component/Avatar/Avatar";
import Style from "./Header.module.css";

const OWNER_EMAIL = "smabumusa98@gmail.com";

export const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const [permissions, setPermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const currentUserEmail = (user?.email || auth.currentUser?.email || "").toLowerCase();

  useEffect(() => {
    const fetchUserRoleAndPermissions = async () => {
      if (!currentUserEmail) {
        setPermissions({});
        setIsAdmin(false);
        return;
      }

      try {
        const cleanEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, "_");

        // ১. Admin Status চেক করা
        const adminDoc = await getDoc(doc(db, "app_admins", cleanEmail));
        const adminAccess = currentUserEmail === OWNER_EMAIL || adminDoc.exists();
        setIsAdmin(adminAccess);

        // ২. User Permissions ডাটা লোড করা
        const permDoc = await getDoc(doc(db, "user_permissions", cleanEmail));
        if (permDoc.exists()) {
          setPermissions(permDoc.data());
        } else {
          setPermissions({});
        }
      } catch (error) {
        console.error("Error fetching header permissions:", error);
      }
    };

    fetchUserRoleAndPermissions();
  }, [currentUserEmail]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // এডমিন অথবা নির্দিষ্ট পারমিশন থাকলে নেভিগেশন লিংক দেখাবে
  const hasAccess = (newKey, legacyKey) => {
    if (isAdmin) return true; // এডমিনরা সবসময় সব মেনু দেখতে পাবেন
    return Boolean(permissions[newKey] || permissions[legacyKey]);
  };

  return (
    <header className={Style.headerWrapper}>
      <nav className={Style.header}>
        <Link to="/" className={Style.logoLink}>
          <img className={Style.Logo} src={logo} alt="MM Engineering" />
        </Link>

        <div className={Style.menu}>
          {/* Home Navigation: Default visible for everyone */}
          <NavLink
            className={({ isActive }) => (isActive ? Style.active : Style.link)}
            to="/"
          >
            Home
          </NavLink>

          {/* Clients Navigation */}
          {hasAccess("nav_clients", "canAccessClients") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/Clints"
            >
              Clients
            </NavLink>
          )}

          {/* Projects Navigation */}
          {hasAccess("nav_projects", "canAccessProjects") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/Projects"
            >
              Projects
            </NavLink>
          )}

          {/* Inventory & Billing Navigation */}
          {hasAccess("nav_inventory", "canAccessInventory") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/InventoryBilling"
            >
              Inventory & Billing
            </NavLink>
          )}

          {/* Employee's Data Navigation */}
          {hasAccess("nav_employee", "canAccessEmployees") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/EmployeeData"
            >
              Employee's Data
            </NavLink>
          )}

          {/* Admin Panel Navigation */}
          {hasAccess("nav_admin") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/AdminPanel"
            >
              Admin Panel
            </NavLink>
          )}
        </div>

        <div className={Style.loginContainer}>
          {user ? (
            <div className={Style.userProfileGroup}>
              {user.employeeProfile && <Avatar profile={user.employeeProfile} />}
              <button onClick={handleLogout} className={Style.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <NavLink className={Style.signupBtn} to="/SignUp">
                Signup
              </NavLink>
              <NavLink className={Style.loginBtn} to="/Login">
                Login
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};