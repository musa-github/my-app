import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllSalesData } from '../../Fetures/Inventory/SalesSlice';
import styles from './Sales.module.css';

function Sales() {
  const dispatch = useDispatch();
  const { salesList, loading, error } = useSelector((state) => state.sales);

  // Filter States
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date/Month Filter States
  const [dateFilterType, setDateFilterType] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    dispatch(fetchAllSalesData());
  }, [dispatch]);

  // ইউনিক কোম্পানি লিস্ট বের করা
  const companyList = useMemo(() => {
    const companies = new Set();
    salesList.forEach((sale) => {
      if (sale.companyName) companies.add(sale.companyName);
    });
    return Array.from(companies);
  }, [salesList]);

  // ফিল্টার এবং আইটেম এগ্রিগেশন
  const aggregatedSales = useMemo(() => {
    const itemMap = {};

    salesList.forEach((sale) => {
      if (selectedCompany !== 'ALL' && sale.companyName !== selectedCompany) {
        return;
      }

      const rawDate = sale.date || sale.createdAt || sale.invoiceDate;
      if (dateFilterType !== 'ALL' && rawDate) {
        const saleDateObj = rawDate.seconds ? new Date(rawDate.seconds * 1000) : new Date(rawDate);

        if (!isNaN(saleDateObj.getTime())) {
          const saleYearMonth = saleDateObj.toISOString().slice(0, 7);
          const saleFormattedDate = saleDateObj.toISOString().slice(0, 10);

          if (dateFilterType === 'MONTH') {
            if (selectedMonth && saleYearMonth !== selectedMonth) return;
          }

          if (dateFilterType === 'DATE_RANGE') {
            if (startDate && saleFormattedDate < startDate) return;
            if (endDate && saleFormattedDate > endDate) return;
          }
        }
      }

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const itemName = (item.name || item.itemName || 'Unknown Item').trim();
          const itemKey = itemName.toLowerCase();

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

  const totalSalesAmount = useMemo(() => {
    return aggregatedSales.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [aggregatedSales]);

  const totalQuantitySold = useMemo(() => {
    return aggregatedSales.reduce((sum, item) => sum + item.totalQuantity, 0);
  }, [aggregatedSales]);

  return (
    <div className={styles.salesContainer}>
      <div className={styles.salesHeader}>
        <h2>📊 Total Sales Summary</h2>
        <p>Analyze product-wise total sales performance across all clients</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.salesSummaryCards}>
        <div className={`${styles.summaryCard} ${styles.revenueCard}`}>
          <h4>Total Sales Revenue</h4>
          <h3 style={{ color: 'var(--success)' }}>
            BDT {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`${styles.summaryCard} ${styles.itemsCard}`}>
          <h4>Total Items Sold</h4>
          <h3>{totalQuantitySold.toLocaleString()} Pcs</h3>
        </div>
        <div className={`${styles.summaryCard} ${styles.typesCard}`}>
          <h4>Unique Products</h4>
          <h3>{aggregatedSales.length} Types</h3>
        </div>
      </div>

      {/* Filter Options */}
      <div className={styles.salesFilterCard}>
        <div className={styles.filterGroup}>
          <div className={styles.filterBox}>
            <label>🏢 Filter by Client / Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">-- All Clients --</option>
              {companyList.map((comp, idx) => (
                <option key={idx} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterBox}>
            <label>📅 Date Filter Mode:</label>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="ALL">All Time</option>
              <option value="MONTH">Month Wise</option>
              <option value="DATE_RANGE">Custom Date Range</option>
            </select>
          </div>

          {dateFilterType === 'MONTH' && (
            <div className={styles.filterBox}>
              <label>🗓️ Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={styles.filterInput}
              />
            </div>
          )}

          {dateFilterType === 'DATE_RANGE' && (
            <>
              <div className={styles.filterBox}>
                <label>📅 Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterBox}>
                <label>📅 End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.filterInput}
                />
              </div>
            </>
          )}

          <div className={styles.filterBox}>
            <label>🔍 Search Item Name:</label>
            <input
              type="text"
              placeholder="Type product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.filterInput}
            />
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      {loading ? (
        <div className={styles.loadingState}>⏳ Loading Sales Data from Firebase...</div>
      ) : error ? (
        <div className={styles.errorState}>⚠️ Error: {error}</div>
      ) : (
        <div className={styles.tableResponsive}>
          <table className={styles.salesTable}>
            <thead>
              <tr>
                <th style={{ width: '8%' }} className={styles.textCenter}>S.L</th>
                <th style={{ width: '42%' }}>Product / Item Description</th>
                <th style={{ width: '12%' }} className={styles.textCenter}>Total Qty Sold</th>
                <th style={{ width: '10%' }} className={styles.textCenter}>Unit</th>
                <th style={{ width: '14%' }} className={styles.textRight}>Unit Price (Avg)</th>
                <th style={{ width: '14%' }} className={styles.textRight}>Total Amount (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSales.length > 0 ? (
                aggregatedSales.map((item, index) => (
                  <tr key={index}>
                    <td className={styles.textCenter}>{index + 1}</td>
                    <td className={styles.bold}>{item.name}</td>
                    <td className={`${styles.textCenter} ${styles.bold}`}>{item.totalQuantity}</td>
                    <td className={styles.textCenter}>{item.unit}</td>
                    <td className={styles.textRight}>
                      {(item.totalAmount / (item.totalQuantity || 1)).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={`${styles.textRight} ${styles.boldAmount}`}>
                      {item.totalAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={`${styles.textCenter} ${styles.noData}`}>
                    No sales records found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
            {aggregatedSales.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="2" className={`${styles.textRight} ${styles.bold}`}>
                    Grand Total:
                  </td>
                  <td className={`${styles.textCenter} ${styles.bold}`}>{totalQuantitySold}</td>
                  <td></td>
                  <td></td>
                  <td className={`${styles.textRight} ${styles.boldAmount}`}>
                    BDT {totalSalesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default Sales;