import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTotalPurchase } from '../../Fetures/Inventory/TotalPurchaseSlice';

function TotalPurchase() {
  const dispatch = useDispatch();
  
  // 🟢 এখানে state.purchase এর বদলে state.totalPurchase হবে
  const purchaseState = useSelector((state) => state.totalPurchase);
  
  const items = purchaseState?.items || [];
  const loading = purchaseState?.loading;
  const error = purchaseState?.error;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  useEffect(() => {
    dispatch(fetchTotalPurchase());
  }, [dispatch]);

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
      if (selectedDate) {
        matchesDate = formattedItemDate === selectedDate;
      }

      if (selectedMonth) {
        matchesMonth = (itemDateObj.getMonth() + 1).toString() === selectedMonth;
      }

      if (selectedDay) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        matchesDay = dayNames[itemDateObj.getDay()] === selectedDay;
      }
    } else if (selectedDate || selectedMonth || selectedDay) {
      return false;
    }

    return matchesName && matchesDate && matchesMonth && matchesDay;
  });

  const totalPurchaseAmount = filteredItems.reduce(
    (total, item) => total + (Number(item?.UnitPrice || item?.price) || 0) * (Number(item?.QTY || item?.quantity) || 0),
    0
  );

  if (loading) return <h3 style={{ padding: '20px' }}>Loading...</h3>;
  if (error) return <h3 style={{ color: 'red', padding: '20px' }}>Error: {error}</h3>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Total Purchase Inventory</h2>

      {/* Filter Section */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px' }}>
        <div>
          <label>Search Name: </label>
          <input
            type="text"
            placeholder="Item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label>Date: </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div>
          <label>Month: </label>
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

        <div>
          <label>Day: </label>
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

        <button onClick={() => { setSearchTerm(''); setSelectedDate(''); setSelectedMonth(''); setSelectedDay(''); }}>
          Reset Filters
        </button>
      </div>

      {/* Table Section */}
      <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#e2e2e2' }}>
            <th>Date</th>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const dateObj = getItemDateObject(item.date || item.createdAt);
              const formattedDate = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString() : 'N/A';
              const unitPrice = Number(item.UnitPrice || item.price) || 0;
              const qty = Number(item.QTY || item.quantity) || 0;

              return (
                <tr key={item.id}>
                  <td>{formattedDate}</td>
                  <td>{item.ItemsName || item.itemName || item.name || 'Unnamed Item'}</td>
                  <td>{qty}</td>
                  <td>${unitPrice}</td>
                  <td>${unitPrice * qty}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No matching items found</td>
            </tr>
          )}
        </tbody>
        {filteredItems.length > 0 && (
          <tfoot>
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
              <td colSpan="4" style={{ textAlign: 'right' }}>Grand Total Purchase:</td>
              <td>${totalPurchaseAmount}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default TotalPurchase;