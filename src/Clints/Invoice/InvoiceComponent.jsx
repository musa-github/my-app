/* eslint-disable react-hooks/set-state-in-effect */
import html2pdf from 'html2pdf.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import logo from "../../assets/main-logo.png";
import { fetchAllCompanies, fetchOffersByCompany, fetchSpecificOfferFromDb } from '../../Fetures/Inventory/ChallanSlice';
import { deleteBillFromFirebase, resetInvoiceData, resetSaveStatus, saveBillToFirebase, updateBillInFirebase } from '../../Fetures/Inventory/InvoiceSlice';
import './InvoiceComponent.css';

const InvoiceComponent = () => {
  const invoiceRef = useRef(null);
  const dispatch = useDispatch();

  // Redux States
  const { companiesList, offersList, challanData, loadingCompanies, loadingOffers, loadingChallan } = useSelector((state) => state.challan);
  const { savingBill, updatingBill, deletingBill, saveSuccess, updateSuccess, deleteSuccess, savedBillIds: reduxSavedBillIds, error: invoiceError } = useSelector((state) => state.invoice);

  // Local States
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const [manualInvoice, setManualInvoice] = useState(null);

  // Existing document database IDs tracking
  const [existingBillIds, setExistingBillIds] = useState(null);

  // Paid Amount State
  const [paidAmount, setPaidAmount] = useState(0);

  // Header State
  const [editableHeader, setEditableHeader] = useState({
    invoiceNo: '',
    date: new Date().toLocaleDateString('en-GB'),
    toCompany: 'Client / Company Name',
    address: 'Address Details',
    subject: 'Bill / Invoice for Goods & Services'
  });

  // Dynamic Editable Data
  const [editableItems, setEditableItems] = useState([]);
  const [notes, setNotes] = useState([
    'This offer excludes VAT, Tax, and AIT.',
    'One-year warranty on all electrical equipment (excluding high voltage, earthquake, water damage).',
    'There is no warranty for the door motor.'
  ]);
  const [paymentMode, setPaymentMode] = useState({
    mode: 'Payment by cash.',
    advance: '80% advance.',
    handover: '20% handover date.'
  });

  // Load Companies List on Mount
  useEffect(() => {
    dispatch(fetchAllCompanies());
  }, [dispatch]);

  // Sync Data when challanData is fetched from Firebase
  useEffect(() => {
    if (challanData && !manualInvoice) {
      setEditableHeader({
        invoiceNo: challanData.offerNo || selectedOfferId || `INV-${Date.now().toString().slice(-6)}`,
        date: challanData.date || new Date().toLocaleDateString('en-GB'),
        toCompany: challanData.toCompany || challanData.headerData?.toCompany || '',
        address: challanData.address || challanData.headerData?.address || '',
        subject: challanData.subject || challanData.headerData?.subject || 'Bill / Invoice for Goods & Services'
      });

      const sourceItems = challanData.items || challanData.products || [];
      const formattedItems = sourceItems.map((item) => ({
        name: item.name || item.itemName || item.description || '',
        quantity: parseFloat(item.quantity || item.qty) || 1,
        unit: item.unit || 'Pcs',
        price: parseFloat(item.price ?? item.unitPrice ?? item.rate ?? item.amount) || 0
      }));
      setEditableItems(formattedItems);

      // Paid Amount sync
      setPaidAmount(parseFloat(challanData.paidAmount || challanData.receivedAmount) || 0);

      // Notes sync
      if (Array.isArray(challanData.notes) && challanData.notes.length > 0) {
        setNotes(challanData.notes);
      }

      // Payment mode sync
      if (challanData.paymentMode) {
        setPaymentMode(challanData.paymentMode);
      }

      // Track existing document IDs for Update/Delete
      if (challanData.isFromBill) {
        setExistingBillIds({
          billId: challanData.id || selectedOfferId,
          salesId: challanData.salesId || challanData.id || selectedOfferId
        });
      } else {
        setExistingBillIds(null);
      }
    }
  }, [challanData, manualInvoice, selectedOfferId]);

  // Combined Active IDs
  const activeBillIds = reduxSavedBillIds || existingBillIds;

  // Dropdown Handlers
  const handleCompanyChange = (e) => {
    const companyDocId = e.target.value;
    setSelectedCompany(companyDocId);
    setSelectedOfferId('');
    setManualInvoice(null);
    setEditableItems([]);
    setExistingBillIds(null);
    setPaidAmount(0);
    if (companyDocId) {
      dispatch(fetchOffersByCompany(companyDocId));
    }
  };

  const handleOfferChange = (e) => {
    const offerId = e.target.value;
    setSelectedOfferId(offerId);
    setManualInvoice(null);
    setExistingBillIds(null);
    if (selectedCompany && offerId) {
      dispatch(fetchSpecificOfferFromDb({ companyDocId: selectedCompany, offerId }));
    }
  };

  // Reset Invoice
  const handleReset = useCallback(() => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setManualInvoice(null);
    setExistingBillIds(null);
    setPaidAmount(0);
    setEditableItems([]);
    setEditableHeader({
      invoiceNo: '',
      date: new Date().toLocaleDateString('en-GB'),
      toCompany: '',
      address: '',
      subject: ''
    });
    dispatch(resetInvoiceData());
  }, [dispatch]);

  // Create Blank / Manual Invoice
  const handleCreateBlankInvoice = () => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setManualInvoice(true);
    setExistingBillIds(null);
    setPaidAmount(0);
    setEditableHeader({
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB'),
      toCompany: 'Client / Company Name',
      address: 'Address Details',
      subject: 'Bill / Invoice for Goods & Services'
    });
    setEditableItems([{ name: 'Sample Item Name', quantity: 1, unit: 'Pcs', price: 0 }]);
    dispatch(resetInvoiceData());
  };

  // Header Change Handler
  const handleHeaderChange = (field, value) => {
    setEditableHeader((prev) => ({ ...prev, [field]: value }));
  };

  // Table Handlers
  const handleItemChange = (index, field, value) => {
    const updated = [...editableItems];
    updated[index][field] = value;
    setEditableItems(updated);
  };
  const handleAddRow = () => setEditableItems([...editableItems, { name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
  const handleRemoveRow = (index) => setEditableItems(editableItems.filter((_, i) => i !== index));

  // Notes & Payment Handlers
  const handleNoteChange = (index, value) => {
    const updated = [...notes];
    updated[index] = value;
    setNotes(updated);
  };
  const handleAddNote = () => setNotes([...notes, 'New condition note...']);
  const handleRemoveNote = (index) => setNotes(notes.filter((_, i) => i !== index));
  const handlePaymentChange = (e) => setPaymentMode({ ...paymentMode, [e.target.name]: e.target.value });

  // Calculations
  const grandTotal = editableItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
    0
  );

  const currentPaid = parseFloat(paidAmount) || 0;
  const dueAmount = grandTotal - currentPaid;

  const numberToWords = (num) => {
    if (!num || num === 0) return 'Zero Taka Only';
    const [integerPart, decimalPart] = num.toFixed(2).split('.');
    return parseInt(decimalPart) > 0
      ? `${integerPart} Taka and ${decimalPart} Paisa Only`
      : `${integerPart} Taka Only`;
  };

  // Save Bill Handler (selectedOfferId যুক্ত করা হয়েছে)
  const handleSaveBill = () => {
    const targetCompanyId = selectedCompany || 'general_clients';
    const safePaid = Number(paidAmount) || 0;
    const safeGrandTotal = Number(grandTotal) || 0;
    const safeDue = safeGrandTotal - safePaid;

    const billPayload = {
      billNo: editableHeader.invoiceNo,
      offerId: selectedOfferId || 'MANUAL',
      companyName: editableHeader.toCompany,
      address: editableHeader.address,
      subject: editableHeader.subject,
      date: editableHeader.date,
      items: editableItems,
      grandTotal: safeGrandTotal,
      paidAmount: safePaid,
      dueAmount: safeDue,
      notes,
      paymentMode,
    };

    dispatch(saveBillToFirebase({ 
      companyDocId: targetCompanyId, 
      billData: billPayload,
      selectedOfferId: selectedOfferId // <--- Offer ID সঠিক ভাবে ডিসপ্যাচ করা হলো
    }));
  };

  // Update Bill Handler
  const handleUpdateBill = () => {
    if (!activeBillIds?.billId) {
      alert("ডকুমেন্ট আইডি পাওয়া যায়নি! অনুগ্রহ করে প্রথমে 'Save Bill' করুন।");
      return;
    }

    const targetCompanyId = selectedCompany || 'general_clients';
    const safePaid = Number(paidAmount) || 0;
    const safeGrandTotal = Number(grandTotal) || 0;
    const safeDue = safeGrandTotal - safePaid;

    const billPayload = {
      billNo: editableHeader.invoiceNo,
      offerId: selectedOfferId || 'MANUAL',
      companyName: editableHeader.toCompany,
      address: editableHeader.address,
      subject: editableHeader.subject,
      date: editableHeader.date,
      items: editableItems,
      grandTotal: safeGrandTotal,
      paidAmount: safePaid,
      dueAmount: safeDue,
      notes,
      paymentMode,
    };

    dispatch(updateBillInFirebase({
      companyDocId: targetCompanyId,
      billId: activeBillIds.billId,
      salesId: activeBillIds.salesId,
      billData: billPayload
    }));
  };

  // Delete Bill Handler
  const handleDeleteBill = () => {
    if (!activeBillIds) {
      alert("This bill hasn't been saved yet or can't be found in the database.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this bill from the database?")) {
      const targetCompanyId = selectedCompany || 'general_clients';
      dispatch(deleteBillFromFirebase({
        companyDocId: targetCompanyId,
        billId: activeBillIds.billId,
        salesId: activeBillIds.salesId
      }));
    }
  };

  // Notification Handler
  useEffect(() => {
    if (saveSuccess) {
      alert('Bill & Sales data successfully saved to Firebase!');
      dispatch(resetSaveStatus());
    } else if (updateSuccess) {
      alert('Bill successfully updated in Firebase!');
      dispatch(resetSaveStatus());
    } else if (deleteSuccess) {
      alert('Bill successfully deleted from Firebase!');
      dispatch(resetSaveStatus());
      handleReset();
    }
  }, [saveSuccess, updateSuccess, deleteSuccess, dispatch, handleReset]);

  // PDF Export
  const handleDownloadPDF = () => {
    setIsPdfPrinting(true);

    setTimeout(() => {
      const element = invoiceRef.current;
      const options = {
        margin: 0,
        filename: `Invoice_Bill_${editableHeader.invoiceNo || 'Draft'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(element).save().then(() => {
        setIsPdfPrinting(false);
      });
    }, 150);
  };

  const currentActiveData = challanData || manualInvoice;

  return (
    <div className="main-wrapper">
      {/* Search Filters & Actions */}
      <div className="invoice-search-card no-print">
        <div className="dropdown-filter-group">
          <div className="select-box">
            <label className="select-label">🏢 Select Company Name</label>
            <select value={selectedCompany} onChange={handleCompanyChange} className="select-dropdown" disabled={loadingCompanies}>
              <option value="">{loadingCompanies ? "Loading..." : "-- Choose Company --"}</option>
              {companiesList.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.displayName}</option>
              ))}
            </select>
          </div>

          <div className="select-box">
            <label className="select-label">📄 Select Offer ID</label>
            <select value={selectedOfferId} onChange={handleOfferChange} className="select-dropdown" disabled={!selectedCompany || loadingOffers}>
              <option value="">{loadingOffers ? "Loading..." : "-- Choose Offer ID --"}</option>
              {offersList.map((offer) => (
                <option key={offer.id} value={offer.id}>{offer.id} ({offer.date})</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="select-box" style={{ justifyContent: 'flex-end' }}>
            <label className="select-label">Quick Actions:</label>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                type="button" 
                className="btn-save-bill" 
                style={{ backgroundColor: '#28a745', marginTop: 0 }}
                onClick={handleCreateBlankInvoice}
              >
                ➕ Create Blank
              </button>

              <button 
                type="button" 
                className="btn-save-bill" 
                style={{ backgroundColor: '#6c757d', marginTop: 0 }}
                onClick={handleReset}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {invoiceError && <p className="error-text">{invoiceError}</p>}

        {currentActiveData && (
          <div className="action-buttons-wrap" style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!activeBillIds && (
              <button className="btn-save-bill" onClick={handleSaveBill} disabled={savingBill}>
                {savingBill ? "💾 Saving ..." : "💾 Save Bill"}
              </button>
            )}

            {activeBillIds && (
              <button 
                className="btn-save-bill" 
                style={{ backgroundColor: '#ffc107', color: '#000' }} 
                onClick={handleUpdateBill} 
                disabled={updatingBill}
              >
                {updatingBill ? "✏️ Updating ..." : "✏️ Update Bill"}
              </button>
            )}

            {activeBillIds && (
              <button 
                className="btn-save-bill" 
                style={{ backgroundColor: '#dc3545' }} 
                onClick={handleDeleteBill} 
                disabled={deletingBill}
              >
                {deletingBill ? "🗑️ Deleting ..." : "🗑️ Delete Bill"}
              </button>
            )}

            <button className="btn-download-pdf" onClick={handleDownloadPDF}>
              📥 Download Invoice Bill (PDF)
            </button>
          </div>
        )}
      </div>

      {/* Invoice Document */}
      {loadingChallan ? (
        <div className="no-data-placeholder">Loading Offer Details....</div>
      ) : currentActiveData ? (
        <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={invoiceRef}>
          <div className="invoice-content-wrap">
            <div className="company-header">
              <div className="logo-box">
                <img src={logo} alt="Company Logo" className="logo-img" />
              </div>
              <div className="company-info">
                <h1 className="company-title">H.R.ENGINEERS</h1>
                <p className="company-services">■ Lift ■ ARD ■ Generator ■ Escalator ■ Service & Maintenance ■ Spare Parts</p>
              </div>
            </div>

            <div className="document-type">BILL / INVOICE</div>

            <div className="info-section">
              <div className="meta-info-grid">
                <div>
                  <strong>Invoice No: </strong>
                  {isPdfPrinting ? editableHeader.invoiceNo : (
                    <input 
                      type="text" 
                      className="table-input bold" 
                      value={editableHeader.invoiceNo} 
                      onChange={(e) => handleHeaderChange('invoiceNo', e.target.value)} 
                    />
                  )}
                </div>
                <div>
                  <strong>Date: </strong>
                  {isPdfPrinting ? editableHeader.date : (
                    <input 
                      type="text" 
                      className="table-input" 
                      value={editableHeader.date} 
                      onChange={(e) => handleHeaderChange('date', e.target.value)} 
                    />
                  )}
                </div>
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
                      value={editableHeader.toCompany} 
                      placeholder="Company Name"
                      onChange={(e) => handleHeaderChange('toCompany', e.target.value)} 
                    />
                    <input 
                      type="text" 
                      className="table-input" 
                      value={editableHeader.address} 
                      placeholder="Address"
                      onChange={(e) => handleHeaderChange('address', e.target.value)} 
                    />
                  </>
                )}
              </div>

              <div className="subject-line">
                <strong>Sub: </strong>
                {isPdfPrinting ? <span className="bold">{editableHeader.subject}</span> : (
                  <input 
                    type="text" 
                    className="table-input bold" 
                    value={editableHeader.subject} 
                    onChange={(e) => handleHeaderChange('subject', e.target.value)} 
                  />
                )}
              </div>

              <div className="salutation">
                Dear Sir,<br />
                We would like to submit our bill as per the following basis:
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>S.l No.</th>
                  <th style={{ width: '43%' }}>Items Description</th>
                  <th style={{ width: '8%' }}>Qty</th>
                  <th style={{ width: '8%' }}>Unit</th>
                  <th style={{ width: '14%' }}>Price (BDT)</th>
                  <th style={{ width: '14%' }}>Total (BDT)</th>
                  {!isPdfPrinting && <th className="no-print" style={{ width: '6%' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {editableItems.length > 0 ? (
                  editableItems.map((item, index) => {
                    const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                    return (
                      <tr key={index} className="page-break-avoid">
                        <td className="text-center">{index + 1}</td>
                        <td>
                          {isPdfPrinting ? item.name : (
                            <input type="text" className="table-input" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} />
                          )}
                        </td>
                        <td className="text-center">
                          {isPdfPrinting ? item.quantity : (
                            <input type="number" className="table-input text-center" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                          )}
                        </td>
                        <td className="text-center">
                          {isPdfPrinting ? item.unit : (
                            <input type="text" className="table-input text-center" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} />
                          )}
                        </td>
                        <td className="text-center">
                          {isPdfPrinting ? parseFloat(item.price || 0).toFixed(2) : (
                            <input type="number" className="table-input text-center" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value)} step="0.01" />
                          )}
                        </td>
                        <td className="text-center bold">
                          {itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {!isPdfPrinting && (
                          <td className="text-center no-print">
                            <button type="button" className="btn-delete" onClick={() => handleRemoveRow(index)}>✖</button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isPdfPrinting ? "6" : "7"} className="text-center" style={{ color: 'red', padding: '15px' }}>
                      No items available for this Offer.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                {/* Grand Total Row */}
                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold">Grand Total:</td>
                  <td className="text-center bold">
                    {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {!isPdfPrinting && <td className="no-print"></td>}
                </tr>

                {/* Paid Amount Row */}
                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold" style={{ color: '#28a745' }}>Paid / Advance Amount:</td>
                  <td className="text-center bold">
                    {isPdfPrinting ? (
                      currentPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    ) : (
                      <input 
                        type="number" 
                        className="table-input text-center bold" 
                        style={{ color: '#28a745' }}
                        value={paidAmount} 
                        onChange={(e) => setPaidAmount(e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                        step="0.01"
                      />
                    )}
                  </td>
                  {!isPdfPrinting && <td className="no-print"></td>}
                </tr>

                {/* Due Amount Row */}
                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold" style={{ color: '#dc3545' }}>Net Due Amount:</td>
                  <td className="text-center bold" style={{ color: '#dc3545' }}>
                    {dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {!isPdfPrinting && <td className="no-print"></td>}
                </tr>
              </tfoot>
            </table>

            {!isPdfPrinting && (
              <div className="add-row-container no-print">
                <button className="btn-add-row" onClick={handleAddRow}>+ Add Item</button>
              </div>
            )}

            <div className="page-break-avoid">
              <div className="in-words-section">
                <strong>In Words: </strong> {numberToWords(grandTotal)}
              </div>

              <div className="notes-section">
                {notes.map((note, index) => (
                  <div key={index} className="note-row">
                    <span className="note-label"><strong>Note {String(index + 1).padStart(2, '0')}- </strong></span>
                    {isPdfPrinting ? <span className="note-text">{note}</span> : (
                      <input type="text" className="inline-input note-input" value={note} onChange={(e) => handleNoteChange(index, e.target.value)} />
                    )}
                    {!isPdfPrinting && (
                      <button className="btn-delete no-print inline-delete" onClick={() => handleRemoveNote(index)}>✕</button>
                    )}
                  </div>
                ))}
                {!isPdfPrinting && (
                  <div className="no-print add-note-box">
                    <button className="btn-add-note" onClick={handleAddNote}>+ Add Note</button>
                  </div>
                )}

                <div className="payment-mode">
                  <div className="payment-line">
                    <strong>Mode: </strong>
                    {isPdfPrinting ? <span>{paymentMode.mode}</span> : (
                      <input type="text" name="mode" value={paymentMode.mode} onChange={handlePaymentChange} className="inline-input" />
                    )}
                  </div>
                  <div className="payment-line">
                    <span>1st payment: </span>
                    {isPdfPrinting ? <span>{paymentMode.advance}</span> : (
                      <input type="text" name="advance" value={paymentMode.advance} onChange={handlePaymentChange} className="inline-input" />
                    )}
                  </div>
                  <div className="payment-line">
                    <span>2nd payment: </span>
                    {isPdfPrinting ? <span>{paymentMode.handover}</span> : (
                      <input type="text" name="handover" value={paymentMode.handover} onChange={handlePaymentChange} className="inline-input" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="page-break-avoid footer-section-wrap">
            <div className="invoice-footer">
              <div className="footer-left">
                <div className="seal-circle">H.R.E</div>
                <p>Thanking You. Yours Truly</p>
              </div>
              <div className="footer-center">
                <div className="signature-line"></div>
                <p>Receiver's Signature & Seal</p>
              </div>
            </div>

            <div className="bottom-contact">
              <p>📞 01711131536, 01407000021 | ✉️ hrengineers@gmail.com</p>
              <p>📍 Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data-placeholder">
          <p>Please select a <strong>Company Name</strong> and an <strong>Offer ID</strong>, or click <strong>"Create Blank"</strong> to make a manual invoice.</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceComponent;