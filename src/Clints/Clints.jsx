import { NavLink, Outlet } from "react-router";
import Style from "./Clints.module.css";
function Clints() {
  return (
    <div className={Style.ClintsContainer}>
     
        <div className={Style.asid}>

            <NavLink to="ClintList" className={Style.asidLink}>Clint List</NavLink>
            <NavLink to="Offer" className={Style.asidLink}>Offer</NavLink>
            <NavLink to="Challan" className={Style.asidLink}>Challan</NavLink>
            <NavLink to="Invoice" className={Style.asidLink}> Invoice</NavLink>
          
        
          
        </div>

       
       <div className={Style.formContainer}>

            <Outlet/>

       </div>

    </div>
  )
}

export default Clints