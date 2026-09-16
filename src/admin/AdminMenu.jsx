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
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    active: true
}

function AdminMenu() {
    const [items, setItems] = useState([])
    const [formData, setFormData] = useState(emptyForm)

    const [editingId, setEditingId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    const loadMenu = async () => {
        try {
            const snapshot = await getDocs(
                collection(db, "menuItems")
            )

            const data = snapshot.docs
                .map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))
                .sort(
                    (a, b) =>
                        Number(a.id || 0) -
                        Number(b.id || 0)
                )

            setItems(data)
        } catch (error) {
            console.error(
                "Error al cargar el menú:",
                error
            )

            setMessage(
                "No se pudo cargar el menú."
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMenu()
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

    const getNextId = () => {
        if (items.length === 0) {
            return 1
        }

        const highestId = Math.max(
            ...items.map((item) =>
                Number(item.id || 0)
            )
        )

        return highestId + 1
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        try {
            setSaving(true)
            setMessage("")

            const menuData = {
                name: formData.name.trim(),
                description:
                    formData.description.trim(),
                price: Number(formData.price),
                category:
                    formData.category.trim(),
                imageUrl:
                    formData.imageUrl.trim(),
                active: formData.active
            }

            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        "menuItems",
                        editingId
                    ),
                    menuData
                )

                setMessage(
                    "Plato actualizado correctamente."
                )
            } else {
                await addDoc(
                    collection(db, "menuItems"),
                    {
                        ...menuData,
                        id: getNextId()
                    }
                )

                setMessage(
                    "Plato creado correctamente."
                )
            }

            resetForm()
            await loadMenu()
        } catch (error) {
            console.error(
                "Error al guardar plato:",
                error
            )

            setMessage(
                "No se pudo guardar el plato."
            )
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (item) => {
        setEditingId(item.firebaseId)

        setFormData({
            name: item.name || "",
            description:
                item.description || "",
            price: item.price ?? "",
            category: item.category || "",
            imageUrl: item.imageUrl || "",
            active: item.active !== false
        })

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }

    const toggleActive = async (item) => {
        try {
            const newValue =
                item.active === false

            await updateDoc(
                doc(
                    db,
                    "menuItems",
                    item.firebaseId
                ),
                {
                    active: newValue
                }
            )

            setItems((current) =>
                current.map((menuItem) =>
                    menuItem.firebaseId ===
                    item.firebaseId
                        ? {
                              ...menuItem,
                              active: newValue
                          }
                        : menuItem
                )
            )
        } catch (error) {
            console.error(
                "Error al cambiar estado:",
                error
            )

            setMessage(
                "No se pudo cambiar el estado."
            )
        }
    }

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `¿Eliminar "${item.name}"?`
        )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "menuItems",
                    item.firebaseId
                )
            )

            setItems((current) =>
                current.filter(
                    (menuItem) =>
                        menuItem.firebaseId !==
                        item.firebaseId
                )
            )

            if (
                editingId === item.firebaseId
            ) {
                resetForm()
            }

            setMessage(
                "Plato eliminado correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar plato:",
                error
            )

            setMessage(
                "No se pudo eliminar el plato."
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
                    MENÚ
                </span>

                <h1>
                    {editingId
                        ? "Editar plato"
                        : "Nuevo plato"}
                </h1>

                <p>
                    Crea, modifica y controla los
                    platos disponibles en el menú.
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
                        required
                    />
                </label>

                <label>
                    Categoría
                    <input
                        type="text"
                        name="category"
                        value={
                            formData.category
                        }
                        onChange={handleChange}
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
                        onChange={handleChange}
                        rows="5"
                    />
                </label>

                <label>
                    Precio
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
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
                        onChange={handleChange}
                    />
                </label>

                <label className="admin-checkbox-label">
                    <input
                        type="checkbox"
                        name="active"
                        checked={
                            formData.active
                        }
                        onChange={handleChange}
                    />

                    Plato activo
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
                              : "Crear plato"}
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
                        PLATOS
                    </span>

                    <h2>Menú actual</h2>
                </div>

                {loading ? (
                    <p>
                        Cargando menú...
                    </p>
                ) : items.length === 0 ? (
                    <p className="admin-empty">
                        Todavía no hay platos
                        guardados en Firestore.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {items.map((item) => (
                            <article
                                key={
                                    item.firebaseId
                                }
                                className="admin-card admin-content-card"
                            >
                                {item.imageUrl && (
                                    <img
                                        className="admin-card-image"
                                        src={
                                            item.imageUrl
                                        }
                                        alt={item.name}
                                    />
                                )}

                                <div>
                                    <span
                                        className={
                                            item.active ===
                                            false
                                                ? "admin-status inactive"
                                                : "admin-status"
                                        }
                                    >
                                        {item.active ===
                                        false
                                            ? "Inactivo"
                                            : "Activo"}
                                    </span>

                                    <p>
                                        {item.category}
                                    </p>

                                    <h2>
                                        {item.name}
                                    </h2>

                                    <p>
                                        {
                                            item.description
                                        }
                                    </p>

                                    <strong className="admin-price">
                                        $
                                        {Number(
                                            item.price
                                        ).toFixed(2)}
                                    </strong>
                                </div>

                                <div className="admin-card-actions">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEdit(
                                                item
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
                                                item
                                            )
                                        }
                                    >
                                        {item.active ===
                                        false
                                            ? "Activar"
                                            : "Desactivar"}
                                    </button>

                                    <button
                                        type="button"
                                        className="admin-danger-button"
                                        onClick={() =>
                                            handleDelete(
                                                item
                                            )
                                        }
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default AdminMenu