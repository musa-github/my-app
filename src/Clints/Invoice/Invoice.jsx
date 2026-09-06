import Style from "./Invoice.module.css";
import InvoiceComponent from "./InvoiceComponent";
function Invoice() {
  
  return (
    <div className={Style.invoiceContainer}>

      <InvoiceComponent/>
      
      
    </div>
  )
}

export default Invoice