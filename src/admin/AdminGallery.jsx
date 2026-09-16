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


const emptyCategoryForm = {
    id: "",
    title: "",
    description: "",
    imageUrl: "",
    order: "",
    active: true
}


const emptyImageForm = {
    title: "",
    imageUrl: "",
    category: ""
}


function AdminGallery() {
    const [categories, setCategories] = useState([])
    const [images, setImages] = useState([])

    const [categoryForm, setCategoryForm] =
        useState(emptyCategoryForm)

    const [imageForm, setImageForm] =
        useState(emptyImageForm)

    const [
        editingCategoryId,
        setEditingCategoryId
    ] = useState(null)

    const [
        editingImageId,
        setEditingImageId
    ] = useState(null)

    const [loading, setLoading] = useState(true)
    const [savingCategory, setSavingCategory] =
        useState(false)

    const [savingImage, setSavingImage] =
        useState(false)

    const [categoryMessage, setCategoryMessage] =
        useState("")

    const [imageMessage, setImageMessage] =
        useState("")


    const slugify = (text) => {
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


    const loadGallery = async () => {
        try {
            const [
                categorySnapshot,
                imageSnapshot
            ] = await Promise.all([
                getDocs(
                    collection(
                        db,
                        "galleryCategories"
                    )
                ),

                getDocs(
                    collection(
                        db,
                        "gallery"
                    )
                )
            ])

            const categoryData =
                categorySnapshot.docs
                    .map((document) => ({
                        firebaseId:
                            document.id,

                        ...document.data()
                    }))
                    .sort(
                        (a, b) =>
                            Number(
                                a.order ?? 0
                            ) -
                            Number(
                                b.order ?? 0
                            )
                    )

            const imageData =
                imageSnapshot.docs
                    .map((document) => ({
                        firebaseId:
                            document.id,

                        ...document.data()
                    }))
                    .sort(
                        (a, b) =>
                            Number(a.id || 0) -
                            Number(b.id || 0)
                    )

            setCategories(categoryData)
            setImages(imageData)
        } catch (error) {
            console.error(
                "Error al cargar galería:",
                error
            )

            setCategoryMessage(
                "No se pudo cargar la galería."
            )
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        loadGallery()
    }, [])


    const handleCategoryChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target

        setCategoryForm((current) => ({
            ...current,

            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }))
    }


    const handleImageChange = (
        event
    ) => {
        const {
            name,
            value
        } = event.target

        setImageForm((current) => ({
            ...current,
            [name]: value
        }))
    }


    const resetCategoryForm = () => {
        setCategoryForm(
            emptyCategoryForm
        )

        setEditingCategoryId(null)
    }


    const resetImageForm = () => {
        setImageForm(
            emptyImageForm
        )

        setEditingImageId(null)
    }


    const getNextImageId = () => {
        const ids = images
            .map((image) =>
                Number(image.id)
            )
            .filter((id) =>
                Number.isFinite(id)
            )

        if (ids.length === 0) {
            return 1
        }

        return Math.max(...ids) + 1
    }


    const handleCategorySubmit = async (
        event
    ) => {
        event.preventDefault()

        try {
            setSavingCategory(true)
            setCategoryMessage("")

            const categoryId =
                categoryForm.id.trim() ||
                slugify(
                    categoryForm.title
                )

            if (!categoryId) {
                setCategoryMessage(
                    "No se pudo generar el ID de la categoría."
                )

                return
            }

            const duplicate =
                categories.some(
                    (category) =>
                        category.id ===
                            categoryId &&
                        category.firebaseId !==
                            editingCategoryId
                )

            if (duplicate) {
                setCategoryMessage(
                    `Ya existe una categoría con el ID "${categoryId}".`
                )

                return
            }

            const categoryData = {
                id: categoryId,

                title:
                    categoryForm.title.trim(),

                description:
                    categoryForm.description.trim(),

                imageUrl:
                    categoryForm.imageUrl.trim(),

                order:
                    Number(
                        categoryForm.order || 0
                    ),

                active:
                    categoryForm.active
            }


            if (editingCategoryId) {
                await updateDoc(
                    doc(
                        db,
                        "galleryCategories",
                        editingCategoryId
                    ),
                    categoryData
                )

                setCategoryMessage(
                    "Categoría actualizada correctamente."
                )
            } else {
                await addDoc(
                    collection(
                        db,
                        "galleryCategories"
                    ),
                    categoryData
                )

                setCategoryMessage(
                    "Categoría creada correctamente."
                )
            }

            resetCategoryForm()
            await loadGallery()
        } catch (error) {
            console.error(
                "Error al guardar categoría:",
                error
            )

            setCategoryMessage(
                "No se pudo guardar la categoría."
            )
        } finally {
            setSavingCategory(false)
        }
    }


    const handleEditCategory = (
        category
    ) => {
        setEditingCategoryId(
            category.firebaseId
        )

        setCategoryForm({
            id:
                category.id || "",

            title:
                category.title || "",

            description:
                category.description || "",

            imageUrl:
                category.imageUrl || "",

            order:
                category.order ?? "",

            active:
                category.active !== false
        })

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }


    const toggleCategoryActive = async (
        category
    ) => {
        try {
            const newValue =
                category.active === false

            await updateDoc(
                doc(
                    db,
                    "galleryCategories",
                    category.firebaseId
                ),
                {
                    active: newValue
                }
            )

            setCategories((current) =>
                current.map((item) =>
                    item.firebaseId ===
                    category.firebaseId
                        ? {
                              ...item,
                              active: newValue
                          }
                        : item
                )
            )
        } catch (error) {
            console.error(
                "Error al cambiar categoría:",
                error
            )

            setCategoryMessage(
                "No se pudo cambiar el estado."
            )
        }
    }


    const handleDeleteCategory = async (
        category
    ) => {
        const linkedImages =
            images.filter(
                (image) =>
                    image.category ===
                    category.id
            )

        if (linkedImages.length > 0) {
            setCategoryMessage(
                `No puedes eliminar "${category.title}" porque tiene ${linkedImages.length} imagen(es). Elimina o mueve esas imágenes primero.`
            )

            return
        }

        const confirmed =
            window.confirm(
                `¿Eliminar la categoría "${category.title}"?`
            )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "galleryCategories",
                    category.firebaseId
                )
            )

            setCategories((current) =>
                current.filter(
                    (item) =>
                        item.firebaseId !==
                        category.firebaseId
                )
            )

            if (
                editingCategoryId ===
                category.firebaseId
            ) {
                resetCategoryForm()
            }

            setCategoryMessage(
                "Categoría eliminada correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar categoría:",
                error
            )

            setCategoryMessage(
                "No se pudo eliminar la categoría."
            )
        }
    }


    const handleImageSubmit = async (
        event
    ) => {
        event.preventDefault()

        try {
            setSavingImage(true)
            setImageMessage("")

            const imageData = {
                title:
                    imageForm.title.trim(),

                imageUrl:
                    imageForm.imageUrl.trim(),

                category:
                    imageForm.category
            }


            if (editingImageId) {
                await updateDoc(
                    doc(
                        db,
                        "gallery",
                        editingImageId
                    ),
                    imageData
                )

                setImageMessage(
                    "Imagen actualizada correctamente."
                )
            } else {
                await addDoc(
                    collection(
                        db,
                        "gallery"
                    ),
                    {
                        ...imageData,
                        id:
                            getNextImageId()
                    }
                )

                setImageMessage(
                    "Imagen agregada correctamente."
                )
            }

            resetImageForm()
            await loadGallery()
        } catch (error) {
            console.error(
                "Error al guardar imagen:",
                error
            )

            setImageMessage(
                "No se pudo guardar la imagen."
            )
        } finally {
            setSavingImage(false)
        }
    }


    const handleEditImage = (
        image
    ) => {
        setEditingImageId(
            image.firebaseId
        )

        setImageForm({
            title:
                image.title || "",

            imageUrl:
                image.imageUrl || "",

            category:
                image.category || ""
        })

        document
            .getElementById(
                "admin-gallery-images"
            )
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            })
    }


    const handleDeleteImage = async (
        image
    ) => {
        const confirmed =
            window.confirm(
                `¿Eliminar "${image.title}"?`
            )

        if (!confirmed) {
            return
        }

        try {
            await deleteDoc(
                doc(
                    db,
                    "gallery",
                    image.firebaseId
                )
            )

            setImages((current) =>
                current.filter(
                    (item) =>
                        item.firebaseId !==
                        image.firebaseId
                )
            )

            if (
                editingImageId ===
                image.firebaseId
            ) {
                resetImageForm()
            }

            setImageMessage(
                "Imagen eliminada correctamente."
            )
        } catch (error) {
            console.error(
                "Error al eliminar imagen:",
                error
            )

            setImageMessage(
                "No se pudo eliminar la imagen."
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
                    GALERÍA
                </span>

                <h1>
                    Administrar galería
                </h1>

                <p>
                    Administra las categorías y
                    las fotografías almacenadas
                    directamente en Firestore.
                </p>
            </section>


            <section className="admin-section admin-section-first">
                <div className="admin-section-title">
                    <span className="admin-kicker">
                        CATEGORÍAS
                    </span>

                    <h2>
                        {editingCategoryId
                            ? "Editar categoría"
                            : "Nueva categoría"}
                    </h2>
                </div>


                <form
                    className="admin-form"
                    onSubmit={
                        handleCategorySubmit
                    }
                >
                    <label>
                        Nombre

                        <input
                            type="text"
                            name="title"
                            value={
                                categoryForm.title
                            }
                            onChange={
                                handleCategoryChange
                            }
                            required
                        />
                    </label>


                    <label>
                        ID / ruta

                        <input
                            type="text"
                            name="id"
                            value={
                                categoryForm.id
                            }
                            onChange={
                                handleCategoryChange
                            }
                            placeholder="restaurante"
                            readOnly={
                                Boolean(
                                    editingCategoryId
                                )
                            }
                        />
                    </label>


                    <label>
                        Descripción

                        <textarea
                            name="description"
                            value={
                                categoryForm.description
                            }
                            onChange={
                                handleCategoryChange
                            }
                            rows="4"
                            required
                        />
                    </label>


                    <label>
                        Imagen de portada

                        <input
                            type="text"
                            name="imageUrl"
                            value={
                                categoryForm.imageUrl
                            }
                            onChange={
                                handleCategoryChange
                            }
                            placeholder="/images/bandeja.jpg"
                            required
                        />
                    </label>


                    <label>
                        Orden

                        <input
                            type="number"
                            name="order"
                            value={
                                categoryForm.order
                            }
                            onChange={
                                handleCategoryChange
                            }
                            min="0"
                            step="1"
                            required
                        />
                    </label>


                    <label className="admin-checkbox-label">
                        <input
                            type="checkbox"
                            name="active"
                            checked={
                                categoryForm.active
                            }
                            onChange={
                                handleCategoryChange
                            }
                        />

                        Categoría activa
                    </label>


                    <div className="admin-form-actions">
                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                savingCategory
                            }
                        >
                            {savingCategory
                                ? "Guardando..."
                                : editingCategoryId
                                  ? "Guardar cambios"
                                  : "Crear categoría"}
                        </button>


                        {editingCategoryId && (
                            <button
                                type="button"
                                className="admin-cancel-button"
                                onClick={
                                    resetCategoryForm
                                }
                            >
                                Cancelar edición
                            </button>
                        )}
                    </div>


                    {categoryMessage && (
                        <p className="admin-message">
                            {
                                categoryMessage
                            }
                        </p>
                    )}
                </form>
            </section>


            <section className="admin-section">
                <div className="admin-section-title">
                    <span className="admin-kicker">
                        CATEGORÍAS ACTUALES
                    </span>

                    <h2>
                        Colecciones de fotos
                    </h2>
                </div>


                {loading ? (
                    <p>
                        Cargando galería...
                    </p>
                ) : categories.length ===
                  0 ? (
                    <p className="admin-empty">
                        No hay categorías
                        guardadas.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {categories.map(
                            (category) => {
                                const totalImages =
                                    images.filter(
                                        (image) =>
                                            image.category ===
                                            category.id
                                    ).length

                                return (
                                    <article
                                        key={
                                            category.firebaseId
                                        }
                                        className="admin-card admin-content-card"
                                    >
                                        {category.imageUrl && (
                                            <img
                                                className="admin-card-image"
                                                src={
                                                    category.imageUrl
                                                }
                                                alt={
                                                    category.title
                                                }
                                            />
                                        )}

                                        <div>
                                            <span
                                                className={
                                                    category.active ===
                                                    false
                                                        ? "admin-status inactive"
                                                        : "admin-status"
                                                }
                                            >
                                                {category.active ===
                                                false
                                                    ? "Inactiva"
                                                    : "Activa"}
                                            </span>

                                            <p>
                                                ID:{" "}
                                                {
                                                    category.id
                                                }
                                            </p>

                                            <h2>
                                                {
                                                    category.title
                                                }
                                            </h2>

                                            <p>
                                                {
                                                    category.description
                                                }
                                            </p>

                                            <p className="admin-gallery-count">
                                                📸{" "}
                                                {
                                                    totalImages
                                                }{" "}
                                                imagen
                                                {totalImages ===
                                                1
                                                    ? ""
                                                    : "es"}
                                            </p>

                                            <small className="admin-order-label">
                                                Orden:{" "}
                                                {
                                                    category.order
                                                }
                                            </small>
                                        </div>

                                        <div className="admin-card-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEditCategory(
                                                        category
                                                    )
                                                }
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-secondary-button"
                                                onClick={() =>
                                                    toggleCategoryActive(
                                                        category
                                                    )
                                                }
                                            >
                                                {category.active ===
                                                false
                                                    ? "Activar"
                                                    : "Desactivar"}
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-danger-button"
                                                onClick={() =>
                                                    handleDeleteCategory(
                                                        category
                                                    )
                                                }
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </article>
                                )
                            }
                        )}
                    </div>
                )}
            </section>


            <section
                id="admin-gallery-images"
                className="admin-section"
            >
                <div className="admin-section-title">
                    <span className="admin-kicker">
                        FOTOGRAFÍAS
                    </span>

                    <h2>
                        {editingImageId
                            ? "Editar imagen"
                            : "Agregar imagen"}
                    </h2>
                </div>


                <form
                    className="admin-form"
                    onSubmit={
                        handleImageSubmit
                    }
                >
                    <label>
                        Título

                        <input
                            type="text"
                            name="title"
                            value={
                                imageForm.title
                            }
                            onChange={
                                handleImageChange
                            }
                            required
                        />
                    </label>


                    <label>
                        URL de imagen

                        <input
                            type="text"
                            name="imageUrl"
                            value={
                                imageForm.imageUrl
                            }
                            onChange={
                                handleImageChange
                            }
                            placeholder="/images/tacos.jpg"
                            required
                        />
                    </label>


                    <label>
                        Categoría

                        <select
                            name="category"
                            value={
                                imageForm.category
                            }
                            onChange={
                                handleImageChange
                            }
                            required
                        >
                            <option value="">
                                Selecciona una categoría
                            </option>

                            {categories.map(
                                (category) => (
                                    <option
                                        key={
                                            category.firebaseId
                                        }
                                        value={
                                            category.id
                                        }
                                    >
                                        {
                                            category.title
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </label>


                    <div className="admin-form-actions">
                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                savingImage
                            }
                        >
                            {savingImage
                                ? "Guardando..."
                                : editingImageId
                                  ? "Guardar cambios"
                                  : "Agregar imagen"}
                        </button>


                        {editingImageId && (
                            <button
                                type="button"
                                className="admin-cancel-button"
                                onClick={
                                    resetImageForm
                                }
                            >
                                Cancelar edición
                            </button>
                        )}
                    </div>


                    {imageMessage && (
                        <p className="admin-message">
                            {
                                imageMessage
                            }
                        </p>
                    )}
                </form>
            </section>


            <section className="admin-section">
                <div className="admin-section-title">
                    <span className="admin-kicker">
                        IMÁGENES
                    </span>

                    <h2>
                        Galería actual
                    </h2>
                </div>


                {loading ? (
                    <p>
                        Cargando imágenes...
                    </p>
                ) : images.length === 0 ? (
                    <p className="admin-empty">
                        No hay imágenes guardadas.
                    </p>
                ) : (
                    <div className="admin-grid">
                        {images.map(
                            (image) => (
                                <article
                                    key={
                                        image.firebaseId
                                    }
                                    className="admin-card admin-content-card"
                                >
                                    <img
                                        className="admin-card-image"
                                        src={
                                            image.imageUrl
                                        }
                                        alt={
                                            image.title
                                        }
                                    />

                                    <div>
                                        <p>
                                            {
                                                image.category
                                            }
                                        </p>

                                        <h2>
                                            {
                                                image.title
                                            }
                                        </h2>

                                        <small className="admin-order-label">
                                            ID:{" "}
                                            {image.id}
                                        </small>
                                    </div>

                                    <div className="admin-card-actions">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleEditImage(
                                                    image
                                                )
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-danger-button"
                                            onClick={() =>
                                                handleDeleteImage(
                                                    image
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

export default AdminGallery