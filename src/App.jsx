import { useEffect } from "react"

import {
    BrowserRouter,
    Routes,
    Route,
    useLocation,
    Outlet
} from "react-router-dom"

import AnalyticsTracker from "./components/AnalyticsTracker.jsx"

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
import AdminEventForm from "./admin/AdminEventForm.jsx"
import AdminVenueForm from "./admin/AdminVenueForm.jsx"
import AdminGallery from "./admin/AdminGallery.jsx"
import AdminAnalytics from "./admin/AdminAnalytics.jsx"

import {
    BusinessProvider
} from "./context/BusinessContext.jsx"


function PublicLayout() {
    return (
        <>
            <AnalyticsTracker />

            <Navbar />

            <Outlet />

            <WhatsAppButton />
        </>
    )
}


function MainPage() {
    const location =
        useLocation()


    useEffect(() => {
        if (!location.hash) {
            return
        }


        const timer =
            setTimeout(() => {
                const section =
                    document.querySelector(
                        location.hash
                    )


                if (section) {
                    section.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    })
                }
            }, 100)


        return () => {
            clearTimeout(
                timer
            )
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


function App() {
    return (
        <BusinessProvider>

            <BrowserRouter>

                <Routes>

                    {/* =====================
                        PÚBLICO
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
                        LOGIN
                    ===================== */}

                    <Route
                        path="/admin/login"
                        element={
                            <AdminLogin />
                        }
                    />


                    {/* =====================
                        ADMIN
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
                        path="/admin/eventos/nuevo"
                        element={
                            <ProtectedAdminRoute>
                                <AdminEventForm />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/eventos/:eventId/editar"
                        element={
                            <ProtectedAdminRoute>
                                <AdminEventForm />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/locales/nuevo"
                        element={
                            <ProtectedAdminRoute>
                                <AdminVenueForm />
                            </ProtectedAdminRoute>
                        }
                    />


                    <Route
                        path="/admin/locales/:venueId/editar"
                        element={
                            <ProtectedAdminRoute>
                                <AdminVenueForm />
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


                    {/* =====================
                        ESTADÍSTICAS
                    ===================== */}

                    <Route
                        path="/admin/estadisticas"
                        element={
                            <ProtectedAdminRoute>
                                <AdminAnalytics />
                            </ProtectedAdminRoute>
                        }
                    />

                </Routes>

            </BrowserRouter>

        </BusinessProvider>
    )
}


export default App