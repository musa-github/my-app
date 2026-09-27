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

// Static Data
const servicesData = [
  {
    id: "s1",
    number: "01",
    title: "Elevator Installation",
    description: "Precision installation of advanced passenger and freight elevators tailored to architectural specifications.",
    details: "We handle complete end-to-end installation including shaft design verification, rail alignment, traction machine setup, control panel configuration (Arkel, Monarch, Yaskawa, etc.), and final safety certification."
  },
  {
    id: "s2",
    number: "02",
    title: "Maintenance & AMC",
    description: "Proactive maintenance regimens ensuring optimal system efficiency, uptime, and strict safety compliance.",
    details: "Our Annual Maintenance Contract (AMC) covers routine monthly inspections, safety gear testing, door drive adjustments, guide rail lubrication, and emergency breakdown priority response."
  },
  {
    id: "s3",
    number: "03",
    title: "System Modernization",
    description: "Upgrading legacy infrastructure with energy-efficient drives, smart controllers, and contemporary cabin interiors.",
    details: "Modernize old elevators with VFD drive integration, smart micro-processor mainboards, LED indicators, Automatic Rescue Devices (ARD), and low-power standby modes."
  },
  {
    id: "s4",
    number: "04",
    title: "Emergency Support",
    description: "24/7 priority emergency dispatch and expert diagnostics to resolve critical system halts rapidly.",
    details: "Immediate on-site technical support for passenger entrapments, drive fault clearing, encoder realignment, and component replacement by skilled engineers."
  }
];

const portfolioData = [
  {
    id: "p1",
    tag: "PASSENGER",
    title: "Passenger Elevator",
    description: "Smooth, ultra-quiet, and energy-efficient mobility designed for commercial towers and luxury residential complexes.",
    details: "Features gearless traction machine technology, VVVF door drives, VVVF main inverted drive, and customizable luxury COP & LOP interfaces.",
    image: "https://images.unsplash.com/photo-1592256410394-51c948ec13d5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bGlmdHxlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    id: "p2",
    tag: "RESIDENTIAL",
    title: "Home Elevator",
    description: "Custom luxury home lifts engineered to integrate seamlessly into private residences with minimal shaft space.",
    details: "Compact single-phase/three-phase operating systems requiring low headroom and pit depth, with soft-start/stop features for maximum comfort.",
    image: "https://media.istockphoto.com/id/509960329/photo/two-elevators-shot-from-outside.webp?a=1&b=1&s=612x612&w=0&k=20&c=am_hJB4Ioumz15o7WLyMIiz8KSaYAeJG_uQNEg0in5M="
  },
  {
    id: "p3",
    tag: "HEALTHCARE",
    title: "Hospital Elevator",
    description: "Spacious, smooth-start stretcher lifts designed for rapid, reliable transport in medical environments.",
    details: "Equipped with priority landing control, extended door-hold timing, emergency battery backup (ARD), and anti-bacterial stainless steel interior finishing.",
    image: "https://media.istockphoto.com/id/2149025784/photo/male-nurse-and-female-doctor-standing-with-male-patient-in-wheelchair-in-hospital-elevator.webp?a=1&b=1&s=612x612&w=0&k=20&c=rElaXPA9TWwN5NltdVLWA_xVOubDFZueOxpob0ZqM6U="
  },
  {
    id: "p4",
    tag: "HEAVY DUTY",
    title: "Goods & Freight Lift",
    description: "Robust, heavy-duty elevators engineered for industrial plants, logistics hubs, and multi-level warehouses.",
    details: "High load capacity structures (up to 5000 kg+) with heavy-gauge checkered floor plates, bump guards, and reinforced door sills.",
    image: "https://media.istockphoto.com/id/507690254/photo/large-freight-elevators-in-modern-building.webp?a=1&b=1&s=612x612&w=0&k=20&c=z-b2H-WHkSaBPSak2Aqn_CWPHFtvQlHRKNsLwak6D2U="
  }
];

const PHONE_NUMBER = "01610989538";
const WHATSAPP_NUMBER = "8801610989538";

const Home = () => {
  const [selectedModalItem, setSelectedModalItem] = useState(null);

  const handleOpenWhatsApp = (title) => {
    const text = encodeURIComponent(`Hello Osan Lift! I need information about: ${title || 'Services'}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${PHONE_NUMBER}`;
  };

  // Structured Data (Schema.org) for Google Search
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Osan Lift",
    "telephone": PHONE_NUMBER,
    "description": "Professional elevator installation, passenger lift supply, Automatic Rescue Devices (ARD), and 24/7 maintenance services.",
    "priceRange": "$$"
  };

  return (
    <main className={Style.homeContainer}>
      <Helmet>
        <title>Osan Lift | Elevator Sales, Installation & Maintenance Services</title>
        <meta 
          name="description" 
          content="Leading elevator solution provider offering passenger lifts, home lifts, ARD units, generators, and 24/7 technical support." 
        />
        <meta name="keywords" content="Osan Lift, Passenger Elevator, Home Lift, Hospital Lift, ARD, Elevator Maintenance, Elevator Spare Parts" />
        <meta property="og:title" content="Osan Lift | Elevator Solutions & Services" />
        <meta property="og:description" content="Precision installation of advanced passenger and freight elevators, ARD systems, and spare parts." />
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      </Helmet>

      <HeroSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <StatsSection Style={Style} />
      <AboutSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <ServicesSection Style={Style} servicesData={servicesData} onSelectService={setSelectedModalItem} />
      <ElevatorSection Style={Style} portfolioData={portfolioData} onSelectPortfolio={setSelectedModalItem} />
      <TechSection Style={Style} onWhatsAppClick={handleOpenWhatsApp} />
      <CtaSection Style={Style} phoneNumber={PHONE_NUMBER} onWhatsAppClick={handleOpenWhatsApp} onCallClick={handleCall} />

      {/* Modal Component */}
      <ServiceModal 
        isOpen={Boolean(selectedModalItem)} 
        onClose={() => setSelectedModalItem(null)} 
        itemData={selectedModalItem} 
      />
    </main>
  );
};

export default Home;