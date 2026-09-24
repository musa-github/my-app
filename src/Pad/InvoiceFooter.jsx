import footer from "../assets/Footer.png";
const InvoiceFooter = () => {
  return (
    <div className="page-break-avoid footer-section-wrap">
      <div className="invoice-footer">
        <div className="footer-left">
          <div className="seal-circle">osan</div>
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