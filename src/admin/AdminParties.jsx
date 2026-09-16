import { useEffect, useState } from "react"
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
    updateDoc
} from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Admin.css"

const emptyForm = {
    title: "",
    description: "",
    price: "",
    serves: "",
    imageUrl: "",
    includesText: "",
    active: true
}

function AdminParties() {
    const [packages, setPackages] = useState([])
    const [formData, setFormData] = useState(emptyForm)

    const [editingId, setEditingId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    const loadPackages = async () => {
        try {
            const snapshot = await getDocs(
                collection(db, "partyPackages")
            )

            const data = snapshot.docs
                .map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))
                .sort(
                    (a, b) =>
                        Number(a.firebaseId) -
                        Number(b.firebaseId)
                )

            setPackages(data)
        } catch (error) {
            console.error(
                "Error al cargar paquetes:",
                error
            )

            setMessage(
                "No se pudieron cargar los paquetes."
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPackages()
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

    const getNextDocumentId = () => {
        if (packages.length === 0) {
            return "1"
        }

        const numericIds = packages
            .map((item) =>
                Number(item.firebaseId)
            )
            .filter((id) =>
                Number.isFinite(id)
            )

        if (numericIds.length === 0) {
            return "1"
        }

        return String(
            Math.max(...numericIds) + 1
        )
    }

    const handleSubmit = async (event) => {
        event.preventDefault()

        try {
            setSaving(true)
            setMessage("")

            const includes = formData.includesText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)

            const packageData = {
                title: formData.title.trim(),
                description:
                    formData.description.trim(),
                price: Number(formData.price),
                serves: Number(formData.serves),
                imageUrl:
                    formData.imageUrl.trim(),
                includes,
                active: formData.active
            }

            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        "partyPackages",
                        editingId
                    ),
                    packageData
                )

                setMessage(
                    "Combo actualizado correctamente."
                )
            } else {
                const newDocumentId =
                    getNextDocumentId()

                await setDoc(
                    doc(
                        db,
                        "partyPackages",
                        newDocumentId
                    ),
                    packageData
                )

                setMessage(
                    `Combo creado correctamente con ID ${newDocumentId}.`
                )
            }

            resetForm()
            await loadPackages()
        } catch (error) {
            console.error(
                "Error al guardar combo:",
                error
            )

            setMessage(
                "No se pudo guardar el combo."
            )
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (partyPackage) => {
        setEditingId(
            partyPackage.firebaseId
        )

        setFormData({
            title:
                partyPackage.title || "",

            description:
                partyPackage.description || "",

            price:
                partyPackage.price ?? "",

            serves:
                partyPackage.serves ?? "",

            imageUrl:
                partyPackage.imageUrl || "",

            includesText:
                Array.isArray(
                    partyPackage.includes
                )
                    ? partyPackage.includes.join(
                          "\n"
                      )
                    : "",

            active:
                partyPackage.active !== false
        })

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }

    const toggleActive = async (
        partyPackage
    ) => {
        try {
            const newValue =
                partyPackage.active === false

            await updateDoc(
                doc(
                    db,
                    "partyPackages",
                    partyPackage.firebaseId
                ),
                {
                    active: newValue
                }
            )

            setPackages((current) =>
                current.map((item) =>
                    item.firebaseId ===
                    partyPackage.firebaseId
                        ? {
                              ...item,
                              active: newValue
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
                "No se pudo cambiar el estado."
            )
        }
    }

    const handleDelete = async (
        partyPackage
    ) => {
        const confirmed =
            window.confirm(
                `¿Eliminar "${partyPackage.title}"?`
            )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "partyPackages",
                    partyPackage.firebaseId
                )
            )

            setPackages((current) =>
                current.filter(
                    (item) =>
                        item.firebaseId !==
                        partyPackage.firebaseId
                )
            )

            if (
                editingId ===
                partyPackage.firebaseId
            ) {
                resetForm()
            }

            setMessage(
                "Combo eliminado correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar combo:",
                error
            )

            setMessage(
                "No se pudo eliminar el combo."
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
                    FIESTAS Y CATERING
                </span>

                <h1>
                    {editingId
                        ? "Editar combo"
                        : "Nuevo combo"}
                </h1>

                <p>
                    Administra directamente los
                    paquetes guardados en Firestore.
                </p>
            </section>

            <form
                className="admin-form"
                onSubmit={handleSubmit}
            >
                <label>
                    Nombre del combo

                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    Personas

                    <input
                        type="number"
                        name="serves"
                        value={formData.serves}
                        onChange={handleChange}
                        min="1"
                        step="1"
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
                        required
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
                        placeholder="/images/bandeja.jpg"
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
                        onChange={handleChange}
                    />

                    Combo activo
                </label>

                <label className="admin-full-field">
                    Incluye

                    <textarea
                        name="includesText"
                        value={
                            formData.includesText
                        }
                        onChange={handleChange}
                        rows="7"
                        placeholder={
                            "Un elemento por línea:\nArroz\nCarne\nAcompañantes\nBebidas"
                        }
                    />
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
                              : "Crear combo"}
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
                        COMBOS
                    </span>

                    <h2>
                        Paquetes actuales
                    </h2>
                </div>

                {loading ? (
                    <p>
                        Cargando combos...
                    </p>
                ) : packages.length === 0 ? (
                    <p className="admin-empty">
                        No hay combos guardados
                        en Firestore.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {packages.map(
                            (partyPackage) => (
                                <article
                                    key={
                                        partyPackage.firebaseId
                                    }
                                    className="admin-card admin-content-card"
                                >
                                    {partyPackage.imageUrl && (
                                        <img
                                            className="admin-card-image"
                                            src={
                                                partyPackage.imageUrl
                                            }
                                            alt={
                                                partyPackage.title
                                            }
                                        />
                                    )}

                                    <div>
                                        <span
                                            className={
                                                partyPackage.active ===
                                                false
                                                    ? "admin-status inactive"
                                                    : "admin-status"
                                            }
                                        >
                                            {partyPackage.active ===
                                            false
                                                ? "Inactivo"
                                                : "Activo"}
                                        </span>

                                        <p>
                                            ID:{" "}
                                            {
                                                partyPackage.firebaseId
                                            }
                                        </p>

                                        <h2>
                                            {
                                                partyPackage.title
                                            }
                                        </h2>

                                        <p>
                                            Para{" "}
                                            {
                                                partyPackage.serves
                                            }{" "}
                                            personas
                                        </p>

                                        <p>
                                            {
                                                partyPackage.description
                                            }
                                        </p>

                                        <strong className="admin-price">
                                            $
                                            {Number(
                                                partyPackage.price
                                            ).toFixed(2)}
                                        </strong>

                                        {Array.isArray(
                                            partyPackage.includes
                                        ) &&
                                            partyPackage
                                                .includes
                                                .length >
                                                0 && (
                                                <ul className="admin-includes">
                                                    {partyPackage.includes.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (
                                                            <li
                                                                key={`${item}-${index}`}
                                                            >
                                                                {
                                                                    item
                                                                }
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            )}
                                    </div>

                                    <div className="admin-card-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEdit(
                                                    partyPackage
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
                                                    partyPackage
                                                )
                                            }
                                        >
                                            {partyPackage.active ===
                                            false
                                                ? "Activar"
                                                : "Desactivar"}
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-danger-button"
                                            onClick={() =>
                                                handleDelete(
                                                    partyPackage
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

export default AdminParties