import html2pdf from 'html2pdf.js';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import footer from "../../assets/Footer.png";
import header from "../../assets/header.png";
import {
  deleteOfferFromFirebase,
  fetchAllSavedOffers,
  fetchOfferProducts,
  fetchPurchaseProducts,
  resetFormState,
  saveOfferToFirebase,
  setSavedOfferInfo,
  updateOfferInFirebase
} from '../../Fetures/Inventory/OfferSlice';
import './OfferInvoice.css';

const OfferInvoice = () => {
  const invoiceRef = useRef(null);
  const dispatch = useDispatch();

  // Logged in user info ebong admin list Redux/Auth state theke retrieve
  const currentUserEmail = useSelector((state) => state.auth?.user?.email || state.auth?.email || '');
  const adminList = useSelector((state) => state.auth?.appAdmins || state.auth?.adminList || []); // Firestore 'app_admins' list

  // Owner Email declaration
  const OWNER_EMAIL = 'osanlift@gmail.com';

  // Role Validation Logic
  const isOwner = currentUserEmail.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
  
  // Checking if current user exists in 'app_admins' collection
  const isAdmin = Array.isArray(adminList) && adminList.some((admin) => {
    if (typeof admin === 'string') {
      return admin.toLowerCase() === currentUserEmail.toLowerCase();
    }
    return admin?.email?.toLowerCase() === currentUserEmail.toLowerCase();
  });

  // Authorization flag for delete functionality
  const canDelete = isOwner || isAdmin;

  const {
    loading: isSaving,
    isUpdating,
    isDeleting,
    savedOfferInfo,
    allSavedOffers = [],
    offerList: offerProductList = [],
    purchaseList: purchaseProductList = []
  } = useSelector((state) => state.offer);

  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const [activeSuggestionRow, setActiveSuggestionRow] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');

  const defaultHeader = {
    date: new Date().toLocaleDateString('en-US'),
    toCompany: '',
    address: '',
    subject: ''
  };

  const [items, setItems] = useState([
    { name: '', quantity: 1, unit: 'Pcs', price: 0 }
  ]);

  const [headerData, setHeaderData] = useState(defaultHeader);

  const [notes, setNotes] = useState([
    'This offers excluding vat, tax, and ait.',
    'One-year Warranty all electrical equipment.',
    'There is no warranty for the door motor.'
  ]);

  const [paymentMode, setPaymentMode] = useState({
    mode: 'Payment by cash.',
    advance: '80% advanced.',
    handover: '20% handover date.'
  });

  useEffect(() => {
    dispatch(fetchOfferProducts());
    dispatch(fetchPurchaseProducts());
    dispatch(fetchAllSavedOffers());
  }, [dispatch]);

  const uniqueCompanies = Array.from(
    new Set(allSavedOffers.map((off) => off.headerData?.toCompany || off.companyName))
  ).filter(Boolean);

  const filteredOffers = selectedCompany
    ? allSavedOffers.filter(
        (off) =>
          (off.headerData?.toCompany || off.companyName) === selectedCompany
      )
    : allSavedOffers;

  const handleCompanyChange = (e) => {
    const comp = e.target.value;
    setSelectedCompany(comp);
    dispatch(resetFormState());
    setHeaderData(defaultHeader);
    setItems([{ name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
  };

  const handleSelectSavedOffer = (e) => {
    const selectedDocId = e.target.value;

    if (!selectedDocId) {
      dispatch(resetFormState());
      setHeaderData(defaultHeader);
      setItems([{ name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
      return;
    }

    const offerData = allSavedOffers.find((item) => item.docId === selectedDocId);

    if (offerData) {
      const rawCompName = offerData.companyName || offerData.headerData?.toCompany || "Unassigned_Company";
      const cleanCompKey = rawCompName.trim().replace(/\s+/g, '_');
      
      dispatch(setSavedOfferInfo({ companyName: cleanCompKey, id: offerData.docId }));
      setHeaderData(offerData.headerData || defaultHeader);
      
      if (offerData.items && Array.isArray(offerData.items)) {
        setItems(offerData.items.map((i) => ({ ...i })));
      } else {
        setItems([{ name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
      }

      if (offerData.notes && Array.isArray(offerData.notes)) {
        setNotes([...offerData.notes]);
      }
      
      setPaymentMode(offerData.paymentMode || {});

      if (offerData.headerData?.toCompany) {
        setSelectedCompany(offerData.headerData.toCompany);
      }
    }
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  const handleHeaderChange = (e) => {
    setHeaderData({ ...headerData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setItems(updatedItems);
  };

  const getProductName = (prod) => {
    return prod?.ItemsName || prod?.itemsName || prod?.name || prod?.title || '';
  };

  const getProductPrice = (prod) => {
    return prod?.SalingPrice ?? prod?.salingPrice ?? prod?.SellingPrice ?? prod?.sellingPrice ?? prod?.price ?? 0;
  };

  const handleSelectProduct = (index, selectedProduct) => {
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          name: getProductName(selectedProduct),
          unit: selectedProduct.unit || selectedProduct.Unit || item.unit || 'Pcs',
          price: getProductPrice(selectedProduct)
        };
      }
      return item;
    });

    setItems(updatedItems);
    setActiveSuggestionRow(null);
  };

  const handleNoteChange = (index, value) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = value;
    setNotes(updatedNotes);
  };

  const handlePaymentChange = (e) => {
    setPaymentMode({ ...paymentMode, [e.target.name]: e.target.value });
  };

  const addItemRow = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
  };

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addNoteRow = () => {
    setNotes([...notes, '']);
  };

  const removeNoteRow = (index) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const handleSaveOffer = () => {
    if (!headerData.toCompany.trim()) {
      alert("Please enter a Company Name before saving!");
      return;
    }

    const offerPayload = { headerData, items, notes, paymentMode, grandTotal };

    dispatch(saveOfferToFirebase(offerPayload))
      .unwrap()
      .then(() => {
        alert("Offer saved successfully!");
        dispatch(fetchAllSavedOffers());
      })
      .catch((err) => {
        alert("Failed to save offer: " + err);
      });
  };

  const handleUpdateOffer = () => {
    if (!savedOfferInfo?.id) {
      alert("Please select an existing offer to update.");
      return;
    }

    const currentCompany = headerData.toCompany.trim().replace(/\s+/g, '_') || savedOfferInfo.companyName;
    const offerPayload = { headerData, items, notes, paymentMode, grandTotal };

    dispatch(updateOfferInFirebase({
      companyName: currentCompany,
      docId: savedOfferInfo.id,
      offerPayload
    }))
      .unwrap()
      .then(() => {
        alert("Offer updated successfully!");
        dispatch(fetchAllSavedOffers());
      })
      .catch((err) => {
        alert("Failed to update offer: " + err);
      });
  };

  const handleDeleteOffer = () => {
    if (!canDelete) {
      alert("Access Denied: Only owner and admin can delete offers!");
      return;
    }

    if (!savedOfferInfo?.id) {
      alert("No active saved offer selected to delete.");
      return;
    }

    const currentCompany = headerData.toCompany.trim().replace(/\s+/g, '_') || savedOfferInfo.companyName;

    if (window.confirm("Are you sure you want to delete this offer?")) {
      dispatch(deleteOfferFromFirebase({
        companyName: currentCompany,
        docId: savedOfferInfo.id
      }))
        .unwrap()
        .then(() => {
          alert("Offer deleted successfully!");
          dispatch(resetFormState());
          setHeaderData(defaultHeader);
          setItems([{ name: '', quantity: 1, unit: 'Pcs', price: 0 }]);
          dispatch(fetchAllSavedOffers());
        })
        .catch((err) => {
          alert("Failed to delete offer: " + err);
        });
    }
  };

  const handleDownloadPDF = () => {
    setIsPdfPrinting(true);
    window.scrollTo(0, 0);

    setTimeout(() => {
      const element = invoiceRef.current;

      const opt = {
        margin: [38, 8, 32, 8],
        filename: `Offer_${headerData.toCompany || 'Invoice'}.pdf`,
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
                span.style.paddingBottom = '3px';
                span.style.marginBottom = '0px';
                span.style.verticalAlign = 'bottom';
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
          avoid: ['.page-break-avoid', '.invoice-footer', '.in-words-section', '.notes-section']
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
                  pdf.addImage(headerImg, 'PNG', 5, 4, 200, 30);
                  pdf.addImage(footerImg, 'PNG', 5, 268, 200, 24);
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
          pdf.save(`Offer_${headerData.toCompany || 'Invoice'}.pdf`);
          setIsPdfPrinting(false);
        })
        .catch((err) => {
          console.error(err);
          setIsPdfPrinting(false);
        });
    }, 300);
  };

  const numberToWords = (num) => {
    if (!num) return 'Zero Taka Only';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };

    return `${inWords(num)} Taka Only`;
  };

  return (
    <div className="main-wrapper" onClick={() => setActiveSuggestionRow(null)}>
      {/* Action Bar */}
      <div className="action-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Company:</label>
          <select
            onChange={handleCompanyChange}
            value={selectedCompany}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' }}
          >
            <option value="">-- All Companies --</option>
            {uniqueCompanies.map((comp, idx) => (
              <option key={idx} value={comp}>
                {comp}
              </option>
            ))}
          </select>

          <label style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '6px' }}>Select Offer:</label>
          <select
            onChange={handleSelectSavedOffer}
            value={savedOfferInfo?.id || ''}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '220px' }}
          >
            <option value="">-- New Offer --</option>
            {filteredOffers.map((off) => {
              const compName = off.headerData?.toCompany || off.companyName || 'No Company';
              const dateVal = off.headerData?.date || defaultHeader.date;
              return (
                <option key={off.docId} value={off.docId}>
                  {off.docId} - {dateVal} ({compName})
                </option>
              );
            })}
          </select>
        </div>

        <button
          className="btn-action"
          onClick={handleSaveOffer}
          disabled={isSaving || savedOfferInfo?.id}
          style={{ backgroundColor: savedOfferInfo?.id ? '#ccc' : '#198754' }}
        >
          {isSaving ? 'Saving...' : '💾 Save'}
        </button>

        <button
          className="btn-action"
          onClick={handleUpdateOffer}
          disabled={isUpdating || !savedOfferInfo?.id}
          style={{ backgroundColor: savedOfferInfo?.id ? '#ffc107' : '#ccc', color: savedOfferInfo?.id ? '#000' : '#fff' }}
        >
          {isUpdating ? 'Updating...' : '✏️ Update'}
        </button>

        {/* Delete Button visibility control for Owner or Admin */}
        {canDelete && (
          <button
            className="btn-action"
            onClick={handleDeleteOffer}
            disabled={isDeleting || !savedOfferInfo?.id}
            style={{ backgroundColor: savedOfferInfo?.id ? '#dc3545' : '#ccc' }}
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        )}

        <button className="btn-action" onClick={handleDownloadPDF}>
          📥 PDF
        </button>
      </div>

      {/* Invoice Document Container */}
      <div className={`invoice-container ${isPdfPrinting ? 'pdf-mode' : ''}`} ref={invoiceRef}>
        {!isPdfPrinting && (
          <div className="company-header no-pdf-img">
            <div style={{ width: "100%", height: "110px" }}>
              <img src={header} alt="Logo" style={{ width: "100%" }} />
            </div>
          </div>
        )}

        <div className="document-type">PRICE OFFER</div>

        {/* Header Info */}
        <div className="info-section">
          <div className="info-row">
            <span className="bold">Date: </span>
            <input
              type="text"
              name="date"
              className="inline-input"
              style={{ width: '120px' }}
              value={headerData.date || ''}
              onChange={handleHeaderChange}
            />
          </div>
          <div className="to-address">
            <span className="bold">To,</span>
            <input
              type="text"
              name="toCompany"
              placeholder="Company Name"
              className="block-input bold"
              value={headerData.toCompany || ''}
              onChange={handleHeaderChange}
            />
            <input
              type="text"
              name="address"
              placeholder="Company Address"
              className="block-input"
              value={headerData.address || ''}
              onChange={handleHeaderChange}
            />
          </div>
          <div className="subject-line">
            <span className="bold">Subject: </span>
            <input
              type="text"
              name="subject"
              placeholder="Enter subject"
              className="inline-input bold"
              style={{ width: '80%' }}
              value={headerData.subject || ''}
              onChange={handleHeaderChange}
            />
          </div>
          <p className="no-margin" style={{ marginTop: '6px' }}>Dear Sir,</p>
          <p className="no-margin">We are pleased to submit our best price offer for your consideration:</p>
        </div>

        {/* Dynamic Items Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>SL</th>
              <th style={{ width: '48%' }}>Description of Items</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '10%' }}>Unit</th>
              <th style={{ width: '12%' }}>Price</th>
              <th style={{ width: '14%' }}>Total</th>
              <th className="no-print" style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const totalItemPrice = (Number(item.quantity) || 0) * (Number(item.price) || 0);
              const searchSearchTerm = (item.name || '').trim().toLowerCase();

              const filteredOfferProds = offerProductList.filter((p) =>
                getProductName(p).toLowerCase().includes(searchSearchTerm)
              );
              
              const filteredPurchaseProds = purchaseProductList.filter((p) =>
                getProductName(p).toLowerCase().includes(searchSearchTerm)
              );

              return (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="table-input"
                      placeholder="Item name / description"
                      value={item.name || ''}
                      style={{ color: '#000000', fontWeight: 'normal' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSuggestionRow(index);
                      }}
                      onChange={(e) => {
                        handleItemChange(index, 'name', e.target.value);
                        setActiveSuggestionRow(index);
                      }}
                    />

                    {activeSuggestionRow === index && searchSearchTerm.length > 0 && (
                      <div
                        className="suggestions-dropdown no-print"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          boxShadow: '0px 4px 10px rgba(0,0,0,0.15)',
                          zIndex: 999,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                      >
                        {filteredOfferProds.length > 0 && (
                          <div className="suggestion-category" style={{ padding: '6px', borderBottom: '1px solid #eee' }}>
                            <strong style={{ fontSize: '11px', color: '#2e7d32' }}>Offer Products</strong>
                            {filteredOfferProds.map((prod, pIdx) => (
                              <div
                                key={`off-${prod.id || pIdx}`}
                                className="suggestion-item"
                                style={{
                                  padding: '6px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f9f9f9',
                                  fontSize: '13px',
                                  color: '#2e7d32',
                                  fontWeight: '500'
                                }}
                                onClick={() => handleSelectProduct(index, prod)}
                              >
                                {getProductName(prod)} ({getProductPrice(prod)} Tk)
                              </div>
                            ))}
                          </div>
                        )}

                        {filteredPurchaseProds.length > 0 && (
                          <div className="suggestion-category" style={{ padding: '6px' }}>
                            <strong style={{ fontSize: '11px', color: '#1565c0' }}>Purchase Products</strong>
                            {filteredPurchaseProds.map((prod, pIdx) => (
                              <div
                                key={`pur-${prod.id || pIdx}`}
                                className="suggestion-item"
                                style={{
                                  padding: '6px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f9f9f9',
                                  fontSize: '13px',
                                  color: '#1565c0',
                                  fontWeight: '500'
                                }}
                                onClick={() => handleSelectProduct(index, prod)}
                              >
                                {getProductName(prod)} — Selling: ({getProductPrice(prod)} Tk)
                              </div>
                            ))}
                          </div>
                        )}

                        {filteredOfferProds.length === 0 && filteredPurchaseProds.length === 0 && (
                          <div style={{ padding: '8px', fontSize: '12px', color: '#d32f2f', textAlign: 'center' }}>
                            No product found
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      className="table-input text-center"
                      value={item.quantity ?? ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="table-input text-center"
                      value={item.unit || ''}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="table-input text-center"
                      value={item.price ?? ''}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                    />
                  </td>
                  <td className="cell-total text-center bold">{totalItemPrice.toLocaleString()}</td>
                  <td className="no-print text-center">
                    <button className="btn-delete" onClick={() => removeItemRow(index)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="bold text-center">Total Amount:</td>
              <td className="cell-total text-center bold">{grandTotal.toLocaleString()}</td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        <div className="add-row-container no-print">
          <button className="btn-add-row" onClick={addItemRow}>+ Add Item</button>
        </div>

        {/* Amount in Words */}
        <div className="in-words-section">
          <span className="bold">In Words: </span>
          <span>{numberToWords(grandTotal)}</span>
        </div>

        {/* Terms & Conditions Section */}
        <div className="notes-section page-break-avoid">
          <span className="bold">Terms & Conditions:</span>
          {notes.map((note, index) => (
            <div key={index} className="note-row">
              <span className="note-label">{index + 1}. </span>
              <input
                type="text"
                className="note-input"
                value={note || ''}
                onChange={(e) => handleNoteChange(index, e.target.value)}
              />
              <button className="btn-delete inline-delete no-print" onClick={() => removeNoteRow(index)}>✕</button>
            </div>
          ))}
          <div className="add-note-box no-print">
            <button className="btn-add-note" onClick={addNoteRow}>+ Add Term</button>
          </div>

          <div className="payment-mode">
            <span className="bold">Mode of Payment:</span>
            <div className="payment-line">
              <input
                type="text"
                name="mode"
                className="block-input"
                value={paymentMode.mode || ''}
                onChange={handlePaymentChange}
              />
            </div>
            <div className="payment-line">
              <input
                type="text"
                name="advance"
                className="block-input"
                value={paymentMode.advance || ''}
                onChange={handlePaymentChange}
              />
            </div>
            <div className="payment-line">
              <input
                type="text"
                name="handover"
                className="block-input"
                value={paymentMode.handover || ''}
                onChange={handlePaymentChange}
              />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="invoice-footer page-break-avoid">
          <div>
            <div className="seal-circle">osan</div>
            <p className="no-margin bold" style={{ fontSize: '11px' }}>Thanking You. Yours Truly</p>
          </div>
          <div>
            <div className="signature-line"></div>
            <p className="no-margin bold" style={{ fontSize: '11px', textAlign: 'center' }}>Receiver's Signature & Seal</p>
          </div>
        </div>

        {!isPdfPrinting && (
          <div className="bottom-contact no-pdf-img page-break-avoid">
            <img src={footer} alt="Footer" style={{ width: "100%" }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferInvoice;