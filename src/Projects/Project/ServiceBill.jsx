/* eslint-disable react-hooks/set-state-in-effect */
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import logo from "../../assets/main-logo.png"; // আপনার প্রোজেক্টের লোগো পাথ অনুযায়ী চেক করুন
import './ServiceBill.css';

const ServiceBill = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  // Router Location State থেকে ডাটা নেওয়া
  const { projectInfo, billInfo } = location.state || {};

  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  
  const [notes, setNotes] = useState([
    'This offer excludes VAT, Tax, and AIT.',
    'One-year warranty on all electrical equipment (excluding high voltage, earthquake, water damage).',
    'There is no warranty for the door motor.'
  ]);

  const [paymentMode, setPaymentMode] = useState({
    mode: 'Payment by cash.'
  });

  // ProjectDetails থেকে আসা সার্ভিস এবং স্পেয়ার পার্টস ডাটা টেবিলে সেট করা
  useEffect(() => {
    if (billInfo) {
      const items = [];
      
      // Servicing Charges
      if (billInfo.servicingBill) {
        items.push({
          name: `Servicing & Maintenance Charges (${billInfo.month || 'Current Month'})`,
          quantity: 1,
          unit: 'Month',
          price: parseFloat(billInfo.servicingBill) || 0
        });
      }

      // Spare Parts Charges (যদি থাকে)
      if (parseFloat(billInfo.sparePartsBill) > 0) {
        items.push({
          name: 'Spare Parts Charges',
          quantity: 1,
          unit: 'Job',
          price: parseFloat(billInfo.sparePartsBill) || 0
        });
      }

      // Previous Due Balance (যদি থাকে)
      if (parseFloat(billInfo.lastMonthDue) > 0) {
        items.push({
          name: 'Previous Due Balance',
          quantity: 1,
          unit: '-',
          price: parseFloat(billInfo.lastMonthDue) || 0
        });
      }

      setEditableItems(items);
    }
  }, [billInfo]);

  if (!projectInfo || !billInfo) {
    return (
      <div className="no-data-placeholder" style={{ textAlign: 'center', padding: '50px' }}>
        <h3>No project or bill data found!</h3>
        <button className="btn-save-bill" onClick={() => navigate(-1)} style={{ marginTop: '10px' }}>
          🔙 Go Back
        </button>
      </div>
    );
  }

  // Table Items Handlers
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

  // Grand Total Calculation
  const grandTotal = editableItems.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0),
    0
  );

  // In Words Function
  const numberToWords = (num) => {
    if (!num || num === 0) return 'Zero Taka Only';
    const [integerPart, decimalPart] = num.toFixed(2).split('.');
    return parseInt(decimalPart) > 0
      ? `${integerPart} Taka and ${decimalPart} Paisa Only`
      : `${integerPart} Taka Only`;
  };

  // PDF Export
  const handleDownloadPDF = () => {
    setIsPdfPrinting(true);

    setTimeout(() => {
      const element = invoiceRef.current;
      const options = {
        margin: 0,
        filename: `Service_Bill_${projectInfo.projectName || 'Draft'}_${billInfo.month}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(options).from(element).save().then(() => {
        setIsPdfPrinting(false);
      });
    }, 150);
  };

  return (
    <div className="main-wrapper">
      {/* Search Filters / Actions Top */}
      <div className="invoice-search-card no-print">
        <div className="action-buttons-wrap" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn-save-bill" onClick={() => navigate(-1)}>
            🔙 Back to Project
          </button>
          <button className="btn-download-pdf" onClick={handleDownloadPDF}>
            📥 Download Service Bill (PDF)
          </button>
        </div>
      </div>

      {/* Invoice Pad Document Area */}
      <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={invoiceRef}>
        <div className="invoice-content-wrap">
          {/* Header Pad */}
          <div className="company-header">
            <div className="logo-box">
              <img src={logo} alt="Company Logo" className="logo-img" />
            </div>
            <div className="company-info">
              <h1 className="company-title">H.R.ENGINEERS</h1>
              <p className="company-services">■ Lift ■ ARD ■ Generator ■ Escalator ■ Service & Maintenance ■ Spare Parts</p>
            </div>
          </div>

          <div className="document-type">SERVICE BILL / INVOICE</div>

          {/* Customer Meta Details */}
          <div className="info-section">
            <div className="meta-info-grid">
              <div><strong>Invoice No: </strong>{projectInfo.id || 'SB-101'}</div>
              <div><strong>Date: </strong>{billInfo.lastServicingDate || new Date().toLocaleDateString('en-GB')}</div>
            </div>

            <div className="to-address">
              <p className="no-margin"><strong>To,</strong></p>
              <div className="bold">{projectInfo.projectName}</div>
              <div>{projectInfo.address || '-'}</div>
              <div>Phone: {projectInfo.phoneNo || '-'}</div>
            </div>

            <div className="subject-line">
              <strong>Sub: </strong><span className="bold">Servicing & Maintenance Bill for the month of {billInfo.month}</span>
            </div>

            <div className="salutation">
              Dear Sir,<br />
              We would like to submit our servicing bill as per the following basis:
            </div>
          </div>

          {/* Items Table */}
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
            </tfoot>
          </table>

          {!isPdfPrinting && (
            <div className="add-row-container no-print">
              <button className="btn-add-row" onClick={handleAddRow}>+ Add Item</button>
            </div>
          )}

          {/* In Words & Notes Area */}
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
                    <input type="text" name="mode" value={paymentMode.mode} onChange={(e) => setPaymentMode({ mode: e.target.value })} className="inline-input" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signature Section */}
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
            <p>📞 01711131536, 01407000021 | ✉️ mmengineering@gmail.com</p>
            <p>📍 Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBill;