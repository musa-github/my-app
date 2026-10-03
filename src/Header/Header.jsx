import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/main-logo.png";
import { logoutUser } from "../Fetures/Inventory/authSlice";
import { auth, db } from "../Firebase/Firebase";
import { Avatar } from "../LoginData/Component/Avatar/Avatar";
import Style from "./Header.module.css";

const OWNER_EMAIL = "osanlift@gmail.com";

export const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});

  const [permissions, setPermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const currentUserEmail = (user?.email || auth.currentUser?.email || "").toLowerCase();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserEmail) {
        setPermissions({});
        setIsAdmin(false);
        setEmployeeProfile(null);
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

        // ৩. Employee Data লোড করা (Firestore employees collection)
        const empDoc = await getDoc(doc(db, "employees", cleanEmail));
        if (empDoc.exists()) {
          setEmployeeProfile(empDoc.data());
        } else {
          setEmployeeProfile(null);
        }
      } catch (error) {
        console.error("Error fetching header user data:", error);
      }
    };

    fetchUserData();
  }, [currentUserEmail]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const hasAccess = (newKey, legacyKey) => {
    if (isAdmin) return true;
    return Boolean(permissions[newKey] || permissions[legacyKey]);
  };

  // Google User / Logged-in Auth User + Firestore Employee Profile merge
  const activeProfile = employeeProfile || user || auth.currentUser;

  return (
    <header className={Style.headerWrapper}>
      <nav className={Style.header}>
        {/* Logo */}
        <Link to="/" className={Style.logoLink} onClick={closeMobileMenu}>
          <img className={Style.Logo} src={logo} alt="MM Engineering" />
        </Link>

        {/* Hamburger Menu Icon (For Mobile) */}
        <button
          className={Style.hamburgerBtn}
          onClick={toggleMobileMenu}
          aria-label="Toggle Navigation"
        >
          <span className={`${Style.bar} ${isMobileMenuOpen ? Style.openBar1 : ""}`}></span>
          <span className={`${Style.bar} ${isMobileMenuOpen ? Style.openBar2 : ""}`}></span>
          <span className={`${Style.bar} ${isMobileMenuOpen ? Style.openBar3 : ""}`}></span>
        </button>

        {/* Nav Links Container */}
        <div className={`${Style.menu} ${isMobileMenuOpen ? Style.menuOpen : ""}`}>
          <NavLink
            className={({ isActive }) => (isActive ? Style.active : Style.link)}
            to="/"
            onClick={closeMobileMenu}
          >
            Home
          </NavLink>

          <NavLink
            className={({ isActive }) => (isActive ? Style.active : Style.link)}
            to="Services"
            onClick={closeMobileMenu}
          >
            Our Services
          </NavLink>

          {hasAccess("nav_clients", "canAccessClients") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/Clints"
              onClick={closeMobileMenu}
            >
              Clients
            </NavLink>
          )}

          {hasAccess("nav_projects", "canAccessProjects") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/Projects"
              onClick={closeMobileMenu}
            >
              Projects
            </NavLink>
          )}

          {hasAccess("nav_inventory", "canAccessInventory") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/InventoryBilling"
              onClick={closeMobileMenu}
            >
              Inventory & Billing
            </NavLink>
          )}

          {hasAccess("nav_employee", "canAccessEmployees") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/EmployeeData"
              onClick={closeMobileMenu}
            >
              Employee's Data
            </NavLink>
          )}

          {hasAccess("nav_admin") && (
            <NavLink
              className={({ isActive }) => (isActive ? Style.active : Style.link)}
              to="/AdminPanel"
              onClick={closeMobileMenu}
            >
              Admin Panel
            </NavLink>
          )}

          {/* Mobile Auth Buttons */}
          <div className={Style.mobileAuthContainer}>
            {user || auth.currentUser ? (
              <div className={Style.userProfileGroup}>
                <Avatar profile={activeProfile} />
                <button onClick={handleLogout} className={Style.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <div className={Style.authGroupMobile}>
                <NavLink className={Style.signupBtn} to="/SignUp" onClick={closeMobileMenu}>
                  Signup
                </NavLink>
                <NavLink className={Style.loginBtn} to="/Login" onClick={closeMobileMenu}>
                  Login
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className={Style.desktopAuthContainer}>
          {user || auth.currentUser ? (
            <div className={Style.userProfileGroup}>
              <Avatar profile={activeProfile} />
              <button onClick={handleLogout} className={Style.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <div className={Style.loginContainer}>
              <NavLink className={Style.signupBtn} to="/SignUp">
                Signup
              </NavLink>
              <NavLink className={Style.loginBtn} to="/Login">
                Login
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};