/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllSalesData } from '../../Fetures/Inventory/SalesSlice';
import { fetchTotalPurchase } from '../../Fetures/Inventory/TotalPurchaseSlice';
import './Stocks.css';

function Stocks() {
  const dispatch = useDispatch();

  // Redux Store selectors
  const salesState = useSelector((state) => state.sales);
  const purchaseState = useSelector((state) => state.totalPurchase);

  const salesList = salesState?.salesList || [];
  const purchaseItems = purchaseState?.items || [];
  const loading = salesState?.loading || purchaseState?.loading;
  const error = salesState?.error || purchaseState?.error;

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    dispatch(fetchAllSalesData());
    dispatch(fetchTotalPurchase());
  }, [dispatch]);

  // Client / Company Dropdown List
  const companyList = useMemo(() => {
    const companies = new Set();
    salesList.forEach((sale) => {
      if (sale.companyName) companies.add(sale.companyName);
    });
    return Array.from(companies);
  }, [salesList]);

  // Date Parsing Helper
  const parseDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal?.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
  };

  // Stock & Profit Calculation Engine
  const stockData = useMemo(() => {
    const inventoryMap = {};

    // 1. Process Purchases
    purchaseItems.forEach((purchase) => {
      const pDate = parseDate(purchase.date || purchase.createdAt);
      if (selectedDate && pDate && pDate.toISOString().split('T')[0] !== selectedDate) return;
      if (selectedMonth && pDate && (pDate.getMonth() + 1).toString() !== selectedMonth) return;

      const rawName = purchase.ItemsName || purchase.itemName || purchase.name || 'Unknown Item';
      const itemName = rawName.trim();
      const itemKey = itemName.toLowerCase();

      if (searchTerm && !itemKey.includes(searchTerm.toLowerCase())) return;

      const qty = Number(purchase.QTY || purchase.quantity) || 0;
      const unitPrice = Number(purchase.UnitPrice || purchase.price) || 0;
      const totalCost = qty * unitPrice;

      if (!inventoryMap[itemKey]) {
        inventoryMap[itemKey] = {
          name: itemName,
          purchasedQty: 0,
          totalPurchaseCost: 0,
          soldQty: 0,
          totalSalesRevenue: 0,
        };
      }

      inventoryMap[itemKey].purchasedQty += qty;
      inventoryMap[itemKey].totalPurchaseCost += totalCost;
    });

    // 2. Process Sales
    salesList.forEach((sale) => {
      if (selectedCompany !== 'ALL' && sale.companyName !== selectedCompany) return;

      const sDate = parseDate(sale.date || sale.createdAt || sale.invoiceDate);
      if (selectedDate && sDate && sDate.toISOString().split('T')[0] !== selectedDate) return;
      if (selectedMonth && sDate && (sDate.getMonth() + 1).toString() !== selectedMonth) return;

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const rawName = item.name || item.itemName || 'Unknown Item';
          const itemName = rawName.trim();
          const itemKey = itemName.toLowerCase();

          if (searchTerm && !itemKey.includes(searchTerm.toLowerCase())) return;

          const qty = Number(item.quantity || item.qty) || 0;
          const unitPrice = Number(item.price || item.unitPrice || item.rate) || 0;
          const totalRevenue = qty * unitPrice;

          if (!inventoryMap[itemKey]) {
            inventoryMap[itemKey] = {
              name: itemName,
              purchasedQty: 0,
              totalPurchaseCost: 0,
              soldQty: 0,
              totalSalesRevenue: 0,
            };
          }

          inventoryMap[itemKey].soldQty += qty;
          inventoryMap[itemKey].totalSalesRevenue += totalRevenue;
        });
      }
    });

    // 3. Final calculations per item
    return Object.values(inventoryMap).map((item) => {
      const currentStock = item.purchasedQty - item.soldQty;
      const avgPurchasePrice = item.purchasedQty > 0 ? item.totalPurchaseCost / item.purchasedQty : 0;
      const costOfGoodsSold = item.soldQty * avgPurchasePrice;
      const profit = item.totalSalesRevenue - costOfGoodsSold;
      const stockValue = currentStock * avgPurchasePrice;

      return {
        ...item,
        currentStock,
        avgPurchasePrice,
        costOfGoodsSold,
        profit,
        stockValue,
      };
    });
  }, [salesList, purchaseItems, searchTerm, selectedCompany, selectedMonth, selectedDate]);

  // Overall Totals
  const totals = useMemo(() => {
    return stockData.reduce(
      (acc, item) => {
        acc.totalPurchasedQty += item.purchasedQty;
        acc.totalSoldQty += item.soldQty;
        acc.totalStock += item.currentStock;
        acc.totalRevenue += item.totalSalesRevenue;
        acc.totalProfit += item.profit;
        acc.totalStockValue += item.stockValue;
        return acc;
      },
      { totalPurchasedQty: 0, totalSoldQty: 0, totalStock: 0, totalRevenue: 0, totalProfit: 0, totalStockValue: 0 }
    );
  }, [stockData]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCompany('ALL');
    setSelectedMonth('');
    setSelectedDate('');
  };

  if (loading) return <div className="loading-state">Loading Stock & Profit Analytics...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="stock-container">
      <div className="stock-header">
        <h2>📦 Stock & Profit Analytics Dashboard</h2>
        <p>Monitor current stock levels, inventory values, and real-time profit/loss</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="summary-cards">
        <div className="card profit-card">
          <h4>Total Estimated Profit</h4>
          <h3 className={totals.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
            BDT {totals.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="card sales-card">
          <h4>Total Sales Revenue</h4>
          <h3>BDT {totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="card stock-val-card">
          <h4>Current Stock Value</h4>
          <h3>BDT {totals.totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="card items-card">
          <h4>Available Stock Items</h4>
          <h3>{totals.totalStock.toLocaleString()} Pcs</h3>
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="filter-item">
            <label>🔍 Item Name:</label>
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>🏢 Client / Company:</label>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              <option value="ALL">All Clients</option>
              {companyList.map((comp, idx) => (
                <option key={idx} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
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

          <div className="filter-item">
            <label>📅 Specific Date:</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          <div className="filter-item btn-box">
            <button className="reset-btn" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stock & Profit Table */}
      <div className="table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>S.L</th>
              <th>Item Description</th>
              <th className="text-center">Purchased Qty</th>
              <th className="text-center">Sold Qty</th>
              <th className="text-center">Stock In Hand</th>
              <th className="text-right">Avg Purchase Price</th>
              <th className="text-right">Sales Revenue</th>
              <th className="text-right">Profit / Loss</th>
            </tr>
          </thead>
          <tbody>
            {stockData.length > 0 ? (
              stockData.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="bold">{item.name}</td>
                  <td className="text-center">{item.purchasedQty}</td>
                  <td className="text-center">{item.soldQty}</td>
                  <td className={`text-center bold ${item.currentStock < 0 ? 'text-danger' : 'text-primary'}`}>
                    {item.currentStock}
                  </td>
                  <td className="text-right">BDT {item.avgPurchasePrice.toFixed(2)}</td>
                  <td className="text-right">BDT {item.totalSalesRevenue.toFixed(2)}</td>
                  <td className={`text-right bold ${item.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    BDT {item.profit.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center no-data">
                  No inventory records matched your filters.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" className="text-right bold">
                Total:
              </td>
              <td className="text-center bold">{totals.totalPurchasedQty}</td>
              <td className="text-center bold">{totals.totalSoldQty}</td>
              <td className="text-center bold text-primary">{totals.totalStock}</td>
              <td></td>
              <td className="text-right bold">
                BDT {totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td
                className={`text-right bold ${
                  totals.totalProfit >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                BDT {totals.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default Stocks;