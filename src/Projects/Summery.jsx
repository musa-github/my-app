import { doc, getDoc } from 'firebase/firestore';
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
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
import { auth, db } from '../Firebase/Firebase';
import './Summery.css';

const monthsList = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const OWNER_EMAIL = "osanlift@gmail.com";

const Summery = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  
  // Current month বের করা (যেমন: October)
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  const { 
    projects = [], 
    selectedMonth, 
    selectedWhoseProject = 'All', 
    loading = false 
  } = useSelector((state) => state.project || {});

  // প্রথম লোড বা মাউন্ট হওয়ার সময় ফিল্টার মাস হিসেবে বর্তমান মাস সেট করা
  useEffect(() => {
    if (!selectedMonth || selectedMonth === 'All') {
      dispatch(setSelectedMonth(currentMonthName));
    }
  }, [dispatch, selectedMonth, currentMonthName]);

  const activeSelectedMonth = selectedMonth || currentMonthName;

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dueFilter, setDueFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);

  const tableRef = useRef(null);

  // Permission & Admin States
  const [permissions, setPermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  const currentUserEmail = (user?.email || auth.currentUser?.email || "").toLowerCase().trim();

  // Fetch Permissions & Admin List from Firebase
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!currentUserEmail) {
        setPermissions({});
        setIsAdmin(false);
        return;
      }

      try {
        const cleanEmail = currentUserEmail.replace(/[^a-zA-Z0-9]/g, "_");

        // Admin status check (Owner email or exists in app_admins)
        const adminDoc = await getDoc(doc(db, "app_admins", cleanEmail));
        const adminAccess = currentUserEmail === OWNER_EMAIL || adminDoc.exists();
        setIsAdmin(adminAccess);

        // User permissions check
        const permDoc = await getDoc(doc(db, "user_permissions", cleanEmail));
        if (permDoc.exists()) {
          setPermissions(permDoc.data());
        } else {
          setPermissions({});
        }
      } catch (error) {
        console.error("Error fetching permissions in Summery:", error);
      }
    };

    fetchPermissions();
  }, [currentUserEmail]);

  // Flexible Permission Checker Helper Function (Owner & Admins get full access)
  const hasPermission = (featureKey, fallbackKey = "") => {
    if (currentUserEmail === OWNER_EMAIL || isAdmin) return true; 
    if (permissions[featureKey]) return true;
    if (fallbackKey && permissions[fallbackKey]) return true;
    return false;
  };

  const initialFormState = {
    projectName: '',
    liftQty: '', 
    whoseProjects: '',
    servicingDate: '',
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
    if (!hasPermission('projects_action_add', 'canAddProjects')) {
      alert("You don't have permission to add new projects.");
      return;
    }
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleEdit = (proj) => {
    if (!hasPermission('projects_action_edit', 'canEditProjects')) {
      alert("You don't have permission to edit projects.");
      return;
    }
    setEditingId(proj.id);
    const activeMonth = activeSelectedMonth === 'All' ? currentMonthName : activeSelectedMonth;
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

    let calculatedMonth = activeSelectedMonth !== 'All' ? activeSelectedMonth : currentMonthName;
    if (formData.servicingDate) {
      const dateObj = new Date(formData.servicingDate);
      if (!isNaN(dateObj.getTime())) {
        calculatedMonth = dateObj.toLocaleString('en-US', { month: 'long' });
      }
    }

    const payload = {
      ...formData,
      month: calculatedMonth
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
    if (!hasPermission('projects_action_save', 'canSaveProjects')) {
      alert("You don't have permission to save projects to Firebase.");
      return;
    }
    dispatch(saveAllProjectsToFirebase())
      .unwrap()
      .then(() => alert('All projects saved to Firebase successfully!'))
      .catch((err) => alert('Save failed: ' + err));
  };

  const handleDelete = (id, name) => {
    if (!hasPermission('projects_action_delete', 'canDeleteProjects')) {
      alert("You don't have permission to delete projects.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete: ${name}?`)) {
      dispatch(deleteProjectFromFirebase(id));
    }
  };

  // PDF Download Handler Function
  const downloadSummaryPDF = () => {
    if (!tableRef || !tableRef.current) {
      console.error('Table element reference not found.');
      return;
    }

    setIsPdfPrinting(true);

    setTimeout(() => {
      const element = tableRef.current;
      const pdfOptions = {
        margin: [8, 8, 8, 8],
        filename: `Project_Summary_${activeSelectedMonth}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0, windowWidth: 1280 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      html2pdf()
        .set(pdfOptions)
        .from(element)
        .save()
        .then(() => {
          setIsPdfPrinting(false);
        })
        .catch((err) => {
          console.error('PDF Generation Error:', err);
          setIsPdfPrinting(false);
        });
    }, 150);
  };

  const availableWhoseProjects = ['All', ...new Set(projects.map(p => p.whoseProjects).filter(Boolean))];

  const filteredProjects = projects.filter((proj) => {
    const matchesWhose = selectedWhoseProject === 'All' || proj.whoseProjects === selectedWhoseProject;
    if (!matchesWhose) return false;

    // Search filter check
    const term = searchTerm.toLowerCase();
    const name = (proj.projectName || '').toLowerCase();
    if (term && !name.includes(term)) return false;

    const filteredBills = (proj.billList || []).filter(
      b => activeSelectedMonth === 'All' || b.month === activeSelectedMonth
    );
    if (activeSelectedMonth !== 'All' && filteredBills.length === 0) return false;

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
      b => activeSelectedMonth === 'All' || b.month === activeSelectedMonth
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
      b => activeSelectedMonth === 'All' || b.month === activeSelectedMonth
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
      b => activeSelectedMonth === 'All' || b.month === activeSelectedMonth
    );

    filteredBills.forEach(bill => {
      const amount = Number(bill.collectedBill) || 0;
      const approver = bill.approvedBy && bill.approvedBy.trim() && bill.approvedBy.trim() !== '-'
        ? bill.approvedBy.trim()
        : null;

      if (approver && amount > 0) {
        acc[approver] = (acc[approver] || 0) + amount;
      }
    });

    return acc;
  }, {});

  return (
    <div className="project-container">
      <style>{`
        ${isPdfPrinting ? `
          .project-container {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .table-wrapper {
            background-color: #ffffff !important;
            border: none !important;
            box-shadow: none !important;
          }
          .project-table th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px !important;
            font-size: 9px !important;
          }
          .project-table td {
            color: #000000 !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px !important;
            font-size: 9px !important;
          }
          .project-table tr:hover {
            background-color: transparent !important;
          }
          .total-row {
            background-color: #f8fafc !important;
            color: #000000 !important;
            font-weight: bold !important;
          }
          .total-row td {
            color: #000000 !important;
          }
          .text-danger {
            color: #dc2626 !important;
          }
          .hide-on-pdf {
            display: none !important;
          }
        ` : ''}
      `}</style>

      <div className="header-bar">
        <h2>Projects & Bills Accounts</h2>

        <div className="action-group">
          {/* Project Search Input */}
          <div className="filter-box">
            <input 
              type="text" 
              placeholder="🔍 Search project name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#1e293b',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          <div className="filter-box">
            <label>Filter Month:</label>
            <select value={activeSelectedMonth} onChange={(e) => dispatch(setSelectedMonth(e.target.value))}>
              {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="filter-box">
            <label>Whose Project:</label>
            <select value={selectedWhoseProject} onChange={(e) => dispatch(setSelectedWhoseProject(e.target.value))}>
              {availableWhoseProjects.map(wp => <option key={wp} value={wp}>{wp}</option>)}
            </select>
          </div>

          <div className="filter-box">
            <label>Due Status:</label>
            <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
              <option value="All">All Projects</option>
              <option value="WithDue">With Due Only</option>
              <option value="NoDue">Paid / No Due</option>
            </select>
          </div>

          {/* Download PDF Button */}
          <button className="btn btn-add" onClick={downloadSummaryPDF} disabled={isPdfPrinting}>
            {isPdfPrinting ? 'Generating PDF...' : '📄 Download PDF'}
          </button>

          {/* Add Project Button (Visible for Owner, Admins or permitted users) */}
          {hasPermission('projects_action_add', 'canAddProjects') && (
            <button className="btn btn-add" onClick={handleOpenAddModal}>+ Add New Project</button>
          )}

          {/* Save to Firebase Button (Visible for Owner, Admins or permitted users) */}
          {hasPermission('projects_action_save', 'canSaveProjects') && (
            <button className="btn btn-save" onClick={handleSaveToFirebase} disabled={loading}>
              {loading ? 'Saving...' : '💾 Save to Firebase'}
            </button>
          )}
        </div>
      </div>

      <div className="summary-cards-container">
        <div className="summary-card">
          <h4>💳 Received Amount Summary:</h4>
          <div className="summary-badge-group">
            {Object.keys(collectorSummary).length === 0 ? (
              <span className="no-summary-text">No collections found[cite: 7].</span>
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
              <span className="no-summary-text">No approvals found[cite: 7].</span>
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

      <div className="table-wrapper" ref={tableRef}>
        <div style={{ padding: isPdfPrinting ? '10px' : '0' }}>
          {isPdfPrinting && (
            <h3 style={{ textAlign: 'center', marginBottom: '12px', color: '#000000', fontSize: '14px', fontWeight: 'bold' }}>
              Project Summary Report - {activeSelectedMonth}
            </h3>
          )}
          <table className="project-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr>
                <th style={{ width: '4%' }} className="text-center">Sl</th>
                <th style={{ width: '15%' }}>Project Name</th>
                <th style={{ width: '7%' }} className="text-center">Whose</th>
                <th style={{ width: '6%' }} className="text-center">Lift Qty</th>
                <th style={{ width: '8%' }} className="text-center">Serv. Bill</th>
                <th style={{ width: '7%' }} className="text-center">Spare</th>
                <th style={{ width: '8%' }} className="text-center">Last Due</th>
                <th style={{ width: '8%' }} className="text-center">Total Bill</th>
                <th style={{ width: '8%' }} className="text-center">Collected</th>
                <th style={{ width: '8%' }} className="text-center">Total Due</th>
                <th style={{ width: '7%' }} className="text-center">Coll. By</th>
                <th style={{ width: '7%' }} className="text-center">Approve</th>
                <th style={{ width: '10%' }} className={`text-center ${isPdfPrinting ? 'hide-on-pdf' : ''}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="13" className="text-center" style={{ padding: '30px', color: '#64748b' }}>No projects found[cite: 7].</td></tr>
              ) : (
                filteredProjects.map((proj, idx) => {
                  const filteredBills = (proj.billList || []).filter(
                    b => activeSelectedMonth === 'All' || b.month === activeSelectedMonth
                  );

                  const bill = filteredBills[0] || {};
                  const servicingBill = Number(bill.servicingBill) || 0;
                  const sparePartsBill = Number(bill.sparePartsBill) || 0;
                  const lastMonthDue = Number(bill.lastMonthDue) || 0;
                  const totalBill = servicingBill + sparePartsBill + lastMonthDue;
                  const collectedBill = Number(bill.collectedBill) || 0;
                  const totalDue = totalBill - collectedBill;

                  const canEdit = hasPermission('projects_action_edit', 'canEditProjects');
                  const canDelete = hasPermission('projects_action_delete', 'canDeleteProjects');

                  return (
                    <tr key={proj.id || idx}>
                      <td style={{ width: '4%' }} className="text-center">{idx + 1}</td>
                      <td style={{ width: '15%', wordBreak: 'break-word' }}><strong style={{ color: isPdfPrinting ? '#000000' : '#f8fafc' }}>{proj.projectName}</strong></td>
                      <td style={{ width: '7%' }} className="text-center">{proj.whoseProjects || '-'}</td>
                      <td style={{ width: '6%' }} className="text-center">{proj.liftQty}</td>
                      <td style={{ width: '8%' }} className="text-center">{servicingBill.toLocaleString()}</td>
                      <td style={{ width: '7%' }} className="text-center">{sparePartsBill.toLocaleString()}</td>
                      <td style={{ width: '8%' }} className="text-center">{lastMonthDue.toLocaleString()}</td>
                      <td style={{ width: '8%' }} className="text-center bold">{totalBill.toLocaleString()}</td>
                      <td style={{ width: '8%' }} className="text-center">{collectedBill.toLocaleString()}</td>
                      <td style={{ width: '8%' }} className="text-center bold text-danger">{totalDue.toLocaleString()}</td>
                      <td style={{ width: '7%' }} className="text-center">{bill.collectedBy || '-'}</td>
                      <td style={{ width: '7%' }} className="text-center">{bill.approvedBy || '-'}</td>
                      <td 
                        style={{ 
                          width: '10%', 
                          textAlign: 'center', 
                          padding: '6px 2px' 
                        }} 
                        className={`${isPdfPrinting ? 'hide-on-pdf' : ''}`}
                      >
                        <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                          {canEdit && (
                            <button 
                              className="btn-edit" 
                              onClick={() => handleEdit(proj)}
                              style={{ padding: '3px 7px', fontSize: '11px', whiteSpace: 'nowrap' }}
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              className="btn-delete" 
                              onClick={() => handleDelete(proj.id, proj.projectName)}
                              style={{ padding: '3px 7px', fontSize: '11px', whiteSpace: 'nowrap' }}
                            >
                              Delete
                            </button>
                          )}
                          {!canEdit && !canDelete && (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Read Only[cite: 7]</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {filteredProjects.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan="4" className="text-center">Total:</td>
                  <td className="text-center">{totals.servicingBill.toLocaleString()}</td>
                  <td className="text-center">{totals.sparePartsBill.toLocaleString()}</td>
                  <td className="text-center">{totals.lastMonthDue.toLocaleString()}</td>
                  <td className="text-center">{totals.totalBill.toLocaleString()}</td>
                  <td className="text-center">{totals.collectedBill.toLocaleString()}</td>
                  <td className="text-center text-danger">{totals.totalDue.toLocaleString()}</td>
                  <td colSpan={isPdfPrinting ? "2" : "3"}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingId ? 'Edit Project' : 'Add New Project'}[cite: 7]</h3>
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
                  placeholder="Whose Project (Owner/Client)" 
                  value={formData.whoseProjects} 
                  onChange={handleInputChange} 
                />

                <div className="input-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', marginBottom: '4px', color: '#94a3b8' }}>Servicing Date / Month:</label>
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
                <button type="submit" className="btn btn-add">{editingId ? 'Update Project' : 'Add Project'}[cite: 7]</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel[cite: 7]</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summery;