import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AboutSection from "./components/AboutSection";
import CtaSection from "./components/CtaSection";
import ElevatorSection from "./components/ElevatorSection";
import HeroSection from "./components/HeroSection";
import ServiceModal from "./components/ServiceModal";
import ServicesSection from "./components/ServicesSection";
import StatsSection from "./components/StatsSection";
import TechSection from "./components/TechSection";
import Style from "./Home.module.css";

const servicesData = [
  { id: "s1", number: "01", title: "Elevator Installation", description: "Complete elevator installation with careful commissioning and safety-focused setup.", details: "We support site coordination, rail and machine installation, control panel configuration, door system setup, testing and commissioning." },
  { id: "s2", number: "02", title: "Maintenance & AMC", description: "Planned maintenance and responsive breakdown support to keep your lift dependable.", details: "Routine inspection, adjustment, lubrication, fault diagnosis, door operator service and preventive maintenance support." },
  { id: "s3", number: "03", title: "Modernization", description: "Upgrade older elevators with modern controllers, drives, ARD and improved operating systems.", details: "Modernization can include controller replacement, VVVF drive integration, ARD, encoder setup, indicators and related control-system upgrades." },
  { id: "s4", number: "04", title: "Control System Solutions", description: "Technical support for elevator control, commissioning, troubleshooting and system conversion.", details: "Technical support for Nice and Arkel based elevator control solutions, commissioning, parameter configuration and fault diagnosis." }
];

const portfolioData = [
  { id: "p1", tag: "PASSENGER", title: "Passenger Elevator", description: "Comfortable and reliable vertical transportation for residential and commercial buildings.", details: "Passenger lift solutions can be configured around building requirements, capacity, travel, door arrangement and control architecture.", image: "https://images.unsplash.com/photo-1592256410394-51c948ec13d5?w=900&auto=format&fit=crop&q=80" },
  { id: "p2", tag: "RESIDENTIAL", title: "Home Elevator", description: "Space-conscious lift solutions designed to complement modern residential buildings.", details: "Home lift configurations can be tailored to available shaft space, capacity, travel and interior requirements.", image: "https://images.unsplash.com/photo-1547630824-eed1be6a27b0?w=900&auto=format&fit=crop&q=80" },
  { id: "p3", tag: "HEALTHCARE", title: "Hospital Elevator", description: "Practical lift systems for smooth and dependable movement in healthcare environments.", details: "Hospital lift requirements can include larger cabin dimensions, suitable door opening, priority operation and emergency provisions.", image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=900&auto=format&fit=crop&q=80" },
  { id: "p4", tag: "HEAVY DUTY", title: "Goods & Freight Lift", description: "Heavy-duty vertical transportation for commercial, industrial and warehouse applications.", details: "Freight lift solutions can be configured around load capacity, cabin dimensions, door arrangement and operating environment.", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&auto=format&fit=crop&q=80" }
];

const PHONE_NUMBER = "01610989538";
const WHATSAPP_NUMBER = "8801610989538";

const Home = () => {
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  const handleOpenWhatsApp = (title) => {
    const text = encodeURIComponent(`Hello OSAN LIFT! I need information about: ${title || "Elevator Services"}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "OSAN LIFT",
    "telephone": PHONE_NUMBER,
    "description": "Elevator installation, maintenance, modernization and control-system solutions.",
    "url": "https://osanlift-38.web.app/"
  };

  return (
    <main className={Style.homeContainer}>
      <Helmet>
        <title>OSAN LIFT | Elevator Installation, Maintenance & Modernization</title>
        <meta name="description" content="OSAN LIFT provides elevator installation, maintenance, modernization and elevator control-system solutions in Bangladesh." />
        <meta name="keywords" content="OSAN LIFT, elevator Bangladesh, lift installation, lift maintenance, elevator modernization, Nice elevator control, Arkel elevator control" />
        <meta property="og:title" content="OSAN LIFT | Elevator Solutions" />
        <meta property="og:description" content="Professional elevator installation, maintenance, modernization and control-system solutions." />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <HeroSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <StatsSection Style={Style} />
      <AboutSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <ServicesSection Style={Style} servicesData={servicesData} onSelectService={setSelectedModalItem} />
      <ElevatorSection Style={Style} portfolioData={portfolioData} onSelectPortfolio={setSelectedModalItem} />
      <TechSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <CtaSection Style={Style} phoneNumber={PHONE_NUMBER} onWhatsAppClick={handleOpenWhatsApp} onCallClick={handleCall} />

      <div className={Style.floatingContact} aria-label="Quick contact">
        <button className={Style.floatingWhatsApp} onClick={() => handleOpenWhatsApp("Quick Consultation")} aria-label="Contact OSAN LIFT on WhatsApp">WhatsApp</button>
        <button className={Style.floatingCall} onClick={handleCall} aria-label="Call OSAN LIFT">Call</button>
      </div>

      <ServiceModal
        isOpen={Boolean(selectedModalItem)}
        onClose={() => setSelectedModalItem(null)}
        itemData={selectedModalItem}
      />
    </main>
  );
};

export default Home;
