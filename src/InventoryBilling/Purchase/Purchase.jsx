import Style from './Purchase.module.css';
import PurchaseInput from "./PurchaseInput/PurchaseInput";

function Purchase() {
  return (
    <div className={Style.container}>
      <PurchaseInput/>
      
    </div>
  )
}

export default Purchase