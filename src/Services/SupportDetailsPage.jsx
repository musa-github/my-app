import { doc, getDoc } from "firebase/firestore";
import { useEffect, useParams, useRef, useState } from "react";
import { db } from "../Firebase/Firebase";
import { downloadInvoicePDF } from "../HndlePDF/HndlePDF";

function SupportDetailsPage() {
  const { requestId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!requestId) return;
      try {
        setLoading(true);
        const docRef = doc(db, "technicalSupportRequests", requestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [requestId]);

  const handleDownloadPDF = () => {
    downloadInvoicePDF({
      elementRef: printRef,
      fileName: `Support_Request_${requestId}`,
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#38bdf8" }}>
        <h3>Loading Support Document...</h3>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "#f87171" }}>
        <h2>Support Request Not Found or Expired!</h2>
      </div>
    );
  }

  const adminRes = data.adminResponse || {};
  const parts = adminRes.partsList || [];
  const grandTotal = adminRes.totalAmount || 0;

  const currentUrl = window.location.href;
  const shareMessage = `Hello ${data.userName || "Customer"},\nHere is your technical support document (ID: ${requestId}).\nView full details: ${currentUrl}`;
  const whatsappUrl = `https://wa.me/${data.phone ? data.phone.replace(/[^0-9]/g, "") : ""}?text=${encodeURIComponent(shareMessage)}`;
  const mailtoUrl = `mailto:${data.email || ""}?subject=${encodeURIComponent(`Support Report (ID: ${requestId})`)}&body=${encodeURIComponent(shareMessage)}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px 16px", color: "#0f172a" }}>
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        {/* Top Header Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ color: "#ffffff", margin: 0 }}>Support Document Preview</h3>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              style={{ padding: "8px 14px", background: "#25D366", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              WhatsApp
            </a>
            <a
              href={mailtoUrl}
              style={{ padding: "8px 14px", background: "#ea4335", color: "#fff", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              Email
            </a>
            <button
              onClick={handleDownloadPDF}
              style={{
                padding: "8px 16px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Dedicated Printable Area */}
        <div
          ref={printRef}
          data-pdf-content="true"
          style={{
            background: "#ffffff",
            padding: "32px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            color: "#0f172a",
          }}
        >
          <div style={{ borderBottom: "2px solid #0284c7", paddingBottom: "12px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, color: "#0284c7" }}>OSAN LIFT - Technical Support Report</h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>Request ID: {requestId}</p>
          </div>

          {/* Details Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b", borderBottom: "1px solid #cbd5e1" }}>User Details</h4>
              <p style={{ margin: "4px 0" }}><strong>Name:</strong> {data.userName || "N/A"}</p>
              <p style={{ margin: "4px 0" }}><strong>Email:</strong> {data.email || "N/A"}</p>
              <p style={{ margin: "4px 0" }}><strong>Phone:</strong> {data.phone || "N/A"}</p>
              <p style={{ margin: "4px 0" }}><strong>Category:</strong> {data.serviceCategory || "N/A"}</p>
              <p style={{ margin: "4px 0" }}><strong>Title:</strong> {data.serviceTitle || "N/A"}</p>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b", borderBottom: "1px solid #cbd5e1" }}>Status & Resolution</h4>
              <p style={{ margin: "4px 0" }}><strong>Status:</strong> <span style={{ color: "#16a34a", fontWeight: "bold" }}>{data.status}</span></p>
              <p style={{ margin: "8px 0 4px 0" }}><strong>Admin Notes:</strong></p>
              <div style={{ background: "#ffffff", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e1", color: "#334155" }}>
                {adminRes.problemNotes || "No notes provided."}
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
            <strong>Problem Description:</strong>
            <p style={{ margin: "6px 0 0 0", color: "#334155" }}>{data.problemDescription || "N/A"}</p>
          </div>

          <h4 style={{ color: "#0f172a", marginBottom: "10px" }}>Required Parts & Costing</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#0f172a" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>#</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "left" }}>Item Name</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>Qty</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>Price</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ border: "1px solid #cbd5e1", padding: "12px", textAlign: "center", color: "#94a3b8" }}>
                    No parts specified.
                  </td>
                </tr>
              ) : (
                parts.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{item.name}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>৳ {item.price}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>৳ {Number(item.quantity) * Number(item.price)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h3 style={{ textAlign: "right", color: "#16a34a", marginTop: "20px" }}>
            Grand Total: ৳ {grandTotal}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default SupportDetailsPage;