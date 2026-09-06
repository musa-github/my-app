import { NavLink } from "react-router";
import logo from "../assets/main-logo.png";
import Style from "./Header.module.css";
export const Header = () => {
  return (
    <nav className={Style.header}>
      <a href="/"  > 
        <img className={Style.Logo}src={logo} alt="Loading..." />
      </a>
       
        <div className={Style.menu}>
            <NavLink className={({isActive})=>(isActive?Style.active:Style.link)} to="/"  >Home</NavLink>
            <NavLink className={({isActive})=>(isActive?Style.active:Style.link)} to="/Clints">Clints</NavLink>
            <NavLink className={({isActive})=>(isActive?Style.active:Style.link)} to="/Projects">Projects</NavLink>
            <NavLink className={({isActive})=>(isActive?Style.active:Style.link)} to="/InventoryBilling">Inventory & Billing</NavLink>
            <NavLink className={({isActive})=>(isActive?Style.active:Style.link)} to="/EmployeeData">Employee's data</NavLink>

        </div>
            

        <div className={Style.loginContainer}>
          <span className={Style.singup}>Signup</span>
          <span className={Style.login}>Login</span>
        </div>
    </nav>
  )
}
