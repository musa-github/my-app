import { NavLink, Outlet } from "react-router";
import Style from "./Inventory.module.css";

function InventoryBilling() {
  return (
    <div className={Style.InventoryContainer}>
       <div className={Style.asid}>
         <NavLink to="Purchase" className={({isActive})=>(isActive?Style.active:Style.asidLink)} >Purchase</NavLink>
         <NavLink to="Sales" className={({isActive})=>(isActive?Style.active:Style.asidLink)} >Sales</NavLink>
         <NavLink to="TotalPurchase" className={({isActive})=>(isActive?Style.active:Style.asidLink)} >Total Purchase</NavLink>
         <NavLink to="Stocks" className={({isActive})=>(isActive?Style.active:Style.asidLink)} >Stocks</NavLink>


       </div>
       <div className={Style.InventoryFormContainer}>
              <Outlet/>
       </div>

    </div>
  )
}

export default InventoryBilling