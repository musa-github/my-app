import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllSalesData } from '../../Fetures/Inventory/SalesSlice'; // আপনার পাথ অনুযায়ী আপডেট করুন
import './Sales.css';

function Sales() {
  const dispatch = useDispatch();
  // Redux স্টোর থেকে ডাটা আনা হচ্ছে
  const { salesList, loading, error } = useSelector((state) => state.sales);

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date/Month Filter States
  const [dateFilterType, setDateFilterType] = useState('ALL'); // 'ALL', 'MONTH', 'DATE_RANGE'
  const [selectedMonth, setSelectedMonth] = useState(''); // YYYY-MM Format
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD Format
  const [endDate, setEndDate] = useState(''); // YYYY-MM-DD Format

  useEffect(() => {
    // কম্পোনেন্ট লোড হলে ডাটা ফেচ করবে
    dispatch(fetchAllSalesData());
  }, [dispatch]);

  // ইউনিক কোম্পানি লিস্ট বের করা (Dropdown Filter-এর জন্য)
  const companyList = useMemo(() => {
    const companies = new Set();
    salesList.forEach((sale) => {
      if (sale.companyName) companies.add(sale.companyName);
    });
    return Array.from(companies);
  }, [salesList]);

  // ফিল্টার এবং আইটেম এগ্রিগেশন (সমজাতীয় প্রোডাক্টের সংখ্যা ও মোট দাম যোগ করা)
  const aggregatedSales = useMemo(() => {
    const itemMap = {};

    salesList.forEach((sale) => {
      // ১. কোম্পানি ফিল্টার
      if (selectedCompany !== 'ALL' && sale.companyName !== selectedCompany) {
        return;
      }

      // ২. ডেট / মান্থ ফিল্টার লজিক
      const rawDate = sale.date || sale.createdAt || sale.invoiceDate;
      if (dateFilterType !== 'ALL' && rawDate) {
        // ফায়ারবেস টাইমস্ট্যাম্প বা স্ট্রিং ডেট হ্যান্ডেল করা
        const saleDateObj = rawDate.seconds ? new Date(rawDate.seconds * 1000) : new Date(rawDate);

        if (!isNaN(saleDateObj.getTime())) {
          const saleYearMonth = saleDateObj.toISOString().slice(0, 7); // YYYY-MM
          const saleFormattedDate = saleDateObj.toISOString().slice(0, 10); // YYYY-MM-DD

          // মাস ভিত্তিক ফিল্টার
          if (dateFilterType === 'MONTH') {
            if (selectedMonth && saleYearMonth !== selectedMonth) {
              return;
            }
          }

          // তারিখের সীমা (Date Range) ভিত্তিক ফিল্টার
          if (dateFilterType === 'DATE_RANGE') {
            if (startDate && saleFormattedDate < startDate) return;
            if (endDate && saleFormattedDate > endDate) return;
          }
        }
      }

      // ৩. আইটেম প্রসেসিং ও সার্চ ফিল্টার
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const itemName = (item.name || item.itemName || 'Unknown Item').trim();
          const itemKey = itemName.toLowerCase();

          // সার্চ ফিল্টার
          if (searchTerm && !itemName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return;
          }

          const qty = parseFloat(item.quantity || item.qty) || 0;
          const price = parseFloat(item.price || item.unitPrice || item.rate) || 0;
          const totalPrice = qty * price;

          if (itemMap[itemKey]) {
            itemMap[itemKey].totalQuantity += qty;
            itemMap[itemKey].totalAmount += totalPrice;
            itemMap[itemKey].invoiceCount += 1;
          } else {
            itemMap[itemKey] = {
              name: itemName,
              unit: item.unit || 'Pcs',
              avgPrice: price,
              totalQuantity: qty,
              totalAmount: totalPrice,
              invoiceCount: 1,
            };
          }
        });
      }
    });

    return Object.values(itemMap);
  }, [salesList, selectedCompany, searchTerm, dateFilterType, selectedMonth, startDate, endDate]);

  // মোট সেলস ও মোট আইটেম গণনা
  const totalSalesAmount = useMemo(() => {
    return aggregatedSales.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [aggregatedSales]);

  const totalQuantitySold = useMemo(() => {
    return aggregatedSales.reduce((sum, item) => sum + item.totalQuantity, 0);
  }, [aggregatedSales]);

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h2>📊 Total Sales Summary</h2>
        <p>Analyze product-wise total sales performance across all clients</p>
      </div>

      {/* Summary Cards */}
      <div className="sales-summary-cards">
        <div className="summary-card">
          <h4>Total Sales Revenue</h4>
          <h3>BDT {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
        </div>
        <div className="summary-card">
          <h4>Total Items Sold</h4>
          <h3>{totalQuantitySold.toLocaleString()} Pcs</h3>
        </div>
        <div className="summary-card">
          <h4>Unique Products</h4>
          <h3>{aggregatedSales.length} Types</h3>
        </div>
      </div>

      {/* Filter Options */}
      <div className="sales-filter-card">
        <div className="filter-group">
          {/* Company Filter */}
          <div className="filter-box">
            <label>🏢 Filter by Client / Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">-- All Clients --</option>
              {companyList.map((comp, idx) => (
                <option key={idx} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Type Selection */}
          <div className="filter-box">
            <label>📅 Date Filter Mode:</label>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Time</option>
              <option value="MONTH">Month Wise</option>
              <option value="DATE_RANGE">Custom Date Range</option>
            </select>
          </div>

          {/* Month Wise Input */}
          {dateFilterType === 'MONTH' && (
            <div className="filter-box">
              <label>🗓️ Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="filter-input"
              />
            </div>
          )}

          {/* Date Range Inputs */}
          {dateFilterType === 'DATE_RANGE' && (
            <>
              <div className="filter-box">
                <label>📅 Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-box">
                <label>📅 End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-input"
                />
              </div>
            </>
          )}

          {/* Search Box */}
          <div className="filter-box">
            <label>🔍 Search Item Name:</label>
            <input
              type="text"
              placeholder="Type product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      {loading ? (
        <div className="loading-state">Loading Sales Data from Firebase...</div>
      ) : error ? (
        <div className="error-state">Error: {error}</div>
      ) : (
        <div className="table-responsive">
          <table className="sales-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>S.L</th>
                <th style={{ width: '42%' }}>Product / Item Description</th>
                <th style={{ width: '12%' }} className="text-center">Total Qty Sold</th>
                <th style={{ width: '10%' }} className="text-center">Unit</th>
                <th style={{ width: '14%' }} className="text-right">Unit Price (Avg)</th>
                <th style={{ width: '14%' }} className="text-right">Total Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSales.length > 0 ? (
                aggregatedSales.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td className="bold">{item.name}</td>
                    <td className="text-center bold">{item.totalQuantity}</td>
                    <td className="text-center">{item.unit}</td>
                    <td className="text-right">
                      {(item.totalAmount / (item.totalQuantity || 1)).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right bold-amount">
                      {item.totalAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center no-data">
                    No sales records found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-right bold">
                  Grand Total:
                </td>
                <td className="text-center bold">{totalQuantitySold}</td>
                <td></td>
                <td></td>
                <td className="text-right bold-amount">
                  BDT {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default Sales;