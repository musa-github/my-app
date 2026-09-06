// import { Navigate, Route, Routes } from "react-router";
// import Challan from "../Clints/Challan/Challan";
// import ClintLisst from "../Clints/ClintList/ClintLisst";
// import Clints from "../Clints/Clints";
// import Invoice from "../Clints/Invoice/Invoice";
// import OfferInvoice from "../Clints/Offer/OfferInvoice";
// import EmployeeData from "../EmployeeData/EmployeeData";
// import Home from "../Home/Home";
// import InventoryBilling from "../InventoryBilling/InventoryBilling";
// import Purchase from "../InventoryBilling/Purchase/Purchase";
// import Sales from "../InventoryBilling/Sales/Sales";
// import Stocks from "../InventoryBilling/Stocks/Stocks";
// import TotalPurchase from "../InventoryBilling/TotalPurchase/TotalPurchase";
// import ProjectDetails from "../Projects/Project/ProjectDetails";
// import ServiceBill from "../Projects/Project/ServiceBill";
// import Serviced_and_Schedule from "../Projects/Project/Serviced_and_Schedule";
// import Projects from "../Projects/Projects";
// import Summery from "../Projects/Summery";
// import "./Main.css";

// export const Main = () => {
//   return (
//     <div className="main">
//       <Routes>
//         <Route path="/" element={<Home />} />

//         {/* Clients Route */}
//         <Route path="/Clints" element={<Clints />}>
//           <Route index element={<Navigate to="Offer" replace />} />
//           <Route path="ClintList" element={<ClintLisst/>}/>
//           <Route path="Offer" element={<OfferInvoice />} />
//           <Route path="Invoice" element={<Invoice />} />
//           <Route path="Challan" element={<Challan />} />
//         </Route>

//         {/* Projects Route */}
//         <Route path="/Projects" element={<Projects />}>
//           <Route index element={<Navigate to="Summery" replace />} />
//           <Route path="Serviced_and_Schedule" element={<Serviced_and_Schedule />} />
//           <Route path="project-details/:id" element={<ProjectDetails />} />
//           <Route path="Summery" element={<Summery />} />
//         </Route>

//         {/* Service Bill Route (আলাদা স্বাধীন রাউট হিসেবে রাখা হয়েছে) */}
//         <Route path="/service-bill" element={<ServiceBill />} />

//         {/* Inventory Route */}
//         <Route path="/InventoryBilling" element={<InventoryBilling />}>
//           <Route index element={<Navigate to="Stocks" replace />} />
//           <Route path="Purchase" element={<Purchase />} />
//           <Route path="TotalPurchase" element={<TotalPurchase />} />
//           <Route path="Sales" element={<Sales />} />
//           <Route path="Stocks" element={<Stocks />} />
//         </Route>

//         <Route path="/EmployeeData" element={<EmployeeData />} />
//       </Routes>
//     </div>
//   );
// };

import { Navigate, Route, Routes } from "react-router";
import Challan from "../Clints/Challan/Challan";
import ClientDetails from "../Clints/ClintDetails/ClintDetails";
import ClintLisst from "../Clints/ClintList/ClintLisst";
import Clints from "../Clints/Clints";
import Invoice from "../Clints/Invoice/Invoice";
import OfferInvoice from "../Clints/Offer/OfferInvoice";
import EmployeeData from "../EmployeeData/EmployeeData";
import Home from "../Home/Home";
import InventoryBilling from "../InventoryBilling/InventoryBilling";
import Purchase from "../InventoryBilling/Purchase/Purchase";
import Sales from "../InventoryBilling/Sales/Sales";
import Stocks from "../InventoryBilling/Stocks/Stocks";
import TotalPurchase from "../InventoryBilling/TotalPurchase/TotalPurchase";
import ProjectDetails from "../Projects/Project/ProjectDetails";
import ServiceBill from "../Projects/Project/ServiceBill";
import Serviced_and_Schedule from "../Projects/Project/Serviced_and_Schedule";
import Projects from "../Projects/Projects";
import Summery from "../Projects/Summery";
import "./Main.css";

export const Main = () => {
  return (
    <div className="main">
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Clients Route */}
        <Route path="/Clints" element={<Clints />}>
          <Route index element={<Navigate to="Offer" replace />} />
          <Route path="ClintList" element={<ClintLisst />} />
          <Route path="ClientDetails/:clientName" element={<ClientDetails />} />
          <Route path="Offer" element={<OfferInvoice />} />
          <Route path="Invoice" element={<Invoice />} />
          <Route path="Challan" element={<Challan />} />
        </Route>

        {/* Projects Route */}
        <Route path="/Projects" element={<Projects />}>
          <Route index element={<Navigate to="Summery" replace />} />
          <Route path="Serviced_and_Schedule" element={<Serviced_and_Schedule />} />
          <Route path="project-details/:id" element={<ProjectDetails />} />
          <Route path="Summery" element={<Summery />} />
        </Route>

        {/* Service Bill Route */}
        <Route path="/service-bill" element={<ServiceBill />} />

        {/* Inventory Route */}
        <Route path="/InventoryBilling" element={<InventoryBilling />}>
          <Route index element={<Navigate to="Stocks" replace />} />
          <Route path="Purchase" element={<Purchase />} />
          <Route path="TotalPurchase" element={<TotalPurchase />} />
          <Route path="Sales" element={<Sales />} />
          <Route path="Stocks" element={<Stocks />} />
        </Route>

        <Route path="/EmployeeData" element={<EmployeeData />} />
      </Routes>
    </div>
  );
};