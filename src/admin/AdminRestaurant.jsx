import { useEffect, useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"
import { useBusiness } from "../context/BusinessContext"

import "./Admin.css"


function AdminRestaurant() {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    const [formData, setFormData] = useState({
        name: "",
        slogan: "",
        description: "",

        heroImageUrl: "",

        phone: "",
        displayPhone: "",
        whatsapp: "",
        whatsappMessage: "",

        address: "",
        shortAddressLine1: "",
        shortAddressLine2: "",

        weekdayDays: "",
        weekdayTime: "",

        weekendDays: "",
        weekendTime: "",

        shortHours: ""
    })


    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")


    useEffect(() => {
        if (!businessData) {
            return
        }

        setFormData({
            name:
                businessData.name || "",

            slogan:
                businessData.slogan || "",

            description:
                businessData.description || "",

            heroImageUrl:
                businessData.heroImageUrl ||
                "/images/restaurant-cover.jpg",

            phone:
                businessData.phone || "",

            displayPhone:
                businessData.displayPhone || "",

            whatsapp:
                businessData.whatsapp || "",

            whatsappMessage:
                businessData.whatsappMessage || "",

            address:
                businessData.address || "",

            shortAddressLine1:
                businessData.shortAddress?.line1 || "",

            shortAddressLine2:
                businessData.shortAddress?.line2 || "",

            weekdayDays:
                businessData.hours?.[0]?.days || "",

            weekdayTime:
                businessData.hours?.[0]?.time || "",

            weekendDays:
                businessData.hours?.[1]?.days || "",

            weekendTime:
                businessData.hours?.[1]?.time || "",

            shortHours:
                businessData.shortHours || ""
        })
    }, [businessData])


    const handleChange = (event) => {
        const {
            name,
            value
        } = event.target

        setFormData(
            (current) => ({
                ...current,
                [name]: value
            })
        )
    }


    const handleSubmit = async (event) => {
        event.preventDefault()

        try {
            setSaving(true)
            setMessage("")

            const businessRef = doc(
                db,
                "business",
                "main"
            )


            const cleanWhatsapp =
                formData.whatsapp.replace(
                    /\D/g,
                    ""
                )


            const encodedAddress =
                encodeURIComponent(
                    formData.address.trim()
                )


            const googleMapsUrl =
                `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`


            const mapUrl =
                `https://maps.google.com/maps?q=${encodedAddress}` +
                `&t=&z=13&ie=UTF8&iwloc=&output=embed`


            const whatsappUrl =
                `https://wa.me/${cleanWhatsapp}` +
                `?text=${encodeURIComponent(
                    formData.whatsappMessage
                )}`


            const updatedBusiness = {
                name:
                    formData.name.trim(),

                slogan:
                    formData.slogan.trim(),

                description:
                    formData.description.trim(),

                heroImageUrl:
                    formData.heroImageUrl.trim(),

                phone:
                    formData.phone.trim(),

                displayPhone:
                    formData.displayPhone.trim(),

                whatsapp:
                    cleanWhatsapp,

                whatsappMessage:
                    formData.whatsappMessage.trim(),

                address:
                    formData.address.trim(),

                shortAddress: {
                    line1:
                        formData.shortAddressLine1.trim(),

                    line2:
                        formData.shortAddressLine2.trim()
                },

                hours: [
                    {
                        days:
                            formData.weekdayDays.trim(),

                        time:
                            formData.weekdayTime.trim()
                    },
                    {
                        days:
                            formData.weekendDays.trim(),

                        time:
                            formData.weekendTime.trim()
                    }
                ],

                shortHours:
                    formData.shortHours.trim(),

                googleMapsUrl,

                mapUrl,

                floatingAction: {
                    icon:
                        businessData.floatingAction?.icon ||
                        "💬",

                    label:
                        businessData.floatingAction?.label ||
                        "Ordenar por WhatsApp",

                    type:
                        businessData.floatingAction?.type ||
                        "whatsapp",

                    url:
                        whatsappUrl
                }
            }


            await updateDoc(
                businessRef,
                updatedBusiness
            )


            setMessage(
                "Cambios guardados correctamente."
            )
        } catch (error) {
            console.error(
                "Error al guardar restaurante:",
                error
            )

            setMessage(
                "No se pudieron guardar los cambios."
            )
        } finally {
            setSaving(false)
        }
    }


    if (
        loadingBusiness ||
        !businessData
    ) {
        return (
            <main className="admin-page">
                <p>
                    Cargando datos...
                </p>
            </main>
        )
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
                    RESTAURANTE
                </span>

                <h1>
                    Editar información
                </h1>

                <p>
                    Información principal,
                    contacto, dirección,
                    horarios y foto del
                    restaurante.
                </p>
            </section>


            <form
                className="admin-form"
                onSubmit={handleSubmit}
            >

                {/* =====================
                    INFORMACIÓN GENERAL
                ===================== */}

                <div className="admin-full-field">
                    <span className="admin-kicker">
                        INFORMACIÓN GENERAL
                    </span>

                    <h2>
                        Identidad del restaurante
                    </h2>
                </div>


                <label>
                    Nombre

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </label>


                <label>
                    Slogan

                    <input
                        type="text"
                        name="slogan"
                        value={formData.slogan}
                        onChange={handleChange}
                        required
                    />
                </label>


                <label className="admin-full-field">
                    Descripción

                    <textarea
                        name="description"
                        value={
                            formData.description
                        }
                        onChange={handleChange}
                        rows="5"
                        required
                    />
                </label>


                {/* =====================
                    FOTO PRINCIPAL
                ===================== */}

                <div className="admin-full-field">
                    <span className="admin-kicker">
                        FOTO PRINCIPAL
                    </span>

                    <h2>
                        Imagen del Home
                    </h2>
                </div>


                <label className="admin-full-field">
                    Ruta o URL de imagen

                    <input
                        type="text"
                        name="heroImageUrl"
                        value={
                            formData.heroImageUrl
                        }
                        onChange={handleChange}
                        placeholder="/images/restaurant-cover.jpg"
                    />
                </label>


                {formData.heroImageUrl && (
                    <div
                        className="admin-full-field admin-content-card"
                        style={{
                            maxWidth: "650px"
                        }}
                    >
                        <p>
                            Vista previa
                        </p>

                        <img
                            src={
                                formData.heroImageUrl
                            }
                            alt="Vista previa del restaurante"
                            style={{
                                width: "100%",
                                maxHeight: "360px",
                                objectFit: "cover",
                                borderRadius: "14px",
                                display: "block"
                            }}
                        />
                    </div>
                )}


                {/* =====================
                    CONTACTO
                ===================== */}

                <div className="admin-full-field">
                    <span className="admin-kicker">
                        CONTACTO
                    </span>

                    <h2>
                        Teléfono y WhatsApp
                    </h2>
                </div>


                <label>
                    Teléfono

                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+12105551234"
                    />
                </label>


                <label>
                    Teléfono visible

                    <input
                        type="text"
                        name="displayPhone"
                        value={
                            formData.displayPhone
                        }
                        onChange={handleChange}
                        placeholder="(210) 555-1234"
                    />
                </label>


                <label>
                    Número de WhatsApp

                    <input
                        type="text"
                        name="whatsapp"
                        value={
                            formData.whatsapp
                        }
                        onChange={handleChange}
                        placeholder="12105551234"
                    />
                </label>


                <label>
                    Mensaje de WhatsApp

                    <input
                        type="text"
                        name="whatsappMessage"
                        value={
                            formData.whatsappMessage
                        }
                        onChange={handleChange}
                        placeholder="Hola, quiero hacer un pedido..."
                    />
                </label>


                {/* =====================
                    DIRECCIÓN
                ===================== */}

                <div className="admin-full-field">
                    <span className="admin-kicker">
                        UBICACIÓN
                    </span>

                    <h2>
                        Dirección
                    </h2>
                </div>


                <label className="admin-full-field">
                    Dirección completa

                    <input
                        type="text"
                        name="address"
                        value={
                            formData.address
                        }
                        onChange={handleChange}
                        placeholder="123 Main Street, San Antonio, TX"
                        required
                    />
                </label>


                <label>
                    Dirección corta - línea 1

                    <input
                        type="text"
                        name="shortAddressLine1"
                        value={
                            formData.shortAddressLine1
                        }
                        onChange={handleChange}
                        placeholder="123 Main Street"
                    />
                </label>


                <label>
                    Dirección corta - línea 2

                    <input
                        type="text"
                        name="shortAddressLine2"
                        value={
                            formData.shortAddressLine2
                        }
                        onChange={handleChange}
                        placeholder="San Antonio, TX"
                    />
                </label>


                {/* =====================
                    HORARIOS
                ===================== */}

                <div className="admin-full-field">
                    <span className="admin-kicker">
                        HORARIOS
                    </span>

                    <h2>
                        Horarios del restaurante
                    </h2>
                </div>


                <label>
                    Días entre semana

                    <input
                        type="text"
                        name="weekdayDays"
                        value={
                            formData.weekdayDays
                        }
                        onChange={handleChange}
                        placeholder="Lunes - Jueves"
                    />
                </label>


                <label>
                    Horario entre semana

                    <input
                        type="text"
                        name="weekdayTime"
                        value={
                            formData.weekdayTime
                        }
                        onChange={handleChange}
                        placeholder="10:00 AM - 9:00 PM"
                    />
                </label>


                <label>
                    Días fin de semana

                    <input
                        type="text"
                        name="weekendDays"
                        value={
                            formData.weekendDays
                        }
                        onChange={handleChange}
                        placeholder="Viernes - Domingo"
                    />
                </label>


                <label>
                    Horario fin de semana

                    <input
                        type="text"
                        name="weekendTime"
                        value={
                            formData.weekendTime
                        }
                        onChange={handleChange}
                        placeholder="10:00 AM - 11:00 PM"
                    />
                </label>


                <label className="admin-full-field">
                    Horario corto para el Home

                    <input
                        type="text"
                        name="shortHours"
                        value={
                            formData.shortHours
                        }
                        onChange={handleChange}
                        placeholder="10AM - 9PM"
                    />
                </label>


                {/* =====================
                    GUARDAR
                ===================== */}

                <div className="admin-form-actions admin-full-field">
                    <button
                        type="submit"
                        className="admin-save-button"
                        disabled={saving}
                    >
                        {saving
                            ? "Guardando..."
                            : "Guardar cambios"}
                    </button>
                </div>


                {message && (
                    <p className="admin-message admin-full-field">
                        {message}
                    </p>
                )}

            </form>
        </main>
    )
}


export default AdminRestaurant