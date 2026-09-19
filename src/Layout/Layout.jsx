import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Main } from "../Main/Main";
import "./Layout.css";

export const Layout = () => {
  return (
    <div className="Layout_Container">
      {/* ১. Fixed Header */}
      <Header />

      {/* ২. Main Area (SideBar + Scrollable Main Content) */}
      <div className="layout-body">
        {/* Main Component-এর ভেতরে আপনার Aside/Sidebar রয়েছে */}
        <main className="layout-main">
          <div className="main-content">
            <Main />
          </div>

          {/* ফুটারকে layout-main-এর ভেতরে নিয়ে আসা হয়েছে যেন কনটেন্টের নিচে স্ক্রল হয় */}
          <Footer />
        </main>
      </div>
    </div>
  );
};