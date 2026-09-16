import { useEffect, useState } from "react"
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc
} from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Admin.css"


const emptyForm = {
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    active: true
}


function AdminPromotions() {
    const [promotions, setPromotions] = useState([])
    const [formData, setFormData] = useState(emptyForm)

    const [editingId, setEditingId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")


    const loadPromotions = async () => {
        try {
            const snapshot = await getDocs(
                collection(
                    db,
                    "promotions"
                )
            )

            const data = snapshot.docs
                .map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))
                .sort((a, b) =>
                    (a.title || "").localeCompare(
                        b.title || ""
                    )
                )

            setPromotions(data)
        } catch (error) {
            console.error(
                "Error al cargar promociones:",
                error
            )

            setMessage(
                "No se pudieron cargar las promociones."
            )
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadPromotions()
    }, [])


    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target

        setFormData((current) => ({
            ...current,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }))
    }


    const resetForm = () => {
        setFormData(emptyForm)
        setEditingId(null)
    }


    const handleSubmit = async (event) => {
        event.preventDefault()

        try {
            setSaving(true)
            setMessage("")

            const promotionData = {
                title:
                    formData.title.trim(),

                description:
                    formData.description.trim(),

                price:
                    Number(formData.price),

                imageUrl:
                    formData.imageUrl.trim(),

                active:
                    formData.active
            }


            if (editingId) {
                const promotionRef = doc(
                    db,
                    "promotions",
                    editingId
                )

                await updateDoc(
                    promotionRef,
                    promotionData
                )

                setMessage(
                    "Promoción actualizada correctamente."
                )
            } else {
                await addDoc(
                    collection(
                        db,
                        "promotions"
                    ),
                    promotionData
                )

                setMessage(
                    "Promoción creada correctamente."
                )
            }

            resetForm()
            await loadPromotions()
        } catch (error) {
            console.error(
                "Error al guardar promoción:",
                error
            )

            setMessage(
                "No se pudo guardar la promoción."
            )
        } finally {
            setSaving(false)
        }
    }


    const handleEdit = (promotion) => {
        setEditingId(
            promotion.firebaseId
        )

        setFormData({
            title:
                promotion.title || "",

            description:
                promotion.description || "",

            price:
                promotion.price ?? "",

            imageUrl:
                promotion.imageUrl || "",

            active:
                promotion.active !== false
        })

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }


    const toggleActive = async (
        promotion
    ) => {
        try {
            const newValue =
                promotion.active === false

            const promotionRef = doc(
                db,
                "promotions",
                promotion.firebaseId
            )

            await updateDoc(
                promotionRef,
                {
                    active: newValue
                }
            )

            setPromotions((current) =>
                current.map((item) =>
                    item.firebaseId ===
                    promotion.firebaseId
                        ? {
                              ...item,
                              active: newValue
                          }
                        : item
                )
            )
        } catch (error) {
            console.error(
                "Error al cambiar promoción:",
                error
            )

            setMessage(
                "No se pudo cambiar el estado."
            )
        }
    }


    const handleDelete = async (
        promotion
    ) => {
        const confirmed =
            window.confirm(
                `¿Eliminar "${promotion.title}"?`
            )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "promotions",
                    promotion.firebaseId
                )
            )

            setPromotions((current) =>
                current.filter(
                    (item) =>
                        item.firebaseId !==
                        promotion.firebaseId
                )
            )

            if (
                editingId ===
                promotion.firebaseId
            ) {
                resetForm()
            }

            setMessage(
                "Promoción eliminada correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar promoción:",
                error
            )

            setMessage(
                "No se pudo eliminar la promoción."
            )
        }
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
                    PROMOCIONES
                </span>

                <h1>
                    {editingId
                        ? "Editar promoción"
                        : "Nueva promoción"}
                </h1>

                <p>
                    Crea ofertas, modifica precios,
                    imágenes y controla cuáles estarán
                    disponibles en la web.
                </p>
            </section>


            <form
                className="admin-form"
                onSubmit={handleSubmit}
            >
                <label>
                    Título

                    <input
                        type="text"
                        name="title"
                        value={
                            formData.title
                        }
                        onChange={
                            handleChange
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
                            formData.price
                        }
                        onChange={
                            handleChange
                        }
                        min="0"
                        step="0.01"
                        placeholder="9.99"
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
                        placeholder="/images/promo.jpg"
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

                    Promoción activa
                </label>


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
                              : "Crear promoción"}
                    </button>

                    {editingId && (
                        <button
                            type="button"
                            className="admin-cancel-button"
                            onClick={resetForm}
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
                        PUBLICACIONES
                    </span>

                    <h2>
                        Promociones actuales
                    </h2>
                </div>


                {loading ? (
                    <p>
                        Cargando promociones...
                    </p>
                ) : promotions.length === 0 ? (
                    <p className="admin-empty">
                        No hay promociones
                        guardadas en Firestore.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {promotions.map(
                            (promotion) => (
                                <article
                                    key={
                                        promotion.firebaseId
                                    }
                                    className="admin-card admin-content-card"
                                >
                                    {promotion.imageUrl && (
                                        <img
                                            className="admin-card-image"
                                            src={
                                                promotion.imageUrl
                                            }
                                            alt={
                                                promotion.title
                                            }
                                        />
                                    )}

                                    <div>
                                        <span
                                            className={
                                                promotion.active ===
                                                false
                                                    ? "admin-status inactive"
                                                    : "admin-status"
                                            }
                                        >
                                            {promotion.active ===
                                            false
                                                ? "Inactiva"
                                                : "Activa"}
                                        </span>

                                        <h2>
                                            {
                                                promotion.title
                                            }
                                        </h2>

                                        <p>
                                            {
                                                promotion.description
                                            }
                                        </p>

                                        <strong className="admin-price">
                                            $
                                            {Number(
                                                promotion.price
                                            ).toFixed(2)}
                                        </strong>
                                    </div>


                                    <div className="admin-card-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(
                                                    promotion
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
                                                    promotion
                                                )
                                            }
                                        >
                                            {promotion.active ===
                                            false
                                                ? "Activar"
                                                : "Desactivar"}
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-danger-button"
                                            onClick={() =>
                                                handleDelete(
                                                    promotion
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

export default AdminPromotions