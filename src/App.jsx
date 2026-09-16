import { useEffect } from "react"

import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    Outlet
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

import {
    BusinessProvider
} from "./context/BusinessContext.jsx"


/* =========================
   LAYOUT PÚBLICO
========================= */

function PublicLayout() {
    return (
        <>
            <Navbar />

            <Outlet />

            <WhatsAppButton />
        </>
    )
}


/* =========================
   HOME
========================= */

function MainPage() {
    const location = useLocation()


    useEffect(() => {
        if (!location.hash) {
            return
        }


        const timer = setTimeout(() => {
            const section =
                document.querySelector(
                    location.hash
                )

            if (section) {
                section.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                })
            }
        }, 100)


        return () => {
            clearTimeout(timer)
        }
    }, [
        location.pathname,
        location.hash
    ])


    return (
        <>
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
        </>
    )
}


/* =========================
   APP
========================= */

function App() {
    return (
        <BusinessProvider>

            <BrowserRouter>

                <Routes>

                    {/* =====================
                        ZONA PÚBLICA
                    ===================== */}

                    <Route
                        element={
                            <PublicLayout />
                        }
                    >

                        <Route
                            path="/"
                            element={
                                <MainPage />
                            }
                        />


                        <Route
                            path="/gallery/:category"
                            element={
                                <GalleryCategory />
                            }
                        />


                        <Route
                            path="/fiestas"
                            element={
                                <Parties />
                            }
                        />


                        <Route
                            path="/fiestas/:packageId"
                            element={
                                <PartyDetail />
                            }
                        />


                        <Route
                            path="/eventos"
                            element={
                                <Events />
                            }
                        />


                        <Route
                            path="/eventos/:eventId"
                            element={
                                <EventDetail />
                            }
                        />

                    </Route>


                    {/* =====================
                        LOGIN ADMIN
                    ===================== */}

                    <Route
                        path="/admin/login"
                        element={
                            <AdminLogin />
                        }
                    />


                    {/* =====================
                        PANEL ADMIN
                    ===================== */}

                    <Route
                        path="/admin"
                        element={
                            <ProtectedAdminRoute>
                                <Admin />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/restaurante"
                        element={
                            <ProtectedAdminRoute>
                                <AdminRestaurant />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/menu"
                        element={
                            <ProtectedAdminRoute>
                                <AdminMenu />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/promociones"
                        element={
                            <ProtectedAdminRoute>
                                <AdminPromotions />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/fiestas"
                        element={
                            <ProtectedAdminRoute>
                                <AdminParties />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/eventos"
                        element={
                            <ProtectedAdminRoute>
                                <AdminEvents />
                            </ProtectedAdminRoute>
                        }
                    />


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