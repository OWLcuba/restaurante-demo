import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Link, useParams } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Parties.css"

import {
    trackWebAction
} from "../utils/analytics"


function PartyDetail() {
    const { packageId } = useParams()

    const [partyPackage, setPartyPackage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [showReservation, setShowReservation] =
        useState(false)

    const [reservationData, setReservationData] =
        useState({
            name: "",
            date: "",
            time: "",
            address: ""
        })


    useEffect(() => {
        async function loadPartyPackage() {
            try {
                const packageRef = doc(
                    db,
                    "partyPackages",
                    packageId
                )

                const packageSnapshot =
                    await getDoc(packageRef)

                if (!packageSnapshot.exists()) {
                    setError(
                        "Combo no encontrado."
                    )

                    return
                }

                setPartyPackage({
                    firebaseId:
                        packageSnapshot.id,

                    ...packageSnapshot.data()
                })
            } catch (firebaseError) {
                console.error(
                    "Error al cargar el combo:",
                    firebaseError
                )

                setError(
                    "No se pudo cargar este combo."
                )
            } finally {
                setLoading(false)
            }
        }

        loadPartyPackage()
    }, [packageId])


    useEffect(() => {
        if (!showReservation) {
            return
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setShowReservation(false)
            }
        }

        document.body.style.overflow = "hidden"

        window.addEventListener(
            "keydown",
            handleEscape
        )

        return () => {
            document.body.style.overflow = ""

            window.removeEventListener(
                "keydown",
                handleEscape
            )
        }
    }, [showReservation])


    const getToday = () => {
        const now = new Date()

        const year = now.getFullYear()

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0")

        const day = String(
            now.getDate()
        ).padStart(2, "0")

        return `${year}-${month}-${day}`
    }


    const formatDate = (dateValue) => {
        if (!dateValue) {
            return ""
        }

        const [
            year,
            month,
            day
        ] = dateValue.split("-")

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        )

        return date.toLocaleDateString(
            "es-US",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        )
    }


    const handleReservationChange = (
        event
    ) => {
        const {
            name,
            value
        } = event.target

        setReservationData(
            (current) => ({
                ...current,
                [name]: value
            })
        )
    }


    const openReservation = () => {
        setReservationData({
            name: "",
            date: "",
            time: "",
            address: ""
        })

        setShowReservation(true)
    }


    const closeReservation = () => {
        setShowReservation(false)
    }


    const handleReservationSubmit = (
        event
    ) => {
        event.preventDefault()

        const phoneNumber =
            "13059700125"

        const message =
            `Hola, quiero reservar el combo "${partyPackage.title}" ` +
            `para ${partyPackage.serves} personas.\n\n` +
            `Reserva a nombre de: ${reservationData.name}\n` +
            `Fecha de entrega: ${formatDate(
                reservationData.date
            )}\n` +
            `Hora de entrega: ${reservationData.time}\n` +
            `Ubicación de entrega: ${reservationData.address}`

        const whatsappUrl =
            `https://wa.me/${phoneNumber}` +
            `?text=${encodeURIComponent(
                message
            )}`

            trackWebAction(
                "party_whatsapp",
                {
                    category:
                        "parties",

                    packageId:
                        partyPackage.firebaseId ||
                        packageId,

                    packageTitle:
                        partyPackage.title,

                    value:
                        Number(
                        partyPackage.price
                        ) || 0
                }
            )

        window.open(
            whatsappUrl,
            "_blank",
            "noopener,noreferrer"
        )

        setShowReservation(false)
    }


    if (loading) {
        return (
            <main className="parties-page">
                <p className="party-status">
                    Cargando combo...
                </p>
            </main>
        )
    }


    if (error || !partyPackage) {
        return (
            <main className="parties-page">
                <h1>
                    {error ||
                        "Combo no encontrado"}
                </h1>

                <Link
                    to="/fiestas"
                    className="party-back-link"
                >
                    ← Volver a Fiestas
                </Link>
            </main>
        )
    }


    const price =
        Number(partyPackage.price) || 0

    const hasPrice =
        price > 0


    return (
        <main className="parties-page">
            <Link
                to="/fiestas"
                className="party-back-link"
            >
                ← Volver a Fiestas
            </Link>


            <section className="party-detail">
                <img
                    src={
                        partyPackage.imageUrl
                    }
                    alt={
                        partyPackage.title
                    }
                    className="party-detail-image"
                />


                <div className="party-detail-content">
                    <span className="party-serves">
                        Para{" "}
                        {partyPackage.serves}{" "}
                        personas
                    </span>

                    <h1>
                        {partyPackage.title}
                    </h1>

                    <p>
                        {
                            partyPackage.description
                        }
                    </p>


                    <h3>
                        Incluye
                    </h3>

                    <ul>
                        {partyPackage.includes?.map(
                            (item, index) => (
                                <li
                                    key={`${item}-${index}`}
                                >
                                    {item}
                                </li>
                            )
                        )}
                    </ul>


                    <strong className="party-detail-price">
                        {hasPrice
                            ? `$${price.toFixed(
                                  2
                              )}`
                            : "Precio por confirmar"}
                    </strong>


                    {hasPrice ? (
                        <button
                            type="button"
                            className="party-reserve-button"
                            onClick={
                                openReservation
                            }
                        >
                            Reservar este combo
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="party-reserve-button"
                            disabled
                        >
                            Próximamente
                        </button>
                    )}
                </div>
            </section>


            {showReservation && (
                <div
                    className="party-modal-backdrop"
                    onMouseDown={
                        closeReservation
                    }
                >
                    <section
                        className="party-modal"
                        onMouseDown={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="party-modal-header">
                            <div>
                                <span>
                                    RESERVAR COMBO
                                </span>

                                <h2>
                                    {
                                        partyPackage.title
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="party-modal-close"
                                onClick={
                                    closeReservation
                                }
                                aria-label="Cerrar"
                            >
                                ×
                            </button>
                        </div>


                        <p className="party-modal-description">
                            Indica a nombre de quién va
                            la reserva y cuándo y dónde
                            quieres recibir tu pedido.
                        </p>


                        <form
                            className="party-reservation-form"
                            onSubmit={
                                handleReservationSubmit
                            }
                        >
                            <label>
                                Nombre para la reserva

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        reservationData.name
                                    }
                                    onChange={
                                        handleReservationChange
                                    }
                                    placeholder="Ej: Juan Pérez"
                                    autoComplete="name"
                                    required
                                />
                            </label>


                            <label>
                                Fecha de entrega

                                <input
                                    type="date"
                                    name="date"
                                    value={
                                        reservationData.date
                                    }
                                    onChange={
                                        handleReservationChange
                                    }
                                    min={
                                        getToday()
                                    }
                                    required
                                />
                            </label>


                            <label>
                                Hora de entrega

                                <input
                                    type="time"
                                    name="time"
                                    value={
                                        reservationData.time
                                    }
                                    onChange={
                                        handleReservationChange
                                    }
                                    required
                                />
                            </label>


                            <label className="party-address-field">
                                Dirección de entrega

                                <textarea
                                    name="address"
                                    value={
                                        reservationData.address
                                    }
                                    onChange={
                                        handleReservationChange
                                    }
                                    rows="3"
                                    placeholder="Ej: 123 Main St, San Antonio, TX 78205"
                                    required
                                />
                            </label>


                            <button
                                type="submit"
                                className="party-whatsapp-button"
                            >
                                Continuar por WhatsApp
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </main>
    )
}


export default PartyDetail