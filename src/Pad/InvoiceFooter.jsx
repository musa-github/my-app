import footer from "../assets/Footer.png";
import seal from "../assets/Seal.png";
import signature from "../assets/signature.png";

const InvoiceFooter = () => {
  return (
    <div className="page-break-avoid footer-section-wrap">
      <div className="invoice-footer">
        <div className="footer-left">
          <div className="seal-circle">
            <img className="seal-image" src={seal} alt="Seal" />
            <img className="seal-signature" src={signature} alt="Signature" />
          </div>
          <p>Thanking You. Yours Truly</p>
        </div>
        <div className="footer-center">
          <div className="signature-line"></div>
          <p>Receiver's Signature & Seal</p>
        </div>
      </div>

      <div className="bottom-contact">
        <img src={footer} alt="footer" style={{width:"100%"}} />
      </div>
    </div>
  );
};

export default InvoiceFooter;