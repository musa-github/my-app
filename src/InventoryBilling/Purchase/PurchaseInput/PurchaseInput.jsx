/* eslint-disable react-hooks/set-state-in-effect */


import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearStatus, savePurchaseData } from '../../../Fetures/Inventory/PurchaseSlice'; // পাথ চেক করুন
import Style from './PurchaseInput.module.css';

function PurchaseInput() {
  const dispatch = useDispatch();
  
  // Redux State থেকে loading, error এবং successMessage নিয়ে আসা
  const { loading, error, successMessage } = useSelector((state) => state.purchase);

  const initialItems = [
    { ItemsName: '', QTY: '', UnitPrice: '', TotalPrice: '', SalingPrice: '' }
  ];

  const [items, setItems] = useState(initialItems);

  // সফল বা ব্যর্থ সাবমিশনের রেসপন্স হ্যান্ডলিং
  useEffect(() => {
    if (successMessage) {
      alert("ডাটা সফলভাবে সেভ হয়েছে!");
      setItems(initialItems);
      dispatch(clearStatus());
    }
    if (error) {
      alert("সমস্যা হয়েছে: " + error);
      dispatch(clearStatus());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, error, dispatch]);

  const handleInput = (index, e) => {
    const { name, value } = e.target;

    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [name]: value };

        if (name === 'QTY' || name === 'UnitPrice') {
          const qty = parseFloat(name === 'QTY' ? value : newItem.QTY) || 0;
          const unitPrice = parseFloat(name === 'UnitPrice' ? value : newItem.UnitPrice) || 0;
          
          newItem.TotalPrice = (qty * unitPrice).toFixed(2);
        }

        return newItem;
      }
      return item;
    });

    setItems(updatedItems);
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      { ItemsName: '', QTY: '', UnitPrice: '', TotalPrice: '', SalingPrice: '' }
    ]);
  };

  const handleDeleteRow = (indexToDelete) => {
    if (items.length === 1) {
      alert("কমপক্ষে একটি সারি থাকা আবশ্যক!");
      return;
    }
    const filteredItems = items.filter((_, index) => index !== indexToDelete);
    setItems(filteredItems);
  };

  const handleReset = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে সব ডাটা মুছে ফেলতে চান?")) {
      setItems(initialItems);
    }
  };

  // Redux Action Dispatch করা
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(savePurchaseData(items)); // Redux Thunk-এ ডাটা পাঠানো হলো
  };

  return (
    <div className={Style.PurchaseInputContainer}>
      <div className={Style.heading_3}>Purchase Input</div>
      
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Items Name</th>
              <th>QTY</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Saling Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              return (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      name="SlNo"
                      value={index + 1}
                      readOnly
                      className={Style.readOnlyInput}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="ItemsName"
                      value={item.ItemsName}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="QTY"
                      value={item.QTY}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="UnitPrice"
                      value={item.UnitPrice}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="TotalPrice"
                      value={item.TotalPrice}
                      readOnly
                      placeholder="0.00"
                      className={Style.readOnlyInput}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="SalingPrice"
                      value={item.SalingPrice}
                      onChange={(e) => handleInput(index, e)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={Style.deleteBtn}
                      onClick={() => handleDeleteRow(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={Style.buttonGroup}>
          <button type="button" className={Style.addBtn} onClick={handleAddRow}>
            + Add Row
          </button>
          <button type="button" className={Style.resetBtn} onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className={Style.submitBtn} disabled={loading}>
            {loading ? "Saving via Redux..." : "Submit All Data"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurchaseInput;