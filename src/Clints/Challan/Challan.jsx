/* eslint-disable react-hooks/set-state-in-effect */
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import footer from "../../assets/Footer.png";
import header from "../../assets/header.png";

import {
  clearOffersList,
  createCustomChallan,
  fetchAllCompanies,
  fetchOffersByCompany,
  fetchSpecificOfferForChallan,
  resetChallan // <-- ১. ইম্পোর্ট করা হলো
} from '../../Fetures/Inventory/ChallanSlice';
import './Challan.css';

const Challan = () => {
  const challanRef = useRef(null);
  const dispatch = useDispatch();

  const { 
    companiesList, 
    offersList, 
    challanData, 
    loadingCompanies, 
    loadingOffers, 
    loadingChallan, 
    error 
  } = useSelector((state) => state.challan);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);

  const [editableHeader, setEditableHeader] = useState({
    toCompany: '',
    address: '',
    subject: ''
  });
  const [editableItems, setEditableItems] = useState([]);

  useEffect(() => {
    dispatch(fetchAllCompanies());
  }, [dispatch]);

  useEffect(() => {
    if (challanData) {
      setEditableHeader({
        toCompany: challanData.toCompany || '',
        address: challanData.address || '',
        subject: challanData.subject || ''
      });
      setEditableItems(challanData.items || []);
    }
  }, [challanData]);

  const handleCompanyChange = (e) => {
    const companyDocId = e.target.value;
    setSelectedCompany(companyDocId);
    setSelectedOfferId('');
    setEditableItems([]);
    
    if (companyDocId) {
      dispatch(fetchOffersByCompany(companyDocId));
    } else {
      dispatch(clearOffersList());
    }
  };

  const handleOfferChange = (e) => {
    const offerId = e.target.value;
    setSelectedOfferId(offerId);

    if (selectedCompany && offerId) {
      dispatch(fetchSpecificOfferForChallan({ companyDocId: selectedCompany, offerId }));
    }
  };

  const handleCreateRandomChallan = () => {
    setSelectedCompany('');
    setSelectedOfferId('');
    dispatch(createCustomChallan());
  };

  // ২. [নতুন] রিকুয়েস্ট রিসেট করার ফাংশন
  const handleReset = () => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setEditableHeader({ toCompany: '', address: '', subject: '' });
    setEditableItems([]);
    dispatch(resetChallan());
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedItems = editableItems.filter((_, index) => index !== indexToRemove);
    setEditableItems(updatedItems);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = editableItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setEditableItems(updatedItems);
  };

  const handleAddItem = () => {
    setEditableItems([...editableItems, { name: '', quantity: 1, unit: 'Pcs' }]);
  };

  const handleHeaderChange = (field, value) => {
    setEditableHeader(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadPDF = () => {
    if (!challanData) return;

    setIsPdfPrinting(true);

    setTimeout(() => {
      const element = challanRef.current;
      
      const options = {
        margin:       0,
        filename:     `Delivery_Challan_${challanData.challanNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          scrollX: 0, 
          scrollY: 0 
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(element).save().then(() => {
        setIsPdfPrinting(false);
      });
    }, 150);
  };

  return (
    <div className="main-wrapper">
      
      {/* ১. ড্রপডাউন, র‍্যান্ডম ক্রিয়েট, রিসেট ও ডাউনলোড কন্ট্রোল বক্স */}
      <div className="challan-search-card no-print">
        <div className="dropdown-filter-group">
          
          {/* Company Dropdown */}
          <div className="select-box">
            <label className="select-label">1. Select Company Name:</label>
            <select 
              value={selectedCompany} 
              onChange={handleCompanyChange} 
              className="select-dropdown"
              disabled={loadingCompanies}
            >
              <option value="">
                {loadingCompanies ? "Loading Companies..." : "-- Choose Company --"}
              </option>
              {companiesList.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Offer ID Dropdown */}
          <div className="select-box">
            <label className="select-label">2. Select Offer ID:</label>
            <select 
              value={selectedOfferId} 
              onChange={handleOfferChange} 
              className="select-dropdown"
              disabled={!selectedCompany || loadingOffers}
            >
              <option value="">
                {loadingOffers ? "Loading Offers..." : "-- Choose Offer ID --"}
              </option>
              {offersList.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.id} ({offer.date})
                </option>
              ))}
            </select>
          </div>

          {/* বাটনের গ্রুপ (Create Random & Reset) */}
          <div className="select-box" style={{ justifyContent: 'flex-end', gap: '8px' }}>
            <label className="select-label">Actions:</label>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                type="button" 
                className="btn-download-challan" 
                style={{ backgroundColor: '#28a745', marginTop: '0', flex: 1 }}
                onClick={handleCreateRandomChallan}
              >
                ➕ Create Blank
              </button>

              {/* [নতুন যোগ করা হয়েছে] Reset Button */}
              <button 
                type="button" 
                className="btn-download-challan" 
                style={{ backgroundColor: '#dc3545', marginTop: '0', flex: 1 }}
                onClick={handleReset}
              >
                🔄 Reset
              </button>
            </div>
          </div>

        </div>

        {error && <p className="error-text">{error}</p>}

        {challanData && (
          <div className="download-box" style={{ marginTop: '15px' }}>
            <button className="btn-download-challan" onClick={handleDownloadPDF}>
              📥 Download Delivery Challan (PDF)
            </button>
          </div>
        )}
      </div>

      {/* ২. চালানের বডি */}
      {loadingChallan ? (
        <div className="no-data-placeholder">Generating Delivery Challan...</div>
      ) : challanData ? (
        <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={challanRef}>
          
          <div className="challan-content-wrap">
            
            {/* Header */}
            <div className="company-header">
              <div className="logo-box">
                <img src={header} alt="Company Logo" className="logo-img" />
              </div>
              
            </div>

            <div className="document-type">DELIVERY CHALLAN</div>

            {/* Info Section */}
            <div className="info-section">
              <div className="meta-info-grid">
                <div><strong>Challan No: </strong>{challanData.challanNo}</div>
                <div><strong>Date: </strong>{challanData.date}</div>
              </div>

              <div className="to-address">
                <p className="no-margin"><strong>To,</strong></p>
                {isPdfPrinting ? (
                  <>
                    <div className="bold">{editableHeader.toCompany}</div>
                    <div>{editableHeader.address}</div>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      className="table-input bold"
                      style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}
                      value={editableHeader.toCompany}
                      placeholder="Company / Client Name"
                      onChange={(e) => handleHeaderChange('toCompany', e.target.value)}
                    />
                    <input
                      type="text"
                      className="table-input"
                      value={editableHeader.address}
                      placeholder="Company Address"
                      onChange={(e) => handleHeaderChange('address', e.target.value)}
                    />
                  </>
                )}
              </div>

              <div className="subject-line challan-subject">
                <strong>Sub: </strong>
                {isPdfPrinting ? (
                  <span className="bold">{editableHeader.subject}</span>
                ) : (
                  <input
                    type="text"
                    className="table-input bold"
                    value={editableHeader.subject}
                    placeholder="Subject..."
                    onChange={(e) => handleHeaderChange('subject', e.target.value)}
                  />
                )}
              </div>

              <div className="salutation challan-salutation">
                Dear Sir,<br />
                Please receive the following goods/materials in good condition:
              </div>
            </div>

            {/* Table */}
            <table className="invoice-table challan-table-wrapper">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>S.l No.</th>
                  <th style={{ width: '55%' }}>Items Description</th>
                  <th style={{ width: '12%' }}>Qty</th>
                  <th style={{ width: '13%' }}>Unit</th>
                  {!isPdfPrinting && <th className="no-print" style={{ width: '12%' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {editableItems.length > 0 ? (
                  editableItems.map((item, index) => (
                    <tr key={index} className="page-break-avoid">
                      <td className="text-center">{index + 1}</td>
                      <td>
                        {isPdfPrinting ? (
                          item.name
                        ) : (
                          <input
                            type="text"
                            className="table-input"
                            value={item.name}
                            placeholder="Item description..."
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="text-center">
                        {isPdfPrinting ? (
                          item.quantity
                        ) : (
                          <input
                            type="number"
                            className="table-input text-center"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="text-center">
                        {isPdfPrinting ? (
                          item.unit
                        ) : (
                          <input
                            type="text"
                            className="table-input text-center"
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          />
                        )}
                      </td>
                      {!isPdfPrinting && (
                        <td className="text-center no-print">
                          <button
                            type="button"
                            className="btn-delete-item"
                            onClick={() => handleRemoveItem(index)}
                          >
                            ✖ Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isPdfPrinting ? "4" : "5"} className="text-center" style={{ color: 'red', padding: '15px' }}>
                      No items selected for this Challan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {!isPdfPrinting && (
              <div className="no-print" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ➕ Add Item
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="page-break-avoid footer-section-wrap">
            <div className="invoice-footer">
              <div className="footer-left">
                <div className="signature-title">
                  <p><strong>Prepared By / Authorized Signature</strong></p>
                </div>
              </div>
              <div className="footer-center">
                <div className="signature-title">
                  <p><strong>Receiver's Signature & Seal</strong></p>
                </div>
              </div>
            </div>

            <div className="bottom-contact">
              <img src={footer} alt="footer" style={{width:"100%"}}/>
            </div>
          </div>

        </div>
      ) : (
        <div className="no-data-placeholder">
          <p>Please select a <strong>Company Name</strong> and an <strong>Offer ID</strong> from above, or click <strong>"Create Blank"</strong> to write manually.</p>
        </div>
      )}
    </div>
  );
};

export default Challan;