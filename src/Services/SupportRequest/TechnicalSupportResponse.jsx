import { doc, updateDoc } from 'firebase/firestore';
import { ExternalLink, Plus, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRequest } from '../../Fetures/Inventory/supportSlice';
import { db } from '../../Firebase/Firebase';
import styles from './TechnicalSupportResponse.module.css';

export default function TechnicalSupportResponse() {
  const dispatch = useDispatch();

  const requests = useSelector((state) => state.support?.supportRequests || []);
  const selectedReq = useSelector((state) => state.support?.selectedRequest);

  const [items, setItems] = useState([{ name: '', qty: 1, price: 0, total: 0 }]);
  const [suggestion, setSuggestion] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [status, setStatus] = useState('pending'); // Status Local State

  useEffect(() => {
    if (selectedReq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestion(selectedReq.suggestion || '');
      setStatus(selectedReq.status || 'pending');
      if (selectedReq.quotationItems && selectedReq.quotationItems.length > 0) {
        setItems(selectedReq.quotationItems);
      } else {
        setItems([{ name: '', qty: 1, price: 0, total: 0 }]);
      }

      if (selectedReq.hasUnreadNotification) {
        updateDoc(doc(db, "technicalSupportRequests", selectedReq.id), {
          hasUnreadNotification: false,
        });
      }
    }
  }, [selectedReq]);

  const handleSelectRequest = (req) => {
    dispatch(setSelectedRequest(req));
  };

  // Status সরাসরী Firestore-এ আপডেট করার ফাংশন
  const handleStatusChange = async (newStatus) => {
    if (!selectedReq) return;
    setStatus(newStatus);
    try {
      await updateDoc(doc(db, "technicalSupportRequests", selectedReq.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'qty' || field === 'price') {
      const qty = Number(updated[index].qty) || 0;
      const price = Number(updated[index].price) || 0;
      updated[index].total = qty * price;
    }
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', qty: 1, price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSendResponse = async () => {
    if (!selectedReq) return;

    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const quotationUrl = `${window.location.origin}/technical-support-quotation/${selectedReq.id}`;

    try {
      await updateDoc(doc(db, "technicalSupportRequests", selectedReq.id), {
        quotationItems: items,
        suggestion: suggestion,
        grandTotal: grandTotal,
        status: status === 'pending' ? 'responded' : status,
        updatedAt: new Date().toISOString(),
      });

      setGeneratedLink(quotationUrl);

      const whatsappText = encodeURIComponent(
        `Hello ${selectedReq.userName},\nWe have prepared the quotation for your request (${selectedReq.serviceTitle}).\n\nView and Download Quotation Here: ${quotationUrl}`
      );

      const cleanPhone = selectedReq.whatsapp.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;

      window.open(`https://wa.me/${formattedPhone}?text=${whatsappText}`, '_blank');
    } catch (error) {
      console.error("Error saving response:", error);
      alert("Failed to send response.");
    }
  };

  return (
    <div className={styles.adminResponseContainer}>
      {/* Sidebar Request List */}
      <div className={styles.requestsSidebar}>
        <h3>Support Requests</h3>
        {requests.map((req) => (
          <div
            key={req.id}
            className={`${styles.requestCard} ${selectedReq?.id === req.id ? styles.active : ''}`}
            onClick={() => handleSelectRequest(req)}
          >
            <strong>{req.userName}</strong>
            <p>{req.serviceTitle}</p>
            <div className={styles.cardFooter}>
              <small>{req.whatsapp}</small>
              <span className={`${styles.statusBadge} ${styles[req.status || 'pending']}`}>
                {req.status || 'pending'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={styles.responseMain}>
        {selectedReq ? (
          <div className={styles.twoColLayout}>
            {/* Left: User Request Details */}
            <div className={styles.userRequestDetails}>
              <h2>User Request Details</h2>
              <div className={styles.detailRow}>
                <strong>Name:</strong> {selectedReq.userName}
              </div>
              <div className={styles.detailRow}>
                <strong>Email:</strong> {selectedReq.email}
              </div>
              <div className={styles.detailRow}>
                <strong>WhatsApp:</strong> {selectedReq.whatsapp}
              </div>
              <div className={styles.detailRow}>
                <strong>Service:</strong> {selectedReq.serviceTitle}
              </div>
              <div className={styles.detailRow}>
                <strong>Problem:</strong> {selectedReq.problemDetails}
              </div>

              {/* Request Status Dropdown */}
              <div className={styles.detailRow} style={{ marginTop: '16px' }}>
                <strong>Request Status:</strong>
                <select
                  className={styles.statusSelect}
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                  <option value="in_progress">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              {(selectedReq.refPic1 || selectedReq.refPic2) && (
                <div className={styles.picPreview}>
                  {selectedReq.refPic1 && <img src={selectedReq.refPic1} alt="Reference 1" />}
                  {selectedReq.refPic2 && <img src={selectedReq.refPic2} alt="Reference 2" />}
                </div>
              )}
            </div>

            {/* Right: Answer / Quotation Form */}
            <div className={styles.adminAnswerForm}>
              <h2>Create Quotation & Response</h2>

              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style={{ width: '75px' }}>Qty</th>
                    <th style={{ width: '90px' }}>Price</th>
                    <th style={{ width: '70px' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Item description"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputField}
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.inputField}
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        />
                      </td>
                      <td>
                        <strong>৳{item.total}</strong>
                      </td>
                      <td>
                        <button className={styles.deleteBtn} onClick={() => handleRemoveItem(index)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button className={styles.addRowBtn} onClick={handleAddItem}>
                <Plus size={16} /> Add Item
              </button>

              <div className={styles.suggestionBox}>
                <label>Engineering Suggestion / Note:</label>
                <textarea
                  rows="3"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Enter suggestions or technical notes..."
                />
              </div>

              <button className={styles.sendBtn} onClick={handleSendResponse}>
                <Send size={16} /> Save & Send to WhatsApp
              </button>

              {generatedLink && (
                <div className={styles.linkBox}>
                  <p>Quotation Link Generated:</p>
                  <a href={generatedLink} target="_blank" rel="noreferrer">
                    {generatedLink} <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.emptySelection}>
            Please select a support request from the left sidebar to view details and create a response.
          </div>
        )}
      </div>
    </div>
  );
}