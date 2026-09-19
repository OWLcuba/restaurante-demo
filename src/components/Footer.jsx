import "./Footer.css"

import {
    Link
} from "react-router-dom"

import {
    useBusiness
} from "../context/BusinessContext"


function Footer() {
    const currentYear =
        new Date().getFullYear()


    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    if (
        loadingBusiness ||
        !businessData
    ) {
        return null
    }


    return (
        <footer className="footer">

            <div className="footer-inner">

                {/* =====================
                    MARCA
                ===================== */}

                <div className="footer-brand-area">

                    <Link
                        to="/"
                        className="footer-brand"
                    >

                        {businessData.logoUrl && (
                            <img
                                src={
                                    businessData.logoUrl
                                }
                                alt={
                                    businessData.name
                                }
                                className="footer-logo"
                            />
                        )}


                        <div>

                            <strong>
                                {
                                    businessData.name
                                }
                            </strong>

                            <span>
                                {
                                    businessData.slogan
                                }
                            </span>

                        </div>

                    </Link>

                </div>


                {/* =====================
                    LINKS
                ===================== */}

                <nav className="footer-links">

                    <Link to="/#menu">
                        Menú
                    </Link>

                    <Link to="/fiestas">
                        Fiestas
                    </Link>

                    <Link to="/eventos">
                        Eventos
                    </Link>

                    <Link to="/#promociones">
                        Promociones
                    </Link>

                    <Link to="/#galeria">
                        Galería
                    </Link>

                    <Link to="/#contacto">
                        Contacto
                    </Link>

                </nav>


                {/* =====================
                    COPYRIGHT
                ===================== */}

                <div className="footer-bottom">

                    <p>
                        © {currentYear}{" "}
                        {
                            businessData.name
                        }.
                        Todos los derechos
                        reservados.
                    </p>


                    <span>
                        Sabor cubano en cada
                        detalle.
                    </span>

                </div>

            </div>

        </footer>
    )
}


export default Footer