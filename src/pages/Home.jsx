import {
    useEffect,
    useState
} from "react"

import {
    collection,
    getDocs
} from "firebase/firestore"

import {
    Link
} from "react-router-dom"

import {
    db
} from "../firebase/firebase"

import "./Home.css"

import {
    useBusiness
} from "../context/BusinessContext"


function Home() {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    const [
        nextEvent,
        setNextEvent
    ] = useState(null)


    /* =====================================================
       PRÓXIMO EVENTO ACTIVO
    ===================================================== */

    useEffect(() => {
        async function loadNextEvent() {
            try {
                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "specialEvents"
                        )
                    )


                const today =
                    new Date()
                        .toISOString()
                        .slice(
                            0,
                            10
                        )


                const activeEvents =
                    snapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .filter(
                            (event) =>
                                event.active !==
                                    false &&
                                event.date &&
                                event.date >=
                                    today
                        )
                        .sort(
                            (a, b) =>
                                a.date.localeCompare(
                                    b.date
                                )
                        )


                setNextEvent(
                    activeEvents[0] ||
                    null
                )

            } catch (error) {
                console.error(
                    "Error cargando próximo evento:",
                    error
                )


                setNextEvent(
                    null
                )
            }
        }


        loadNextEvent()
    }, [])


    /* =====================================================
       LOADING BUSINESS
    ===================================================== */

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

            {/* =====================================================
                HERO PRINCIPAL
            ===================================================== */}

            <div className="hero-main">

                <div className="hero-content">

                    <span className="subtitle">
                        Sabor que enamora
                    </span>


                    <h1>
                        {
                            businessData.slogan
                        }
                    </h1>


                    <p>
                        {
                            businessData.description
                        }
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
                        src={
                            heroImage
                        }
                        alt={
                            businessData.name
                        }
                    />

                </div>


                <div className="mobile-business-strip">

                    <span>
                        ⏰{" "}
                        {
                            businessData.shortHours
                        }
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


            {/* =====================================================
                INFO
            ===================================================== */}

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


            {/* =====================================================
                EXPERIENCIAS
            ===================================================== */}

            <div className="home-experiences">

                {/* FIESTAS */}

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


                {/* EVENTO DINÁMICO */}

                {nextEvent && (

                    <Link
                        to={`/eventos/${nextEvent.firebaseId}`}
                        className="home-experience-card events-experience"
                        style={{
                            backgroundImage:
                                nextEvent.imageUrl
                                    ? `url("${nextEvent.imageUrl}")`
                                    : undefined
                        }}
                    >

                        <div className="home-experience-overlay">

                            <span>
                                🎤{" "}
                                {
                                    nextEvent.dateLabel ||
                                    "PRÓXIMO EVENTO"
                                }
                            </span>


                            <h2>
                                {
                                    nextEvent.title
                                }
                            </h2>


                            <p>
                                {nextEvent.description ||
                                    "Vive una noche especial en Q' Bola."}
                            </p>


                            <div className="home-experience-button">
                                Ver evento →
                            </div>

                        </div>

                    </Link>

                )}

            </div>

        </section>
    )
}


export default Home