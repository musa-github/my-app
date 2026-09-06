
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router';

import {
  addOrUpdateBill,
  deleteBillFromFirebase,
  deleteMonthBill,
  saveBillToFirebase
} from '../../Fetures/Inventory/ProjectsSlice';

import './ProjectDetails.css';

const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux Store থেকে Projects অ্যারে এক্সট্র্যাক্ট করা (Fallback সহ)
  const projects = useSelector((state) => state.project?.projects || state.projectDetails?.projects || []);
  
  // String এবং Number উভয় টাইপ মেলাতে Loose check বা String conversion ব্যবহার করা হলো
  const project = projects.find((p) => String(p.id) === String(id));

  const [showBillModal, setShowBillModal] = useState(false);

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
        <h2>Project Not Found</h2>
        <p>Project ID: {id}</p>
        <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
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
    dispatch(addOrUpdateBill({ projectId: project.id, billData: billForm }));
    dispatch(saveBillToFirebase({ projectId: project.id, billData: billForm }));
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
      <div className="details-header">
        <div>
          <h2>Project Details: {project.projectName}</h2>
          <p><strong>Whose Project:</strong> {project.whoseProjects || '-'} | <strong>Address:</strong> {project.address || '-'} | <strong>Phone:</strong> {project.phoneNo || '-'}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-make-bill" onClick={() => handleOpenMakeBill()}>➕ Make Bill</button>
          <button className="btn btn-back" onClick={() => navigate(-1)}>🔙 Back</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Servicing Date</th>
              <th>Status</th>
              <th>Servicing Bill</th>
              <th>Spare Parts</th>
              <th>Last Due</th>
              <th>Total Bill</th>
              <th>Collected</th>
              <th>Customer Due</th>
              <th>Collected By</th>
              <th>Approved By</th>
              <th>Serviced By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {billList.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center">No monthly bills created yet.</td>
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
                    <td className="text-center bold">{bill.month}</td>
                    <td className="text-center">{bill.lastServicingDate || bill.servicingDate || '-'}</td>
                    <td className="text-center">
                      <span className={`status-badge ${status.toLowerCase() === 'complete' ? 'badge-complete' : 'badge-pending'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="text-center">{sBill.toLocaleString()}</td>
                    <td className="text-center">{pBill.toLocaleString()}</td>
                    <td className="text-center">{lDue.toLocaleString()}</td>
                    <td className="text-center bold">{tBill.toLocaleString()}</td>
                    <td className="text-center">{cBill.toLocaleString()}</td>
                    <td className="text-center bold text-danger">{due.toLocaleString()}</td>
                    <td className="text-center">{bill.collectedBy || '-'}</td>
                    <td className="text-center">{bill.approvedBy || '-'}</td>
                    <td className="text-center">{bill.servicedBy || '-'}</td>
                    <td className="text-center action-buttons">
                      <button className="btn-print" onClick={() => handleGenerateBill(bill)}>📄 Generate Bill</button>
                      <button className="btn-edit" onClick={() => handleOpenMakeBill(bill)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDeleteBill(bill.month)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showBillModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Make / Update Monthly Bill</h3>
            <form onSubmit={handleBillSubmit}>
              <div className="form-grid">
                <div className="input-field">
                  <label>Select Month:</label>
                  <select name="month" value={billForm.month} onChange={handleBillInputChange}>
                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="input-field">
                  <label>Servicing Date:</label>
                  <input type="date" name="lastServicingDate" value={billForm.lastServicingDate} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Servicing Status:</label>
                  <select name="servicingStatus" value={billForm.servicingStatus} onChange={handleBillInputChange}>
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
                <div className="input-field">
                  <label>Servicing Bill:</label>
                  <input type="number" name="servicingBill" value={billForm.servicingBill} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Spare Parts Bill:</label>
                  <input type="number" name="sparePartsBill" value={billForm.sparePartsBill} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Last Month Due:</label>
                  <input type="number" name="lastMonthDue" value={billForm.lastMonthDue} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Collected Bill Amount:</label>
                  <input type="number" name="collectedBill" value={billForm.collectedBill} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Collected By:</label>
                  <input type="text" name="collectedBy" value={billForm.collectedBy} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Approved By:</label>
                  <input type="text" name="approvedBy" value={billForm.approvedBy} onChange={handleBillInputChange} />
                </div>
                <div className="input-field">
                  <label>Serviced By:</label>
                  <input type="text" name="servicedBy" value={billForm.servicedBy} onChange={handleBillInputChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-save">Save Bill</button>
                <button type="button" className="btn btn-cancel" onClick={() => setShowBillModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;