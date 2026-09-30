import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { selectClientDetailsByName } from '../../Fetures/Inventory/clientSlice';
import { downloadInvoicePDF } from '../../HndlePDF/HndlePDF';
import './ClintDetails.css';

const formatDateStandard = (dateVal) => {
  if (!dateVal || dateVal === 'N/A' || dateVal === '-') return '-';

  if (typeof dateVal === 'object' && dateVal.seconds) {
    dateVal = new Date(dateVal.seconds * 1000);
  }

  const parsedDate = new Date(dateVal);
  if (isNaN(parsedDate.getTime())) {
    return String(dateVal).split('T')[0];
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function ClientDetails() {
  const { clientName } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);

  const clientData = useSelector(selectClientDetailsByName(clientName));

  const [filterMonth, setFilterMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const mergedTransactions = useMemo(() => {
    if (!clientData) return [];

    const map = new Map();

    (clientData.sales || []).forEach((sale) => {
      const rawId = sale.id || sale.billNo || sale.offerNo || sale.offerId;
      if (!rawId) return;

      const docId = String(rawId).trim();
      const billAmt = Number(sale.grandTotal || sale.totalBill || sale.billAmount || 0);

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

      if (map.has(docId)) {
        const existing = map.get(docId);
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

  const filteredTransactions = useMemo(() => {
    return mergedTransactions.filter((record) => {
      if (activeTab === 'SALES' && !record.hasSale) return false;
      if (activeTab === 'OFFERS' && !record.hasOffer) return false;

      const primaryDateStr = record.billDate !== '-' && record.billDate !== 'N/A' 
        ? record.billDate 
        : (record.offerDate !== '-' && record.offerDate !== 'N/A' ? record.offerDate : '');
        
      const recordDate = primaryDateStr && primaryDateStr !== '-' ? new Date(primaryDateStr) : null;

      if (filterMonth && primaryDateStr) {
        if (!primaryDateStr.startsWith(filterMonth)) return false;
      }

      if (startDate && recordDate) {
        if (recordDate < new Date(startDate)) return false;
      }
      if (endDate && recordDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }

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

  const totalBilled = filteredTransactions.reduce((sum, t) => sum + t.billedAmount, 0);
  const totalReceived = filteredTransactions.reduce((sum, t) => sum + t.receivedAmount, 0);
  const totalDue = totalBilled - totalReceived;

  const handleReset = () => {
    setFilterMonth('');
    setStartDate('');
    setEndDate('');
    setSelectedItem('');
    setActiveTab('ALL');
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/Clints/ClintList');
    }
  };

  const handleDownloadPDF = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      alert("PDF তৈরি করার মতো কোনো ডাটা পাওয়া যায়নি!");
      return;
    }

    downloadInvoicePDF({
      elementRef: printRef,
      fileName: `${clientData.clientName}_Ledger_Report_${new Date().toISOString().slice(0, 10)}`,
      setIsPdfPrinting: setIsPdfPrinting,
    });
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
      {/* Top Header & Action */}
      <div className="details-header">
        <button className="btn-back" onClick={handleBack}>
          ⬅️ Back to Client List
        </button>
        <h2>Client Ledger: {clientData.clientName}</h2>

        <div className="action-buttons-group">
          <button className="btn-action btn-pdf" onClick={handleDownloadPDF} disabled={isPdfPrinting}>
            {isPdfPrinting ? '⏳ Generating PDF...' : '📄 Download PDF'}
          </button>
        </div>
      </div>

      {/* Main Container Referenced for PDF */}
      <div ref={printRef} className={`printable-content ${isPdfPrinting ? 'pdf-downloading' : ''}`}>
        
        {/* PDF Document Title Header */}
        <div className="pdf-company-header">
          <h2>OSAN LIFT</h2>
          <h3>Client Statement: {clientData.clientName}</h3>
          <p>Generated Date: {new Date().toLocaleDateString('en-GB')}</p>
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

        {/* Filters Box (Marked elements to hide during download) */}
        <div className="filter-card hide-on-pdf">
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

        {/* Tab Buttons (Hide during download) */}
        <div className="tab-buttons hide-on-pdf">
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
                const itemCount = tx.items ? tx.items.length : 0;

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
                      {/* Normal display (unfiltered list) */}
                      <ul className="item-list normal-item-list">
                        {tx.items.map((it, i) => (
                          <li key={i}>
                            {it.name || it.itemName || it.description} ({it.quantity || 1} {it.unit || 'Pcs'})
                          </li>
                        ))}
                      </ul>
                      {/* PDF download display (count only) */}
                      <span className="pdf-item-count">
                        {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                      </span>
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
    </div>
  );
}

export default ClientDetails;