import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTotalPurchase, updatePurchaseItem } from '../../Fetures/Inventory/TotalPurchaseSlice';
import styles from './TotalPurchase.module.css';

function TotalPurchase() {
  const dispatch = useDispatch();
  const purchaseState = useSelector((state) => state.totalPurchase);

  const rawItems = purchaseState?.items || [];
  const loading = purchaseState?.loading;
  const error = purchaseState?.error;

  // Local Editable Items State
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  // Edit State & Modal
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ItemsName: '',
    QTY: '',
    UnitPrice: '',
    date: '',
  });

  useEffect(() => {
    dispatch(fetchTotalPurchase());
  }, [dispatch]);

  // Redux store data syncs with local state
  useEffect(() => {
    if (rawItems.length > 0) {
      setItems(rawItems);
    }
  }, [rawItems]);

  // তারিখ ফরম্যাট হেলপার ফাংশন
  const getItemDateObject = (itemDate) => {
    if (!itemDate) return null;
    if (itemDate?.seconds) {
      return new Date(itemDate.seconds * 1000);
    }
    return new Date(itemDate);
  };

  // ডাটা ফিল্টারিং লজিক
  const filteredItems = items.filter((item) => {
    const itemName = (item.ItemsName || item.itemName || item.name || '').toLowerCase();
    const matchesName = itemName.includes(searchTerm.toLowerCase());

    const itemDateObj = getItemDateObject(item.date || item.createdAt);

    let matchesDate = true;
    let matchesMonth = true;
    let matchesDay = true;

    if (itemDateObj && !isNaN(itemDateObj)) {
      const formattedItemDate = itemDateObj.toISOString().split('T')[0];
      if (selectedDate) matchesDate = formattedItemDate === selectedDate;
      if (selectedMonth) matchesMonth = (itemDateObj.getMonth() + 1).toString() === selectedMonth;
      if (selectedDay) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        matchesDay = dayNames[itemDateObj.getDay()] === selectedDay;
      }
    } else if (selectedDate || selectedMonth || selectedDay) {
      return false;
    }

    return matchesName && matchesDate && matchesMonth && matchesDay;
  });

  // Total Amounts Calculation
  const totalPurchaseAmount = filteredItems.reduce(
    (total, item) => total + (Number(item?.UnitPrice || item?.price) || 0) * (Number(item?.QTY || item?.quantity) || 0),
    0
  );

  // Edit Modal Open Handler
  const handleOpenEdit = (item) => {
    const dateObj = getItemDateObject(item.date || item.createdAt);
    const dateString = dateObj && !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : '';

    setEditingItem(item);
    setFormData({
      ItemsName: item.ItemsName || item.itemName || item.name || '',
      QTY: item.QTY || item.quantity || 0,
      UnitPrice: item.UnitPrice || item.price || 0,
      date: dateString,
    });
  };

  // Edit Submit Handler
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const payload = {
      ItemsName: formData.ItemsName,
      QTY: Number(formData.QTY),
      UnitPrice: Number(formData.UnitPrice),
      date: formData.date,
    };

    try {
      await dispatch(updatePurchaseItem({ id: editingItem.id, updatedData: payload })).unwrap();
      alert('Purchase record updated successfully!');
      setEditingItem(null);
    } catch (err) {
      alert('Failed to update record: ' + err);
    }
  };

  if (loading) return <div className={styles.loadingState}>⏳ Loading Purchase Inventory...</div>;
  if (error) return <div className={styles.errorState}>⚠️ Error: {error}</div>;

  return (
    <div className={styles.purchaseContainer}>
      <div className={styles.purchaseHeader}>
        <h2>🛍️ Total Purchase Inventory</h2>
        <p>Track purchased inventory items, filter by date/month, and monitor expenditure & sales projection</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <h4>Total Purchase Cost</h4>
          <h3>BDT {totalPurchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className={styles.card}>
          <h4>Total Selling Value</h4>
          <h3>BDT {totalSellingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Filter Bar Section */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <label>🔍 Search Item:</label>
            <input
              type="text"
              placeholder="Item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <label>📅 Specific Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <label>🗓️ Month:</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label>📆 Day:</label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              <option value="">All Days</option>
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

          <div className={`${styles.filterItem} ${styles.btnBox}`}>
            <button
              className={styles.resetBtn}
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setSelectedMonth('');
                setSelectedDay('');
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.purchaseTable}>
          <thead>
            <tr>
              <th className={styles.textCenter} style={{ width: '110px' }}>Date</th>
              <th>Item Description</th>
<<<<<<< HEAD
              <th className={styles.textCenter} style={{ width: '90px' }}>QTY</th>
              <th className={styles.textRight}>Purchase Price</th>
              <th className={styles.textRight}>Selling Price</th>
              <th className={styles.textRight}>Total Purchase</th>
              <th className={styles.textCenter} style={{ width: '130px' }}>Action</th>
=======
              <th className={styles.textCenter}>Quantity</th>
              <th className={styles.textRight}>Unit Price</th>
              <th className={styles.textRight}>Total Cost</th>
              <th className={styles.textCenter} style={{ width: '90px' }}>Action</th>
>>>>>>> second-repo/version-1.7
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const currentId = item.id || index;
                const isEditing = editingId === currentId;
                const dateObj = getItemDateObject(item.date || item.createdAt);
                const formattedDate = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A';

                const unitPrice = Number(item.UnitPrice || item.price) || 0;
                const sellingPrice = Number(item.SalingPrice || item.sellingPrice || item.SellingPrice) || 0;
                const qty = Number(item.QTY || item.quantity) || 0;

                return (
                  <tr key={currentId}>
                    <td className={`${styles.textCenter} ${styles.bold}`}>{formattedDate}</td>
<<<<<<< HEAD
                    
                    {/* Item Description */}
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          name="itemName"
                          value={editFormData.itemName}
                          onChange={handleInputChange}
                          className={styles.editInput}
                        />
                      ) : (
                        item.ItemsName || item.itemName || item.name || 'Unnamed Item'
                      )}
                    </td>

                    {/* Quantity */}
                    <td className={styles.textCenter}>
                      {isEditing ? (
                        <input
                          type="number"
                          name="quantity"
                          value={editFormData.quantity}
                          onChange={handleInputChange}
                          className={`${styles.editInput} ${styles.textCenter}`}
                        />
                      ) : (
                        qty
                      )}
                    </td>

                    {/* Unit Purchase Price */}
                    <td className={styles.textRight}>
                      {isEditing ? (
                        <input
                          type="number"
                          name="unitPrice"
                          value={editFormData.unitPrice}
                          onChange={handleInputChange}
                          className={`${styles.editInput} ${styles.textRight}`}
                        />
                      ) : (
                        `BDT ${unitPrice.toFixed(2)}`
                      )}
                    </td>

                    {/* Selling Price */}
                    <td className={`${styles.textRight} ${styles.bold}`}>
                      {isEditing ? (
                        <input
                          type="number"
                          name="sellingPrice"
                          value={editFormData.sellingPrice}
                          onChange={handleInputChange}
                          className={`${styles.editInput} ${styles.textRight}`}
                        />
                      ) : (
                        `BDT ${sellingPrice.toFixed(2)}`
                      )}
                    </td>

                    {/* Total Purchase Cost */}
                    <td className={`${styles.textRight} ${styles.bold}`}>
                      BDT {(unitPrice * qty).toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className={styles.textCenter}>
                      {isEditing ? (
                        <div className={styles.actionBtnGroup}>
                          <button
                            onClick={() => handleSave(item.id, index)}
                            className={styles.saveBtn}
                          >
                            Save
                          </button>
                          <button onClick={handleCancel} className={styles.cancelBtn}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(item, index)}
                          className={styles.editBtn}
                        >
                          ✏️ Edit
                        </button>
                      )}
=======
                    <td className={styles.bold}>{item.ItemsName || item.itemName || item.name || 'Unnamed Item'}</td>
                    <td className={styles.textCenter}>{qty}</td>
                    <td className={styles.textRight}>BDT {unitPrice.toFixed(2)}</td>
                    <td className={`${styles.textRight} ${styles.bold}`}>BDT {(unitPrice * qty).toFixed(2)}</td>
                    <td className={styles.textCenter}>
                      <button
                        className={styles.editBtn || 'edit-btn'}
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
>>>>>>> second-repo/version-1.7
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
<<<<<<< HEAD
                <td colSpan="7" className={styles.noData}>
=======
                <td colSpan="6" className={styles.noData}>
>>>>>>> second-repo/version-1.7
                  No purchase records matched your filters.
                </td>
              </tr>
            )}
          </tbody>
          {filteredItems.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="5" className={`${styles.textRight} ${styles.bold}`}>
                  Grand Total Purchase:
                </td>
                <td className={`${styles.textRight} ${styles.bold} ${styles.textPrimary}`}>
                  BDT {totalPurchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '25px',
              borderRadius: '8px',
              minWidth: '320px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>✏️ Edit Purchase Item</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Item Name:</label>
                <input
                  type="text"
                  value={formData.ItemsName}
                  onChange={(e) => setFormData({ ...formData, ItemsName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
                <input
                  type="number"
                  value={formData.QTY}
                  onChange={(e) => setFormData({ ...formData, QTY: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Unit Price (BDT):</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.UnitPrice}
                  onChange={(e) => setFormData({ ...formData, UnitPrice: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 15px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TotalPurchase;