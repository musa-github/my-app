import { MessageSquare, PhoneCall, X } from "lucide-react";
import Style from "../Home.module.css";

const PHONE_NUMBER = "01610989538";
const WHATSAPP_NUMBER = "8801610989538";

const ServiceModal = ({ isOpen, onClose, itemData }) => {
  if (!isOpen || !itemData) return null;

  const handleOpenWhatsApp = (title) => {
    const text = encodeURIComponent(`Hello OSAN LIFT! I need information about: ${title || "Elevator Services"}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={Style.modalOverlay} onClick={onClose} role="presentation">
      <div className={Style.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <button className={Style.closeBtn} onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        <div className={Style.modalHeader}>
          {itemData.tag && <span className={Style.modalTag}>{itemData.tag}</span>}
          <h3 id="service-modal-title" className={Style.modalTitle}>{itemData.title}</h3>
        </div>
        <div className={Style.modalBody}>
          <h4>Overview</h4><p>{itemData.description}</p>
          {itemData.details && <><h4>Technical Scope</h4><p>{itemData.details}</p></>}
        </div>
        <div className={Style.modalFooter}>
          <button className={Style.whatsappBtn} onClick={() => handleOpenWhatsApp(itemData.title)}><MessageSquare size={18} /> WhatsApp Chat</button>
          <button className={Style.phoneBtn} onClick={() => { window.location.href = `tel:${PHONE_NUMBER}`; }}><PhoneCall size={18} /> Direct Call</button>
        </div>
      </div>
    </div>
  );
};
export default ServiceModal;
