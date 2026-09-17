import {
    useEffect,
    useState
} from "react"

import {
    collection,
    doc,
    getDoc,
    getDocs
} from "firebase/firestore"

import {
    Link,
    useParams
} from "react-router-dom"

import {
    db
} from "../firebase/firebase"

import "./Events.css"

import {
    trackWebAction
} from "../utils/analytics"


/* =====================================================
   HELPERS
===================================================== */

const clamp = (
    value,
    min,
    max
) => {
    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    )
}


const getAreaCenter = (
    points = []
) => {
    if (!points.length) {
        return {
            x: 50,
            y: 50
        }
    }


    const total =
        points.reduce(
            (
                result,
                point
            ) => ({
                x:
                    result.x +
                    Number(
                        point.x
                    ),

                y:
                    result.y +
                    Number(
                        point.y
                    )
            }),
            {
                x: 0,
                y: 0
            }
        )


    return {
        x:
            total.x /
            points.length,

        y:
            total.y /
            points.length
    }
}


const formatPrice = (
    value
) => {
    const number =
        Number(
            value
        )


    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0
    ) {
        return "Precio por confirmar"
    }


    return `$${number.toFixed(
        2
    )}`
}


/* =====================================================
   COMPONENTE
===================================================== */

function EventDetail() {
    const {
        eventId
    } = useParams()


    const [
        event,
        setEvent
    ] = useState(null)


    const [
        venue,
        setVenue
    ] = useState(null)


    const [
        loading,
        setLoading
    ] = useState(true)


    const [
        error,
        setError
    ] = useState("")


    const [
        showReservation,
        setShowReservation
    ] = useState(false)


    const [
        selectedOffer,
        setSelectedOffer
    ] = useState(null)


    const [
        customerName,
        setCustomerName
    ] = useState("")


    const [
        quantity,
        setQuantity
    ] = useState(1)


    const [
        selectedSeatIds,
        setSelectedSeatIds
    ] = useState([])


    /* =====================================================
       CARGAR EVENTO + LOCAL
    ===================================================== */

    useEffect(() => {
        async function loadEvent() {
            try {
                const eventRef =
                    doc(
                        db,
                        "specialEvents",
                        eventId
                    )


                const eventSnapshot =
                    await getDoc(
                        eventRef
                    )


                if (
                    !eventSnapshot.exists()
                ) {
                    setError(
                        "Evento no encontrado."
                    )

                    return
                }


                const eventData = {
                    firebaseId:
                        eventSnapshot.id,

                    ...eventSnapshot.data()
                }


                setEvent(
                    eventData
                )


                /*
                    Nuevo formato:
                    buscamos directamente
                    por venueId.
                */

                if (
                    eventData.venueId
                ) {
                    const venueSnapshot =
                        await getDoc(
                            doc(
                                db,
                                "venues",
                                eventData.venueId
                            )
                        )


                    if (
                        venueSnapshot.exists()
                    ) {
                        setVenue({
                            firebaseId:
                                venueSnapshot.id,

                            ...venueSnapshot.data()
                        })

                        return
                    }
                }


                /*
                    Compatibilidad con eventos
                    antiguos que solo tienen
                    venue: "Q' Bola".
                */

                const venuesSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "venues"
                        )
                    )


                const matchingVenue =
                    venuesSnapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .find(
                            (venueItem) =>
                                venueItem.name ===
                                eventData.venue
                        )


                if (
                    matchingVenue
                ) {
                    setVenue(
                        matchingVenue
                    )
                }

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

    }, [
        eventId
    ])


    /* =====================================================
       MODAL
    ===================================================== */

    useEffect(() => {
        if (!showReservation) {
            return
        }


        const previousOverflow =
            document.body
                .style
                .overflow


        document.body.style.overflow =
            "hidden"


        const handleKeyDown = (
            keyboardEvent
        ) => {
            if (
                keyboardEvent.key ===
                "Escape"
            ) {
                setShowReservation(
                    false
                )
            }
        }


        window.addEventListener(
            "keydown",
            handleKeyDown
        )


        return () => {
            document.body.style.overflow =
                previousOverflow


            window.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }

    }, [
        showReservation
    ])


    /* =====================================================
       DATOS DEL PLANO
    ===================================================== */

    const seatingMap =
        venue
            ?.seatingMap ||
        null


    const seats =
        Array.isArray(
            seatingMap?.seats
        )
            ? seatingMap.seats
            : []


    const standingAreas =
        Array.isArray(
            seatingMap
                ?.standingAreas
        )
            ? seatingMap
                  .standingAreas
            : []


    /* =====================================================
       ESTADOS
    ===================================================== */

    const getSeatStatus = (
        seatId
    ) => {
        const status =
            event
                ?.seatStatus?.[
                    seatId
                ]


        if (
            status ===
                "reserved" ||
            status ===
                "blocked"
        ) {
            return status
        }


        return "available"
    }


    /* =====================================================
       GENERAL
    ===================================================== */

    const totalStandingCapacity =
        standingAreas.reduce(
            (
                total,
                area
            ) =>
                total +
                (
                    Number(
                        area.capacity
                    ) || 0
                ),
            0
        )


    const hasStandingInventory =
        event
            ?.standingAvailability &&
        Object.keys(
            event
                .standingAvailability
        ).length > 0


    const getStandingAvailable = (
        area
    ) => {
        const capacity =
            Number(
                area.capacity
            ) || 0


        const saved =
            Number(
                event
                    ?.standingAvailability?.[
                        area.id
                    ]
            )


        if (
            Number.isFinite(
                saved
            )
        ) {
            return clamp(
                saved,
                0,
                capacity
            )
        }


        return capacity
    }


    const calculatedGeneralAvailable =
        standingAreas.reduce(
            (
                total,
                area
            ) =>
                total +
                getStandingAvailable(
                    area
                ),
            0
        )


    /* =====================================================
       OFERTAS
    ===================================================== */

    const activeOffers =
        event
            ?.offers
            ?.filter(
                (offer) =>
                    offer.active !==
                    false
            ) ||
        []


    const getOfferType = (
        offer
    ) => {
        return (
            offer?.type ||
            ""
        ).toLowerCase()
    }


    const getOfferAvailability = (
        offer
    ) => {
        const type =
            getOfferType(
                offer
            )


        if (
            type ===
            "general"
        ) {
            /*
                Nuevo inventario.
            */

            if (
                standingAreas.length >
                    0 &&
                hasStandingInventory
            ) {
                return calculatedGeneralAvailable
            }


            /*
                Fallback para eventos
                anteriores.
            */

            const saved =
                Number(
                    offer.available
                )


            if (
                Number.isFinite(
                    saved
                )
            ) {
                return saved
            }


            return totalStandingCapacity
        }


        if (
            type ===
            "table"
        ) {
            if (
                seats.length > 0
            ) {
                return seats.filter(
                    (seat) =>
                        seat.type ===
                            "table" &&
                        getSeatStatus(
                            seat.id
                        ) ===
                            "available"
                ).length
            }


            return Number(
                offer.available
            ) || 0
        }


        if (
            type ===
            "vip"
        ) {
            if (
                seats.length > 0
            ) {
                return seats.filter(
                    (seat) =>
                        seat.type ===
                            "vip" &&
                        getSeatStatus(
                            seat.id
                        ) ===
                            "available"
                ).length
            }


            return Number(
                offer.available
            ) || 0
        }


        return Number(
            offer.available
        ) || 0
    }


    /* =====================================================
       ABRIR RESERVA
    ===================================================== */

    const openReservation = (
        offer
    ) => {
        const available =
            getOfferAvailability(
                offer
            )


        if (
            available <= 0
        ) {
            return
        }


        setSelectedOffer(
            offer
        )

        setQuantity(
            1
        )

        setSelectedSeatIds(
            []
        )

        setShowReservation(
            true
        )
    }


    const closeReservation = () => {
        setShowReservation(
            false
        )

        setSelectedOffer(
            null
        )

        setSelectedSeatIds(
            []
        )
    }


    /* =====================================================
       CANTIDAD
    ===================================================== */

    const changeQuantity = (
        value
    ) => {
        if (!selectedOffer) {
            return
        }


        const max =
            getOfferAvailability(
                selectedOffer
            )


        setQuantity(
            clamp(
                Number(
                    value
                ) || 1,
                1,
                Math.max(
                    1,
                    max
                )
            )
        )
    }


    /* =====================================================
       SELECCIONAR MESA / VIP
    ===================================================== */

    const toggleSeat = (
        seat
    ) => {
        if (!selectedOffer) {
            return
        }


        const offerType =
            getOfferType(
                selectedOffer
            )


        if (
            seat.type !==
            offerType
        ) {
            return
        }


        if (
            getSeatStatus(
                seat.id
            ) !==
            "available"
        ) {
            return
        }


        setSelectedSeatIds(
            (current) => {
                if (
                    current.includes(
                        seat.id
                    )
                ) {
                    return current.filter(
                        (id) =>
                            id !==
                            seat.id
                    )
                }


                return [
                    ...current,
                    seat.id
                ]
            }
        )
    }


    /* =====================================================
       SELECCIÓN
    ===================================================== */

    const selectedOfferType =
        getOfferType(
            selectedOffer
        )


    const usesSeatSelector =
        selectedOfferType ===
            "table" ||
        selectedOfferType ===
            "vip"


    const selectedSeats =
        seats.filter(
            (seat) =>
                selectedSeatIds.includes(
                    seat.id
                )
        )


    const selectedCapacity =
        selectedSeats.reduce(
            (
                total,
                seat
            ) =>
                total +
                (
                    Number(
                        seat.capacity
                    ) || 0
                ),
            0
        )


    const reservationCount =
        usesSeatSelector
            ? selectedSeatIds.length
            : quantity


    const unitPrice =
        Number(
            selectedOffer?.price
        ) || 0


    const reservationTotal =
        reservationCount *
        unitPrice


    /* =====================================================
       WHATSAPP
    ===================================================== */

    const continueToWhatsApp = () => {
        if (
            !selectedOffer ||
            !customerName.trim()
        ) {
            return
        }


        if (
            usesSeatSelector &&
            selectedSeatIds.length ===
                0
        ) {
            return
        }


        const phoneNumber =
            "13059700125"


        const lines = [
            `Hola, quiero solicitar una reserva para el evento ${event.title}.`,
            "",
            `Nombre: ${customerName.trim()}`,
            `Oferta: ${selectedOffer.name}`
        ]


        if (
            selectedOfferType ===
            "general"
        ) {
            lines.push(
                `Cantidad: ${quantity} entradas`
            )
        }


        if (
            usesSeatSelector
        ) {
            lines.push(
                `${
                    selectedOfferType ===
                    "vip"
                        ? "VIP"
                        : "Mesas"
                }: ${selectedSeats
                    .map(
                        (seat) =>
                            seat.label ||
                            seat.id
                    )
                    .join(", ")}`
            )


            lines.push(
                `Capacidad total: ${selectedCapacity} personas`
            )
        }


        if (
            unitPrice > 0
        ) {
            lines.push(
                `Precio unitario: ${formatPrice(unitPrice)}`
            )

            lines.push(
                `Total estimado: ${formatPrice(reservationTotal)}`
            )
        }


        lines.push(
            "",
            `Fecha: ${event.dateLabel}`,
            `Local: ${event.venue}`
        )


        const whatsappUrl =
            `https://wa.me/${phoneNumber}` +
            `?text=${encodeURIComponent(
                lines.join(
                    "\n"
                )
            )}`


            trackWebAction(
                "event_whatsapp",
                {
                    category:
                        "events",

                    eventId:
                        event.firebaseId ||
                        eventId,

                    eventTitle:
                        event.title,

                    offerType:
                        selectedOfferType,

                    offerName:
                        selectedOffer.name,

                    quantity:
                        reservationCount,

                    value:
                        reservationTotal,

                    seatIds:
                        selectedSeatIds
                }
            )
            
        window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
        )
    }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <main className="events-page">

                <p className="event-status">
                    Cargando evento...
                </p>

            </main>
        )
    }


    if (
        error ||
        !event
    ) {
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


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="events-page">

            <Link
                to="/eventos"
                className="event-back-link"
            >
                ← Volver a Eventos
            </Link>


            {/* =====================================================
                HERO
            ===================================================== */}

            <section className="event-detail-hero">

                <img
                    src={
                        event.imageUrl
                    }
                    alt={`${event.title} en ${event.venue}`}
                />


                <div className="event-detail-overlay">

                    <span>
                        {
                            event.dateLabel
                        }
                    </span>


                    <h1>
                        {
                            event.title
                        }
                    </h1>


                    <p>
                        En{" "}
                        {
                            event.venue
                        }
                    </p>

                </div>

            </section>


            {/* =====================================================
                OFERTAS
            ===================================================== */}

            <section className="event-offers-section">

                <div className="event-offers-header">

                    <span>
                        OFERTAS DISPONIBLES
                    </span>


                    <h2>
                        Elige cómo quieres
                        vivir la noche
                    </h2>


                    <p>
                        Selecciona tu entrada,
                        mesa o experiencia VIP
                        y revisa la distribución
                        del local antes de reservar.
                    </p>

                </div>


                <div className="event-offers-grid">

                    {activeOffers.map(
                        (
                            offer,
                            index
                        ) => {
                            const offerType =
                                getOfferType(
                                    offer
                                )


                            const price =
                                Number(
                                    offer.price
                                ) || 0


                            const available =
                                getOfferAvailability(
                                    offer
                                )


                            const soldOut =
                                available <=
                                0


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
                                        {
                                            offerType.toUpperCase()
                                        }
                                    </span>


                                    <h3>
                                        {
                                            offer.name
                                        }
                                    </h3>


                                    <p>
                                        {offer.description ||
                                            "Acceso disponible para este evento."}
                                    </p>


                                    <div className="event-offer-availability">

                                        <span>
                                            {soldOut
                                                ? "AGOTADO"
                                                : `${available} disponibles`}
                                        </span>

                                    </div>


                                    <strong>
                                        {
                                            formatPrice(
                                                price
                                            )
                                        }
                                    </strong>


                                    {price <=
                                    0 ? (

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
                                                openReservation(
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


            {/* =====================================================
                MODAL
            ===================================================== */}

            {showReservation &&
                selectedOffer && (

                <div
                    className="event-reservation-overlay"
                    onMouseDown={(
                        mouseEvent
                    ) => {
                        if (
                            mouseEvent.target ===
                            mouseEvent.currentTarget
                        ) {
                            closeReservation()
                        }
                    }}
                >

                    <section
                        className="event-reservation-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Reservar evento"
                    >

                        {/* HEADER */}

                        <div className="event-reservation-modal-header">

                            <div>

                                <span>
                                    RESERVA
                                </span>


                                <h2>
                                    {
                                        selectedOffer.name
                                    }
                                </h2>


                                <p>
                                    {
                                        event.title
                                    }{" "}
                                    ·{" "}
                                    {
                                        event.dateLabel
                                    }
                                </p>

                            </div>


                            <button
                                type="button"
                                className="event-reservation-close"
                                onClick={
                                    closeReservation
                                }
                                aria-label="Cerrar"
                            >
                                ×
                            </button>

                        </div>


                        {/* NOMBRE */}

                        <div className="event-reservation-customer">

                            <label>

                                Nombre de la reserva

                                <input
                                    type="text"
                                    value={
                                        customerName
                                    }
                                    onChange={(
                                        inputEvent
                                    ) =>
                                        setCustomerName(
                                            inputEvent
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Tu nombre completo"
                                    autoComplete="name"
                                />

                            </label>

                        </div>


                        {/* GENERAL */}

                        {selectedOfferType ===
                            "general" && (

                            <div className="event-general-selection">

                                <div>

                                    <span>
                                        Cantidad de entradas
                                    </span>


                                    <div className="event-public-quantity">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeQuantity(
                                                    quantity -
                                                        1
                                                )
                                            }
                                            disabled={
                                                quantity <=
                                                1
                                            }
                                        >
                                            −
                                        </button>


                                        <input
                                            type="number"
                                            min="1"
                                            max={
                                                getOfferAvailability(
                                                    selectedOffer
                                                )
                                            }
                                            value={
                                                quantity
                                            }
                                            onChange={(
                                                inputEvent
                                            ) =>
                                                changeQuantity(
                                                    inputEvent
                                                        .target
                                                        .value
                                                )
                                            }
                                        />


                                        <button
                                            type="button"
                                            onClick={() =>
                                                changeQuantity(
                                                    quantity +
                                                        1
                                                )
                                            }
                                            disabled={
                                                quantity >=
                                                getOfferAvailability(
                                                    selectedOffer
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>


                                    <small>
                                        {
                                            getOfferAvailability(
                                                selectedOffer
                                            )
                                        }{" "}
                                        entradas disponibles
                                    </small>

                                </div>

                            </div>

                        )}


                        {/* INSTRUCCIÓN MAPA */}

                        {seatingMap && (

                            <div className="event-public-map-heading">

                                <div>

                                    <span>
                                        PLANO DEL LOCAL
                                    </span>


                                    <h3>
                                        {selectedOfferType ===
                                        "general"
                                            ? "Tu área en el evento"
                                            : selectedOfferType ===
                                                "vip"
                                              ? "Selecciona tu VIP"
                                              : "Selecciona tu mesa"}
                                    </h3>

                                </div>


                                {usesSeatSelector && (

                                    <strong>
                                        {
                                            selectedSeatIds.length
                                        }{" "}
                                        seleccionada
                                        {selectedSeatIds.length ===
                                        1
                                            ? ""
                                            : "s"}
                                    </strong>

                                )}

                            </div>

                        )}


                        {/* =====================================================
                            MAPA PÚBLICO
                        ===================================================== */}

                        {seatingMap && (

                            <div className="event-public-floor-plan">

                                {/* ÁREAS GENERAL */}

                                <svg
                                    className="event-public-standing-layer"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >

                                    {standingAreas.map(
                                        (
                                            area
                                        ) => {

                                            const points =
                                                area.points
                                                    ?.map(
                                                        (
                                                            point
                                                        ) =>
                                                            `${point.x},${point.y}`
                                                    )
                                                    .join(
                                                        " "
                                                    ) ||
                                                ""


                                            return (
                                                <polygon
                                                    key={
                                                        area.id
                                                    }
                                                    points={
                                                        points
                                                    }
                                                    className={[
                                                        "event-public-standing-area",

                                                        selectedOfferType ===
                                                        "general"
                                                            ? "highlighted"
                                                            : ""
                                                    ].join(
                                                        " "
                                                    )}
                                                />
                                            )
                                        }
                                    )}

                                </svg>


                                {/* LABEL GENERAL */}

                                {standingAreas.map(
                                    (
                                        area
                                    ) => {

                                        const center =
                                            getAreaCenter(
                                                area.points
                                            )


                                        return (
                                            <div
                                                key={`${area.id}-label`}
                                                className={[
                                                    "event-public-area-label",

                                                    selectedOfferType ===
                                                    "general"
                                                        ? "highlighted"
                                                        : ""
                                                ].join(
                                                    " "
                                                )}
                                                style={{
                                                    left:
                                                        `${center.x}%`,

                                                    top:
                                                        `${center.y}%`
                                                }}
                                            >

                                                <strong>
                                                    {
                                                        area.label
                                                    }
                                                </strong>


                                                <small>
                                                    {hasStandingInventory
                                                        ? getStandingAvailable(
                                                              area
                                                          )
                                                        : area.capacity}{" "}
                                                    disponibles
                                                </small>

                                            </div>
                                        )
                                    }
                                )}


                                {/* ESCENARIO */}

                                {seatingMap.stage && (

                                    <div
                                        className="event-public-stage"
                                        style={{
                                            left:
                                                `${seatingMap.stage.x ?? 50}%`,

                                            top:
                                                `${seatingMap.stage.y ?? 8}%`,

                                            width:
                                                `${seatingMap.stage.width ?? 76}%`,

                                            height:
                                                `${seatingMap.stage.height ?? 10}%`,

                                            transform:
                                                `translate(-50%, -50%) rotate(${seatingMap.stage.rotation ?? 0}deg)`
                                        }}
                                    >
                                        🎤{" "}
                                        {
                                            seatingMap.stage.label ||
                                            "ESCENARIO"
                                        }
                                    </div>

                                )}


                                {/* MARCADORES */}

                                {seatingMap.markers
                                    ?.map(
                                        (
                                            marker
                                        ) => (

                                            <div
                                                key={
                                                    marker.id
                                                }
                                                className="event-public-marker"
                                                style={{
                                                    left:
                                                        `${marker.x ?? 50}%`,

                                                    top:
                                                        `${marker.y ?? 50}%`,

                                                    width:
                                                        `${marker.width ?? 13}%`,

                                                    height:
                                                        `${marker.height ?? 8}%`,

                                                    transform:
                                                        `translate(-50%, -50%) rotate(${marker.rotation ?? 0}deg)`
                                                }}
                                            >

                                                <span>
                                                    {marker.id ===
                                                    "bar"
                                                        ? "🍹"
                                                        : marker.id ===
                                                            "entrance"
                                                          ? "🚪"
                                                          : "📍"}
                                                </span>


                                                {
                                                    marker.label
                                                }

                                            </div>

                                        )
                                    )}


                                {/* MESAS / VIP */}

                                {seats.map(
                                    (
                                        seat
                                    ) => {
                                        const status =
                                            getSeatStatus(
                                                seat.id
                                            )


                                        const correctType =
                                            seat.type ===
                                            selectedOfferType


                                        const canSelect =
                                            usesSeatSelector &&
                                            correctType &&
                                            status ===
                                                "available"


                                        const selected =
                                            selectedSeatIds.includes(
                                                seat.id
                                            )


                                        let visualState =
                                            status


                                        if (
                                            selectedOfferType ===
                                                "general" ||
                                            !correctType
                                        ) {
                                            visualState =
                                                "locked"
                                        }


                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    seat.id
                                                }
                                                className={[
                                                    "event-public-seat",

                                                    seat.type ===
                                                    "vip"
                                                        ? "vip"
                                                        : "table",

                                                    visualState,

                                                    selected
                                                        ? "selected"
                                                        : ""
                                                ].join(
                                                    " "
                                                )}
                                                style={{
                                                    left:
                                                        `${seat.x ?? 50}%`,

                                                    top:
                                                        `${seat.y ?? 50}%`,

                                                    width:
                                                        `${seat.width ?? 9}%`,

                                                    height:
                                                        `${seat.height ?? 10}%`,

                                                    transform:
                                                        `translate(-50%, -50%) rotate(${seat.rotation ?? 0}deg)`
                                                }}
                                                disabled={
                                                    !canSelect
                                                }
                                                onClick={() =>
                                                    toggleSeat(
                                                        seat
                                                    )
                                                }
                                                title={
                                                    `${seat.label || seat.id} · ${seat.capacity || 1} personas`
                                                }
                                            >

                                                <strong>
                                                    {
                                                        seat.label ||
                                                        seat.id
                                                    }
                                                </strong>


                                                <small>
                                                    {
                                                        seat.capacity ||
                                                        1
                                                    }
                                                    p
                                                </small>

                                            </button>
                                        )
                                    }
                                )}

                            </div>

                        )}


                        {/* LEYENDA */}

                        {usesSeatSelector &&
                            seatingMap && (

                            <div className="event-public-map-legend">

                                <span>
                                    <i className="available" />
                                    Disponible
                                </span>


                                <span>
                                    <i className="selected" />
                                    Seleccionada
                                </span>


                                <span>
                                    <i className="unavailable" />
                                    No disponible
                                </span>

                            </div>

                        )}


                        {/* SELECCIÓN MESAS */}

                        {usesSeatSelector &&
                            selectedSeats.length >
                                0 && (

                            <div className="event-public-selected-list">

                                {selectedSeats.map(
                                    (
                                        seat
                                    ) => (

                                        <button
                                            type="button"
                                            key={
                                                seat.id
                                            }
                                            onClick={() =>
                                                toggleSeat(
                                                    seat
                                                )
                                            }
                                        >
                                            <span>
                                                {seat.type ===
                                                "vip"
                                                    ? "⭐"
                                                    : "🪑"}
                                            </span>

                                            <strong>
                                                {
                                                    seat.label ||
                                                    seat.id
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    seat.capacity ||
                                                    1
                                                }{" "}
                                                personas
                                            </small>

                                            <b>
                                                ×
                                            </b>

                                        </button>
                                    )
                                )}

                            </div>

                        )}


                        {/* =====================================================
                            RESUMEN
                        ===================================================== */}

                        <div className="event-public-reservation-summary">

                            <div>

                                <span>
                                    {
                                        selectedOffer.name
                                    }
                                </span>


                                <small>
                                    {usesSeatSelector
                                        ? selectedSeatIds.length >
                                          0
                                            ? `${selectedSeatIds.length} ubicación${selectedSeatIds.length === 1 ? "" : "es"}`
                                            : "Selecciona una ubicación"
                                        : `${quantity} entrada${quantity === 1 ? "" : "s"}`}
                                </small>

                            </div>


                            {usesSeatSelector &&
                                selectedSeatIds.length >
                                    0 && (

                                <div>

                                    <span>
                                        Capacidad
                                    </span>

                                    <strong>
                                        {
                                            selectedCapacity
                                        }{" "}
                                        personas
                                    </strong>

                                </div>

                            )}


                            <div>

                                <span>
                                    Total
                                </span>

                                <strong>
                                    {
                                        formatPrice(
                                            reservationTotal
                                        )
                                    }
                                </strong>

                            </div>

                        </div>


                        {/* CONTINUAR */}

                        <button
                            type="button"
                            className="event-public-whatsapp-button"
                            disabled={
                                !customerName.trim() ||
                                (
                                    usesSeatSelector &&
                                    selectedSeatIds.length ===
                                        0
                                )
                            }
                            onClick={
                                continueToWhatsApp
                            }
                        >
                            Continuar por WhatsApp
                        </button>


                        <p className="event-public-reservation-note">
                            La reserva queda sujeta
                            a confirmación del local.
                        </p>

                    </section>

                </div>

            )}

        </main>
    )
}


export default EventDetail