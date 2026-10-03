import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  ArrowRight,
  Clock,
  Cpu,
  Send,
  Settings,
  ShieldCheck,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '../Firebase/Firebase';
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
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    whatsapp: '',
    problemDetails: '',
    refPic1: '',
    refPic2: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert File to Base64 String for storing in Firestore
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.userName || !formData.whatsapp || !formData.problemDetails) {
      alert("Please fill in all required fields (Name, WhatsApp, and Problem Details).");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "technicalSupportRequests"), {
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        serviceTag: selectedService.tag,
        userName: formData.userName,
        email: formData.email,
        whatsapp: formData.whatsapp,
        problemDetails: formData.problemDetails,
        refPic1: formData.refPic1,
        refPic2: formData.refPic2,
        status: "pending",
        hasUnreadNotification: true,
        createdAt: serverTimestamp()
      });

      alert("Your technical support request has been submitted successfully!");
      setFormData({ userName: '', email: '', whatsapp: '', problemDetails: '', refPic1: '', refPic2: '' });
      setSelectedService(null);
    } catch (error) {
      console.error("Error submitting support request:", error);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.servicesSection}>
      <Helmet>
        <title>Engineering & Elevator Services | Osan Lift</title>
      </Helmet>

      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Our Expertise</span>
          <h2 className={styles.title}>Engineering & Power Solutions Services</h2>
        </div>

        <div className={styles.grid}>
          {servicesData.map((service) => (
            <div key={service.id} className={styles.card}>
              <div>
                <div className={styles.cardTop}>
                  <div className={styles.iconWrapper}>{service.icon}</div>
                  <span className={styles.tag}>{service.tag}</span>
                </div>
                <h3 className={styles.cardTitle}>{service.title}</h3>
                <p className={styles.cardDescription}>{service.description}</p>
              </div>

              <div 
                className={styles.cardFooter} 
                onClick={() => setSelectedService(service)}
                role="button"
                tabIndex={0}
              >
                <span>Request Support</span>
                <ArrowRight className={styles.arrowIcon} />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Window with Two Columns */}
        {selectedService && (
          <div className={styles.modalOverlay} onClick={() => setSelectedService(null)}>
            <div className={styles.modalContentTwoCol} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeBtn} onClick={() => setSelectedService(null)}>
                <X size={20} />
              </button>

              {/* Left Column: Service Details */}
              <div className={styles.leftColumn}>
                <div className={styles.modalHeader}>
                  <div className={styles.iconWrapper}>{selectedService.icon}</div>
                  <div>
                    <span className={styles.tag}>{selectedService.tag}</span>
                    <h3 className={styles.modalTitle}>{selectedService.title}</h3>
                  </div>
                </div>

                <div className={styles.modalBody}>
                  <h4>Service Overview</h4>
                  <p>{selectedService.description}</p>
                  
                  <h4>Key Technical Specifications</h4>
                  <p>{selectedService.details}</p>
                </div>
              </div>

              {/* Right Column: Technical Support Request Form */}
              <div className={styles.rightColumn}>
                <h3 className={styles.formTitle}>Request Technical Support</h3>
                <form onSubmit={handleSubmitRequest} className={styles.supportForm}>
                  <div className={styles.inputGroup}>
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      name="userName" 
                      required 
                      value={formData.userName} 
                      onChange={handleInputChange} 
                      placeholder="Your Name" 
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="email@example.com" 
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>WhatsApp Number *</label>
                      <input 
                        type="text" 
                        name="whatsapp" 
                        required 
                        value={formData.whatsapp} 
                        onChange={handleInputChange} 
                        placeholder="017XXXXXXXX" 
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Problem / Requirement Details *</label>
                    <textarea 
                      name="problemDetails" 
                      rows="3" 
                      required 
                      value={formData.problemDetails} 
                      onChange={handleInputChange} 
                      placeholder="Describe issue or required service..." 
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Ref Picture 1</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'refPic1')} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Ref Picture 2</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'refPic2')} />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    <Send size={16} /> {isSubmitting ? "Submitting..." : "Submit Support Request"}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Services;