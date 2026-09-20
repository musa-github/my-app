import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Main } from "../Main/Main";
import "./Layout.css";

export const Layout = () => {
  return (
    <div className="Layout_Container">
      {/* ১. Header */}
      <Header />

      {/* ২. Main Area (SideBar + Scrollable Main Content) */}
      <div className="layout-body">
        {/* Main Component-এর ভেতরে Aside/Sidebar রয়েছে */}
        <main className="layout-main">
          <div className="main-content">
            <Main />
          </div>

          {/* ফুটার স্ক্রলের নিচে থাকবে */}
          <Footer />
        </main>
      </div>
    </div>
  );
};