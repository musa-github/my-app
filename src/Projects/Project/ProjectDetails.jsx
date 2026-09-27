import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import { auth, db } from '../../Firebase/Firebase';

import {
  addOrUpdateBill,
  deleteBillFromFirebase,
  deleteMonthBill,
  saveBillToFirebase
} from '../../Fetures/Inventory/ProjectsSlice';

import './ProjectDetails.css';

const OWNER_EMAIL = "osanlift@gmail.com";

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const projects = useSelector((state) => state.project?.projects || state.projectDetails?.projects || []);
  const project = projects.find((p) => String(p.id) === String(id));

  const [showBillModal, setShowBillModal] = useState(false);
  const [adminList, setAdminList] = useState([]);

  // Logged-in User Info and Role Verification
  const reduxUserEmail = useSelector((state) => state.auth?.user?.email);
  const reduxUserRole = useSelector((state) => state.auth?.user?.role);
  
  const currentUserEmail = (
    reduxUserEmail ||
    auth.currentUser?.email ||
    ""
  ).toLowerCase().trim();

  // Fetch Admin Emails from Firebase
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminSnap = await getDocs(collection(db, "app_admins"));
        const admins = [OWNER_EMAIL];
        adminSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.email) {
            admins.push(data.email.toLowerCase().trim());
          }
        });
        setAdminList(admins);
      } catch (err) {
        console.error("Error fetching admin list:", err);
      }
    };
    fetchAdmins();
  }, []);

  // Strict Check: User is Owner or Admin
  const normalizedRole = String(reduxUserRole || "").toLowerCase().trim();
  const isAdminOrOwner =
    currentUserEmail === OWNER_EMAIL ||
    adminList.includes(currentUserEmail) ||
    normalizedRole === "admin" ||
    normalizedRole === "owner";

  const [billForm, setBillForm] = useState({
    month: 'January',
    servicingBill: '',
    sparePartsBill: '',
    lastMonthDue: '',
    collectedBill: '',
    collectedBy: '',
    approvedBy: '',
    servicedBy: '',
    lastServicingDate: '',
    servicingStatus: 'Pending'
  });

  if (!project) {
    return (
      <div className="details-container">
        <div className="not-found-card">
          <h2>Project Not Found</h2>
          <p>Project ID: <strong>{id}</strong></p>
          <button className="btn btn-back" onClick={() => navigate(-1)}>
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const billList = project.billList || [];

  const handleOpenMakeBill = (existingBill = null) => {
    if (existingBill) {
      setBillForm({ 
        ...existingBill,
        servicingStatus: existingBill.servicingStatus || 'Pending' 
      });
    } else {
      setBillForm({
        month: 'January',
        servicingBill: '',
        sparePartsBill: '',
        lastMonthDue: '',
        collectedBill: '',
        collectedBy: '',
        approvedBy: '',
        servicedBy: '',
        lastServicingDate: '',
        servicingStatus: 'Pending'
      });
    }
    setShowBillModal(true);
  };

  const handleBillInputChange = (e) => {
    setBillForm({ ...billForm, [e.target.name]: e.target.value });
  };

  const handleDeleteBill = (month) => {
    if (window.confirm(`Are you sure you want to delete the bill for ${month}?`)) {
      dispatch(deleteMonthBill({ projectId: project.id, month }));
      dispatch(deleteBillFromFirebase({ projectId: project.id, month }));
    }
  };

  const handleBillSubmit = (e) => {
    e.preventDefault();

    // Protection logic: Admin/Owner chara dynamic field tampering prevent kora
    const updatedForm = {
      ...billForm,
      approvedBy: isAdminOrOwner ? billForm.approvedBy : (billForm.approvedBy || 'Pending Admin Approval')
    };

    dispatch(addOrUpdateBill({ projectId: project.id, billData: updatedForm }));
    dispatch(saveBillToFirebase({ projectId: project.id, billData: updatedForm }));
    setShowBillModal(false);
  };

  const handleGenerateBill = (bill) => {
    navigate('/service-bill', {
      state: {
        projectInfo: {
          id: project.id,
          projectName: project.projectName,
          address: project.address,
          phoneNo: project.phoneNo,
          whoseProjects: project.whoseProjects
        },
        billInfo: bill
      }
    });
  };

  return (
    <div className="details-container">
      {/* Header Banner Section */}
      <div className="details-header">
        <div className="header-info">
          <h2>{project.projectName}</h2>
          <div className="meta-badges">
            <span className="meta-item"><strong>Client:</strong> {project.whoseProjects || 'N/A'}</span>
            <span className="meta-divider">•</span>
            <span className="meta-item"><strong>Address:</strong> {project.address || 'N/A'}</span>
            <span className="meta-divider">•</span>
            <span className="meta-item"><strong>Phone:</strong> {project.phoneNo || 'N/A'}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-make-bill" onClick={() => handleOpenMakeBill()}>
            <span>＋</span> Create Bill
          </button>
          <button className="btn btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>

      {/* Main Billing Table */}
      <div className="table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Date</th>
              <th>Status</th>
              <th>Servicing</th>
              <th>Spare Parts</th>
              <th>Last Due</th>
              <th>Total Bill</th>
              <th>Collected</th>
              <th>Due</th>
              <th>Collected By</th>
              <th>Approved By</th>
              <th>Serviced By</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {billList.length === 0 ? (
              <tr>
                <td colSpan="13" className="no-data">
                  No monthly bills created for this project yet.
                </td>
              </tr>
            ) : (
              billList.map((bill, index) => {
                const sBill = Number(bill.servicingBill) || 0;
                const pBill = Number(bill.sparePartsBill) || 0;
                const lDue = Number(bill.lastMonthDue) || 0;
                const tBill = sBill + pBill + lDue;
                const cBill = Number(bill.collectedBill) || 0;
                const due = tBill - cBill;
                const status = bill.servicingStatus || 'Pending';

                return (
                  <tr key={index}>
                    <td className="font-bold month-col">{bill.month}</td>
                    <td>{bill.lastServicingDate || bill.servicingDate || '-'}</td>
                    <td>
                      <span className={`status-badge ${status.toLowerCase() === 'complete' ? 'badge-complete' : 'badge-pending'}`}>
                        {status}
                      </span>
                    </td>
                    <td>৳ {sBill.toLocaleString('en-IN')}</td>
                    <td>৳ {pBill.toLocaleString('en-IN')}</td>
                    <td>৳ {lDue.toLocaleString('en-IN')}</td>
                    <td className="font-bold">৳ {tBill.toLocaleString('en-IN')}</td>
                    <td className="text-success font-bold">৳ {cBill.toLocaleString('en-IN')}</td>
                    <td className={due > 0 ? 'text-danger font-bold' : ''}>৳ {due.toLocaleString('en-IN')}</td>
                    <td>{bill.collectedBy || '-'}</td>
                    <td>{bill.approvedBy || '-'}</td>
                    <td>{bill.servicedBy || '-'}</td>
                    <td className="action-buttons">
                      <button className="btn-action btn-print" title="Generate Bill" onClick={() => handleGenerateBill(bill)}>
                        📄 Bill
                      </button>
                      <button className="btn-action btn-edit" title="Edit Bill" onClick={() => handleOpenMakeBill(bill)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-action btn-delete" title="Delete Bill" onClick={() => handleDeleteBill(bill.month)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal Overlay */}
      {showBillModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Monthly Bill Setup</h3>
              <button className="close-btn" onClick={() => setShowBillModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleBillSubmit}>
              <div className="form-grid">
                <div className="input-field">
                  <label>Select Month</label>
                  <select name="month" value={billForm.month} onChange={handleBillInputChange}>
                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                
                <div className="input-field">
                  <label>Servicing Date</label>
                  <input type="date" name="lastServicingDate" value={billForm.lastServicingDate} onChange={handleBillInputChange} />
                </div>
                
                <div className="input-field">
                  <label>Servicing Status</label>
                  <select name="servicingStatus" value={billForm.servicingStatus} onChange={handleBillInputChange}>
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                <div className="input-field">
                  <label>Servicing Bill (৳)</label>
                  <input type="number" placeholder="0.00" name="servicingBill" value={billForm.servicingBill} onChange={handleBillInputChange} />
                </div>

                <div className="input-field">
                  <label>Spare Parts Bill (৳)</label>
                  <input type="number" placeholder="0.00" name="sparePartsBill" value={billForm.sparePartsBill} onChange={handleBillInputChange} />
                </div>

                <div className="input-field">
                  <label>Last Month Due (৳)</label>
                  <input type="number" placeholder="0.00" name="lastMonthDue" value={billForm.lastMonthDue} onChange={handleBillInputChange} />
                </div>

                <div className="input-field">
                  <label>Collected Amount (৳)</label>
                  <input type="number" placeholder="0.00" name="collectedBill" value={billForm.collectedBill} onChange={handleBillInputChange} />
                </div>

                <div className="input-field">
                  <label>Collected By</label>
                  <input type="text" placeholder="Name" name="collectedBy" value={billForm.collectedBy} onChange={handleBillInputChange} />
                </div>

                {/* Restricted Input: Only Admin / Owner can edit */}
                <div className="input-field">
                  <label>
                    Approved By {!isAdminOrOwner && <small style={{ color: '#d9534f' }}>(Admin/Owner Only)</small>}
                  </label>
                  <input 
                    type="text" 
                    placeholder={isAdminOrOwner ? "Approver Name" : "Only Admin/Owner can approve"} 
                    name="approvedBy" 
                    value={billForm.approvedBy} 
                    onChange={handleBillInputChange}
                    disabled={!isAdminOrOwner}
                    style={{
                      backgroundColor: !isAdminOrOwner ? "#f2f2f2" : "#fff",
                      cursor: !isAdminOrOwner ? "not-allowed" : "text"
                    }}
                  />
                </div>

                <div className="input-field">
                  <label>Serviced By</label>
                  <input type="text" placeholder="Technician Name" name="servicedBy" value={billForm.servicedBy} onChange={handleBillInputChange} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowBillModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-save">Save & Sync</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;