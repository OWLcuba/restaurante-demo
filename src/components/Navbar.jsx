import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import "./Navbar.css"

import { useBusiness } from "../context/BusinessContext"

function Navbar() {
    const [activeSection, setActiveSection] = useState("inicio")
    const [menuOpen, setMenuOpen] = useState(false)

    const {
        businessData,
        loadingBusiness
    } = useBusiness()

    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                "inicio",
                "menu",
                "promociones",
                "galeria",
                "contacto"
            ]

            sections.forEach((section) => {
                const element = document.getElementById(section)

                if (element) {
                    const position =
                        element.getBoundingClientRect()

                    if (
                        position.top <= 120 &&
                        position.bottom >= 120
                    ) {
                        setActiveSection(section)
                    }
                }
            })
        }

        window.addEventListener("scroll", handleScroll)

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            )
    }, [])

    const closeMenu = () => {
        setMenuOpen(false)
    }

    return (
        <nav className="navbar">
            <h2 className="logo">
                <img
                    src="/images/logo.jpg"
                    alt={businessData?.name || "Q' Bola"}
                    className="navbar-logo"
                />

                {!loadingBusiness && businessData?.name}
            </h2>

            <button
                className="hamburger"
                onClick={() =>
                    setMenuOpen(!menuOpen)
                }
                aria-label="Abrir menú de navegación"
            >
                ☰
            </button>

            <div
                className={
                    menuOpen
                        ? "nav-links open"
                        : "nav-links"
                }
            >
                <a
                    onClick={closeMenu}
                    className={
                        activeSection === "inicio"
                            ? "active"
                            : ""
                    }
                    href="#inicio"
                >
                    Inicio
                </a>

                <a
                    onClick={closeMenu}
                    className={
                        activeSection === "menu"
                            ? "active"
                            : ""
                    }
                    href="#menu"
                >
                    Menú
                </a>

                <Link
                    to="/fiestas"
                    onClick={closeMenu}
                >
                    Fiestas
                </Link>

                <Link
                    to="/eventos"
                    onClick={closeMenu}
                >
                    Eventos
                </Link>

                <a
                    onClick={closeMenu}
                    className={
                        activeSection ===
                        "promociones"
                            ? "active"
                            : ""
                    }
                    href="#promociones"
                >
                    Promociones
                </a>

                <a
                    onClick={closeMenu}
                    className={
                        activeSection === "galeria"
                            ? "active"
                            : ""
                    }
                    href="#galeria"
                >
                    Galería
                </a>

                <a
                    onClick={closeMenu}
                    className={
                        activeSection === "contacto"
                            ? "active"
                            : ""
                    }
                    href="#contacto"
                >
                    Contacto
                </a>
            </div>
        </nav>
    )
}

export default Navbar