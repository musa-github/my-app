import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { selectClientDetailsByName } from '../../Fetures/Inventory/clientSlice';
import './ClintDetails.css';

function ClientDetails() {
  const { clientName } = useParams();
  const navigate = useNavigate();

  // Redux Data Fetch
  const clientData = useSelector(selectClientDetailsByName(clientName));

  // Local Filter States
  const [filterMonth, setFilterMonth] = useState(''); // YYYY-MM
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, OFFERS, SALES

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!clientData) return { offers: [], sales: [] };

    const filterRecord = (record) => {
      const recordDateStr = record.date || record.updatedAt || '';
      const recordDate = recordDateStr ? new Date(recordDateStr) : null;

      // 1. Month Filter (YYYY-MM)
      if (filterMonth && recordDateStr) {
        if (!recordDateStr.startsWith(filterMonth)) return false;
      }

      // 2. Custom Date Range Filter
      if (startDate && recordDate) {
        if (recordDate < new Date(startDate)) return false;
      }
      if (endDate && recordDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }

      // 3. Item Name Filter
      if (selectedItem) {
        const items = record.items || record.products || [];
        const hasItem = items.some((item) => {
          const name = item.name || item.itemName || item.description || '';
          return name.trim().toLowerCase() === selectedItem.toLowerCase();
        });
        if (!hasItem) return false;
      }

      return true;
    };

    return {
      offers: clientData.offers.filter(filterRecord),
      sales: clientData.sales.filter(filterRecord),
    };
  }, [clientData, filterMonth, startDate, endDate, selectedItem]);

  // Calculations
  const totalBilled = filteredData.sales.reduce(
    (sum, s) => sum + Number(s.grandTotal || s.totalBill || 0),
    0
  );
  const totalReceived = filteredData.sales.reduce(
    (sum, s) => sum + Number(s.receivedAmount || s.paidAmount || 0),
    0
  );
  const totalDue = totalBilled - totalReceived;

  // Reset Filters
  const handleReset = () => {
    setFilterMonth('');
    setStartDate('');
    setEndDate('');
    setSelectedItem('');
    setActiveTab('ALL');
  };

  // Back Button Handler
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/Clints/ClintList');
    }
  };

  if (!clientData) {
    return (
      <div className="details-container">
        <div className="details-header">
          <button className="btn-back" onClick={handleBack}>
            ⬅️ Back to Client List
          </button>
        </div>
        <p className="no-data">Client Not Found or Loading...</p>
      </div>
    );
  }

  return (
    <div className="details-container">
      {/* Top Header */}
      <div className="details-header">
        <button className="btn-back" onClick={handleBack}>
          ⬅️ Back to Client List
        </button>
        <h2>Client Ledger: {clientData.clientName}</h2>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card bill-card">
          <h4>Filtered Billed</h4>
          <p>৳ {totalBilled.toLocaleString('en-IN')}</p>
        </div>
        <div className="card received-card">
          <h4>Filtered Received</h4>
          <p>৳ {totalReceived.toLocaleString('en-IN')}</p>
        </div>
        <div className="card due-card">
          <h4>Outstanding Due</h4>
          <p>৳ {totalDue > 0 ? totalDue.toLocaleString('en-IN') : 0}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-card">
        <div className="filter-group">
          <label>📅 Monthly Filter:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              setStartDate('');
              setEndDate('');
            }}
          />
        </div>

        <div className="filter-group">
          <label>📆 Date Range:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFilterMonth('');
            }}
          />
          <span>To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFilterMonth('');
            }}
          />
        </div>

        <div className="filter-group">
          <label>📦 Filter by Item:</label>
          <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
            <option value="">All Items</option>
            {clientData.itemList.map((item, idx) => (
              <option key={idx} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset Filters
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-buttons">
        <button
          className={activeTab === 'ALL' ? 'active' : ''}
          onClick={() => setActiveTab('ALL')}
        >
          All Transactions
        </button>
        <button
          className={activeTab === 'SALES' ? 'active' : ''}
          onClick={() => setActiveTab('SALES')}
        >
          Sales & Bills ({filteredData.sales.length})
        </button>
        <button
          className={activeTab === 'OFFERS' ? 'active' : ''}
          onClick={() => setActiveTab('OFFERS')}
        >
          Offers / Quotations ({filteredData.offers.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="table-responsive">
        <table className="client-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Doc No / ID</th>
              <th>Date</th>
              <th>Items Included</th>
              <th>Total Amount</th>
              <th>Received</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {/* Sales Rows */}
            {(activeTab === 'ALL' || activeTab === 'SALES') &&
              filteredData.sales.map((sale) => {
                const bill = Number(sale.grandTotal || sale.totalBill || 0);
                const rec = Number(sale.receivedAmount || sale.paidAmount || 0);
                const items = sale.items || sale.products || [];
                return (
                  <tr key={sale.id} className="row-sale">
                    <td>
                      <span className="badge badge-sale">BILL/SALE</span>
                    </td>
                    <td>{sale.billNo || sale.id}</td>
                    <td>{sale.date || 'N/A'}</td>
                    <td>
                      <ul className="item-list">
                        {items.map((it, i) => (
                          <li key={i}>
                            {it.name || it.itemName} ({it.quantity || 1} {it.unit || 'pcs'})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>৳ {bill.toLocaleString('en-IN')}</td>
                    <td className="text-success">৳ {rec.toLocaleString('en-IN')}</td>
                    <td className="text-danger">৳ {(bill - rec).toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}

            {/* Offer Rows */}
            {(activeTab === 'ALL' || activeTab === 'OFFERS') &&
              filteredData.offers.map((offer) => {
                const offerAmt = Number(offer.grandTotal || offer.totalAmount || 0);
                const items = offer.items || offer.products || [];
                return (
                  <tr key={offer.id} className="row-offer">
                    <td>
                      <span className="badge badge-offer">OFFER</span>
                    </td>
                    <td>{offer.offerNo || offer.id}</td>
                    <td>{offer.date || 'N/A'}</td>
                    <td>
                      <ul className="item-list">
                        {items.map((it, i) => (
                          <li key={i}>
                            {it.name || it.itemName} ({it.quantity || 1} {it.unit || 'pcs'})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>৳ {offerAmt.toLocaleString('en-IN')}</td>
                    <td>-</td>
                    <td>-</td>
                  </tr>
                );
              })}

            {filteredData.sales.length === 0 && filteredData.offers.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">
                  No transaction records found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientDetails;