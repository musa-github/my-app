/* eslint-disable react-hooks/rules-of-hooks */
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../Firebase/Firebase";
import styles from "./SupportResponseModal.module.css";

function SupportResponseModal({ request, onClose, onRefresh }) {
  if (!request) return null;

  const isAlreadySaved = Boolean(request?.adminResponse?.updatedAt);

   
  const [status, setStatus] = useState(request?.status || "Processing");
  const [problemNotes, setProblemNotes] = useState(request?.adminResponse?.problemNotes || "");
  const [partsList, setPartsList] = useState(
    request?.adminResponse?.partsList || [{ name: "", quantity: 1, price: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatedLink = `${window.location.origin}/support-details/${request.id}`;

  const shareMessage = `Hello ${request.userName || "Customer"},\nHere is the resolution update for your support request (ID: ${request.id}).\nCheck full details here: ${generatedLink}`;
  const whatsappUrl = `https://wa.me/${request.phone ? request.phone.replace(/[^0-9]/g, "") : ""}?text=${encodeURIComponent(shareMessage)}`;
  const mailtoUrl = `mailto:${request.email || ""}?subject=${encodeURIComponent(`Support Request Resolution (ID: ${request.id})`)}&body=${encodeURIComponent(shareMessage)}`;

  const handleAddPart = () => {
    setPartsList([...partsList, { name: "", quantity: 1, price: 0 }]);
  };

  const handlePartChange = (index, field, value) => {
    const updated = [...partsList];
    updated[index][field] = field === "name" ? value : Number(value);
    setPartsList(updated);
  };

  const handleRemovePart = (index) => {
    setPartsList(partsList.filter((_, i) => i !== index));
  };

  const totalAmount = partsList.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  const handleSaveResponse = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, "technicalSupportRequests", request.id);

      await updateDoc(docRef, {
        status: status,
        adminResponse: {
          problemNotes,
          partsList,
          totalAmount,
          updatedAt: new Date().toISOString(),
        },
      });

      setSaving(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error("Error saving response:", err);
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>Request Resolution (ID: {request.id})</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {isAlreadySaved ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <h4 style={{ color: "#16a34a", marginBottom: "8px" }}>
                ✓ Resolution Details Already Saved!
              </h4>
              <p style={{ color: "#64748b", margin: "4px 0" }}>
                Status: <strong>{request.status}</strong>
              </p>

              <div style={{ display: "flex", gap: "8px", margin: "20px 0", justifyContent: "center" }}>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  style={{ width: "70%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{ padding: "10px 16px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "16px 0" }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: "10px 16px", background: "#25D366", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}
                >
                  Send via WhatsApp
                </a>

                <a
                  href={mailtoUrl}
                  style={{ padding: "10px 16px", background: "#ea4335", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}
                >
                  Send via Email
                </a>
              </div>

              <div style={{ marginTop: "16px" }}>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#2563eb", fontWeight: "bold", textDecoration: "none" }}
                >
                  Preview Dedicated Page ↗
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <label><strong>Status:</strong></label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px" }}
                >
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed (Remove from Active Admin List)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label><strong>Technical Assessment / Notes:</strong></label>
                <textarea
                  rows="3"
                  value={problemNotes}
                  onChange={(e) => setProblemNotes(e.target.value)}
                  placeholder="Enter problem analysis..."
                  style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px" }}
                />
              </div>

              <h4>Required Parts & Pricing</h4>
              {partsList.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="Part Name"
                    value={item.name}
                    onChange={(e) => handlePartChange(idx, "name", e.target.value)}
                    style={{ flex: 2, padding: "6px" }}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handlePartChange(idx, "quantity", e.target.value)}
                    style={{ width: "60px", padding: "6px" }}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => handlePartChange(idx, "price", e.target.value)}
                    style={{ width: "100px", padding: "6px" }}
                  />
                  <button onClick={() => handleRemovePart(idx)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px" }}>✕</button>
                </div>
              ))}

              <button onClick={handleAddPart} style={{ marginBottom: "16px", background: "#cbd5e1", border: "none", padding: "6px 12px", borderRadius: "4px" }}>
                + Add Part
              </button>

              <div style={{ textAlign: "right", fontSize: "1.1rem", fontWeight: "bold", marginBottom: "20px" }}>
                Total: ৳ {totalAmount}
              </div>

              <button
                onClick={handleSaveResponse}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving Response..." : "Save Resolution & Generate Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupportResponseModal;