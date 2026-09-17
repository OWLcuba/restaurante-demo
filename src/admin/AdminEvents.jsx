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

import "./Admin.css"


function AdminEvents() {
    const [
        events,
        setEvents
    ] = useState([])

    const [
        venues,
        setVenues
    ] = useState([])

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        error,
        setError
    ] = useState("")


    /* =========================
       FECHA ACTUAL
    ========================= */

    const getTodayKey = () => {
        const now =
            new Date()

        const year =
            now.getFullYear()

        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            )

        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            )

        return `${year}-${month}-${day}`
    }


    /* =========================
       CARGAR TODO
    ========================= */

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [
                    eventSnapshot,
                    venueSnapshot
                ] =
                    await Promise.all([
                        getDocs(
                            collection(
                                db,
                                "specialEvents"
                            )
                        ),

                        getDocs(
                            collection(
                                db,
                                "venues"
                            )
                        )
                    ])


                const eventData =
                    eventSnapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )


                const venueData =
                    venueSnapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .sort(
                            (a, b) =>
                                (
                                    a.name ||
                                    ""
                                ).localeCompare(
                                    b.name ||
                                    ""
                                )
                        )


                setEvents(
                    eventData
                )

                setVenues(
                    venueData
                )
            } catch (firebaseError) {
                console.error(
                    "Error al cargar administración de eventos:",
                    firebaseError
                )

                setError(
                    "No se pudieron cargar los eventos y locales."
                )
            } finally {
                setLoading(false)
            }
        }


        loadDashboard()
    }, [])


    /* =========================
       ACTIVOS / PASADOS
    ========================= */

    const today =
        getTodayKey()


    const activeEvents =
        events
            .filter(
                (eventItem) =>
                    !eventItem.date ||
                    eventItem.date >=
                        today
            )
            .sort(
                (a, b) =>
                    (
                        a.date || ""
                    ).localeCompare(
                        b.date || ""
                    )
            )


    const pastEvents =
        events
            .filter(
                (eventItem) =>
                    eventItem.date &&
                    eventItem.date <
                        today
            )
            .sort(
                (a, b) =>
                    (
                        b.date || ""
                    ).localeCompare(
                        a.date || ""
                    )
            )


    /* =========================
       CONTAR MESAS
    ========================= */

    const getVenueCounts = (
        venue
    ) => {
        const seats =
            venue.seatingMap
                ?.seats || []


        return {
            tables:
                seats.filter(
                    (seat) =>
                        seat.type ===
                        "table"
                ).length,

            vip:
                seats.filter(
                    (seat) =>
                        seat.type ===
                        "vip"
                ).length
        }
    }


    /* =========================
       TARJETA EVENTO
    ========================= */

    const renderEvent = (
        eventItem
    ) => {
        return (
            <article
                key={
                    eventItem.firebaseId
                }
                className="admin-card admin-content-card"
            >

                {eventItem.imageUrl && (
                    <img
                        className="admin-card-image"
                        src={
                            eventItem.imageUrl
                        }
                        alt={
                            eventItem.title
                        }
                    />
                )}


                <div>

                    <span
                        className={
                            eventItem.active ===
                            false
                                ? "admin-status inactive"
                                : "admin-status"
                        }
                    >
                        {eventItem.active ===
                        false
                            ? "Inactivo"
                            : "Activo"}
                    </span>


                    <h2>
                        {
                            eventItem.title
                        }
                    </h2>


                    <p>
                        📅{" "}
                        {
                            eventItem.dateLabel ||
                            eventItem.date
                        }
                    </p>


                    <p>
                        📍{" "}
                        {
                            eventItem.venue ||
                            "Sin local asignado"
                        }
                    </p>


                    <p>
                        🎟️{" "}
                        {
                            eventItem.offers
                                ?.filter(
                                    (
                                        offer
                                    ) =>
                                        offer.active !==
                                        false
                                )
                                .length ||
                            0
                        }{" "}
                        opciones
                    </p>

                </div>


                <div className="admin-card-actions">

                    <Link
                        to={`/admin/eventos/${eventItem.firebaseId}/editar`}
                        className="admin-card-button"
                    >
                        Editar evento
                    </Link>

                </div>

            </article>
        )
    }


    /* =========================
       RENDER
    ========================= */

    return (
        <main className="admin-page">

            <Link
                to="/admin"
                className="admin-back-link"
            >
                ← Volver al panel
            </Link>


            <section className="admin-header">

                <span className="admin-kicker">
                    EVENTOS
                </span>

                <h1>
                    Eventos y locales
                </h1>

                <p>
                    Administra los eventos
                    y los espacios donde
                    se realizan.
                </p>

            </section>


            {error && (
                <p className="admin-message">
                    {error}
                </p>
            )}


            {loading ? (

                <p className="admin-empty">
                    Cargando...
                </p>

            ) : (
                <>

                    {/* =====================
                        EVENTOS
                    ===================== */}

                    <section className="admin-section admin-section-first">

                        <div className="admin-section-title">

                            <span className="admin-kicker">
                                EVENTOS
                            </span>

                            <h2>
                                Eventos
                            </h2>

                        </div>


                        <Link
                            to="/admin/eventos/nuevo"
                            className="admin-card-button"
                        >
                            + Crear evento
                        </Link>

                    </section>


                    {/* ACTIVOS */}

                    {activeEvents.length >
                        0 && (

                        <section className="admin-section">

                            <div className="admin-section-title">

                                <span className="admin-kicker">
                                    ACTIVOS
                                </span>

                                <h2>
                                    Eventos activos
                                </h2>

                            </div>


                            <div className="admin-grid">

                                {activeEvents.map(
                                    renderEvent
                                )}

                            </div>

                        </section>

                    )}


                    {/* PASADOS */}

                    {pastEvents.length >
                        0 && (

                        <section className="admin-section">

                            <div className="admin-section-title">

                                <span className="admin-kicker">
                                    HISTORIAL
                                </span>

                                <h2>
                                    Eventos pasados
                                </h2>

                            </div>


                            <div className="admin-grid">

                                {pastEvents.map(
                                    renderEvent
                                )}

                            </div>

                        </section>

                    )}


                    {/* =====================
                        LOCALES
                    ===================== */}

                    <section className="admin-section">

                        <div className="admin-section-title">

                            <span className="admin-kicker">
                                LOCALES
                            </span>

                            <h2>
                                Locales
                            </h2>

                        </div>


                        <Link
                            to="/admin/locales/nuevo"
                            className="admin-card-button"
                        >
                            + Crear local
                        </Link>


                        {venues.length >
                            0 && (

                            <div
                                className="admin-grid"
                                style={{
                                    marginTop:
                                        "25px"
                                }}
                            >

                                {venues.map(
                                    (
                                        venue
                                    ) => {
                                        const counts =
                                            getVenueCounts(
                                                venue
                                            )


                                        return (
                                            <article
                                                key={
                                                    venue.firebaseId
                                                }
                                                className="admin-card"
                                            >

                                                <span>
                                                    🏢
                                                </span>


                                                <h2>
                                                    {
                                                        venue.name
                                                    }
                                                </h2>


                                                <p>
                                                    🪑{" "}
                                                    {
                                                        counts.tables
                                                    }{" "}
                                                    mesas
                                                </p>


                                                <p>
                                                    ⭐{" "}
                                                    {
                                                        counts.vip
                                                    }{" "}
                                                    VIP
                                                </p>


                                                <div className="admin-card-actions">

                                                    <Link
                                                        to={`/admin/locales/${venue.firebaseId}/editar`}
                                                        className="admin-card-button"
                                                    >
                                                        Editar local
                                                    </Link>

                                                </div>

                                            </article>
                                        )
                                    }
                                )}

                            </div>

                        )}

                    </section>

                </>
            )}

        </main>
    )
}


export default AdminEvents