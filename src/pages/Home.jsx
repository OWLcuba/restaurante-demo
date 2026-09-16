import { Link } from "react-router-dom"

import "./Home.css"
import { useBusiness } from "../context/BusinessContext"


function Home() {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    if (
        loadingBusiness ||
        !businessData
    ) {
        return (
            <section className="hero">
                <p>
                    Cargando información...
                </p>
            </section>
        )
    }


    const heroImage =
        businessData.heroImageUrl ||
        "/images/restaurant-cover.jpg"


    return (
        <section className="hero">

            <div className="hero-main">

                <div className="hero-content">
                    <span className="subtitle">
                        Sabor que enamora
                    </span>

                    <h1>
                        {businessData.slogan}
                    </h1>

                    <p>
                        {businessData.description}
                    </p>


                    <div className="hero-buttons">

                        <a
                            className="primary-btn"
                            href="#menu"
                        >
                            Ver menú
                        </a>


                        <a
                            className="secondary-btn"
                            href={`tel:${businessData.phone}`}
                        >
                            📞 Ordenar
                        </a>

                    </div>
                </div>


                <div className="hero-image">
                    <img
                        src={heroImage}
                        alt={businessData.name}
                    />
                </div>


                <div className="mobile-business-strip">

                    <span>
                        ⏰{" "}
                        {businessData.shortHours}
                    </span>

                    <span>
                        📍{" "}
                        {
                            businessData
                                .shortAddress
                                ?.line1
                        }
                    </span>

                </div>

            </div>


            <div className="info-cards">

                <div>
                    ☎️

                    <p>
                        Llámanos
                    </p>

                    <strong>
                        {
                            businessData
                                .displayPhone
                        }
                    </strong>
                </div>


                <div>
                    📍

                    <p>
                        Visítanos
                    </p>

                    <strong>
                        {
                            businessData
                                .shortAddress
                                ?.line2
                        }
                    </strong>
                </div>


                <div>
                    ⏰

                    <p>
                        Horario
                    </p>

                    <strong>
                        {
                            businessData
                                .shortHours
                        }
                    </strong>
                </div>

            </div>


            <div className="home-experiences">

                <Link
                    to="/fiestas"
                    className="home-experience-card party-experience"
                >
                    <div className="home-experience-overlay">

                        <span>
                            🎉 FIESTAS Y CATERING
                        </span>

                        <h2>
                            Lleva Q&apos; Bola
                            a tu celebración
                        </h2>

                        <p>
                            Combos para cumpleaños,
                            reuniones, fiestas y
                            actividades en casa.
                        </p>

                        <div className="home-experience-button">
                            Ver combos →
                        </div>

                    </div>
                </Link>


                <Link
                    to="/eventos"
                    className="home-experience-card events-experience"
                >
                    <div className="home-experience-overlay">

                        <span>
                            🎤 EVENTOS ESPECIALES
                        </span>

                        <h2>
                            Vive una noche
                            diferente
                        </h2>

                        <p>
                            Artistas en vivo,
                            entradas, experiencias
                            VIP y mesas especiales.
                        </p>

                        <div className="home-experience-button">
                            Ver próximos eventos →
                        </div>

                    </div>
                </Link>

            </div>

        </section>
    )
}


export default Home