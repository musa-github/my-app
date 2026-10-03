import { doc, getDoc } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../Firebase/Firebase';
import { downloadInvoicePDF } from '../../HndlePDF/HndlePDF';
import styles from './TechnicalSupportQuotation.module.css';

export default function TechnicalSupportQuotation() {
  const { requestId } = useParams();
  const [data, setData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (requestId) {
        const docSnap = await getDoc(doc(db, "technicalSupportRequests", requestId));
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
      }
    };
    fetchData();
  }, [requestId]);

  if (!data) return <div className={styles.loading}>Loading Quotation...</div>;

  const handleDownload = () => {
    downloadInvoicePDF({
      elementRef: printRef,
      fileName: `Quotation_${data.userName}`,
      setIsPdfPrinting: setIsPdfPrinting
    });
  };

  return (
    <div className={styles.quotationWrapper}>
      <div className={styles.downloadBar}>
        <button onClick={handleDownload} className={styles.downloadBtn}>
          <Download size={18} /> Download PDF
        </button>
      </div>

      <div className={styles.pdfContainer} ref={printRef}>
        <div className={styles.headerBrand}>
          <h2>OSAN LIFT</h2>
          
          <p>Technical Service Quotation</p>
              <span style={{fontWeight:"bold",color:"#cd5432"}}>24/7 Call : 01610989538 </span>
        </div>

        <div className={styles.clientInfoGrid}>
          <div className={styles.infoBlock}>
            <h4>Client Information</h4>
            <p><strong>Name:</strong> {data.userName}</p>
            <p><strong>WhatsApp:</strong> {data.whatsapp}</p>
            <p><strong>Email:</strong> {data.email}</p>
          </div>
          <div className={styles.infoBlock}>
            <h4>Request Details</h4>
            <p><strong>Service:</strong> {data.serviceTitle}</p>
            <p><strong>Date:</strong> {data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Problem Description:</h4>
          <p className={styles.problemText}>{data.problemDetails}</p>
        </div>

        {data.quotationItems && data.quotationItems.length > 0 && (
          <div className={styles.section}>
            <h4>Cost Breakdown & Quotation</h4>
            <table className={styles.quotationTable}>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.quotationItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>৳ {item.price}</td>
                    <td>৳ {item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className={styles.grandTotal}>Grand Total: ৳ {data.grandTotal}</h3>
          </div>
        )}

        {data.suggestion && (
          <div className={`${styles.section} ${styles.suggestionSection}`}>
            <h4>Engineering Suggestions & Notes:</h4>
            <p>{data.suggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}