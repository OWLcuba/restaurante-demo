import { useEffect } from "react"
import {
    BrowserRouter,
    Routes,
    Route,
    useLocation
} from "react-router-dom"

import Navbar from "./components/Navbar.jsx"
import Home from "./pages/Home.jsx"
import Menu from "./pages/Menu.jsx"
import Promotions from "./pages/Promotions.jsx"
import Gallery from "./pages/Gallery.jsx"
import GalleryCategory from "./pages/GalleryCategory.jsx"
import Contact from "./pages/Contact.jsx"
import Footer from "./components/Footer.jsx"
import WhatsAppButton from "./components/WhatsAppButton.jsx"
import { BusinessProvider } from "./context/BusinessContext.jsx"


function MainPage() {
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const section = document.querySelector(location.hash)

            if (section) {
                setTimeout(() => {
                    section.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    })
                }, 100)
            }
        }
    }, [location])

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

function App() {
    return (
        <BusinessProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainPage />} />

                    <Route
                        path="/gallery/:category"
                        element={<GalleryCategory />}
                    />
                </Routes>
            </BrowserRouter>
        </BusinessProvider>
    )
}

export default App