import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import {
  fetchOfferList,
  fetchSalesList,
  selectClientSummaryTotals,
  selectFilteredClients,
  setSearchTerm,
  setStatusFilter,
} from '../../Fetures/Inventory/clientSlice';
import './ClintList.css';

function ClintList() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchOfferList());
    dispatch(fetchSalesList());
  }, [dispatch]);

  const loading = useSelector((state) => state.client.loading);
  const searchTerm = useSelector((state) => state.client.searchTerm);
  const statusFilter = useSelector((state) => state.client.statusFilter);
  const filteredClients = useSelector(selectFilteredClients);
  const totals = useSelector(selectClientSummaryTotals);

  return (
    <div className="client-list-container">
      <h2>Client Summary & Ledger</h2>

      {/* Filter and Search Bar */}
      <div className="filter-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Client/Company Name..."
          value={searchTerm}
          onChange={(e) => dispatch(setSearchTerm(e.target.value))}
        />

        <select
          className="status-select"
          value={statusFilter}
          onChange={(e) => dispatch(setStatusFilter(e.target.value))}
        >
          <option value="ALL">All Clients</option>
          <option value="DUE">Due Only</option>
          <option value="PAID">Paid / No Due</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card offer-card">
          <h4>Total Offered</h4>
          <p>৳ {totals.totalOffer.toLocaleString('en-IN')}</p>
        </div>
        <div className="card bill-card">
          <h4>Total Billed</h4>
          <p>৳ {totals.totalBill.toLocaleString('en-IN')}</p>
        </div>
        <div className="card received-card">
          <h4>Total Received</h4>
          <p>৳ {totals.totalReceived.toLocaleString('en-IN')}</p>
        </div>
        <div className="card due-card">
          <h4>Total Outstanding Due</h4>
          <p>৳ {totals.totalDue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Client Table */}
      <div className="table-responsive">
        <table className="client-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Client / Company Name</th>
              <th>Total Offer</th>
              <th>Total Billed</th>
              <th>Total Received</th>
              <th>Current Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="no-data">Loading......</td>
              </tr>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <tr key={client.clientName || index}>
                  <td>{index + 1}</td>
                  <td className="font-bold">
                    <NavLink to={`/Clints/ClientDetails/${encodeURIComponent(client.clientName)}`} style={{color:"#333",fontSize:"14px"}}>
                      {client.clientName}
                    </NavLink>
                  </td>
                  <td>৳ {client.totalOffer.toLocaleString('en-IN')}</td>
                  <td>৳ {client.totalBill.toLocaleString('en-IN')}</td>
                  <td className="text-success">৳ {client.totalReceived.toLocaleString('en-IN')}</td>
                  <td className={client.totalDue > 0 ? 'text-danger font-bold' : ''}>
                    ৳ {client.totalDue.toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`status-badge ${client.totalDue > 0 ? 'badge-due' : 'badge-paid'}`}>
                      {client.totalDue > 0 ? 'Due' : 'Clear'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No Clients Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClintList;