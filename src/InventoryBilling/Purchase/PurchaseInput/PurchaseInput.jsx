/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearStatus, savePurchaseData } from '../../../Fetures/Inventory/PurchaseSlice';
import Style from './PurchaseInput.module.css';

function PurchaseInput() {
  const dispatch = useDispatch();

  const { loading, error, successMessage } = useSelector((state) => state.purchase);

  const initialItems = [
    { ItemsName: '', QTY: '', UnitPrice: '', TotalPrice: '', SalingPrice: '' }
  ];

  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    if (successMessage) {
      alert("ডাটা সফলভাবে সেভ হয়েছে!");
      setItems(initialItems);
      dispatch(clearStatus());
    }
    if (error) {
      alert("সমস্যা হয়েছে: " + error);
      dispatch(clearStatus());
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(savePurchaseData(items));
  };

  return (
    <div className={Style.PurchaseInputContainer}>
      <div className={Style.headingContainer}>
        <h2 className={Style.heading_3}>🛒 Purchase Entry Form</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={Style.tableWrapper}>
          <table className={Style.table}>
            <thead>
              <tr>
                <th className={Style.narrow}>Sl</th>
                <th>Item Name</th>
                <th className={Style.medium}>QTY</th>
                <th className={Style.medium}>Unit Price</th>
                <th className={Style.medium}>Total Price</th>
                <th className={Style.medium}>Selling Price</th>
                <th className={Style.narrow}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className={Style.narrow}>
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
                      placeholder="Produc Name"
                      value={item.ItemsName}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td className={Style.medium}>
                    <input
                      type="number"
                      name="QTY"
                      placeholder="0"
                      value={item.QTY}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td className={Style.medium}>
                    <input
                      type="number"
                      name="UnitPrice"
                      placeholder="0.00"
                      value={item.UnitPrice}
                      onChange={(e) => handleInput(index, e)}
                      required
                    />
                  </td>
                  <td className={Style.medium}>
                    <input
                      type="text"
                      name="TotalPrice"
                      value={item.TotalPrice}
                      readOnly
                      placeholder="0.00"
                      className={Style.readOnlyInput}
                    />
                  </td>
                  <td className={Style.medium}>
                    <input
                      type="number"
                      name="SalingPrice"
                      placeholder="0.00"
                      value={item.SalingPrice}
                      onChange={(e) => handleInput(index, e)}
                    />
                  </td>
                  <td className={Style.narrow}>
                    <button
                      type="button"
                      className={Style.deleteBtn}
                      onClick={() => handleDeleteRow(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={Style.buttonGroup}>
          <div className={Style.leftButtons}>
            <button type="button" className={Style.addBtn} onClick={handleAddRow}>
              + Add Item Row
            </button>
            <button type="button" className={Style.resetBtn} onClick={handleReset}>
              Reset
            </button>
          </div>
          <button type="submit" className={Style.submitBtn} disabled={loading}>
            {loading ? "Saving Records..." : "Submit All Purchases"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurchaseInput;