
const InvoiceFooter = () => {
  return (
    <div className="page-break-avoid footer-section-wrap">
      <div className="invoice-footer">
        <div className="footer-left">
          <div className="seal-circle">H.R.E</div>
          <p>Thanking You. Yours Truly</p>
        </div>
        <div className="footer-center">
          <div className="signature-line"></div>
          <p>Receiver's Signature & Seal</p>
        </div>
      </div>

      <div className="bottom-contact">
        <p>📞 01711131536, 01407000021 | ✉️ hrengineersbd@gmail.com</p>
        <p>📍 202/1, South Borua, Hazibari, Khilkhet, Dhaka-1229</p>
      </div>
    </div>
  );
};

export default InvoiceFooter;