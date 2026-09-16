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

import Parties from "./pages/Parties.jsx"
import Events from "./pages/Events.jsx"
import PartyDetail from "./pages/PartyDetail.jsx"
import EventDetail from "./pages/EventDetail.jsx"

import Admin from "./admin/Admin.jsx"
import AdminLogin from "./admin/AdminLogin.jsx"
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute.jsx"
import AdminRestaurant from "./admin/AdminRestaurant.jsx"
import AdminMenu from "./admin/AdminMenu.jsx"
import AdminPromotions from "./admin/AdminPromotions.jsx"
import AdminParties from "./admin/AdminParties.jsx"
import AdminEvents from "./admin/AdminEvents.jsx"
import AdminGallery from "./admin/AdminGallery.jsx"

import { BusinessProvider } from "./context/BusinessContext.jsx"


function MainPage() {
    const location = useLocation()

    useEffect(() => {
        if (location.hash) {
            const section = document.querySelector(
                location.hash
            )

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

                    {/* =========================
                        PÁGINA PRINCIPAL
                    ========================= */}

                    <Route
                        path="/"
                        element={<MainPage />}
                    />


                    {/* =========================
                        GALERÍA PÚBLICA
                    ========================= */}

                    <Route
                        path="/gallery/:category"
                        element={<GalleryCategory />}
                    />


                    {/* =========================
                        FIESTAS PÚBLICAS
                    ========================= */}

                    <Route
                        path="/fiestas"
                        element={<Parties />}
                    />

                    <Route
                        path="/fiestas/:packageId"
                        element={<PartyDetail />}
                    />


                    {/* =========================
                        EVENTOS PÚBLICOS
                    ========================= */}

                    <Route
                        path="/eventos"
                        element={<Events />}
                    />

                    <Route
                        path="/eventos/:eventId"
                        element={<EventDetail />}
                    />


                    {/* =========================
                        LOGIN ADMIN
                    ========================= */}

                    <Route
                        path="/admin/login"
                        element={<AdminLogin />}
                    />


                    {/* =========================
                        PANEL ADMIN
                    ========================= */}

                    <Route
                        path="/admin"
                        element={
                            <ProtectedAdminRoute>
                                <Admin />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN RESTAURANTE
                    ========================= */}

                    <Route
                        path="/admin/restaurante"
                        element={
                            <ProtectedAdminRoute>
                                <AdminRestaurant />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN MENÚ
                    ========================= */}

                    <Route
                        path="/admin/menu"
                        element={
                            <ProtectedAdminRoute>
                                <AdminMenu />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN PROMOCIONES
                    ========================= */}

                    <Route
                        path="/admin/promociones"
                        element={
                            <ProtectedAdminRoute>
                                <AdminPromotions />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN FIESTAS
                    ========================= */}

                    <Route
                        path="/admin/fiestas"
                        element={
                            <ProtectedAdminRoute>
                                <AdminParties />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN EVENTOS
                    ========================= */}

                    <Route
                        path="/admin/eventos"
                        element={
                            <ProtectedAdminRoute>
                                <AdminEvents />
                            </ProtectedAdminRoute>
                        }
                    />


                    {/* =========================
                        ADMIN GALERÍA
                    ========================= */}

                    <Route
                        path="/admin/galeria"
                        element={
                            <ProtectedAdminRoute>
                                <AdminGallery />
                            </ProtectedAdminRoute>
                        }
                    />

                </Routes>
            </BrowserRouter>
        </BusinessProvider>
    )
}


export default App