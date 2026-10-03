/* eslint-disable react-hooks/set-state-in-effect */
import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import footerImg from "../../assets/Footer.png";
import headerImg from "../../assets/header.png";


const ServiceBill = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  // Router Location State থেকে ডাটা নেওয়া
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

  // ProjectDetails থেকে সার্ভিস ও স্পেয়ার পার্টস ডাটা সেট করা
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

      // Spare Parts Charges
      if (parseFloat(billInfo.sparePartsBill) > 0) {
        items.push({
          name: 'Spare Parts Charges',
          quantity: 1,
          unit: 'Job',
          price: parseFloat(billInfo.sparePartsBill) || 0
        });
      }

      // Previous Due Balance
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

  // PDF Download Solution with Dynamic Header & Footer Image Overlay
  const handleDownloadPDF = () => {
    setIsPdfPrinting(true);
    window.scrollTo(0, 0);

    setTimeout(() => {
      const element = invoiceRef.current;

      const options = {
        margin: [35, 8, 30, 8],
        filename: `Service_Bill_${projectInfo.projectName || 'Draft'}_${billInfo.month || 'Current'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            const pdfElement = clonedDoc.querySelector('.pdf-mode');
            if (pdfElement) {
              pdfElement.style.width = '100%';
              const inputs = pdfElement.querySelectorAll('input, textarea');
              inputs.forEach((input) => {
                const span = clonedDoc.createElement('span');
                span.innerText = input.value || input.placeholder || '';
                span.style.display = 'inline-block';
                span.style.fontFamily = 'inherit';
                span.style.fontSize = window.getComputedStyle(input).fontSize;
                span.style.fontWeight = window.getComputedStyle(input).fontWeight;
                span.style.color = window.getComputedStyle(input).color;
                span.style.lineHeight = '1.4';
                span.style.wordBreak = 'break-word';
                span.style.whiteSpace = 'pre-wrap';

                if (input.parentNode) {
                  input.parentNode.replaceChild(span, input);
                }
              });
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.page-break-avoid', '.footer-section-wrap']
        }
      };

      html2pdf()
        .from(element)
        .set(options)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          const totalPages = pdf.internal.getNumberOfPages();
          const hImg = new Image();
          const fImg = new Image();
          hImg.src = headerImg;
          fImg.src = footerImg;

          return new Promise((resolve) => {
            let loadedCount = 0;
            const checkLoaded = () => {
              loadedCount++;
              if (loadedCount === 2) {
                for (let i = 1; i <= totalPages; i++) {
                  pdf.setPage(i);
                  pdf.addImage(hImg, 'PNG', 5, 4, 200, 30);
                  pdf.addImage(fImg, 'PNG', 5, 268, 200, 24);
                }
                resolve(pdf);
              }
            };

            hImg.onload = checkLoaded;
            fImg.onload = checkLoaded;
            if (hImg.complete) checkLoaded();
            if (fImg.complete) checkLoaded();
          });
        })
        .then((pdf) => {
          pdf.save(`Service_Bill_${projectInfo.projectName || 'Draft'}_${billInfo.month || 'Current'}.pdf`);
          setIsPdfPrinting(false);
        })
        .catch((err) => {
          console.error(err);
          setIsPdfPrinting(false);
        });
    }, 200);
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
          {/* Pad Header Image Placeholder / Visible on UI only */}
          <div className="company-header no-print-in-pdf">
            <img src={headerImg} alt="Header Pad" style={{ width: '100%', height: 'auto' }} />
          </div>

          <div className="document-type" style={{ marginTop: '15px' }}>SERVICE BILL / INVOICE</div>

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

            <div className="subject-line" style={{ marginTop: '8px' }}>
              <strong>Sub: </strong><span className="bold">Servicing & Maintenance Bill for the month of {billInfo.month}</span>
            </div>

            <div className="salutation" style={{ marginTop: '8px' }}>
              Dear Sir,<br />
              We would like to submit our servicing bill as per the following basis:
            </div>
          </div>

          {/* Items Table */}
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
                          <button type="button" className="btn-delete" onClick={() => handleRemoveRow(index)}>✖</button>
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
              <div className="seal-circle">osan lift</div>
              <p>Thanking You. Yours Truly</p>
            </div>
            <div className="footer-center">
              <div className="signature-line"></div>
              <p>Receiver's Signature & Seal</p>
            </div>
          </div>

          <div className="bottom-contact no-print-in-pdf">
            <img src={footerImg} alt="Footer Pad" style={{ width: '100%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBill;