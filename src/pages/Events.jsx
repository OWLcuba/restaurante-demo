import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Events.css"

function Events() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadEvents() {
            try {
                const querySnapshot = await getDocs(
                    collection(db, "specialEvents")
                )

                const eventData = querySnapshot.docs
                    .map((document) => ({
                        firebaseId: document.id,
                        ...document.data()
                    }))
                    .filter((event) => event.active !== false)

                setEvents(eventData)
            } catch (firebaseError) {
                console.error(
                    "Error al cargar los eventos:",
                    firebaseError
                )

                setError("No se pudieron cargar los eventos.")
            } finally {
                setLoading(false)
            }
        }

        loadEvents()
    }, [])

    return (
        <main className="events-page">
            <section className="events-header">
                <span className="events-kicker">
                    PRÓXIMOS EVENTOS
                </span>

                <h1>Vive la noche en Q&apos; Bola</h1>

                <p>
                    Música en vivo, artistas invitados y experiencias
                    especiales. Reserva tu entrada antes de que se agoten.
                </p>
            </section>

            {loading && (
                <p className="event-status">
                    Cargando eventos...
                </p>
            )}

            {error && (
                <p className="event-status">
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                events.map((event) => (
                    <section
                        key={event.firebaseId}
                        className="featured-event"
                    >
                        <div className="featured-event-image">
                            <img
                                src={event.imageUrl}
                                alt={`${event.title} en ${event.venue}`}
                            />

                            <div className="featured-event-date">
                                <strong>
                                    {event.dateLabel?.split(" ")[0]}
                                </strong>

                                <span>
                                    {event.dateLabel?.split(" ")[1]}
                                </span>
                            </div>

                            <div className="featured-event-badge">
                                PRÓXIMO EVENTO
                            </div>
                        </div>

                        <div className="featured-event-content">
                            <span className="featured-event-label">
                                EN VIVO
                            </span>

                            <h2>{event.title}</h2>

                            <h3>
                                En {event.venue}
                            </h3>

                            <div className="event-info-row">
                                <div>
                                    <span className="event-info-icon">
                                        📅
                                    </span>

                                    <div>
                                        <small>Fecha</small>
                                        <strong>
                                            {event.dateLabel}
                                        </strong>
                                    </div>
                                </div>

                                <div>
                                    <span className="event-info-icon">
                                        🎟️
                                    </span>

                                    <div>
                                        <small>Ofertas</small>
                                        <strong>
                                            {event.offers?.length || 0} opciones
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            <p className="featured-event-description">
                                {event.description}
                            </p>

                            <div className="event-options-preview">
                                {event.offers
                                    ?.filter((offer) => offer.active !== false)
                                    .map((offer) => (
                                        <span key={offer.type}>
                                            {offer.name}
                                        </span>
                                    ))}
                            </div>

                            <Link
                                to={`/eventos/${event.firebaseId}`}
                                className="event-primary-button"
                            >
                                Ver ofertas del evento
                            </Link>
                        </div>
                    </section>
                ))}
        </main>
    )
}

export default Events