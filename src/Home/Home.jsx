import Carousel from "./Carousel";
import Style from "./Home.module.css";

const Home = () => {
  return (
    <main className={Style.homeContainer}>

      {/* ================= HERO SECTION ================= */}
      <section className={Style.heroSection}>
        <div className={Style.heroOverlay}></div>

        <div className={Style.heroContent}>
          <span className={Style.heroBadge}>
            <span className={Style.badgeDot}></span>
            ELEVATOR & LIFT SOLUTIONS
          </span>

          <h1 className={Style.heroTitle}>
            Moving People.
            <br />
            <span className={Style.gradientText}>Elevating Possibilities.</span>
          </h1>

          <p className={Style.heroSubtitle}>
            Engineered for safety, reliability, and precision. Delivering modern 
            vertical transportation solutions for high-end residential, commercial, 
            and industrial architecture.
          </p>

          <div className={Style.heroButtons}>
            <button className={Style.primaryBtn}>
              Get a Free Quote
              <span className={Style.btnArrow}>→</span>
            </button>

            <button className={Style.secondaryBtn}>
              Explore Services
            </button>
          </div>
        </div>

        <div className={Style.scrollIndicator}>
          <span>Scroll to explore</span>
          <div className={Style.scrollLine}></div>
        </div>
      </section>


      {/* ================= STATS SECTION ================= */}
      <section className={Style.statsSection}>
        <div className={Style.statItem}>
          <strong className={Style.statNumber}>100+</strong>
          <span className={Style.statLabel}>Projects Completed</span>
        </div>

        <div className={Style.statItem}>
          <strong className={Style.statNumber}>10+</strong>
          <span className={Style.statLabel}>Years Experience</span>
        </div>

        <div className={Style.statItem}>
          <strong className={Style.statNumber}>24/7</strong>
          <span className={Style.statLabel}>Technical Support</span>
        </div>

        <div className={Style.statItem}>
          <strong className={Style.statNumber}>100%</strong>
          <span className={Style.statLabel}>Safety Record</span>
        </div>
      </section>


      {/* ================= ABOUT SECTION ================= */}
      <section className={Style.aboutSection}>
        <div className={Style.sectionHeading}>
          <span className={Style.sectionTag}>WHO WE ARE</span>
          <h2>
            Engineering the Future of
            <br />
            <span className={Style.accentText}>Vertical Transportation</span>
          </h2>
        </div>

        <div className={Style.aboutGrid}>
          <div className={Style.aboutText}>
            <p className={Style.introText}>
              We provide end-to-end elevator engineering—from modern installations 
              and control modernization to preventive maintenance and rapid emergency care.
            </p>

            <p>
              Our engineering standards leverage cutting-edge control architectures, 
              precision drives, and redundant safety systems to guarantee smooth, 
              quiet, and uninterrupted vertical movement.
            </p>

            <button className={Style.outlineBtn}>
              Discover More
              <span>→</span>
            </button>
          </div>

          <div className={Style.aboutMedia}>
            <div className={Style.mediaFrame}>
              <Carousel />
            </div>
          </div>
        </div>
      </section>


      {/* ================= SERVICES SECTION ================= */}
      <section className={Style.servicesSection}>
        <div className={Style.sectionHeadingCenter}>
          <span className={Style.sectionTag}>WHAT WE DO</span>
          <h2>
            Engineering <span>Solutions</span>
          </h2>
          <p>
            Comprehensive lifecycle support for vertical transit infrastructure.
          </p>
        </div>

        <div className={Style.servicesGrid}>
          <div className={Style.serviceCard}>
            <div className={Style.serviceNumber}>01</div>
            <div className={Style.serviceIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l5 5 5-5M7 7l5-5 5 5"/></svg>
            </div>
            <h3>Elevator Installation</h3>
            <p>Precision installation of advanced passenger and freight elevators tailored to architectural specifications.</p>
            <a href="#contact" className={Style.cardLink}>Learn More <span>→</span></a>
          </div>

          <div className={Style.serviceCard}>
            <div className={Style.serviceNumber}>02</div>
            <div className={Style.serviceIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <h3>Maintenance & AMC</h3>
            <p>Proactive maintenance regimens ensuring optimal system efficiency, uptime, and strict safety compliance.</p>
            <a href="#contact" className={Style.cardLink}>Learn More <span>→</span></a>
          </div>

          <div className={Style.serviceCard}>
            <div className={Style.serviceNumber}>03</div>
            <div className={Style.serviceIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3>System Modernization</h3>
            <p>Upgrading legacy infrastructure with energy-efficient drives, smart controllers, and contemporary cabin interiors.</p>
            <a href="#contact" className={Style.cardLink}>Learn More <span>→</span></a>
          </div>

          <div className={Style.serviceCard}>
            <div className={Style.serviceNumber}>04</div>
            <div className={Style.serviceIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3>Emergency Support</h3>
            <p>24/7 priority emergency dispatch and expert diagnostics to resolve critical system halts rapidly.</p>
            <a href="#contact" className={Style.cardLink}>Learn More <span>→</span></a>
          </div>
        </div>
      </section>


      {/* ================= ELEVATOR PRODUCTS ================= */}
      <section className={Style.elevatorSection}>
        <div className={Style.sectionHeadingCenter}>
          <span className={Style.sectionTag}>OUR PORTFOLIO</span>
          <h2>
            Tailored <span>Elevator Systems</span>
          </h2>
        </div>

        <div className={Style.elevatorGrid}>
          <div className={Style.elevatorCard}>
            <div className={Style.elevatorImage}>
              <span className={Style.imageTag}>PASSENGER</span>
            </div>
            <div className={Style.elevatorInfo}>
              <h3>Passenger Elevator</h3>
              <p>Smooth, ultra-quiet, and energy-efficient mobility designed for commercial towers and luxury residential complexes.</p>
              <a href="#contact" className={Style.cardLink}>View Details <span>→</span></a>
            </div>
          </div>

          <div className={Style.elevatorCard}>
            <div className={Style.elevatorImage}>
              <span className={Style.imageTag}>RESIDENTIAL</span>
            </div>
            <div className={Style.elevatorInfo}>
              <h3>Home Elevator</h3>
              <p>Custom luxury home lifts engineered to integrate seamlessly into private residences with minimal shaft space.</p>
              <a href="#contact" className={Style.cardLink}>View Details <span>→</span></a>
            </div>
          </div>

          <div className={Style.elevatorCard}>
            <div className={Style.elevatorImage}>
              <span className={Style.imageTag}>HEALTHCARE</span>
            </div>
            <div className={Style.elevatorInfo}>
              <h3>Hospital Elevator</h3>
              <p>Spacious, smooth-start stretcher lifts designed for rapid, reliable transport in medical environments.</p>
              <a href="#contact" className={Style.cardLink}>View Details <span>→</span></a>
            </div>
          </div>

          <div className={Style.elevatorCard}>
            <div className={Style.elevatorImage}>
              <span className={Style.imageTag}>HEAVY DUTY</span>
            </div>
            <div className={Style.elevatorInfo}>
              <h3>Goods & Freight Lift</h3>
              <p>Robust, heavy-duty elevators engineered for industrial plants, logistics hubs, and multi-level warehouses.</p>
              <a href="#contact" className={Style.cardLink}>View Details <span>→</span></a>
            </div>
          </div>
        </div>
      </section>


      {/* ================= TECHNOLOGY SECTION ================= */}
      <section className={Style.videoSection}>
        <div className={Style.videoContent}>
          <span className={Style.sectionTagLight}>ADVANCED ENGINEERING</span>
          <h2>
            Built on Safety.
            <br />
            <span className={Style.gradientText}>Driven by Technology.</span>
          </h2>

          <p>
            Our control configurations combine intelligence and durability to ensure peak transit performance and maximum energy savings.
          </p>

          <ul className={Style.techList}>
            <li><span className={Style.checkIcon}>✓</span> Microprocessor-driven control cards</li>
            <li><span className={Style.checkIcon}>✓</span> Precision encoder & drive tuning</li>
            <li><span className={Style.checkIcon}>✓</span> Automatic Rescue Device (ARD) safety integration</li>
            <li><span className={Style.checkIcon}>✓</span> Real-time monitoring and diagnostic software</li>
          </ul>

          <button className={Style.primaryBtn}>
            Talk to an Expert
          </button>
        </div>

        <div className={Style.videoWrapper}>
          <iframe
            src="https://www.youtube.com/embed/wE8AsupuJAI"
            title="Elevator Technology"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </section>


      {/* ================= CTA SECTION ================= */}
      <section className={Style.ctaSection} id="contact">
        <div className={Style.ctaCard}>
          <span className={Style.sectionTag}>GET IN TOUCH</span>
          <h2>
            Need a High-Performance
            <br />
            <strong>Elevator Solution?</strong>
          </h2>
          <p>
            Connect with our engineering experts today for technical guidance, site visits, or tailored price proposals.
          </p>

          <div className={Style.ctaButtons}>
            <button className={Style.primaryBtn}>
              Request a Quote
            </button>
            <button className={Style.darkBtn}>
              📞 Call Direct
            </button>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Home;