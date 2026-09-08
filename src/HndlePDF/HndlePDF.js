import html2pdf from 'html2pdf.js';

/**
 * Generates and downloads a PDF from a given React ref element.
 * 
 * @param {Object} options
 * @param {React.RefObject} options.elementRef - Invoice container-এর React ref
 * @param {string} options.fileName - PDF ডাউনলোডের ফাইল নেম
 * @param {Function} options.setIsPdfPrinting - State update callback (PDF তৈরি শুরু/শেষ চিহ্নিত করার জন্য)
 */
export const downloadInvoicePDF = ({ elementRef, fileName = 'Invoice_Bill', setIsPdfPrinting }) => {
  if (!elementRef || !elementRef.current) {
    console.error('Invoice element reference not found.');
    return;
  }

  // Set printing mode to hide interactive fields
  if (setIsPdfPrinting) {
    setIsPdfPrinting(true);
  }

  setTimeout(() => {
    const element = elementRef.current;
    const pdfOptions = {
      margin: 0,
      filename: `${fileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(pdfOptions)
      .from(element)
      .save()
      .then(() => {
        if (setIsPdfPrinting) setIsPdfPrinting(false);
      })
      .catch((err) => {
        console.error('PDF Generation Error:', err);
        if (setIsPdfPrinting) setIsPdfPrinting(false);
      });
  }, 150);
};