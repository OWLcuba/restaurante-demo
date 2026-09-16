import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Link, useParams } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Events.css"


function EventDetail() {
    const { eventId } = useParams()

    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")


    useEffect(() => {
        async function loadEvent() {
            try {
                const eventRef = doc(
                    db,
                    "specialEvents",
                    eventId
                )

                const eventSnapshot = await getDoc(
                    eventRef
                )

                if (!eventSnapshot.exists()) {
                    setError(
                        "Evento no encontrado."
                    )

                    return
                }

                setEvent({
                    firebaseId:
                        eventSnapshot.id,

                    ...eventSnapshot.data()
                })
            } catch (firebaseError) {
                console.error(
                    "Error al cargar el evento:",
                    firebaseError
                )

                setError(
                    "No se pudo cargar este evento."
                )
            } finally {
                setLoading(false)
            }
        }

        loadEvent()
    }, [eventId])


    const handleReservation = (offer) => {
        const phoneNumber = "13059700125"

        const offerType = (
            offer.type || ""
        ).toLowerCase()

        let reservationText =
            "una entrada normal"

        if (offerType === "table") {
            reservationText =
                "una mesa"
        }

        if (offerType === "vip") {
            reservationText =
                "una entrada VIP"
        }


        const message =
            `Hola, quiero reservar ${reservationText} ` +
            `para el evento/show ${event.title}.`


        const whatsappUrl =
            `https://wa.me/${phoneNumber}` +
            `?text=${encodeURIComponent(message)}`


        window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
        )
    }


    if (loading) {
        return (
            <main className="events-page">
                <p className="event-status">
                    Cargando evento...
                </p>
            </main>
        )
    }


    if (error || !event) {
        return (
            <main className="events-page">
                <h1>
                    {error ||
                        "Evento no encontrado"}
                </h1>

                <Link
                    to="/eventos"
                    className="event-back-link"
                >
                    ← Volver a Eventos
                </Link>
            </main>
        )
    }


    const activeOffers =
        event.offers?.filter(
            (offer) =>
                offer.active !== false
        ) || []


    return (
        <main className="events-page">
            <Link
                to="/eventos"
                className="event-back-link"
            >
                ← Volver a Eventos
            </Link>


            <section className="event-detail-hero">
                <img
                    src={event.imageUrl}
                    alt={`${event.title} en ${event.venue}`}
                />

                <div className="event-detail-overlay">
                    <span>
                        {event.dateLabel}
                    </span>

                    <h1>
                        {event.title}
                    </h1>

                    <p>
                        En {event.venue}
                    </p>
                </div>
            </section>


            <section className="event-offers-section">
                <div className="event-offers-header">
                    <span>
                        OFERTAS DISPONIBLES
                    </span>

                    <h2>
                        Elige cómo quieres vivir
                        la noche
                    </h2>

                    <p>
                        Selecciona entre las opciones
                        disponibles para este evento.
                    </p>
                </div>


                <div className="event-offers-grid">
                    {activeOffers.map(
                        (offer, index) => {
                            const offerType = (
                                offer.type || ""
                            ).toLowerCase()

                            const price =
                                Number(
                                    offer.price
                                ) || 0

                            const hasPrice =
                                price > 0

                            const soldOut =
                                offer.available !==
                                    undefined &&
                                Number(
                                    offer.available
                                ) <= 0


                            return (
                                <article
                                    key={`${offerType}-${index}`}
                                    className={
                                        offerType ===
                                        "vip"
                                            ? "event-offer-card featured"
                                            : "event-offer-card"
                                    }
                                >
                                    <span className="event-offer-type">
                                        {offerType.toUpperCase()}
                                    </span>

                                    <h3>
                                        {offer.name}
                                    </h3>

                                    <p>
                                        {offer.description ||
                                            "Acceso disponible para este evento."}
                                    </p>


                                    <strong>
                                        {hasPrice
                                            ? `$${price.toFixed(
                                                  2
                                              )}`
                                            : "Precio por confirmar"}
                                    </strong>


                                    {!hasPrice ? (
                                        <button
                                            type="button"
                                            disabled
                                        >
                                            Próximamente
                                        </button>
                                    ) : soldOut ? (
                                        <button
                                            type="button"
                                            disabled
                                        >
                                            Agotado
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleReservation(
                                                    offer
                                                )
                                            }
                                        >
                                            Reservar
                                        </button>
                                    )}
                                </article>
                            )
                        }
                    )}
                </div>
            </section>
        </main>
    )
}


export default EventDetail