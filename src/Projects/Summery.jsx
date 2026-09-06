import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    addNewProjectLocal,
    deleteProjectFromFirebase,
    fetchProjects,
    saveAllProjectsToFirebase,
    setSelectedMonth,
    setSelectedWhoseProject,
    updateProjectLocal
} from '../Fetures/Inventory/ProjectsSlice';
import './Summery.css';

const monthsList = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Summery = () => {
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
    servicingDate: '', // Month ড্রপডাউনের পরিবর্তে Date ফিল্ড
    servicingBill: '',
    sparePartsBill: '',
    lastMonthDue: '',
    collectedBill: '',
    collectedBy: '',
    approvedBy: '',
    servicedBy: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleEdit = (proj) => {
    setEditingId(proj.id);
    const activeMonth = selectedMonth === 'All' ? 'August' : selectedMonth;
    const currentBill = (proj.billList || []).find(b => b.month === activeMonth) || {};

    setFormData({
      projectName: proj.projectName || '',
      liftQty: proj.liftQty || '',
      whoseProjects: proj.whoseProjects || '',
      servicingDate: currentBill.servicingDate || currentBill.lastServicingDate || proj.servicingDate || '',
      servicingBill: currentBill.servicingBill || '',
      sparePartsBill: currentBill.sparePartsBill || '',
      lastMonthDue: currentBill.lastMonthDue || '',
      collectedBill: currentBill.collectedBill || '',
      collectedBy: currentBill.collectedBy || '',
      approvedBy: currentBill.approvedBy || '',
      servicedBy: currentBill.servicedBy || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.projectName.trim()) {
      alert('Project Name is required!');
      return;
    }

    // তারিখ সিলেক্ট করা থাকলে সেখান থেকে মাসের নাম বের করা
    let calculatedMonth = selectedMonth !== 'All' ? selectedMonth : 'August';
    if (formData.servicingDate) {
      const dateObj = new Date(formData.servicingDate);
      if (!isNaN(dateObj.getTime())) {
        calculatedMonth = dateObj.toLocaleString('en-US', { month: 'long' });
      }
    }

    const payload = {
      ...formData,
      month: calculatedMonth // রিডক্সের জন্য মাসের নাম পাঠানো হচ্ছে
    };

    if (editingId) {
      dispatch(updateProjectLocal({ id: editingId, ...payload }));
    } else {
      dispatch(addNewProjectLocal(payload));
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

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete: ${name}?`)) {
      dispatch(deleteProjectFromFirebase(id));
    }
  };

  const availableWhoseProjects = ['All', ...new Set(projects.map(p => p.whoseProjects).filter(Boolean))];

  const filteredProjects = projects.filter((proj) => {
    const matchesWhose = selectedWhoseProject === 'All' || proj.whoseProjects === selectedWhoseProject;
    if (!matchesWhose) return false;

    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );
    if (selectedMonth !== 'All' && filteredBills.length === 0) return false;

    const bill = filteredBills[0] || {};
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

  const totals = filteredProjects.reduce((acc, proj) => {
    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );
    const bill = filteredBills[0] || {};

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

  const collectorSummary = filteredProjects.reduce((acc, proj) => {
    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );

    filteredBills.forEach(bill => {
      const amount = Number(bill.collectedBill) || 0;
      const collector = (bill.collectedBy && bill.collectedBy.trim()) ? bill.collectedBy.trim() : 'Unspecified';

      if (amount > 0) {
        acc[collector] = (acc[collector] || 0) + amount;
      }
    });

    return acc;
  }, {});

  const approverSummary = filteredProjects.reduce((acc, proj) => {
    const filteredBills = (proj.billList || []).filter(
      b => selectedMonth === 'All' || b.month === selectedMonth
    );

    filteredBills.forEach(bill => {
      const sBill = Number(bill.servicingBill) || 0;
      const pBill = Number(bill.sparePartsBill) || 0;
      const lDue = Number(bill.lastMonthDue) || 0;
      const totalApprovedAmount = sBill + pBill + lDue;

      const approver = (bill.approvedBy && bill.approvedBy.trim()) ? bill.approvedBy.trim() : 'Unapproved/Pending';

      if (totalApprovedAmount > 0) {
        acc[approver] = (acc[approver] || 0) + totalApprovedAmount;
      }
    });

    return acc;
  }, {});

  return (
    <div className="project-container">
      <div className="header-bar">
        <h2>Projects & Bills Accounts</h2>

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

          <button className="btn btn-add" onClick={handleOpenAddModal}>+ Add New Project</button>

          <button className="btn btn-save" onClick={handleSaveToFirebase} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save to Firebase'}
          </button>
        </div>
      </div>

      <div className="summary-cards-container">
        <div className="summary-card">
          <h4>💳 Received Amount Summary:</h4>
          <div className="summary-badge-group">
            {Object.keys(collectorSummary).length === 0 ? (
              <span className="no-summary-text">No collections found.</span>
            ) : (
              Object.entries(collectorSummary).map(([person, amount]) => (
                <div key={person} className="summary-badge collector-badge">
                  <span className="person-label">{person}: </span>
                  <strong className="collector-amount">{amount.toLocaleString()} Tk</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="summary-card">
          <h4>✅ Approved Amount Summary:</h4>
          <div className="summary-badge-group">
            {Object.keys(approverSummary).length === 0 ? (
              <span className="no-summary-text">No approvals found.</span>
            ) : (
              Object.entries(approverSummary).map(([person, amount]) => (
                <div key={person} className="summary-badge approver-badge">
                  <span className="person-label">{person}: </span>
                  <strong className="approver-amount">{amount.toLocaleString()} Tk</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Sl</th>
              <th>Project Name</th>
              <th>Whose</th>
              <th>Lift Qty</th>
              <th>Servicing Bill</th>
              <th>Spare Parts</th>
              <th>Last Due</th>
              <th>Total Bill</th>
              <th>Collected</th>
              <th>Total Due</th>
              <th>Collected By</th>
              <th>Approved By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr><td colSpan="13" className="text-center">No projects found.</td></tr>
            ) : (
              filteredProjects.map((proj, idx) => {
                const filteredBills = (proj.billList || []).filter(
                  b => selectedMonth === 'All' || b.month === selectedMonth
                );

                const bill = filteredBills[0] || {};
                const servicingBill = Number(bill.servicingBill) || 0;
                const sparePartsBill = Number(bill.sparePartsBill) || 0;
                const lastMonthDue = Number(bill.lastMonthDue) || 0;
                const totalBill = servicingBill + sparePartsBill + lastMonthDue;
                const collectedBill = Number(bill.collectedBill) || 0;
                const totalDue = totalBill - collectedBill;

                return (
                  <tr key={proj.id || idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td><strong>{proj.projectName}</strong></td>
                    <td className="text-center">{proj.whoseProjects || '-'}</td>
                    <td className="text-center">{proj.liftQty}</td>
                    <td className="text-right">{servicingBill.toLocaleString()}</td>
                    <td className="text-right">{sparePartsBill.toLocaleString()}</td>
                    <td className="text-right">{lastMonthDue.toLocaleString()}</td>
                    <td className="text-right bold">{totalBill.toLocaleString()}</td>
                    <td className="text-right">{collectedBill.toLocaleString()}</td>
                    <td className="text-right bold text-danger">{totalDue.toLocaleString()}</td>
                    <td className="text-center">{bill.collectedBy || '-'}</td>
                    <td className="text-center">{bill.approvedBy || '-'}</td>
                    <td className="text-center action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(proj)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(proj.id, proj.projectName)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {filteredProjects.length > 0 && (
            <tfoot>
              <tr className="total-row">
                <td colSpan="4" className="text-right">Total:</td>
                <td className="text-right">{totals.servicingBill.toLocaleString()}</td>
                <td className="text-right">{totals.sparePartsBill.toLocaleString()}</td>
                <td className="text-right">{totals.lastMonthDue.toLocaleString()}</td>
                <td className="text-right">{totals.totalBill.toLocaleString()}</td>
                <td className="text-right">{totals.collectedBill.toLocaleString()}</td>
                <td className="text-right text-danger">{totals.totalDue.toLocaleString()}</td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingId ? 'Edit Project' : 'Add New Project'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <input 
                  type="text" 
                  name="projectName" 
                  placeholder="Project Name *" 
                  value={formData.projectName} 
                  onChange={handleInputChange} 
                  required 
                />
                <input 
                  type="number" 
                  name="liftQty" 
                  placeholder="Lift Qty" 
                  value={formData.liftQty} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="text" 
                  name="whoseProjects" 
                  placeholder="Whose Project (e.g., HRE, MM)" 
                  value={formData.whoseProjects} 
                  onChange={handleInputChange} 
                />

                {/* Month ড্রপডাউনের জায়গায় Date Calender Input */}
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', marginBottom: '2px', color: '#555' }}>Servicing Date / Month:</label>
                  <input 
                    type="date" 
                    name="servicingDate" 
                    value={formData.servicingDate} 
                    onChange={handleInputChange} 
                  />
                </div>

                <input 
                  type="number" 
                  name="servicingBill" 
                  placeholder="Servicing Bill" 
                  value={formData.servicingBill} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="number" 
                  name="sparePartsBill" 
                  placeholder="Spare Parts Bill" 
                  value={formData.sparePartsBill} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="number" 
                  name="lastMonthDue" 
                  placeholder="Last Month Due" 
                  value={formData.lastMonthDue} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="number" 
                  name="collectedBill" 
                  placeholder="Collected Bill" 
                  value={formData.collectedBill} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="text" 
                  name="collectedBy" 
                  placeholder="Collected By" 
                  value={formData.collectedBy} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="text" 
                  name="approvedBy" 
                  placeholder="Approved By" 
                  value={formData.approvedBy} 
                  onChange={handleInputChange} 
                />
                <input 
                  type="text" 
                  name="servicedBy" 
                  placeholder="Serviced By" 
                  value={formData.servicedBy} 
                  onChange={handleInputChange} 
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-save">{editingId ? 'Update Project' : 'Add Project'}</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summery;