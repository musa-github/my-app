import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  PhoneCall,
  Send,
  Settings,
  ShieldCheck,
  User,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { addDoc, collection, db, serverTimestamp, Timestamp } from '../Firebase/Firebase';
import styles from './Services.module.css';

const servicesData = [
  {
    id: 1,
    title: "New Lift Installation",
    description: "Complete modern elevator setup with high-grade safety standards and smooth operational performance for residential & commercial buildings.",
    details: "We offer end-to-end elevator installation including shaft measurement, structural engineering, high-efficiency traction systems, custom cabin design, and safety certification.",
    icon: <Zap size={24} />,
    tag: "Installation",
    features: ["Shaft & Core Engineering Inspection", "High-Efficiency Traction Engine Setup", "Custom Cabin & COP/LOP Design", "Safety Certification & Load Testing"]
  },
  {
    id: 2,
    title: "Automatic Rescue Device (ARD)",
    description: "Advanced ARD systems ensuring safe passenger evacuation to the nearest floor during sudden power outages.",
    details: "Our intelligent ARD units detect power supply failure instantly, switch smoothly to internal battery back-up, and bring the cabin safely to the nearest floor level.",
    icon: <Cpu size={24} />,
    tag: "Power Solution",
    features: ["Instant Power Failure Sensing", "Automatic Battery Health Monitoring", "Smooth Nearest Floor Leveling", "Emergency Intercom & Light Control"]
  },
  {
    id: 3,
    title: "Generator & Power Backup",
    description: "Reliable industrial and commercial generator supply, setup, and control system integration.",
    details: "High-capacity diesel and industrial power backup integration for heavy duty commercial power requirements, equipped with Automatic Transfer Switches (ATS).",
    icon: <Settings size={24} />,
    tag: "Power Solution",
    features: ["Heavy Duty Generator Supply", "Automatic Transfer Switch (ATS) Setup", "Load Calculation & Wiring Layout", "Periodic Electrical Maintenance"]
  },
  {
    id: 4,
    title: "Elevator Spare Parts & Controller",
    description: "Genuine inverters, motherboards, encoders, and door operators for all major elevator brands.",
    details: "We stock authentic components from Fuji, Monarch, Yaskawa, Arkel, and ThyssenKrupp controllers, encoders, guide shoes, door drives, and safety sensors.",
    icon: <Wrench size={24} />,
    tag: "Parts Supply",
    features: ["Monarch & Arkel Mainboard Configuration", "Fuji & Yaskawa VFD Tuning", "Jarless-Con Door Drive Setup", "Original Sensor & Guide Shoe Supply"]
  },
  {
    id: 5,
    title: "Comprehensive Maintenance & AMC",
    description: "Routine inspections, testing, preventive repairs, and emergency support to minimize downtime.",
    details: "Annual Maintenance Contracts (AMC) with scheduled periodic checks, lubrications, wire rope inspections, safety gear testing, and priority breakdown assistance.",
    icon: <ShieldCheck size={24} />,
    tag: "Maintenance",
    features: ["Monthly Preventive Inspection Routine", "Safety Brake & Wire Rope Testing", "Free Replacement under AMC Policy", "24/7 Priority Emergency Support"]
  },
  {
    id: 6,
    title: "24/7 Emergency Technical Support",
    description: "Quick breakdown response and technical troubleshooting by certified engineering specialists.",
    details: "Dedicated emergency rapid-response unit for instant troubleshooting, passenger entrapment relief, controller parameter configuration, and hardware repair.",
    icon: <Clock size={24} />,
    tag: "Support",
    features: ["Rapid On-Site Technical Deployment", "Passenger Entrapment Relief Unit", "Error Code & Parameter Diagnostics", "Emergency Electrical Rewiring"]
  }
];

const PHONE_NUMBER = "01610989538";
const WHATSAPP_NUMBER = "8801610989538";

