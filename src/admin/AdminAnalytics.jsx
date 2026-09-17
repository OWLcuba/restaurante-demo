import {
    useEffect,
    useMemo,
    useState
} from "react"

import {
    collection,
    onSnapshot
} from "firebase/firestore"

import {
    Link
} from "react-router-dom"

import {
    db
} from "../firebase/firebase"

import "./Admin.css"


const STRONG_ACTIONS = [
    "phone_click",
    "map_open",
    "doordash_click",
    "party_whatsapp",
    "event_whatsapp",
    "contact_whatsapp"
]


function AdminAnalytics() {
    const [
        analytics,
        setAnalytics
    ] = useState([])


    const [
        loading,
        setLoading
    ] = useState(true)


    const [
        period,
        setPeriod
    ] = useState(
        "30"
    )


    /* =====================================================
       FIRESTORE
    ===================================================== */

    useEffect(() => {
        const unsubscribe =
            onSnapshot(
                collection(
                    db,
                    "webAnalytics"
                ),

                (
                    snapshot
                ) => {
                    setAnalytics(
                        snapshot.docs.map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                    )


                    setLoading(
                        false
                    )
                },

                (
                    error
                ) => {
                    console.error(
                        "Error cargando estadísticas:",
                        error
                    )

                    setLoading(
                        false
                    )
                }
            )


        return unsubscribe

    }, [])


    /* =====================================================
       FILTRAR FECHA
    ===================================================== */

    const filtered =
        useMemo(
            () => {
                if (
                    period ===
                    "all"
                ) {
                    return analytics
                }


                const days =
                    Number(
                        period
                    )


                const cutoff =
                    new Date()


                cutoff.setHours(
                    0,
                    0,
                    0,
                    0
                )


                cutoff.setDate(
                    cutoff.getDate() -
                        (
                            days -
                            1
                        )
                )


                return analytics.filter(
                    (item) => {
                        const date =
                            item.createdAt
                                ?.toDate?.()


                        if (!date) {
                            return false
                        }


                        return (
                            date >=
                            cutoff
                        )
                    }
                )

            },
            [
                analytics,
                period
            ]
        )


    /* =====================================================
       HELPERS
    ===================================================== */

    const countType = (
        type
    ) => {
        return filtered.filter(
            (item) =>
                item.type ===
                type
        ).length
    }


    const sessionIds =
        new Set(
            filtered
                .filter(
                    (item) =>
                        item.type ===
                        "session_start"
                )
                .map(
                    (item) =>
                        item.sessionId
                )
        )


    const strongActions =
        filtered.filter(
            (item) =>
                STRONG_ACTIONS.includes(
                    item.type
                )
        )


    const convertedSessions =
        new Set(
            strongActions.map(
                (item) =>
                    item.sessionId
            )
        )


    const conversionRate =
        sessionIds.size > 0
            ? (
                  (
                      convertedSessions.size /
                      sessionIds.size
                  ) *
                  100
              ).toFixed(
                  1
              )
            : "0.0"


    /* =====================================================
       BREAKDOWN
    ===================================================== */

    const createBreakdown = (
        type,
        field
    ) => {
        const result = {}


        filtered
            .filter(
                (item) =>
                    item.type ===
                    type
            )
            .forEach(
                (item) => {
                    const name =
                        item[field] ||
                        "Sin nombre"


                    result[name] =
                        (
                            result[name] ||
                            0
                        ) + 1
                }
            )


        return Object.entries(
            result
        )
            .map(
                (
                    [
                        name,
                        count
                    ]
                ) => ({
                    name,
                    count
                })
            )
            .sort(
                (a, b) =>
                    b.count -
                    a.count
            )
    }


    const eventBreakdown =
        createBreakdown(
            "event_whatsapp",
            "eventTitle"
        )


    const partyBreakdown =
        createBreakdown(
            "party_whatsapp",
            "packageTitle"
        )


    /* =====================================================
       RENDER
    ===================================================== */

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
                    RESULTADOS WEB
                </span>

                <h1>
                    Rendimiento de la web
                </h1>

                <p>
                    Acciones generadas
                    directamente desde la
                    página de Q&apos; Bola.
                </p>

            </section>


            <div className="admin-analytics-periods">

                <button
                    type="button"
                    className={
                        period ===
                        "1"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setPeriod(
                            "1"
                        )
                    }
                >
                    Hoy
                </button>


                <button
                    type="button"
                    className={
                        period ===
                        "7"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setPeriod(
                            "7"
                        )
                    }
                >
                    7 días
                </button>


                <button
                    type="button"
                    className={
                        period ===
                        "30"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setPeriod(
                            "30"
                        )
                    }
                >
                    30 días
                </button>


                <button
                    type="button"
                    className={
                        period ===
                        "all"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setPeriod(
                            "all"
                        )
                    }
                >
                    Todo
                </button>

            </div>


            {loading ? (

                <p className="admin-empty">
                    Cargando estadísticas...
                </p>

            ) : (

                <>

                    <section className="admin-analytics-hero-grid">

                        <article>
                            <span>
                                👥
                            </span>

                            <strong>
                                {
                                    sessionIds.size
                                }
                            </strong>

                            <small>
                                sesiones
                            </small>
                        </article>


                        <article>
                            <span>
                                👆
                            </span>

                            <strong>
                                {
                                    strongActions.length
                                }
                            </strong>

                            <small>
                                acciones importantes
                            </small>
                        </article>


                        <article>
                            <span>
                                📈
                            </span>

                            <strong>
                                {
                                    conversionRate
                                }%
                            </strong>

                            <small>
                                sesiones con acción
                            </small>
                        </article>


                        <article>
                            <span>
                                👁️
                            </span>

                            <strong>
                                {
                                    countType(
                                        "page_view"
                                    )
                                }
                            </strong>

                            <small>
                                páginas vistas
                            </small>
                        </article>

                    </section>


                    <section className="admin-analytics-grid">

                        <article>
                            <span>
                                📞
                            </span>

                            <strong>
                                {
                                    countType(
                                        "phone_click"
                                    )
                                }
                            </strong>

                            <small>
                                llamadas iniciadas
                            </small>
                        </article>


                        <article>
                            <span>
                                📍
                            </span>

                            <strong>
                                {
                                    countType(
                                        "map_open"
                                    )
                                }
                            </strong>

                            <small>
                                mapas abiertos
                            </small>
                        </article>


                        <article>
                            <span>
                                🥡
                            </span>

                            <strong>
                                {
                                    countType(
                                        "doordash_click"
                                    )
                                }
                            </strong>

                            <small>
                                enviados a DoorDash
                            </small>
                        </article>


                        <article>
                            <span>
                                💬
                            </span>

                            <strong>
                                {
                                    countType(
                                        "contact_whatsapp"
                                    )
                                }
                            </strong>

                            <small>
                                WhatsApp general
                            </small>
                        </article>


                        <article>
                            <span>
                                🎉
                            </span>

                            <strong>
                                {
                                    countType(
                                        "party_whatsapp"
                                    )
                                }
                            </strong>

                            <small>
                                combos solicitados
                            </small>
                        </article>


                        <article>
                            <span>
                                🎤
                            </span>

                            <strong>
                                {
                                    countType(
                                        "event_whatsapp"
                                    )
                                }
                            </strong>

                            <small>
                                reservas de eventos
                            </small>
                        </article>

                    </section>


                    <section className="admin-analytics-details">

                        <article>

                            <span className="admin-kicker">
                                EVENTOS
                            </span>

                            <h2>
                                Reservas generadas
                            </h2>


                            {eventBreakdown.length ===
                            0 ? (

                                <p>
                                    Todavía no hay
                                    reservas registradas.
                                </p>

                            ) : (

                                eventBreakdown.map(
                                    (
                                        item
                                    ) => (

                                        <div
                                            key={
                                                item.name
                                            }
                                            className="admin-analytics-row"
                                        >
                                            <span>
                                                {
                                                    item.name
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    item.count
                                                }
                                            </strong>
                                        </div>

                                    )
                                )

                            )}

                        </article>


                        <article>

                            <span className="admin-kicker">
                                FIESTAS
                            </span>

                            <h2>
                                Combos solicitados
                            </h2>


                            {partyBreakdown.length ===
                            0 ? (

                                <p>
                                    Todavía no hay
                                    solicitudes registradas.
                                </p>

                            ) : (

                                partyBreakdown.map(
                                    (
                                        item
                                    ) => (

                                        <div
                                            key={
                                                item.name
                                            }
                                            className="admin-analytics-row"
                                        >
                                            <span>
                                                {
                                                    item.name
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    item.count
                                                }
                                            </strong>
                                        </div>

                                    )
                                )

                            )}

                        </article>

                    </section>

                </>
            )}

        </main>
    )
}


export default AdminAnalytics