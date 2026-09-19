import { Navigate, Route, Routes } from "react-router";
import AdminPanel from "../AdminPannel/AdminPanel";
import Challan from "../Clints/Challan/Challan";
import ClientDetails from "../Clints/ClintDetails/ClintDetails";
import ClintLisst from "../Clints/ClintList/ClintLisst";
import Clints from "../Clints/Clints";
import Invoice from "../Clints/Invoice/Invoice";
import OfferInvoice from "../Clints/Offer/OfferInvoice";
import Attendance from "../EmployeeData/Attendance/Attendance";
import EmployeeData from "../EmployeeData/EmployeeData";
import EmployeeList from "../EmployeeData/EmployeeList/EmployeeList";
import Payroll_Salary from "../EmployeeData/Payroll_Salary/Payroll_Salary";
import YourProfile from "../EmployeeData/YourProfile/YourProfile";
import Home from "../Home/Home";
import InventoryBilling from "../InventoryBilling/InventoryBilling";
import Purchase from "../InventoryBilling/Purchase/Purchase";
import Sales from "../InventoryBilling/Sales/Sales";
import Stocks from "../InventoryBilling/Stocks/Stocks";
import TotalPurchase from "../InventoryBilling/TotalPurchase/TotalPurchase";
import Login from "../LoginData/Login/Login";
import SignUp from "../LoginData/SignUp/SignUp";
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

        {/* Authentication Routes */}
        <Route path="/Login" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />

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
          <Route index element={<Navigate to="Serviced_and_Schedule" replace />} />
          <Route path="Summery" element={<Summery />} />
          <Route path="project-details/:id" element={<ProjectDetails />} />
          <Route path="Serviced_and_Schedule" element={<Serviced_and_Schedule />} />
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

        {/* Employee Data Route */}
        <Route path="/EmployeeData" element={<EmployeeData />}>
          <Route index element={<Navigate to="YourProfile" replace />} />
          <Route path="YourProfile" element={<YourProfile />} />
          <Route path="EmployeeList" element={<EmployeeList />} />
          <Route path="Attendance" element={<Attendance />} />
          <Route path="Payroll" element={<Payroll_Salary />} />
        </Route>
        
        <Route path="/AdminPanel" element={<AdminPanel />} />
      </Routes>
    </div>
  );
};