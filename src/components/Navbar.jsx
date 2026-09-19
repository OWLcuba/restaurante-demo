import {
    useEffect,
    useState
} from "react"

import {
    Link,
    useLocation
} from "react-router-dom"

import "./Navbar.css"

import {
    useBusiness
} from "../context/BusinessContext"


function Navbar() {
    const location = useLocation()

    const [
        activeSection,
        setActiveSection
    ] = useState("inicio")

    const [
        menuOpen,
        setMenuOpen
    ] = useState(false)


    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    /* =========================
       DETECTAR SECCIÓN DEL HOME
    ========================= */

    useEffect(() => {
        if (
            location.pathname !== "/"
        ) {
            return
        }


        const handleScroll = () => {
            const sections = [
                "inicio",
                "menu",
                "promociones",
                "galeria",
                "contacto"
            ]


            for (
                const section
                of sections
            ) {
                const element =
                    document.getElementById(
                        section
                    )


                if (!element) {
                    continue
                }


                const position =
                    element
                        .getBoundingClientRect()


                if (
                    position.top <= 130 &&
                    position.bottom >= 130
                ) {
                    setActiveSection(
                        section
                    )

                    break
                }
            }
        }


        handleScroll()


        window.addEventListener(
            "scroll",
            handleScroll
        )


        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            )
        }
    }, [
        location.pathname
    ])


    /* =========================
       CERRAR AL CAMBIAR PÁGINA
    ========================= */

    useEffect(() => {
        setMenuOpen(false)
    }, [
        location.pathname,
        location.hash
    ])


    const closeMenu = () => {
        setMenuOpen(false)
    }


    const homeSectionClass = (
        section
    ) => {
        if (
            location.pathname === "/" &&
            activeSection === section
        ) {
            return "active"
        }

        return ""
    }


    const logoUrl =
    businessData?.logoUrl || ""


    return (
        <nav className="navbar">

            {/* LOGO */}

            <Link
                to="/"
                className="logo"
                onClick={closeMenu}
            >
                {logoUrl && (
    <img
        src={logoUrl}
        alt={
            businessData?.name ||
            "Q' Bola"
        }
        className="navbar-logo"
    />
)}

                <span>
                    {!loadingBusiness &&
                        businessData?.name}
                </span>
            </Link>


            {/* HAMBURGUESA */}

            <button
                type="button"
                className={
                    menuOpen
                        ? "hamburger open"
                        : "hamburger"
                }
                onClick={() =>
                    setMenuOpen(
                        (current) =>
                            !current
                    )
                }
                aria-label={
                    menuOpen
                        ? "Cerrar menú"
                        : "Abrir menú"
                }
                aria-expanded={
                    menuOpen
                }
            >
                {menuOpen
                    ? "×"
                    : "☰"}
            </button>


            {/* MENÚ */}

            <div
                className={
                    menuOpen
                        ? "nav-links open"
                        : "nav-links"
                }
            >

                <Link
                    to="/#inicio"
                    onClick={
                        closeMenu
                    }
                    className={
                        homeSectionClass(
                            "inicio"
                        )
                    }
                >
                    Inicio
                </Link>


                <Link
                    to="/#menu"
                    onClick={
                        closeMenu
                    }
                    className={
                        homeSectionClass(
                            "menu"
                        )
                    }
                >
                    Menú
                </Link>


                <Link
                    to="/fiestas"
                    onClick={
                        closeMenu
                    }
                    className={
                        location.pathname
                            .startsWith(
                                "/fiestas"
                            )
                            ? "active"
                            : ""
                    }
                >
                    Fiestas
                </Link>


                <Link
                    to="/eventos"
                    onClick={
                        closeMenu
                    }
                    className={
                        location.pathname
                            .startsWith(
                                "/eventos"
                            )
                            ? "active"
                            : ""
                    }
                >
                    Eventos
                </Link>


                <Link
                    to="/#promociones"
                    onClick={
                        closeMenu
                    }
                    className={
                        homeSectionClass(
                            "promociones"
                        )
                    }
                >
                    Promociones
                </Link>


                <Link
                    to="/#galeria"
                    onClick={
                        closeMenu
                    }
                    className={
                        location.pathname
                            .startsWith(
                                "/gallery"
                            )
                            ? "active"
                            : homeSectionClass(
                                  "galeria"
                              )
                    }
                >
                    Galería
                </Link>


                <Link
                    to="/#contacto"
                    onClick={
                        closeMenu
                    }
                    className={
                        homeSectionClass(
                            "contacto"
                        )
                    }
                >
                    Contacto
                </Link>

            </div>

        </nav>
    )
}


export default Navbar