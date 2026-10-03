import { configureStore } from '@reduxjs/toolkit';
import challanReducer from '../Fetures/Inventory/ChallanSlice';
import invoiceReducer from '../Fetures/Inventory/InvoiceSlice';
import offerReducer from '../Fetures/Inventory/OfferSlice';
import projectReducer from '../Fetures/Inventory/ProjectsSlice';
import purchaseReducer from '../Fetures/Inventory/PurchaseSlice';
import salesReducer from '../Fetures/Inventory/SalesSlice';
import totalPurchaseReducer from '../Fetures/Inventory/TotalPurchaseSlice';
import attendanceReducer from '../Fetures/Inventory/attendanceSlice';
import { default as authReducer } from '../Fetures/Inventory/authSlice';
import clientReducer from '../Fetures/Inventory/clientSlice';
import payrollReducer from '../Fetures/Inventory/payrollSlice';
import supportReducer from '../Fetures/Inventory/supportSlice';

supportReducer

export const store = configureStore({
  reducer: {
    purchase: purchaseReducer,
    totalPurchase: totalPurchaseReducer,
    offer: offerReducer,
    challan: challanReducer,
    invoice: invoiceReducer,
    sales: salesReducer,
    project: projectReducer,
    client: clientReducer,
  payroll: payrollReducer,
    auth: authReducer,
   attendance: attendanceReducer,
   support: supportReducer,
    
  }
});