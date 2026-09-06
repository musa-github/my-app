import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { Main } from "../Main/Main";
import "./Layout.css";
export const Layout = () => {
  return (
    <div className="Layout_Container">
        <Header/>
        <Main/>
        <Footer/>
    </div>
  )
}
