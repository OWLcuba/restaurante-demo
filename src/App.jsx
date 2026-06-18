import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Menu from "./pages/Menu.jsx"
import Promotions from "./pages/Promotions.jsx"
import Gallery from "./pages/Gallery.jsx"
import Contact from "./pages/Contact.jsx"
import Footer from "./components/Footer.jsx"
import WhatsAppButton from "./components/WhatsAppButton.jsx"

function App() {

  return (
    <>
      <Navbar />

      <section id="inicio">
        <Home />
      </section>

      <section id="menu">
        <Menu />
      </section>

      <section id="promociones">
        <Promotions />
      </section>

      <section id="galeria">
        <Gallery />
      </section>

      <section id="contacto">
        <Contact />
      </section>

      <Footer />

      <WhatsAppButton />
      
    </>
  )

}

export default App