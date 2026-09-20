import {
    useEffect,
    useState
} from "react"

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc
} from "firebase/firestore"

import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
} from "firebase/storage"

import {
    Link
} from "react-router-dom"

import {
    db,
    storage
} from "../firebase/firebase"

import {
    processImage
} from "../utils/processImage"

import "./Admin.css"


/* =====================================================
   FORMULARIOS VACÍOS
===================================================== */

const emptyCategoryForm = {
    id: "",
    title: "",
    description: "",
    imageUrl: "",
    imageStoragePath: "",
    order: "",
    active: true
}


const emptyImageForm = {
    title: "",
    imageUrl: "",
    storagePath: "",
    category: ""
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminGallery() {
    const [
        categories,
        setCategories
    ] = useState([])

    const [
        images,
        setImages
    ] = useState([])


    const [
        categoryForm,
        setCategoryForm
    ] = useState(
        emptyCategoryForm
    )


    const [
        imageForm,
        setImageForm
    ] = useState(
        emptyImageForm
    )


    const [
        editingCategoryId,
        setEditingCategoryId
    ] = useState(null)


    const [
        editingImageId,
        setEditingImageId
    ] = useState(null)


    const [
        categoryImageFile,
        setCategoryImageFile
    ] = useState(null)


    const [
        imageFile,
        setImageFile
    ] = useState(null)


    const [
        categoryPreview,
        setCategoryPreview
    ] = useState("")


    const [
        imagePreview,
        setImagePreview
    ] = useState("")


    const [
        loading,
        setLoading
    ] = useState(true)


    const [
        savingCategory,
        setSavingCategory
    ] = useState(false)


    const [
        savingImage,
        setSavingImage
    ] = useState(false)


    const [
        categoryMessage,
        setCategoryMessage
    ] = useState("")


    const [
        imageMessage,
        setImageMessage
    ] = useState("")


    /* =====================================================
       HELPERS
    ===================================================== */

    const slugify = (
        text
    ) => {
        return String(
            text || ""
        )
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
    }


    const validateImageFile = (
        file,
        setMessage
    ) => {
        if (!file) {
            return false
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            setMessage(
                "Selecciona un archivo de imagen válido."
            )

            return false
        }


        if (
            file.size >
            15 * 1024 * 1024
        ) {
            setMessage(
                "La imagen original no puede superar 15 MB."
            )

            return false
        }


        return true
    }


    const deleteStorageFile =
        async (
            storagePath
        ) => {
            if (!storagePath) {
                return
            }


            try {
                await deleteObject(
                    ref(
                        storage,
                        storagePath
                    )
                )
            } catch (error) {
                console.warn(
                    "No se pudo eliminar archivo anterior de Storage:",
                    storagePath,
                    error
                )
            }
        }


    /* =====================================================
       CARGAR GALERÍA
    ===================================================== */

    const loadGallery =
        async () => {
            try {
                setLoading(true)


                const [
                    categorySnapshot,
                    imageSnapshot
                ] =
                    await Promise.all([
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
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                Number(
                                    a.order ??
                                        0
                                ) -
                                Number(
                                    b.order ??
                                        0
                                )
                        )


                const imageData =
                    imageSnapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                Number(
                                    a.id ||
                                        0
                                ) -
                                Number(
                                    b.id ||
                                        0
                                )
                        )


                setCategories(
                    categoryData
                )

                setImages(
                    imageData
                )

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


    /* =====================================================
       LIMPIAR PREVIEWS BLOB
    ===================================================== */

    useEffect(() => {
        return () => {
            if (
                categoryPreview.startsWith(
                    "blob:"
                )
            ) {
                URL.revokeObjectURL(
                    categoryPreview
                )
            }
        }
    }, [
        categoryPreview
    ])


    useEffect(() => {
        return () => {
            if (
                imagePreview.startsWith(
                    "blob:"
                )
            ) {
                URL.revokeObjectURL(
                    imagePreview
                )
            }
        }
    }, [
        imagePreview
    ])


    /* =====================================================
       CAMBIOS FORM CATEGORÍA
    ===================================================== */

    const handleCategoryChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } =
            event.target


        setCategoryForm(
            (current) => ({
                ...current,

                [name]:
                    type ===
                    "checkbox"
                        ? checked
                        : value
            })
        )
    }


    /* =====================================================
       FOTO DE PORTADA
    ===================================================== */

    const handleCategoryImageChange =
        async (
            event
        ) => {
            const file =
                event.target.files?.[0]


            if (
                !validateImageFile(
                    file,
                    setCategoryMessage
                )
            ) {
                return
            }


            try {
                setCategoryMessage(
                    "Procesando imagen..."
                )


                const processedFile =
                    await processImage(
                        file
                    )


                if (
                    categoryPreview.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        categoryPreview
                    )
                }


                setCategoryImageFile(
                    processedFile
                )


                setCategoryPreview(
                    URL.createObjectURL(
                        processedFile
                    )
                )


                setCategoryMessage(
                    ""
                )

            } catch (error) {
                console.error(
                    "Error procesando portada:",
                    error
                )


                setCategoryImageFile(
                    null
                )


                setCategoryMessage(
                    "No se pudo procesar esa imagen. Prueba con otra foto."
                )
            }
        }


    /* =====================================================
       CAMBIOS FORM FOTO
    ===================================================== */

    const handleImageChange = (
        event
    ) => {
        const {
            name,
            value
        } =
            event.target


        setImageForm(
            (current) => ({
                ...current,

                [name]:
                    value
            })
        )
    }


    /* =====================================================
       FOTO GALERÍA
    ===================================================== */

    const handleGalleryImageChange =
        async (
            event
        ) => {
            const file =
                event.target.files?.[0]


            if (
                !validateImageFile(
                    file,
                    setImageMessage
                )
            ) {
                return
            }


            try {
                setImageMessage(
                    "Procesando imagen..."
                )


                const processedFile =
                    await processImage(
                        file
                    )


                if (
                    imagePreview.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        imagePreview
                    )
                }


                setImageFile(
                    processedFile
                )


                setImagePreview(
                    URL.createObjectURL(
                        processedFile
                    )
                )


                setImageMessage(
                    ""
                )

            } catch (error) {
                console.error(
                    "Error procesando imagen de galería:",
                    error
                )


                setImageFile(
                    null
                )


                setImageMessage(
                    "No se pudo procesar esa imagen. Prueba con otra foto."
                )
            }
        }


    /* =====================================================
       RESET CATEGORÍA
    ===================================================== */

    const resetCategoryForm = () => {
        if (
            categoryPreview.startsWith(
                "blob:"
            )
        ) {
            URL.revokeObjectURL(
                categoryPreview
            )
        }


        setCategoryForm(
            emptyCategoryForm
        )

        setCategoryImageFile(
            null
        )

        setCategoryPreview("")

        setEditingCategoryId(
            null
        )
    }


    /* =====================================================
       RESET IMAGEN
    ===================================================== */

    const resetImageForm = () => {
        if (
            imagePreview.startsWith(
                "blob:"
            )
        ) {
            URL.revokeObjectURL(
                imagePreview
            )
        }


        setImageForm(
            emptyImageForm
        )

        setImageFile(
            null
        )

        setImagePreview("")

        setEditingImageId(
            null
        )
    }


    /* =====================================================
       SIGUIENTE ID DE IMAGEN
    ===================================================== */

    const getNextImageId = () => {
        const ids =
            images
                .map(
                    (image) =>
                        Number(
                            image.id
                        )
                )
                .filter(
                    (id) =>
                        Number.isFinite(
                            id
                        )
                )


        if (
            ids.length ===
            0
        ) {
            return 1
        }


        return (
            Math.max(
                ...ids
            ) + 1
        )
    }


    /* =====================================================
       SUBIR PORTADA DE CATEGORÍA
    ===================================================== */

    const uploadCategoryImage =
        async (
            categoryId
        ) => {
            if (
                !categoryImageFile
            ) {
                return {
                    imageUrl:
                        categoryForm.imageUrl,

                    imageStoragePath:
                        categoryForm.imageStoragePath
                }
            }


            const storagePath =
                `gallery/categories/${categoryId}/cover-${Date.now()}.jpg`


            const storageRef =
                ref(
                    storage,
                    storagePath
                )


            await uploadBytes(
                storageRef,
                categoryImageFile,
                {
                    contentType:
                        categoryImageFile.type
                }
            )


            const imageUrl =
                await getDownloadURL(
                    storageRef
                )


            return {
                imageUrl,
                imageStoragePath:
                    storagePath
            }
        }


    /* =====================================================
       GUARDAR CATEGORÍA
    ===================================================== */

    const handleCategorySubmit =
        async (
            event
        ) => {
            event.preventDefault()


            try {
                setSavingCategory(
                    true
                )

                setCategoryMessage(
                    ""
                )


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
                        (
                            category
                        ) =>
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


                const oldStoragePath =
                    categoryForm.imageStoragePath


                const uploaded =
                    await uploadCategoryImage(
                        categoryId
                    )


                const categoryData = {
                    id:
                        categoryId,

                    title:
                        categoryForm.title.trim(),

                    description:
                        categoryForm.description.trim(),

                    imageUrl:
                        uploaded.imageUrl ||
                        "",

                    imageStoragePath:
                        uploaded.imageStoragePath ||
                        "",

                    order:
                        Number(
                            categoryForm.order ||
                                0
                        ),

                    active:
                        categoryForm.active
                }


                if (
                    editingCategoryId
                ) {
                    await updateDoc(
                        doc(
                            db,
                            "galleryCategories",
                            editingCategoryId
                        ),
                        categoryData
                    )


                    if (
                        categoryImageFile &&
                        oldStoragePath &&
                        oldStoragePath !==
                            uploaded.imageStoragePath
                    ) {
                        await deleteStorageFile(
                            oldStoragePath
                        )
                    }


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
                setSavingCategory(
                    false
                )
            }
        }


    /* =====================================================
       EDITAR CATEGORÍA
    ===================================================== */

    const handleEditCategory = (
        category
    ) => {
        setEditingCategoryId(
            category.firebaseId
        )


        setCategoryForm({
            id:
                category.id ||
                "",

            title:
                category.title ||
                "",

            description:
                category.description ||
                "",

            imageUrl:
                category.imageUrl ||
                "",

            imageStoragePath:
                category.imageStoragePath ||
                "",

            order:
                category.order ??
                "",

            active:
                category.active !==
                false
        })


        setCategoryImageFile(
            null
        )


        setCategoryPreview(
            category.imageUrl ||
            ""
        )


        window.scrollTo({
            top: 0,
            behavior:
                "smooth"
        })
    }


    /* =====================================================
       ACTIVAR / DESACTIVAR
    ===================================================== */

    const toggleCategoryActive =
        async (
            category
        ) => {
            try {
                const newValue =
                    category.active ===
                    false


                await updateDoc(
                    doc(
                        db,
                        "galleryCategories",
                        category.firebaseId
                    ),
                    {
                        active:
                            newValue
                    }
                )


                setCategories(
                    (
                        current
                    ) =>
                        current.map(
                            (
                                item
                            ) =>
                                item.firebaseId ===
                                category.firebaseId
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
                    "Error al cambiar categoría:",
                    error
                )


                setCategoryMessage(
                    "No se pudo cambiar el estado."
                )
            }
        }


    /* =====================================================
       ELIMINAR CATEGORÍA
    ===================================================== */

    const handleDeleteCategory =
        async (
            category
        ) => {
            const linkedImages =
                images.filter(
                    (
                        image
                    ) =>
                        image.category ===
                        category.id
                )


            if (
                linkedImages.length >
                0
            ) {
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


                if (
                    category.imageStoragePath
                ) {
                    await deleteStorageFile(
                        category.imageStoragePath
                    )
                }


                setCategories(
                    (
                        current
                    ) =>
                        current.filter(
                            (
                                item
                            ) =>
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


    /* =====================================================
       SUBIR IMAGEN DE GALERÍA
    ===================================================== */

    const uploadGalleryImage =
        async (
            categoryId
        ) => {
            if (!imageFile) {
                return {
                    imageUrl:
                        imageForm.imageUrl,

                    storagePath:
                        imageForm.storagePath
                }
            }


            const titleSlug =
                slugify(
                    imageForm.title
                ) ||
                "imagen"


            const storagePath =
                `gallery/${categoryId}/${Date.now()}-${titleSlug}.jpg`


            const storageRef =
                ref(
                    storage,
                    storagePath
                )


            await uploadBytes(
                storageRef,
                imageFile,
                {
                    contentType:
                        imageFile.type
                }
            )


            const imageUrl =
                await getDownloadURL(
                    storageRef
                )


            return {
                imageUrl,
                storagePath
            }
        }


    /* =====================================================
       GUARDAR IMAGEN
    ===================================================== */

    const handleImageSubmit =
        async (
            event
        ) => {
            event.preventDefault()


            try {
                setSavingImage(
                    true
                )

                setImageMessage(
                    ""
                )


                if (
                    !imageForm.category
                ) {
                    setImageMessage(
                        "Selecciona una categoría."
                    )

                    return
                }


                if (
                    !editingImageId &&
                    !imageFile
                ) {
                    setImageMessage(
                        "Selecciona una imagen desde tu dispositivo."
                    )

                    return
                }


                const oldStoragePath =
                    imageForm.storagePath


                const uploaded =
                    await uploadGalleryImage(
                        imageForm.category
                    )


                if (
                    !uploaded.imageUrl
                ) {
                    setImageMessage(
                        "No se pudo obtener la imagen."
                    )

                    return
                }


                const imageData = {
                    title:
                        imageForm.title.trim(),

                    imageUrl:
                        uploaded.imageUrl,

                    storagePath:
                        uploaded.storagePath ||
                        "",

                    category:
                        imageForm.category
                }


                if (
                    editingImageId
                ) {
                    await updateDoc(
                        doc(
                            db,
                            "gallery",
                            editingImageId
                        ),
                        imageData
                    )


                    if (
                        imageFile &&
                        oldStoragePath &&
                        oldStoragePath !==
                            uploaded.storagePath
                    ) {
                        await deleteStorageFile(
                            oldStoragePath
                        )
                    }


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
                                getNextImageId(),

                            active:
                                true
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
                setSavingImage(
                    false
                )
            }
        }


    /* =====================================================
       EDITAR IMAGEN
    ===================================================== */

    const handleEditImage = (
        image
    ) => {
        setEditingImageId(
            image.firebaseId
        )


        setImageForm({
            title:
                image.title ||
                "",

            imageUrl:
                image.imageUrl ||
                "",

            storagePath:
                image.storagePath ||
                "",

            category:
                image.category ||
                ""
        })


        setImageFile(
            null
        )


        setImagePreview(
            image.imageUrl ||
            ""
        )


        document
            .getElementById(
                "admin-gallery-images"
            )
            ?.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start"
            })
    }


    /* =====================================================
       ELIMINAR IMAGEN
    ===================================================== */

    const handleDeleteImage =
        async (
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


                if (
                    image.storagePath
                ) {
                    await deleteStorageFile(
                        image.storagePath
                    )
                }


                setImages(
                    (
                        current
                    ) =>
                        current.filter(
                            (
                                item
                            ) =>
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


    /* =====================================================
       RENDER
    ===================================================== */

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
                    Sube fotografías directamente
                    desde tu teléfono o computadora.
                </p>

            </section>


            {/* =====================================================
                CATEGORÍA
            ===================================================== */}

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


                    <label className="admin-full-field">
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


                    <label className="admin-full-field">

                        Imagen de portada

                        <input
                            type="file"
                            accept="image/*"
                            onChange={
                                handleCategoryImageChange
                            }
                        />

                    </label>


                    {categoryPreview && (

                        <div className="admin-upload-preview">

                            <p>
                                Vista previa
                            </p>

                            <img
                                src={
                                    categoryPreview
                                }
                                alt="Vista previa de categoría"
                            />

                        </div>

                    )}


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
                                ? categoryImageFile
                                    ? "Subiendo imagen..."
                                    : "Guardando..."
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


            {/* =====================================================
                CATEGORÍAS ACTUALES
            ===================================================== */}

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
                            (
                                category
                            ) => {
                                const totalImages =
                                    images.filter(
                                        (
                                            image
                                        ) =>
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


            {/* =====================================================
                SUBIR FOTOGRAFÍA
            ===================================================== */}

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
                                (
                                    category
                                ) => (

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


                    <label className="admin-full-field">

                        Seleccionar imagen

                        <input
                            type="file"
                            accept="image/*"
                            onChange={
                                handleGalleryImageChange
                            }
                        />

                    </label>


                    {imagePreview && (

                        <div className="admin-upload-preview">

                            <p>
                                Vista previa
                            </p>


                            <img
                                src={
                                    imagePreview
                                }
                                alt="Vista previa"
                            />

                        </div>

                    )}


                    <div className="admin-form-actions">

                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                savingImage
                            }
                        >
                            {savingImage
                                ? imageFile
                                    ? "Subiendo imagen..."
                                    : "Guardando..."
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


            {/* =====================================================
                IMÁGENES ACTUALES
            ===================================================== */}

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

                ) : images.length ===
                  0 ? (

                    <p className="admin-empty">
                        No hay imágenes guardadas.
                    </p>

                ) : (

                    <div className="admin-grid">

                        {images.map(
                            (
                                image
                            ) => (

                                <article
                                    key={
                                        image.firebaseId
                                    }
                                    className="admin-card admin-content-card"
                                >

                                    {image.imageUrl && (

                                        <img
                                            className="admin-card-image"
                                            src={
                                                image.imageUrl
                                            }
                                            alt={
                                                image.title
                                            }
                                        />

                                    )}


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
                                            {
                                                image.id
                                            }
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