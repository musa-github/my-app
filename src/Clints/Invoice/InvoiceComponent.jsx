/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  DEFAULT_NOTES,
  DEFAULT_PAYMENT_MODE,
  convertToWords
} from './invoiceConstants.js';

import {
  deleteBillFromFirebase,
  fetchAllCompanies,
  fetchOffersByCompany,
  fetchSpecificOfferFromDb,
  resetInvoiceData,
  resetSaveStatus,
  saveBillToFirebase,
  setFilterMode,
  setSubSourceFilter,
  updateBillInFirebase
} from '../../Fetures/Inventory/InvoiceSlice.js';
import { downloadInvoicePDF } from '../../HndlePDF/HndlePDF.js';
import InvoiceFooter from '../../Pad/InvoiceFooter.jsx';
import InvoiceHeader from '../../Pad/InvoiceHeader.jsx';
import './InvoiceComponent.css';

const InvoiceComponent = () => {
  const invoiceRef = useRef(null);
  const dispatch = useDispatch();

  const { 
    companiesList = [], 
    offersList = [], 
    challanData = null, 
    loadingCompanies = false, 
    loadingOffers = false, 
    loadingChallan = false,
    savingBill = false, 
    updatingBill = false, 
    deletingBill = false, 
    saveSuccess = false, 
    updateSuccess = false, 
    deleteSuccess = false, 
    savedBillIds: reduxSavedBillIds = null, 
    error: invoiceError = null,
    subSourceFilter = 'offers_only'
  } = useSelector((state) => state.invoice || state.challan || {});

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const [manualInvoice, setManualInvoice] = useState(null);

  const [existingBillIds, setExistingBillIds] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);

  const [editableHeader, setEditableHeader] = useState({
    invoiceNo: '',
    date: new Date().toLocaleDateString('en-GB'),
    toCompany: '',
    address: '',
    subject: 'Bill / Invoice for Goods & Services'
  });

  const [editableItems, setEditableItems] = useState([]);
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [paymentMode, setPaymentMode] = useState(DEFAULT_PAYMENT_MODE);
  const [localFilterType, setLocalFilterType] = useState('all');

  useEffect(() => {
    dispatch(fetchAllCompanies(localFilterType));
  }, [dispatch, localFilterType]);

  const mapChallanToState = useCallback((data, docId) => {
    if (!data) return;

    const matchedBill = data.matchedBill;
    const targetData = matchedBill || data;
    
    const headerInfo = targetData.headerData || data.headerData || {};

    const extractedInvoiceNo = 
      targetData.billNo || 
      targetData.offerNo || 
      headerInfo.offerNo || 
      headerInfo.billNo || 
      `INV-${Date.now().toString().slice(-6)}`;

    const extractedDate = 
      targetData.date || 
      headerInfo.date || 
      new Date().toLocaleDateString('en-GB');

    const extractedCompany = 
      targetData.toCompany || 
      targetData.companyName || 
      headerInfo.toCompany || 
      headerInfo.companyName || 
      '';

    const extractedAddress = 
      targetData.address || 
      headerInfo.address || 
      '';

    const extractedSubject = 
      targetData.subject || 
      headerInfo.subject || 
      'Bill / Invoice for Goods & Services';

    setEditableHeader({
      invoiceNo: extractedInvoiceNo,
      date: extractedDate,
      toCompany: extractedCompany,
      address: extractedAddress,
      subject: extractedSubject
    });

    const sourceItems = targetData.items || targetData.products || [];
    const formattedItems = sourceItems.map((item) => ({
      name: item.name || item.itemName || item.description || item.productName || '',
      quantity: parseFloat(item.quantity || item.qty || item.count) || 1,
      unit: item.unit || 'Pcs',
      price: parseFloat(item.price ?? item.unitPrice ?? item.rate ?? item.amount) || 0
    }));

    setEditableItems(formattedItems);
    setPaidAmount(parseFloat(targetData.paidAmount || targetData.receivedAmount) || 0);

    if (Array.isArray(targetData.notes) && targetData.notes.length > 0) {
      setNotes(targetData.notes);
    } else {
      setNotes(DEFAULT_NOTES);
    }

    if (targetData.paymentMode) {
      setPaymentMode(targetData.paymentMode);
    } else {
      setPaymentMode(DEFAULT_PAYMENT_MODE);
    }

    if (matchedBill || targetData.billNo || targetData.sourceType === 'bill') {
      setExistingBillIds({
        billId: targetData.id || docId,
        salesId: targetData.salesId || targetData.id || docId
      });
    } else {
      setExistingBillIds(null);
    }
  }, []);

  useEffect(() => {
    if (challanData && !manualInvoice) {
      mapChallanToState(challanData, selectedOfferId);
    }
  }, [challanData, manualInvoice, selectedOfferId, mapChallanToState]);

  const activeBillIds = reduxSavedBillIds || existingBillIds;

  const handleFilterTypeChange = (mode) => {
    setLocalFilterType(mode);
    dispatch(setFilterMode(mode));
    setSelectedCompany('');
    setSelectedOfferId('');
    setManualInvoice(null);
    dispatch(resetInvoiceData());
  };

  const handleSubSourceChange = (subSource) => {
    dispatch(setSubSourceFilter(subSource));
    setSelectedOfferId('');
    setManualInvoice(null);
    dispatch(resetInvoiceData());
    if (selectedCompany) {
      dispatch(fetchOffersByCompany({ 
        companyDocId: selectedCompany, 
        filterMode: localFilterType,
        subSourceFilter: subSource 
      }));
    }
  };

  const handleCompanyChange = (e) => {
    const companyDocId = e.target.value;
    setSelectedCompany(companyDocId);
    setSelectedOfferId('');
    setManualInvoice(null);
    setEditableItems([]);
    setExistingBillIds(null);
    setPaidAmount(0);
    dispatch(resetInvoiceData());
    if (companyDocId) {
      dispatch(fetchOffersByCompany({ 
        companyDocId, 
        filterMode: localFilterType,
        subSourceFilter 
      }));
    }
  };

  const handleOfferChange = (e) => {
    const offerId = e.target.value;
    setSelectedOfferId(offerId);
    setManualInvoice(null);
    setExistingBillIds(null);
    if (selectedCompany && offerId) {
      const selectedItem = offersList.find((item) => item.id === offerId);
      const sourceType = selectedItem?.sourceType || 'offer';

      dispatch(fetchSpecificOfferFromDb({ 
        companyDocId: selectedCompany, 
        offerId, 
        sourceType
      }));
    }
  };

  const handleReset = useCallback(() => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setManualInvoice(null);
    setExistingBillIds(null);
    setPaidAmount(0);
    setEditableItems([]);
    setNotes(DEFAULT_NOTES);
    setPaymentMode(DEFAULT_PAYMENT_MODE);
    setEditableHeader({
      invoiceNo: '',
      date: new Date().toLocaleDateString('en-GB'),
      toCompany: '',
      address: '',
      subject: ''
    });
    dispatch(resetInvoiceData());
  }, [dispatch]);

  const handleCreateBlankInvoice = () => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setManualInvoice(true);
    setExistingBillIds(null);
    setPaidAmount(0);
    setNotes(DEFAULT_NOTES);
    setPaymentMode(DEFAULT_PAYMENT_MODE);
    setEditableHeader({
      invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB'),
      toCompany: '',
      address: '',
      subject: 'Bill / Invoice for Goods & Services'
    });
    setEditableItems([{ name: 'Sample Item Name', quantity: 1, unit: 'Pcs', price: 0 }]);
    dispatch(resetInvoiceData());
  };

  const handleHeaderChange = (field, value) => setEditableHeader((prev) => ({ ...prev, [field]: value }));

  const handleItemChange = (index, field, value) => {
    setEditableItems((prevItems) => {
      const updated = [...prevItems];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddRow = () => setEditableItems((prev) => [...prev, { name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
  const handleRemoveRow = (index) => setEditableItems((prev) => prev.filter((_, i) => i !== index));

  const handleNoteChange = (index, value) => {
    setNotes((prevNotes) => {
      const updated = [...prevNotes];
      updated[index] = value;
      return updated;
    });
  };
  const handleAddNote = () => setNotes((prev) => [...prev, 'New condition note...']);
  const handleRemoveNote = (index) => setNotes((prev) => prev.filter((_, i) => i !== index));
  const handlePaymentChange = (e) => setPaymentMode((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Calculations
  const grandTotal = useMemo(() => {
    return editableItems.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
      0
    );
  }, [editableItems]);

  const currentPaid = parseFloat(paidAmount) || 0;
  const dueAmount = grandTotal - currentPaid;

  const getTargetCompanyId = useCallback(() => {
    if (selectedCompany) return selectedCompany;
    if (editableHeader.toCompany && editableHeader.toCompany.trim() !== '') {
      return editableHeader.toCompany.trim().replace(/\s+/g, '_');
    }
    return 'general_clients';
  }, [selectedCompany, editableHeader.toCompany]);

  const buildBillPayload = useCallback(() => {
    const safePaid = Number(paidAmount) || 0;
    const safeGrandTotal = Number(grandTotal) || 0;
    const targetCompanyId = getTargetCompanyId();
    
    // Save to Firestore with proper createdType tag
    const createdType = manualInvoice ? 'General' : 'offer_based';

    return {
      billNo: editableHeader.invoiceNo,
      companyName: editableHeader.toCompany || targetCompanyId,
      toCompany: editableHeader.toCompany,
      companyDocId: targetCompanyId,
      address: editableHeader.address,
      subject: editableHeader.subject,
      date: editableHeader.date,
      items: editableItems,
      grandTotal: safeGrandTotal,
      paidAmount: safePaid,
      dueAmount: safeGrandTotal - safePaid,
      notes,
      paymentMode,
      isBlankCreated: Boolean(manualInvoice),
      createdType: createdType,
      offerId: selectedOfferId || null,
      createdAt: new Date().toISOString()
    };
  }, [paidAmount, grandTotal, getTargetCompanyId, manualInvoice, editableHeader, editableItems, notes, paymentMode, selectedOfferId]);

  const handleSaveBill = () => {
    const targetCompanyId = getTargetCompanyId();
    dispatch(saveBillToFirebase({ 
      companyDocId: targetCompanyId, 
      billData: buildBillPayload()
    }));
  };

  const handleUpdateBill = () => {
    if (!activeBillIds?.billId) {
      alert("Document ID not found. Save bill first.");
      return;
    }
    const targetCompanyId = getTargetCompanyId();
    dispatch(updateBillInFirebase({
      companyDocId: targetCompanyId,
      billId: activeBillIds.billId,
      billData: buildBillPayload()
    }));
  };

  const handleDeleteBill = () => {
    if (!activeBillIds?.billId) {
      alert("This bill hasn't been saved yet.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this bill?")) {
      const targetCompanyId = getTargetCompanyId();
      dispatch(deleteBillFromFirebase({
        companyDocId: targetCompanyId,
        billId: activeBillIds.billId
      }));
    }
  };

  useEffect(() => {
    if (saveSuccess) {
      alert('Bill successfully saved to Firebase!');
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

  const handleDownloadPDF = () => {
    downloadInvoicePDF({
      elementRef: invoiceRef,
      fileName: `Invoice_Bill_${editableHeader.invoiceNo || 'Draft'}`,
      setIsPdfPrinting
    });
  };

  const currentActiveData = challanData || manualInvoice;

  return (
    <div className="main-wrapper">
      <div className="invoice-search-card no-print">
        {/* Main Filter Category */}
        <div className="filter-container">
          <span className="filter-title">🔍 Filter Category:</span>

          <label className={`filter-label ${localFilterType === 'all' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="filterType" 
              value="all" 
              checked={localFilterType === 'all'} 
              onChange={() => handleFilterTypeChange('all')} 
            />
            <span>All Data</span>
          </label>

          <label className={`filter-label ${localFilterType === 'offer_based' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="filterType" 
              value="offer_based" 
              checked={localFilterType === 'offer_based'} 
              onChange={() => handleFilterTypeChange('offer_based')} 
            />
            <span>🏷️ Offer Based</span>
          </label>

          <label className={`filter-label ${localFilterType === 'general' ? 'active' : ''}`}>
            <input 
              type="radio" 
              name="filterType" 
              value="general" 
              checked={localFilterType === 'general'} 
              onChange={() => handleFilterTypeChange('general')} 
            />
            <span>📄 General (Blank)</span>
          </label>
        </div>

        {/* Sub-source Selection for Offer Based */}
        {localFilterType === 'offer_based' && (
          <div className="filter-container sub-filter-container">
            <span className="filter-title">📑 Select Source:</span>

            <label className={`filter-label ${subSourceFilter === 'offers_only' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="subSourceFilter" 
                value="offers_only" 
                checked={subSourceFilter === 'offers_only'} 
                onChange={() => handleSubSourceChange('offers_only')} 
              />
              <span>🏷️ Raw Offers</span>
            </label>

            <label className={`filter-label ${subSourceFilter === 'bills_only' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="subSourceFilter" 
                value="bills_only" 
                checked={subSourceFilter === 'bills_only'} 
                onChange={() => handleSubSourceChange('bills_only')} 
              />
              <span>🧾 Saved Offer Bills</span>
            </label>
          </div>
        )}

        <div className="dropdown-filter-group">
          <div className="select-box">
            <label className="select-label">🏢 Select Company Name</label>
            <select value={selectedCompany} onChange={handleCompanyChange} className="select-dropdown" disabled={loadingCompanies}>
              <option value="">{loadingCompanies ? "Loading..." : "-- Choose Company --"}</option>
              {companiesList.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.displayName || comp.id}</option>
              ))}
            </select>
          </div>

          <div className="select-box">
            <label className="select-label">📄 Select Offer / Bill ID</label>
            <select value={selectedOfferId} onChange={handleOfferChange} className="select-dropdown" disabled={!selectedCompany || loadingOffers}>
              <option value="">{loadingOffers ? "Loading..." : "-- Choose Offer / Bill ID --"}</option>
              {offersList.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.displayLabel || offer.billNo || offer.id}
                </option>
              ))}
            </select>
          </div>

          <div className="select-box quick-actions-box">
            <label className="select-label">Quick Actions:</label>
            <div className="quick-actions-buttons">
              <button 
                type="button" 
                className="btn-save-bill btn-create-blank" 
                onClick={handleCreateBlankInvoice}
              >
                ➕ Create Blank
              </button>

              <button 
                type="button" 
                className="btn-save-bill btn-reset-action" 
                onClick={handleReset}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {invoiceError && <p className="error-text invoice-error-text">{invoiceError}</p>}

        {currentActiveData && (
          <div className="action-buttons-wrap">
            {!activeBillIds && (
              <button className="btn-save-bill" onClick={handleSaveBill} disabled={savingBill}>
                {savingBill ? "💾 Saving ..." : "💾 Save Bill"}
              </button>
            )}

            {activeBillIds && (
              <button 
                className="btn-save-bill btn-update-bill" 
                onClick={handleUpdateBill} 
                disabled={updatingBill}
              >
                {updatingBill ? "✏️ Updating ..." : "✏️ Update Bill"}
              </button>
            )}

            {activeBillIds && (
              <button 
                className="btn-save-bill btn-delete-bill" 
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

      {loadingChallan ? (
        <div className="no-data-placeholder">Loading Details....</div>
      ) : currentActiveData ? (
        <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={invoiceRef}>
          <div className="invoice-content-wrap">
            <InvoiceHeader 
              isPdfPrinting={isPdfPrinting}
              editableHeader={editableHeader}
              handleHeaderChange={handleHeaderChange}
            />

            <table className="invoice-table">
              <thead>
                <tr>
                  <th className="table-col-sl">S.l No.</th>
                  <th className="table-col-desc">Items Description</th>
                  <th className="table-col-qty">Qty</th>
                  <th className="table-col-unit">Unit</th>
                  <th className="table-col-price">Price (BDT)</th>
                  <th className="table-col-total">Total (BDT)</th>
                  {!isPdfPrinting && <th className="no-print table-col-action">Action</th>}
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
                            <button type="button" className="btn-delete" onClick={() => handleRemoveRow(index)}>✕</button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isPdfPrinting ? "6" : "7"} className="text-center empty-items-cell">
                      No items available.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold">Grand Total:</td>
                  <td className="text-center bold">
                    {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {!isPdfPrinting && <td className="no-print"></td>}
                </tr>

                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold paid-amount-title">Paid / Advance Amount:</td>
                  <td className="text-center bold">
                    {isPdfPrinting ? (
                      currentPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    ) : (
                      <input 
                        type="number" 
                        className="table-input text-center bold paid-amount-input" 
                        value={paidAmount} 
                        onChange={(e) => setPaidAmount(e.target.value === '' ? 0 : parseFloat(e.target.value))} 
                        step="0.01"
                      />
                    )}
                  </td>
                  {!isPdfPrinting && <td className="no-print"></td>}
                </tr>

                <tr className="page-break-avoid">
                  <td colSpan="5" className="text-right bold due-amount-title">Net Due Amount:</td>
                  <td className="text-center bold due-amount-value">
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
                <strong>In Words: </strong> {convertToWords(grandTotal)}
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

          <InvoiceFooter />
        </div>
      ) : (
        <div className="no-data-placeholder">
          <p>Please select a <strong>Company Name</strong> and an <strong>Offer / Bill ID</strong>, or click <strong>"Create Blank"</strong> to make a manual invoice.</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceComponent;