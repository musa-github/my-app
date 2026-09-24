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
  resetChallan
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
    date: new Date().toLocaleDateString('en-US'),
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
        date: challanData.date || new Date().toLocaleDateString('en-US'),
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

  const handleReset = () => {
    setSelectedCompany('');
    setSelectedOfferId('');
    setEditableHeader({ date: new Date().toLocaleDateString('en-US'), toCompany: '', address: '', subject: '' });
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

  // Challan Invoice এর ডায়নামিক PDF জেনারেটর সিস্টেম
  const handleDownloadPDF = () => {
    if (!challanData) return;

    setIsPdfPrinting(true);
    window.scrollTo(0, 0);

    setTimeout(() => {
      const element = challanRef.current;

      const opt = {
        margin: [42, 8, 38, 8],
        filename: `Delivery_Challan_${challanData.challanNo || 'Invoice'}.pdf`,
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
                span.style.width = '100%';
                span.style.fontFamily = 'inherit';
                span.style.fontSize = window.getComputedStyle(input).fontSize;
                span.style.fontWeight = window.getComputedStyle(input).fontWeight;
                span.style.color = window.getComputedStyle(input).color;
                span.style.textAlign = window.getComputedStyle(input).textAlign;
                span.style.lineHeight = '1.4';
                span.style.paddingBottom = '2px';
                span.style.verticalAlign = 'middle';
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
          mode: ['css', 'legacy'],
          avoid: ['tr', '.page-break-avoid', '.invoice-footer']
        }
      };

      html2pdf()
        .from(element)
        .set(opt)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          const totalPages = pdf.internal.getNumberOfPages();
          const headerImg = new Image();
          const footerImg = new Image();
          headerImg.src = header;
          footerImg.src = footer;

          return new Promise((resolve) => {
            let loadedCount = 0;
            const checkLoaded = () => {
              loadedCount++;
              if (loadedCount === 2) {
                for (let i = 1; i <= totalPages; i++) {
                  pdf.setPage(i);
                  pdf.addImage(headerImg, 'PNG', 10, 3.5, 190, 30);
                  pdf.addImage(footerImg, 'PNG', 10, 263, 190, 30);
                }
                resolve(pdf);
              }
            };

            headerImg.onload = checkLoaded;
            footerImg.onload = checkLoaded;
            if (headerImg.complete) checkLoaded();
            if (footerImg.complete) checkLoaded();
          });
        })
        .then((pdf) => {
          pdf.save(`Delivery_Challan_${challanData.challanNo || 'Invoice'}.pdf`);
          setIsPdfPrinting(false);
        })
        .catch((err) => {
          console.error("PDF generation error:", err);
          setIsPdfPrinting(false);
        });
    }, 300);
  };

  return (
    <div className="main-wrapper">
      
      {/* Search and Action Bar */}
      <div className="challan-search-card no-print">
        <div className="dropdown-filter-group">
          
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

      {/* Challan Body (OfferInvoice Layout Applied) */}
      {loadingChallan ? (
        <div className="no-data-placeholder">Generating Delivery Challan...</div>
      ) : challanData ? (
        <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={challanRef}>
          
          {/* Header Image (Visible only on UI screen, PDF injects it automatically) */}
          {!isPdfPrinting && (
            <div className="company-header no-pdf-img">
              <div style={{ width: "100%", height: "110px" }}>
                <img src={header} alt="Header Logo" style={{ width: "100%" }} />
              </div>
            </div>
          )}

          <div className="document-type">DELIVERY CHALLAN</div>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span className="bold">Challan No: </span>
                <span>{challanData.challanNo}</span>
              </div>
              <div>
                <span className="bold">Date: </span>
                <input
                  type="text"
                  className="inline-input"
                  style={{ width: '120px' }}
                  value={editableHeader.date}
                  onChange={(e) => handleHeaderChange('date', e.target.value)}
                />
              </div>
            </div>

            <div className="to-address">
              <span className="bold">To,</span>
              <input
                type="text"
                placeholder="Company / Client Name"
                className="block-input bold"
                value={editableHeader.toCompany}
                onChange={(e) => handleHeaderChange('toCompany', e.target.value)}
              />
              <input
                type="text"
                placeholder="Company Address"
                className="block-input"
                value={editableHeader.address}
                onChange={(e) => handleHeaderChange('address', e.target.value)}
              />
            </div>

            <div className="subject-line">
              <span className="bold">Sub: </span>
              <input
                type="text"
                placeholder="Subject..."
                className="inline-input bold"
                style={{ width: '80%' }}
                value={editableHeader.subject}
                onChange={(e) => handleHeaderChange('subject', e.target.value)}
              />
            </div>

            <p className="no-margin" style={{ marginTop: '6px' }}>Dear Sir,</p>
            <p className="no-margin">Please receive the following goods/materials in good condition:</p>
          </div>

          {/* Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>S.l No.</th>
                <th style={{ width: '64%' }}>Items Description</th>
                <th style={{ width: '12%' }}>Qty</th>
                <th style={{ width: '12%' }}>Unit</th>
                <th className="no-print" style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {editableItems.length > 0 ? (
                editableItems.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="table-input"
                        placeholder="Item description..."
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="table-input text-center"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="table-input text-center"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      />
                    </td>
                    <td className="no-print text-center">
                      <button className="btn-delete" onClick={() => handleRemoveItem(index)}>✕</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center" style={{ color: 'red', padding: '15px' }}>
                    No items selected for this Challan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="add-row-container no-print">
            <button className="btn-add-row" onClick={handleAddItem}>+ Add Item</button>
          </div>

          {/* Footer Signatures */}
          <div className="invoice-footer page-break-avoid" style={{ marginTop: '40px' }}>
            <div>
              <div className="signature-line"></div>
              <p className="no-margin bold" style={{ fontSize: '11px', textAlign: 'center' }}>Prepared By / Authorized Signature</p>
            </div>
            <div>
              <div className="signature-line"></div>
              <p className="no-margin bold" style={{ fontSize: '11px', textAlign: 'center' }}>Receiver's Signature & Seal</p>
            </div>
          </div>

          {/* Footer Image (Visible only on UI screen) */}
          {!isPdfPrinting && (
            <div className="bottom-contact no-pdf-img page-break-avoid">
              <img src={footer} alt="Footer Logo" style={{ width: "100%" }} />
            </div>
          )}

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