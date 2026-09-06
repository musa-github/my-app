import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import {
  fetchProjects,
  saveAllProjectsToFirebase,
  setSelectedMonth,
  setSelectedWhoseProject,
  updateProjectLocal
} from '../../Fetures/Inventory/ProjectsSlice';
import './Serviced_and_Schedule.css';

const monthsList = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Serviced_and_Schedule = () => {
  const dispatch = useDispatch();
  const { 
    projects = [], 
    selectedMonth = 'All', 
    selectedWhoseProject = 'All', 
    loading = false 
  } = useSelector((state) => state.project || {});

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dueFilter, setDueFilter] = useState('All');

  const initialFormState = {
    projectName: '',
    liftQty: '', 
    whoseProjects: '',
    address: '',
    phoneNo: '',
    month: 'September',
    servicingBill: '',
    sparePartsBill: '',
    lastMonthDue: '',
    collectedBill: '',
    collectedBy: '',
    approvedBy: '',
    servicedBy: '',
    lastServicingDate: '',
    servicingStatus: 'Pending'
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getLastServicingDateFromProj = (proj, targetMonth = 'All') => {
    if (!proj) return '';
    const bills = proj.billList || [];
    
    if (targetMonth !== 'All') {
      const currentBill = bills.find(b => b.month === targetMonth);
      if (currentBill) {
        const date = currentBill.lastServicingDate || currentBill.servicingDate;
        if (date) return date;
      }
    }

    for (let i = bills.length - 1; i >= 0; i--) {
      const d = bills[i].lastServicingDate || bills[i].servicingDate;
      if (d) return d;
    }

    return proj.lastServicingDate || proj.servicingDate || '';
  };

  const handleEdit = (proj) => {
    setEditingId(proj.id);
    const activeMonth = selectedMonth === 'All' ? monthsList[new Date().getMonth() + 1] : selectedMonth;
    const currentBill = (proj.billList || []).find(b => b.month === activeMonth) || {};
    
    const existingDate = getLastServicingDateFromProj(proj, activeMonth);

    setFormData({
      projectName: proj.projectName || '',
      liftQty: proj.liftQty || '',
      whoseProjects: proj.whoseProjects || '',
      address: proj.address || '',
      phoneNo: proj.phoneNo || '',
      month: activeMonth,
      servicingBill: currentBill.servicingBill || '',
      sparePartsBill: currentBill.sparePartsBill || '',
      lastMonthDue: currentBill.lastMonthDue || '',
      collectedBill: currentBill.collectedBill || '',
      collectedBy: currentBill.collectedBy || '',
      approvedBy: currentBill.approvedBy || '',
      servicedBy: currentBill.servicedBy || '',
      lastServicingDate: existingDate,
      servicingStatus: currentBill.servicingStatus || 'Pending'
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateProjectLocal({ id: editingId, ...formData }));
    }
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const handleSaveToFirebase = () => {
    dispatch(saveAllProjectsToFirebase())
      .unwrap()
      .then(() => alert('All projects saved to Firebase successfully!'))
      .catch((err) => alert('Save failed: ' + err));
  };

  const availableWhoseProjects = ['All', ...new Set(projects.map(p => p.whoseProjects).filter(Boolean))];

  // ==================== [ Next Servicing Date ক্যালকুলেশন ] ====================
  const getUpcomingSchedules = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0 indexed
    const currentMonthName = monthsList[currentMonth + 1];
    const todayDate = new Date(currentYear, currentMonth, today.getDate());

    return projects.map((proj) => {
      const currentMonthBill = (proj.billList || []).find(b => b.month === currentMonthName);

      if (currentMonthBill && currentMonthBill.servicingStatus === 'Complete') {
        return null;
      }

      const dateStr = getLastServicingDateFromProj(proj);
      if (!dateStr) return null;

      const lastDate = new Date(dateStr);
      if (isNaN(lastDate.getTime())) return null;

      const serviceDay = lastDate.getDate();
      const nextServicingDate = new Date(currentYear, currentMonth, serviceDay);

      const formattedYear = nextServicingDate.getFullYear();
      const formattedMonth = String(nextServicingDate.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(nextServicingDate.getDate()).padStart(2, '0');
      const formattedNextServicingDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;

      const diffTime = nextServicingDate.getTime() - todayDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= -30 && diffDays <= 5) {
        return {
          ...proj,
          lastServiceDayDate: dateStr,
          nextServicingDate: formattedNextServicingDate,
          daysRemaining: diffDays
        };
      }
      return null;
    }).filter(Boolean).sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const upcomingSchedules = getUpcomingSchedules();

  // ==================== [ মূল প্রজেক্ট ফিল্টারিং আপডেট (যাতে কোনো প্রজেক্ট হারিয়ে না যায়) ] ====================
  const filteredProjects = projects.filter((proj) => {
    const matchesWhose = selectedWhoseProject === 'All' || proj.whoseProjects === selectedWhoseProject;
    if (!matchesWhose) return false;

    // নির্বাচিত মাসের জন্য বিল অবজেক্ট খোঁজা হচ্ছে
    const targetMonth = selectedMonth === 'All' ? monthsList[new Date().getMonth() + 1] : selectedMonth;
    const bill = (proj.billList || []).find(b => b.month === targetMonth) || {};

    const servicingBill = Number(bill.servicingBill) || 0;
    const sparePartsBill = Number(bill.sparePartsBill) || 0;
    const lastMonthDue = Number(bill.lastMonthDue) || 0;
    const totalBill = servicingBill + sparePartsBill + lastMonthDue;
    const collectedBill = Number(bill.collectedBill) || 0;
    const totalDue = totalBill - collectedBill;

    if (dueFilter === 'WithDue') {
      return totalDue > 0;
    } else if (dueFilter === 'NoDue') {
      return totalDue <= 0;
    }

    return true;
  });

  // ==================== [ ডাটাবেজের সর্বমোট প্রজেক্ট ও রানিং মাসের স্ট্যাটাস গণনা ] ====================
  const targetMonthForSummary = selectedMonth === 'All' ? monthsList[new Date().getMonth() + 1] : selectedMonth;
  
  const statusSummary = projects.reduce(
    (acc, proj) => {
      const currentBill = (proj.billList || []).find((b) => b.month === targetMonthForSummary);
      const status = currentBill ? currentBill.servicingStatus : 'Pending';

      if (status === 'Complete') {
        acc.completed += 1;
      } else {
        acc.incomplete += 1;
      }
      return acc;
    },
    { total: projects.length, completed: 0, incomplete: 0 }
  );

  const totals = filteredProjects.reduce((acc, proj) => {
    const bill = (proj.billList || []).find(b => b.month === targetMonthForSummary) || {};

    const sBill = Number(bill.servicingBill) || 0;
    const pBill = Number(bill.sparePartsBill) || 0;
    const lDue = Number(bill.lastMonthDue) || 0;
    const tBill = sBill + pBill + lDue;
    const cBill = Number(bill.collectedBill) || 0;
    const tDue = tBill - cBill;

    acc.servicingBill += sBill;
    acc.sparePartsBill += pBill;
    acc.lastMonthDue += lDue;
    acc.totalBill += tBill;
    acc.collectedBill += cBill;
    acc.totalDue += tDue;

    return acc;
  }, {
    servicingBill: 0,
    sparePartsBill: 0,
    lastMonthDue: 0,
    totalBill: 0,
    collectedBill: 0,
    totalDue: 0
  });

  const collectorDetailedSummary = filteredProjects.reduce((acc, proj) => {
    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );

    filteredBills.forEach(bill => {
      const collector = (bill.collectedBy && bill.collectedBy.trim()) ? bill.collectedBy.trim() : 'Unspecified';
      const collectedAmount = Number(bill.collectedBill) || 0;
      
      const isApproved = bill.approvedBy && bill.approvedBy.trim() !== '' && bill.approvedBy.trim() !== '-';
      const approvedAmount = isApproved ? collectedAmount : 0;

      if (!acc[collector]) {
        acc[collector] = { collected: 0, approved: 0 };
      }

      acc[collector].collected += collectedAmount;
      acc[collector].approved += approvedAmount;
    });

    return acc;
  }, {});

  const approverDetailedSummary = filteredProjects.reduce((acc, proj) => {
    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );

    filteredBills.forEach(bill => {
      const approver = (bill.approvedBy && bill.approvedBy.trim() && bill.approvedBy.trim() !== '-') 
        ? bill.approvedBy.trim() 
        : null;

      if (approver) {
        const collectedAmount = Number(bill.collectedBill) || 0;
        acc[approver] = (acc[approver] || 0) + collectedAmount;
      }
    });

    return acc;
  }, {});

  return (
    <div className="project-container">
      <div className="header-bar">
        <h2>Serviced & Schedule</h2>

        <div className="action-group">
          <div className="filter-box">
            <label>Filter Month: </label>
            <select value={selectedMonth} onChange={(e) => dispatch(setSelectedMonth(e.target.value))}>
              {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="filter-box">
            <label>Whose Project: </label>
            <select value={selectedWhoseProject} onChange={(e) => dispatch(setSelectedWhoseProject(e.target.value))}>
              {availableWhoseProjects.map(wp => <option key={wp} value={wp}>{wp}</option>)}
            </select>
          </div>

          <div className="filter-box">
            <label>Due Status: </label>
            <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
              <option value="All">All Projects</option>
              <option value="WithDue">With Due Only</option>
              <option value="NoDue">Paid / No Due</option>
            </select>
          </div>

          <button className="btn btn-save" onClick={handleSaveToFirebase} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save'}
          </button>
        </div>
      </div>

      {/* UPCOMING SERVICING SCHEDULE ALERT */}
      <div className="summary-card" style={{ marginBottom: '20px', backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
        <h4 style={{ color: '#d48806', marginBottom: '10px' }}>
          🔔 Upcoming Servicing Schedule (আগামী 5 দিনের সার্ভিসিং তালিকা)
        </h4>
        <div className="table-wrapper">
          <table className="project-table" style={{ backgroundColor: '#fff' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff1b8' }}>
                <th>Sl</th>
                <th>Project Name</th>
                <th>Lift Qty</th>
                <th>Phone No</th>
                <th>Last Servicing Date</th>
                <th>Next Servicing Date</th>
                <th>Status / Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSchedules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center" style={{ color: '#888' }}>
                    আগামী 5 দিনের মধ্যে কোনো সার্ভিসিং শিডিউল নেই।
                  </td>
                </tr>
              ) : (
                upcomingSchedules.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="text-center">{index + 1}</td>
                    <td> 
                      <NavLink style={{color:"#096dd9", fontSize:"14px", fontWeight: "bold"}} to={`/Projects/project-details/${item.id}`}>
                        {item.projectName}  
                      </NavLink> 
                    </td>
                    <td className="text-center">{item.liftQty || 1}</td>
                    <td className="text-center">{item.phoneNo || '-'}</td>
                    <td className="text-center">{item.lastServiceDayDate}</td>
                    <td className="text-center"><strong>{item.nextServicingDate}</strong></td>
                    <td className="text-center bold">
                      {item.daysRemaining === 0 ? (
                        <span style={{ color: '#cf1322' }}>আজকেই সার্ভিসের দিন!</span>
                      ) : item.daysRemaining > 0 ? (
                        <span style={{ color: '#d48806' }}>{item.daysRemaining} দিন বাকি</span>
                      ) : (
                        <span style={{ color: '#ff4d4f' }}>{Math.abs(item.daysRemaining)} দিন পার হয়ে গেছে</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button className="btn-edit" onClick={() => handleEdit(item)}>Update</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-container">
        {/* PROJECT OVERVIEW CARD */}
        <div className="summary-card status-card">
          <div className="card-header">
            <div className="icon-wrapper status-icon">🏢</div>
            <div>
              <h3>Project Overview</h3>
              <p className="card-subtitle">{targetMonthForSummary} মাসের সার্ভিসিং স্ট্যাটাস</p>
            </div>
          </div>

          <div className="status-grid">
            <div className="status-box total">
              <span className="status-label">Database Total Projects</span>
              <span className="status-value">{statusSummary.total}</span>
            </div>
            <div className="status-box completed">
              <span className="status-label">Completed ({targetMonthForSummary})</span>
              <span className="status-value">{statusSummary.completed}</span>
            </div>
            <div className="status-box pending">
              <span className="status-label">Pending / Incomplete ({targetMonthForSummary})</span>
              <span className="status-value">{statusSummary.incomplete}</span>
            </div>
          </div>
        </div>

        <div className="summary-card collector-card">
          <div className="card-header">
            <div className="icon-wrapper collector-icon">📊</div>
            <div>
              <h3>Collector Summary</h3>
              <p className="card-subtitle">সংগ্রহ ও অনুমোদনের হিসাব</p>
            </div>
          </div>

          <div className="collector-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Collector Name</th>
                  <th className="text-center">Collected</th>
                  <th className="text-center">Approved</th>
                  <th className="text-center">Balance</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(collectorDetailedSummary).length === 0 ? (
                  <tr><td colSpan="4" className="empty-text">No data available</td></tr>
                ) : (
                  Object.entries(collectorDetailedSummary).map(([collector, data]) => {
                    const difference = data.collected - data.approved;
                    return (
                      <tr key={collector}>
                        <td>
                          <span className="user-badge collector-badge">{collector}</span>
                        </td>
                        <td className="text-center font-medium">{data.collected.toLocaleString()} Tk</td>
                        <td className="text-center font-medium text-success">{data.approved.toLocaleString()} Tk</td>
                        <td className="text-center">
                          <span className={`status-pill ${difference > 0 ? 'pill-danger' : 'pill-success'}`}>
                            {Math.abs(difference).toLocaleString()} Tk
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="summary-card approver-card">
          <div className="card-header">
            <div className="icon-wrapper approver-icon">✅</div>
            <div>
              <h3>Approver Summary</h3>
              <p className="card-subtitle">অনুমোদিত মোট টাকার পরিমাণ</p>
            </div>
          </div>

          <div className="collector-table-wrapper">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Approver Name</th>
                  <th className="text-center">Total Approved Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(approverDetailedSummary).length === 0 ? (
                  <tr><td colSpan="2" className="empty-text">No approved collections found</td></tr>
                ) : (
                  Object.entries(approverDetailedSummary).map(([approver, amount]) => (
                    <tr key={approver}>
                      <td>
                        <span className="user-badge approver-badge">{approver}</span>
                      </td>
                      <td className="text-center">
                        <span className="amount-highlight">{amount.toLocaleString()} Tk</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th>Project Name</th>
              <th>Whose</th>
              <th>Lift Qty</th>
              <th>Address</th>
              <th>Phone No</th>
              <th>Last Servicing Date</th>
              <th>Servicing Status</th>
              <th>Servicing Bill</th>
              <th>Spare Parts</th>
              <th>Last Due</th>
              <th>Total Bill</th>
              <th>Collected</th>
              <th>Customer Due (গ্রাহকের বকেয়া)</th>
              <th>Collected By</th>
              <th>Approved By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr><td colSpan="17" className="text-center">No projects found.</td></tr>
            ) : (
              filteredProjects.map((proj, idx) => {
                const targetMonth = selectedMonth === 'All' ? monthsList[new Date().getMonth() + 1] : selectedMonth;
                const bill = (proj.billList || []).find(b => b.month === targetMonth) || {};

                const servicingBill = Number(bill.servicingBill) || 0;
                const sparePartsBill = Number(bill.sparePartsBill) || 0;
                const lastMonthDue = Number(bill.lastMonthDue) || 0;
                const totalBill = servicingBill + sparePartsBill + lastMonthDue;
                const collectedBill = Number(bill.collectedBill) || 0;
                const totalDue = totalBill - collectedBill;

                const servicingDateDisplay = getLastServicingDateFromProj(proj, targetMonth) || '-';
                const currentStatus = bill.servicingStatus || 'Pending';

                return (
                  <tr key={proj.id || idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <NavLink style={{color:"#096dd9", fontWeight: "bold" , fontSize:"14px"}} to={`/Projects/project-details/${proj.id}`}>
                        {proj.projectName}
                      </NavLink>
                    </td>
                    <td className="text-center">{proj.whoseProjects || '-'}</td>
                    <td className="text-center">{proj.liftQty}</td>
                    <td>{proj.address || '-'}</td>
                    <td className="text-center">{proj.phoneNo || '-'}</td>
                    <td className="text-center">{servicingDateDisplay}</td>
                    <td className="text-center">
                      <span className={`status-badge ${currentStatus.toLowerCase() === 'complete' ? 'badge-complete' : 'badge-pending'}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="text-center">{servicingBill.toLocaleString()}</td>
                    <td className="text-center">{sparePartsBill.toLocaleString()}</td>
                    <td className="text-center">{lastMonthDue.toLocaleString()}</td>
                    <td className="text-center bold">{totalBill.toLocaleString()}</td>
                    <td className="text-center">{collectedBill.toLocaleString()}</td>
                    <td className="text-center bold text-danger">{totalDue.toLocaleString()}</td>
                    <td className="text-center">{bill.collectedBy || '-'}</td>
                    <td className="text-center">{bill.approvedBy || '-'}</td>
                    <td className="text-center action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(proj)}>Edit Info</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {filteredProjects.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan="8" className="text-center">Total:</td>
                <td className="text-center">{totals.servicingBill.toLocaleString()}</td>
                <td className="text-center">{totals.sparePartsBill.toLocaleString()}</td>
                <td className="text-center">{totals.lastMonthDue.toLocaleString()}</td>
                <td className="text-center">{totals.totalBill.toLocaleString()}</td>
                <td className="text-center">{totals.collectedBill.toLocaleString()}</td>
                <td className="text-center text-danger">{totals.totalDue.toLocaleString()}</td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Info ({formData.projectName})</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-field">
                  <label>Last Servicing Date:</label>
                  <input 
                    type="date" 
                    name="lastServicingDate" 
                    value={formData.lastServicingDate} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="input-field">
                  <label>Servicing Status:</label>
                  <select 
                    name="servicingStatus" 
                    value={formData.servicingStatus} 
                    onChange={handleInputChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Collected Bill Amount :</label>
                  <input 
                    type="number" 
                    name="collectedBill" 
                    placeholder="Collected Bill" 
                    value={formData.collectedBill} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div className="input-field">
                  <label>Collected By:</label>
                  <input 
                    type="text" 
                    name="collectedBy" 
                    placeholder="Collected By" 
                    value={formData.collectedBy} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-save">Update Info</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Serviced_and_Schedule;