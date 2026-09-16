import { useEffect, useState } from "react"
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc
} from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Admin.css"


const createDefaultOffers = () => [
    {
        type: "general",
        name: "Entrada General",
        description: "",
        price: "",
        available: "",
        active: true
    },
    {
        type: "table",
        name: "Mesa",
        description: "",
        price: "",
        available: "",
        active: true
    },
    {
        type: "vip",
        name: "Experiencia VIP",
        description: "",
        price: "",
        available: "",
        active: true
    }
]


const createEmptyForm = () => ({
    title: "",
    venue: "Q' Bola",
    date: "",
    dateLabel: "",
    description: "",
    imageUrl: "",
    active: true,
    offers: createDefaultOffers()
})


function AdminEvents() {
    const [events, setEvents] = useState([])
    const [formData, setFormData] = useState(
        createEmptyForm()
    )

    const [editingId, setEditingId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")


    const createDateLabel = (dateValue) => {
        if (!dateValue) {
            return ""
        }

        const [
            year,
            month,
            day
        ] = dateValue.split("-")

        const months = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC"
        ]

        const monthIndex =
            Number(month) - 1

        if (
            !year ||
            !day ||
            monthIndex < 0 ||
            monthIndex > 11
        ) {
            return ""
        }

        return `${Number(day)} ${months[monthIndex]} ${year}`
    }


    const createSlug = (text) => {
        return text
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
    }


    const loadEvents = async () => {
        try {
            const snapshot = await getDocs(
                collection(
                    db,
                    "specialEvents"
                )
            )

            const data = snapshot.docs
                .map((document) => ({
                    firebaseId:
                        document.id,

                    ...document.data()
                }))
                .sort((a, b) =>
                    (a.date || "")
                        .localeCompare(
                            b.date || ""
                        )
                )

            setEvents(data)
        } catch (error) {
            console.error(
                "Error al cargar eventos:",
                error
            )

            setMessage(
                "No se pudieron cargar los eventos."
            )
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadEvents()
    }, [])


    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target

        setFormData((current) => {
            const updated = {
                ...current,
                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            }

            if (name === "date") {
                updated.dateLabel =
                    createDateLabel(value)
            }

            return updated
        })
    }


    const handleOfferChange = (
        index,
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target

        setFormData((current) => {
            const offers = [
                ...current.offers
            ]

            offers[index] = {
                ...offers[index],

                [name]:
                    type === "checkbox"
                        ? checked
                        : value
            }

            return {
                ...current,
                offers
            }
        })
    }


    const addOffer = () => {
        setFormData((current) => ({
            ...current,

            offers: [
                ...current.offers,

                {
                    type: "general",
                    name: "",
                    description: "",
                    price: "",
                    available: "",
                    active: true
                }
            ]
        }))
    }


    const removeOffer = (index) => {
        setFormData((current) => ({
            ...current,

            offers:
                current.offers.filter(
                    (_, offerIndex) =>
                        offerIndex !== index
                )
        }))
    }


    const resetForm = () => {
        setFormData(
            createEmptyForm()
        )

        setEditingId(null)
    }


    const handleSubmit = async (
        event
    ) => {
        event.preventDefault()

        try {
            setSaving(true)
            setMessage("")

            const cleanOffers =
                formData.offers
                    .filter(
                        (offer) =>
                            offer.name.trim()
                    )
                    .map((offer) => ({
                        type:
                            offer.type
                                .trim()
                                .toLowerCase(),

                        name:
                            offer.name.trim(),

                        description:
                            offer.description.trim(),

                        price:
                            offer.price === ""
                                ? 0
                                : Number(
                                      offer.price
                                  ),

                        available:
                            offer.available === ""
                                ? 0
                                : Number(
                                      offer.available
                                  ),

                        active:
                            offer.active
                    }))


            const eventData = {
                active:
                    formData.active,

                date:
                    formData.date,

                dateLabel:
                    formData.dateLabel.trim() ||
                    createDateLabel(
                        formData.date
                    ),

                description:
                    formData.description.trim(),

                imageUrl:
                    formData.imageUrl.trim(),

                offers:
                    cleanOffers,

                title:
                    formData.title.trim(),

                venue:
                    formData.venue.trim()
            }


            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        "specialEvents",
                        editingId
                    ),
                    eventData
                )

                setMessage(
                    "Evento actualizado correctamente."
                )
            } else {
                const documentId =
                    createSlug(
                        formData.title
                    )

                if (!documentId) {
                    setMessage(
                        "No se pudo generar el ID del evento."
                    )

                    return
                }

                const eventRef = doc(
                    db,
                    "specialEvents",
                    documentId
                )

                const existingEvent =
                    await getDoc(eventRef)

                if (
                    existingEvent.exists()
                ) {
                    setMessage(
                        `Ya existe un evento con el ID "${documentId}".`
                    )

                    return
                }

                await setDoc(
                    eventRef,
                    eventData
                )

                setMessage(
                    `Evento creado correctamente con ID "${documentId}".`
                )
            }

            resetForm()

            await loadEvents()
        } catch (error) {
            console.error(
                "Error al guardar evento:",
                error
            )

            setMessage(
                "No se pudo guardar el evento."
            )
        } finally {
            setSaving(false)
        }
    }


    const handleEdit = (
        eventItem
    ) => {
        setEditingId(
            eventItem.firebaseId
        )

        setFormData({
            title:
                eventItem.title || "",

            venue:
                eventItem.venue ||
                "Q' Bola",

            date:
                eventItem.date || "",

            dateLabel:
                eventItem.dateLabel || "",

            description:
                eventItem.description || "",

            imageUrl:
                eventItem.imageUrl || "",

            active:
                eventItem.active !== false,

            offers:
                Array.isArray(
                    eventItem.offers
                )
                    ? eventItem.offers.map(
                          (offer) => ({
                              type:
                                  (
                                      offer.type ||
                                      "general"
                                  )
                                      .toLowerCase(),

                              name:
                                  offer.name || "",

                              description:
                                  offer.description ||
                                  "",

                              price:
                                  offer.price ?? "",

                              available:
                                  offer.available ??
                                  "",

                              active:
                                  offer.active !==
                                  false
                          })
                      )
                    : []
        })

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }


    const toggleActive = async (
        eventItem
    ) => {
        try {
            const newValue =
                eventItem.active === false

            await updateDoc(
                doc(
                    db,
                    "specialEvents",
                    eventItem.firebaseId
                ),
                {
                    active:
                        newValue
                }
            )

            setEvents((current) =>
                current.map((item) =>
                    item.firebaseId ===
                    eventItem.firebaseId
                        ? {
                              ...item,
                              active:
                                  newValue
                          }
                        : item
                )
            )
        } catch (error) {
            console.error(
                "Error al cambiar estado:",
                error
            )

            setMessage(
                "No se pudo cambiar el estado del evento."
            )
        }
    }


    const handleDelete = async (
        eventItem
    ) => {
        const confirmed =
            window.confirm(
                `¿Eliminar "${eventItem.title}"?`
            )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "specialEvents",
                    eventItem.firebaseId
                )
            )

            setEvents((current) =>
                current.filter(
                    (item) =>
                        item.firebaseId !==
                        eventItem.firebaseId
                )
            )

            if (
                editingId ===
                eventItem.firebaseId
            ) {
                resetForm()
            }

            setMessage(
                "Evento eliminado correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar evento:",
                error
            )

            setMessage(
                "No se pudo eliminar el evento."
            )
        }
    }


    const formatPrice = (price) => {
        const number =
            Number(price)

        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {
            return "Por confirmar"
        }

        return `$${number.toFixed(2)}`
    }


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
                    {editingId
                        ? "Editar evento"
                        : "Nuevo evento"}
                </h1>

                <p>
                    Administra directamente los
                    eventos y ofertas guardados
                    en Firestore.
                </p>
            </section>


            <form
                className="admin-form"
                onSubmit={handleSubmit}
            >
                <label>
                    Nombre del evento

                    <input
                        type="text"
                        name="title"
                        value={
                            formData.title
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="El Yonki"
                        required
                    />
                </label>


                <label>
                    Lugar

                    <input
                        type="text"
                        name="venue"
                        value={
                            formData.venue
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />
                </label>


                <label>
                    Descripción

                    <textarea
                        name="description"
                        value={
                            formData.description
                        }
                        onChange={
                            handleChange
                        }
                        rows="5"
                        required
                    />
                </label>


                <label>
                    Fecha

                    <input
                        type="date"
                        name="date"
                        value={
                            formData.date
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />
                </label>


                <label>
                    Texto de fecha

                    <input
                        type="text"
                        name="dateLabel"
                        value={
                            formData.dateLabel
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="26 SEP 2026"
                        required
                    />
                </label>


                <label className="admin-full-field">
                    URL de imagen

                    <input
                        type="text"
                        name="imageUrl"
                        value={
                            formData.imageUrl
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="/images/yonki.webp"
                        required
                    />
                </label>


                <label className="admin-checkbox-label">
                    <input
                        type="checkbox"
                        name="active"
                        checked={
                            formData.active
                        }
                        onChange={
                            handleChange
                        }
                    />

                    Evento activo
                </label>


                <section className="admin-offers-editor">
                    <div className="admin-offers-header">
                        <div>
                            <span className="admin-kicker">
                                OFERTAS
                            </span>

                            <h2>
                                Entradas y opciones
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="admin-add-button"
                            onClick={
                                addOffer
                            }
                        >
                            + Agregar oferta
                        </button>
                    </div>


                    {formData.offers.length ===
                    0 ? (
                        <p className="admin-empty">
                            Este evento todavía no
                            tiene ofertas.
                        </p>
                    ) : (
                        formData.offers.map(
                            (
                                offer,
                                index
                            ) => (
                                <article
                                    key={
                                        index
                                    }
                                    className="admin-offer-editor"
                                >
                                    <div className="admin-offer-title">
                                        <strong>
                                            Oferta{" "}
                                            {index +
                                                1}
                                        </strong>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeOffer(
                                                    index
                                                )
                                            }
                                        >
                                            Eliminar
                                        </button>
                                    </div>


                                    <div className="admin-offer-grid">
                                        <label>
                                            Tipo

                                            <select
                                                name="type"
                                                value={
                                                    offer.type
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                            >
                                                <option value="general">
                                                    General
                                                </option>

                                                <option value="table">
                                                    Mesa
                                                </option>

                                                <option value="vip">
                                                    VIP
                                                </option>
                                            </select>
                                        </label>


                                        <label>
                                            Nombre

                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    offer.name
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                required
                                            />
                                        </label>


                                        <label>
                                            Precio

                                            <input
                                                type="number"
                                                name="price"
                                                value={
                                                    offer.price
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                min="0"
                                                step="0.01"
                                            />
                                        </label>


                                        <label>
                                            Disponibles

                                            <input
                                                type="number"
                                                name="available"
                                                value={
                                                    offer.available
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                min="0"
                                                step="1"
                                            />
                                        </label>


                                        <label className="admin-offer-description">
                                            Descripción

                                            <textarea
                                                name="description"
                                                value={
                                                    offer.description
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                rows="3"
                                                placeholder="Descripción opcional"
                                            />
                                        </label>


                                        <label className="admin-checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={
                                                    offer.active
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                            />

                                            Oferta activa
                                        </label>
                                    </div>
                                </article>
                            )
                        )
                    )}
                </section>


                <div className="admin-form-actions">
                    <button
                        type="submit"
                        className="admin-save-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Guardando..."
                            : editingId
                              ? "Guardar cambios"
                              : "Crear evento"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="admin-cancel-button"
                            onClick={
                                resetForm
                            }
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>


                {message && (
                    <p className="admin-message">
                        {message}
                    </p>
                )}
            </form>


            <section className="admin-section">
                <div className="admin-section-title">
                    <span className="admin-kicker">
                        EVENTOS
                    </span>

                    <h2>
                        Eventos actuales
                    </h2>
                </div>


                {loading ? (
                    <p>
                        Cargando eventos...
                    </p>
                ) : events.length === 0 ? (
                    <p className="admin-empty">
                        No hay eventos guardados
                        en Firestore.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {events.map(
                            (eventItem) => (
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


                                        <p>
                                            ID:{" "}
                                            {
                                                eventItem.firebaseId
                                            }
                                        </p>


                                        <h2>
                                            {
                                                eventItem.title
                                            }
                                        </h2>


                                        <p>
                                            📍{" "}
                                            {
                                                eventItem.venue
                                            }
                                        </p>


                                        <p>
                                            📅{" "}
                                            {
                                                eventItem.dateLabel
                                            }
                                        </p>


                                        <p>
                                            {
                                                eventItem.description
                                            }
                                        </p>


                                        <div className="admin-event-offers">
                                            {eventItem.offers
                                                ?.filter(
                                                    (
                                                        offer
                                                    ) =>
                                                        offer.active !==
                                                        false
                                                )
                                                .map(
                                                    (
                                                        offer,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={`${offer.type}-${index}`}
                                                            className="admin-event-offer"
                                                        >
                                                            <strong>
                                                                {
                                                                    offer.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {formatPrice(
                                                                    offer.price
                                                                )}
                                                            </span>

                                                            <small>
                                                                {
                                                                    offer.available ??
                                                                    0
                                                                }{" "}
                                                                disponibles
                                                            </small>
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>


                                    <div className="admin-card-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(
                                                    eventItem
                                                )
                                            }
                                        >
                                            Editar
                                        </button>


                                        <button
                                            type="button"
                                            className="admin-secondary-button"
                                            onClick={() =>
                                                toggleActive(
                                                    eventItem
                                                )
                                            }
                                        >
                                            {eventItem.active ===
                                            false
                                                ? "Activar"
                                                : "Desactivar"}
                                        </button>


                                        <button
                                            type="button"
                                            className="admin-danger-button"
                                            onClick={() =>
                                                handleDelete(
                                                    eventItem
                                                )
                                            }
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                )}
            </section>
        </main>
    )
}

export default AdminEvents