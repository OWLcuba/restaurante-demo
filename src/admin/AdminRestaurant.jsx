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
        phone: "",
        displayPhone: "",
        whatsapp: "",
        address: "",
        shortHours: ""
    })

    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        if (businessData) {
            setFormData({
                name: businessData.name || "",
                slogan: businessData.slogan || "",
                description: businessData.description || "",
                phone: businessData.phone || "",
                displayPhone: businessData.displayPhone || "",
                whatsapp: businessData.whatsapp || "",
                address: businessData.address || "",
                shortHours: businessData.shortHours || ""
            })
        }
    }, [businessData])

    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((current) => ({
            ...current,
            [name]: value
        }))
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

            await updateDoc(
                businessRef,
                formData
            )

            setMessage("Cambios guardados correctamente.")
        } catch (error) {
            console.error(
                "Error al guardar restaurante:",
                error
            )

            setMessage(
                `Error: ${error.code || "desconocido"} - ${error.message}`
            )
        } finally {
            setSaving(false)
        }
    }

    if (loadingBusiness || !businessData) {
        return (
            <main className="admin-page">
                <p>Cargando datos...</p>
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

                <h1>Editar información</h1>

                <p>
                    Los cambios se guardarán directamente
                    en Firestore.
                </p>
            </section>

            <form
                className="admin-form"
                onSubmit={handleSubmit}
            >
                <label>
                    Nombre
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Slogan
                    <input
                        type="text"
                        name="slogan"
                        value={formData.slogan}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Descripción
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="5"
                    />
                </label>

                <label>
                    Teléfono
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Teléfono visible
                    <input
                        type="text"
                        name="displayPhone"
                        value={formData.displayPhone}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    WhatsApp
                    <input
                        type="text"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Dirección
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Horario corto
                    <input
                        type="text"
                        name="shortHours"
                        value={formData.shortHours}
                        onChange={handleChange}
                    />
                </label>

                <button
                    type="submit"
                    className="admin-save-button"
                    disabled={saving}
                >
                    {saving
                        ? "Guardando..."
                        : "Guardar cambios"}
                </button>

                {message && (
                    <p className="admin-message">
                        {message}
                    </p>
                )}
            </form>
        </main>
    )
}

export default AdminRestaurant