import {
  ArrowRight,
  Clock,
  Cpu,
  MessageSquare,
  PhoneCall,
  Settings,
  ShieldCheck,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './Services.module.css';

const servicesData = [
  {
    id: 1,
    title: "New Lift Installation",
    description: "Complete modern elevator setup with high-grade safety standards and smooth operational performance for residential & commercial buildings.",
    details: "We offer end-to-end elevator installation including shaft measurement, structural engineering, high-efficiency traction systems, custom cabin design, and safety certification.",
    icon: <Zap size={24} />,
    tag: "Installation"
  },
  {
    id: 2,
    title: "Automatic Rescue Device (ARD)",
    description: "Advanced ARD systems ensuring safe passenger evacuation to the nearest floor during sudden power outages.",
    details: "Our intelligent ARD units detect power supply failure instantly, switch smoothly to internal battery back-up, and bring the cabin safely to the nearest floor level.",
    icon: <Cpu size={24} />,
    tag: "Power Solution"
  },
  {
    id: 3,
    title: "Generator & Power Backup",
    description: "Reliable industrial and commercial generator supply, setup, and control system integration.",
    details: "High-capacity diesel and industrial power backup integration for heavy duty commercial power requirements, equipped with Automatic Transfer Switches (ATS).",
    icon: <Settings size={24} />,
    tag: "Power Solution"
  },
  {
    id: 4,
    title: "Elevator Spare Parts & Controller",
    description: "Genuine inverters, motherboards, encoders, and door operators for all major elevator brands.",
    details: "We stock authentic components from Fuji, Monarch, Yaskawa, Arkel, and ThyssenKrupp controllers, encoders, guide shoes, door drives, and safety sensors.",
    icon: <Wrench size={24} />,
    tag: "Parts Supply"
  },
  {
    id: 5,
    title: "Comprehensive Maintenance & AMC",
    description: "Routine inspections, testing, preventive repairs, and emergency support to minimize downtime.",
    details: "Annual Maintenance Contracts (AMC) with scheduled periodic checks, lubrications, wire rope inspections, safety gear testing, and priority breakdown assistance.",
    icon: <ShieldCheck size={24} />,
    tag: "Maintenance"
  },
  {
    id: 6,
    title: "24/7 Emergency Technical Support",
    description: "Quick breakdown response and technical troubleshooting by certified engineering specialists.",
    details: "Dedicated emergency rapid-response unit for instant troubleshooting, passenger entrapment relief, controller parameter configuration, and hardware repair.",
    icon: <Clock size={24} />,
    tag: "Support"
  }
];

const PHONE_NUMBER = "01610989538";
const WHATSAPP_NUMBER = "8801610989538";

function Services() {
  const [selectedService, setSelectedService] = useState(null);

  // Prevent background scrolling when modal is open on mobile
  useEffect(() => {
    if (selectedService) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedService]);

  const handleOpenWhatsApp = (serviceTitle) => {
    const text = encodeURIComponent(`Hello! I need information regarding: ${serviceTitle || "Engineering Services"}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  return (
    <section className={styles.servicesSection}>
      <div className={styles.container}>
        
        {/* Header Section */}
        <div className={styles.header}>
          <span className={styles.badge}>Our Expertise</span>
          <h2 className={styles.title}>Engineering & Power Solutions Services</h2>
          <p className={styles.subtitle}>
            We deliver top-tier elevator setup, automatic rescue devices, generator integration, and specialized technical support for uninterrupted reliability.
          </p>
        </div>

        {/* Services Grid */}
        <div className={styles.grid}>
          {servicesData.map((service) => (
            <div key={service.id} className={styles.card}>
              <div>
                <div className={styles.cardTop}>
                  <div className={styles.iconWrapper}>
                    {service.icon}
                  </div>
                  <span className={styles.tag}>{service.tag}</span>
                </div>

                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardDescription}>{service.description}</p>
              </div>

              {/* Card Footer */}
              <div 
                className={styles.cardFooter} 
                onClick={() => setSelectedService(service)}
                role="button"
                tabIndex={0}
              >
                <span>Learn More</span>
                <ArrowRight className={styles.arrowIcon} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className={styles.ctaBanner}>
          <h3 className={styles.ctaTitle}>Need Custom Elevator Parts or Emergency Service?</h3>
          <p className={styles.ctaText}>
            Get in touch with our operations team for immediate assistance or technical consultation.
          </p>
          <div className={styles.ctaActionGroup}>
            <button className={styles.ctaBtn} onClick={() => handleOpenWhatsApp("Emergency Consultation")}>
              <MessageSquare size={18} /> WhatsApp Chat
            </button>
            <button className={styles.ctaCallBtn} onClick={handleCall}>
              <PhoneCall size={18} /> Call Us ({PHONE_NUMBER})
            </button>
          </div>
        </div>

        {/* Details Modal / Popup */}
        {selectedService && (
          <div className={styles.modalOverlay} onClick={() => setSelectedService(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeBtn} onClick={() => setSelectedService(null)}>
                <X size={20} />
              </button>
              
              <div className={styles.modalHeader}>
                <div className={styles.iconWrapper}>
                  {selectedService.icon}
                </div>
                <div>
                  <span className={styles.tag}>{selectedService.tag}</span>
                  <h3 className={styles.modalTitle}>{selectedService.title}</h3>
                </div>
              </div>

              <div className={styles.modalBody}>
                <h4>Service Overview</h4>
                <p>{selectedService.description}</p>
                
                <h4>Key Technical Details</h4>
                <p>{selectedService.details}</p>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.whatsappBtn} 
                  onClick={() => handleOpenWhatsApp(selectedService.title)}
                >
                  <MessageSquare size={18} /> Contact on WhatsApp
                </button>
                <button className={styles.phoneBtn} onClick={handleCall}>
                  <PhoneCall size={18} /> Direct Call
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default Services;