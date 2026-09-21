import logo from '../assets/main-logo.png';

const InvoiceHeader = ({ isPdfPrinting, editableHeader, handleHeaderChange }) => {
  return (
    <>
      <div className="company-header">
        <div className="logo-box">
          <img src={logo} alt="Company Logo" className="logo-img" />
        </div>
        <div className="company-info">
          <h1 className="company-title" style={{fontSize:"56px"}}>H.R.ENGINEERS</h1>
          <p className="company-services">■ Lift ■ ARD ■ Generator ■ Escalator ■ Service & Maintenance ■ Spare Parts</p>
        </div>
      </div>

      <div className="document-type">BILL / INVOICE</div>

      <div className="info-section">
        <div className="meta-info-grid">
          <div>
            <strong>Invoice No: </strong>
            {isPdfPrinting ? (
              editableHeader.invoiceNo
            ) : (
              <input 
                type="text" 
                className="table-input bold" 
                value={editableHeader.invoiceNo} 
                onChange={(e) => handleHeaderChange('invoiceNo', e.target.value)} 
              />
            )}
          </div>
          <div>
            <strong>Date: </strong>
            {isPdfPrinting ? (
              editableHeader.date
            ) : (
              <input 
                type="text" 
                className="table-input" 
                value={editableHeader.date} 
                onChange={(e) => handleHeaderChange('date', e.target.value)} 
              />
            )}
          </div>
        </div>

        <div className="to-address">
          <p className="no-margin"><strong>To,</strong></p>
          {isPdfPrinting ? (
            <>
              <div className="bold">{editableHeader.toCompany}</div>
              <div>{editableHeader.address}</div>
            </>
          ) : (
            <>
              <input 
                type="text" 
                className="table-input bold" 
                value={editableHeader.toCompany} 
                placeholder="Company Name"
                onChange={(e) => handleHeaderChange('toCompany', e.target.value)} 
              />
              <input 
                type="text" 
                className="table-input" 
                value={editableHeader.address} 
                placeholder="Address"
                onChange={(e) => handleHeaderChange('address', e.target.value)} 
              />
            </>
          )}
        </div>

        <div className="subject-line">
          <strong>Sub: </strong>
          {isPdfPrinting ? (
            <span className="bold">{editableHeader.subject}</span>
          ) : (
            <input 
              type="text" 
              className="table-input bold" 
              value={editableHeader.subject} 
              onChange={(e) => handleHeaderChange('subject', e.target.value)} 
            />
          )}
        </div>

        <div className="salutation">
          Dear Sir,<br />
          We would like to submit our bill as per the following basis:
        </div>
      </div>
    </>
  );
};

export default InvoiceHeader;