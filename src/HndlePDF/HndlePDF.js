import html2canvas from "html2canvas";
import html2pdf from 'html2pdf.js';
import jsPDF from "jspdf";

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

export const TechnicalSupportHandlePDF = async ({ elementRef, fileName }) => {
  if (!elementRef || !elementRef.current) return;

  const element = elementRef.current;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff", // PDF download-e white opacity fix
      onclone: (clonedDoc) => {
        // Force printable area to have crisp dark text & white bg
        const clonedElement = clonedDoc.querySelector(`[data-pdf-content="true"]`) || clonedDoc.body;
        clonedElement.style.color = "#0f172a";
        clonedElement.style.backgroundColor = "#ffffff";
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName || "Support_Request"}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
  }
};