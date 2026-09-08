import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { selectClientDetailsByName } from '../../Fetures/Inventory/clientSlice';
import './ClintDetails.css';

// ডেট ফরম্যাটকে সব জায়গায় একই (YYYY-MM-DD) করার জন্য হেলপার ফাংশন
const formatDateStandard = (dateVal) => {
  if (!dateVal || dateVal === 'N/A' || dateVal === '-') return '-';

  // Firestore Timestamp হলে
  if (typeof dateVal === 'object' && dateVal.seconds) {
    dateVal = new Date(dateVal.seconds * 1000);
  }

  const parsedDate = new Date(dateVal);
  if (isNaN(parsedDate.getTime())) {
    // যদি সাধারণ স্ট্রাকচার্ড String হয় (যেমন: YYYY-MM-DD)
    return String(dateVal).split('T')[0];
  }

  // YYYY-MM-DD ফরম্যাটে কনভার্ট
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

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

 // Merge Offers and Sales by Unique Document ID
  const mergedTransactions = useMemo(() => {
    if (!clientData) return [];

    const map = new Map();

    // 1. Process Sales / Bills First (Prevent Duplicates for Same ID)
    (clientData.sales || []).forEach((sale) => {
      // Primary Unique Identifier (Ensure ID clean string)
      const rawId = sale.id || sale.billNo || sale.offerNo || sale.offerId;
      if (!rawId) return;

      const docId = String(rawId).trim();
      const billAmt = Number(sale.grandTotal || sale.totalBill || sale.billAmount || 0);

      // Safe Received Amount extraction
      let rawRecAmt = sale.paidAmount ?? sale.receivedAmount ?? sale.totalReceived ?? 0;
      if (Array.isArray(sale.paymentHistory)) {
        rawRecAmt = sale.paymentHistory.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      }
      const recAmt = parseFloat(String(rawRecAmt).replace(/,/g, '')) || 0;

      const rawBillDate = sale.billDate || sale.date || sale.createdAt || 'N/A';
      const rawRecDate =
        sale.receivedDate ||
        sale.paymentDate ||
        sale.updatedAt ||
        (recAmt > 0 ? sale.billDate || sale.date : '-');

      // If document ID already exists in map, update/merge values instead of creating new row
      if (map.has(docId)) {
        const existing = map.get(docId);
        // Keep maximum values if duplicated
        existing.billedAmount = Math.max(existing.billedAmount, billAmt);
        existing.receivedAmount = Math.max(existing.receivedAmount, recAmt);
        if (existing.receivedDate === '-' && rawRecDate !== '-') {
          existing.receivedDate = formatDateStandard(rawRecDate);
        }
      } else {
        map.set(docId, {
          id: docId,
          offerDate: '-',
          billDate: formatDateStandard(rawBillDate),
          receivedDate: formatDateStandard(rawRecDate),
          items: sale.items || sale.products || [],
          offerAmount: 0,
          billedAmount: billAmt,
          receivedAmount: recAmt,
          hasSale: true,
          hasOffer: false,
        });
      }
    });

    // 2. Process Offers and Merge with matching ID
    (clientData.offers || []).forEach((offer) => {
      const rawId = offer.id || offer.offerNo || offer.billNo;
      if (!rawId) return;

      const docId = String(rawId).trim();
      const offerAmt = Number(offer.grandTotal || offer.totalAmount || offer.totalBill || 0);
      const rawOfferDate = offer.offerDate || offer.date || offer.createdAt || 'N/A';
      const formattedOfferDate = formatDateStandard(rawOfferDate);

      if (map.has(docId)) {
        const existing = map.get(docId);
        existing.offerAmount = offerAmt;
        existing.offerDate = formattedOfferDate;
        existing.hasOffer = true;

        if (!existing.items || existing.items.length === 0) {
          existing.items = offer.items || offer.products || [];
        }
      } else {
        map.set(docId, {
          id: docId,
          offerDate: formattedOfferDate,
          billDate: '-',
          receivedDate: '-',
          items: offer.items || offer.products || [],
          offerAmount: offerAmt,
          billedAmount: 0,
          receivedAmount: 0,
          hasSale: false,
          hasOffer: true,
        });
      }
    });

    return Array.from(map.values());
  }, [clientData]);
  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return mergedTransactions.filter((record) => {
      // Tab Filtering
      if (activeTab === 'SALES' && !record.hasSale) return false;
      if (activeTab === 'OFFERS' && !record.hasOffer) return false;

      // Primary Date for filtering (Prefer Bill Date, fallback to Offer Date)
      const primaryDateStr = record.billDate !== '-' && record.billDate !== 'N/A' 
        ? record.billDate 
        : (record.offerDate !== '-' && record.offerDate !== 'N/A' ? record.offerDate : '');
        
      const recordDate = primaryDateStr && primaryDateStr !== '-' ? new Date(primaryDateStr) : null;

      // 1. Month Filter (YYYY-MM)
      if (filterMonth && primaryDateStr) {
        if (!primaryDateStr.startsWith(filterMonth)) return false;
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
        const items = record.items || [];
        const hasItem = items.some((item) => {
          const name = item.name || item.itemName || item.description || '';
          return name.trim().toLowerCase() === selectedItem.toLowerCase();
        });
        if (!hasItem) return false;
      }

      return true;
    });
  }, [mergedTransactions, activeTab, filterMonth, startDate, endDate, selectedItem]);

  // Calculations
  const totalBilled = filteredTransactions.reduce((sum, t) => sum + t.billedAmount, 0);
  const totalReceived = filteredTransactions.reduce((sum, t) => sum + t.receivedAmount, 0);
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
            {(clientData.itemList || []).map((item, idx) => (
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
          All Transactions ({mergedTransactions.length})
        </button>
        <button
          className={activeTab === 'SALES' ? 'active' : ''}
          onClick={() => setActiveTab('SALES')}
        >
          Sales & Bills ({mergedTransactions.filter((t) => t.hasSale).length})
        </button>
        <button
          className={activeTab === 'OFFERS' ? 'active' : ''}
          onClick={() => setActiveTab('OFFERS')}
        >
          Offers / Quotations ({mergedTransactions.filter((t) => t.hasOffer).length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="table-responsive">
        <table className="client-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Doc No / ID</th>
              <th>Offer Date</th>
              <th>Bill Date</th>
              <th>Receive Date</th>
              <th>Items Included</th>
              <th>Offer Amount</th>
              <th>Billed Amount</th>
              <th>Received</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => {
              const dueAmt = tx.billedAmount - tx.receivedAmount;
              return (
                <tr key={tx.id} className="row-sale">
                  <td>
                    {tx.hasSale && tx.hasOffer && (
                      <span className="badge badge-sale">OFFER & BILL</span>
                    )}
                    {tx.hasSale && !tx.hasOffer && (
                      <span className="badge badge-sale">BILL/SALE</span>
                    )}
                    {!tx.hasSale && tx.hasOffer && (
                      <span className="badge badge-offer">OFFER ONLY</span>
                    )}
                  </td>
                  <td>{tx.id}</td>
                  <td>{tx.offerDate}</td>
                  <td>{tx.billDate}</td>
                  <td>{tx.receivedDate}</td>
                  <td>
                    <ul className="item-list">
                      {tx.items.map((it, i) => (
                        <li key={i}>
                          {it.name || it.itemName || it.description} ({it.quantity || 1} {it.unit || 'Pcs'})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    {tx.hasOffer ? `৳ ${tx.offerAmount.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td>
                    {tx.hasSale ? `৳ ${tx.billedAmount.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="text-success">
                    {tx.hasSale ? `৳ ${tx.receivedAmount.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="text-danger">
                    {tx.hasSale ? `৳ ${(dueAmt > 0 ? dueAmt : 0).toLocaleString('en-IN')}` : '-'}
                  </td>
                </tr>
              );
            })}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="10" className="no-data">
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