function Services() {
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    problem: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Lock background scroll when modal is active
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleModalClose = () => {
    setSelectedService(null);
    setSuccessMsg('');
    setFormData({ name: '', phone: '', email: '', problem: '' });
    setImageFile(null);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      let uploadedImageUrl = '';

      // Optional Cloudinary Upload
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('file', imageFile);
        uploadData.append('upload_preset', 'your_cloudinary_preset');

        try {
          const res = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
            method: 'POST',
            body: uploadData
          });
          const fileData = await res.json();
          uploadedImageUrl = fileData.secure_url || '';
        } catch (err) {
          console.warn('Image upload skipped or failed, submitting form without image', err);
        }
      }

      const now = new Date();
      // Calculate 10 days expiry date for Firestore TTL
      const expiresAtDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      // Save to Firestore 'technicalSupportRequests' collection
      await addDoc(collection(db, 'technicalSupportRequests'), {
        userName: formData.name,
        phone: formData.phone,
        email: formData.email || 'N/A',
        serviceTitle: selectedService ? selectedService.title : 'General Request',
        serviceCategory: selectedService ? selectedService.tag : 'General',
        problemDescription: formData.problem,
        imageUrl: uploadedImageUrl,
        status: 'Pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAtDate) // Used by Firestore TTL & Client filter
      });

      setSuccessMsg('Request submitted successfully! Our engineering team will contact you shortly.');
      setFormData({ name: '', phone: '', email: '', problem: '' });
      setImageFile(null);
      
      setTimeout(() => {
        handleModalClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving request to Firestore: ', error);
      alert('Failed to submit request. Please check network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.servicesSection}>
      <Helmet>
        <title>Engineering & Elevator Services | Osan Lift</title>
      </Helmet>

      <div className={styles.container}>
        
        {/* Header */}
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

              <div 
                className={styles.cardFooter} 
                onClick={() => setSelectedService(service)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedService(service); }}
                role="button"
                tabIndex={0}
              >
                <span>Request Support & Info</span>
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

        {/* Split Two-Column Interactive Modal */}
        {selectedService && (
          <div className={styles.modalOverlay} onClick={handleModalClose} role="presentation">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button className={styles.closeBtn} onClick={handleModalClose}>
                <X size={20} />
              </button>

              <div className={styles.modalSplitGrid}>
                
                {/* Left Side: Information & Scope */}
                <div className={styles.modalLeftColumn}>
                  <div className={styles.serviceMetaHeader}>
                    <div className={styles.modalIconBox}>
                      {selectedService.icon}
                    </div>
                    <div>
                      <span className={styles.modalBadge}>{selectedService.tag}</span>
                      <h3 className={styles.modalTitle}>{selectedService.title}</h3>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <h4>Service Overview</h4>
                    <p>{selectedService.description}</p>

                    <h4>Key Technical Scope</h4>
                    <p>{selectedService.details}</p>

                    <h4>Key Features & Highlights</h4>
                    <ul className={styles.featureList}>
                      {selectedService.features.map((feat, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={16} className={styles.checkIcon} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.directContactRow}>
                    <button type="button" className={styles.directCallBtn} onClick={handleCall}>
                      <PhoneCall size={16} /> Direct Call
                    </button>
                    <button type="button" className={styles.directWaBtn} onClick={() => handleOpenWhatsApp(selectedService.title)}>
                      <MessageSquare size={16} /> WhatsApp
                    </button>
                  </div>
                </div>

                {/* Right Side: Request Support Form */}
                <div className={styles.modalRightColumn}>
                  <div className={styles.formHeader}>
                    <h3>Submit Request / Inquiry</h3>
                    <p>Fill out the form below to request support for <strong>{selectedService.title}</strong>.</p>
                  </div>

                  {successMsg ? (
                    <div className={styles.successBox}>
                      <CheckCircle2 size={36} />
                      <p>{successMsg}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className={styles.supportForm}>
                      <div className={styles.inputGroup}>
                        <label><User size={14} /> Full Name *</label>
                        <input 
                          type="text" 
                          name="name" 
                          required 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="e.g. S.M. Abu Musa" 
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label><PhoneCall size={14} /> Phone Number *</label>
                        <input 
                          type="tel" 
                          name="phone" 
                          required 
                          value={formData.phone} 
                          onChange={handleInputChange} 
                          placeholder="017XXXXXXXX" 
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label><FileText size={14} /> Email Address (Optional)</label>
                        <input 
                          type="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          placeholder="example@domain.com" 
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label><MessageSquare size={14} /> Details / Issues You Want to Know *</label>
                        <textarea 
                          name="problem" 
                          rows="3" 
                          required 
                          value={formData.problem} 
                          onChange={handleInputChange} 
                          placeholder="Describe your inquiry, error code, or lift configuration needed..."
                        ></textarea>
                      </div>

                      <div className={styles.inputGroup}>
                        <label><ImageIcon size={14} /> Attach Reference Picture (Optional)</label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className={styles.fileInput}
                        />
                      </div>

                      <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 size={18} className={styles.spinner} /> Submitting Request...
                          </>
                        ) : (
                          <>
                            <Send size={18} /> Submit Technical Request
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export default Services;