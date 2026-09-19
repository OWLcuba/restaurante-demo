import {
    useEffect,
    useState
} from "react"

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
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

import "./Admin.css"


/* =====================================================
   FORMULARIO VACÍO
===================================================== */

const emptyForm = {
    title: "",
    description: "",
    price: "",
    imageUrl: "",
    imageStoragePath: "",
    active: true
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminPromotions() {
    const [
        promotions,
        setPromotions
    ] = useState([])


    const [
        formData,
        setFormData
    ] = useState(
        emptyForm
    )


    const [
        editingId,
        setEditingId
    ] = useState(null)


    const [
        loading,
        setLoading
    ] = useState(true)


    const [
        saving,
        setSaving
    ] = useState(false)


    const [
        message,
        setMessage
    ] = useState("")


    const [
        imageFile,
        setImageFile
    ] = useState(null)


    const [
        imagePreview,
        setImagePreview
    ] = useState("")


    /* =====================================================
       CARGAR PROMOCIONES
    ===================================================== */

    const loadPromotions = async () => {
        try {
            setLoading(true)


            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "promotions"
                    )
                )


            const data =
                snapshot.docs
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
                            (
                                a.title ||
                                ""
                            ).localeCompare(
                                b.title ||
                                ""
                            )
                    )


            setPromotions(
                data
            )

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


    /* =====================================================
       LIMPIAR PREVIEW
    ===================================================== */

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
       CAMBIOS FORMULARIO
    ===================================================== */

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } =
            event.target


        setFormData(
            (
                current
            ) => ({
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
       SELECCIONAR IMAGEN
    ===================================================== */

    const handleImageChange = (
        event
    ) => {
        const file =
            event.target.files?.[0]


        if (!file) {
            return
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            setMessage(
                "Selecciona un archivo de imagen válido."
            )

            return
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setMessage(
                "La imagen no puede superar 10 MB."
            )

            return
        }


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
            file
        )


        setImagePreview(
            URL.createObjectURL(
                file
            )
        )


        setMessage("")
    }


    /* =====================================================
       EXTENSIÓN
    ===================================================== */

    const getFileExtension = (
        file
    ) => {
        const fileName =
            file?.name ||
            ""


        const parts =
            fileName.split(".")


        if (
            parts.length > 1
        ) {
            return parts
                .pop()
                .toLowerCase()
        }


        if (
            file?.type ===
            "image/png"
        ) {
            return "png"
        }


        if (
            file?.type ===
            "image/webp"
        ) {
            return "webp"
        }


        return "jpg"
    }


    /* =====================================================
       SUBIR IMAGEN
    ===================================================== */

    const uploadPromotionImage =
        async (
            promotionId
        ) => {
            if (!imageFile) {
                return {
                    imageUrl:
                        formData.imageUrl,

                    imageStoragePath:
                        formData.imageStoragePath
                }
            }


            const extension =
                getFileExtension(
                    imageFile
                )


            const storagePath =
                `promotions/${promotionId}/promotion-${Date.now()}.${extension}`


            const imageRef =
                ref(
                    storage,
                    storagePath
                )


            await uploadBytes(
                imageRef,
                imageFile,
                {
                    contentType:
                        imageFile.type
                }
            )


            const imageUrl =
                await getDownloadURL(
                    imageRef
                )


            return {
                imageUrl,

                imageStoragePath:
                    storagePath
            }
        }


    /* =====================================================
       BORRAR IMAGEN STORAGE
    ===================================================== */

    const deleteStorageImage =
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
                    "No se pudo eliminar la imagen anterior:",
                    error
                )
            }
        }


    /* =====================================================
       RESET
    ===================================================== */

    const resetForm = () => {
        if (
            imagePreview.startsWith(
                "blob:"
            )
        ) {
            URL.revokeObjectURL(
                imagePreview
            )
        }


        setFormData(
            emptyForm
        )


        setImageFile(
            null
        )


        setImagePreview(
            ""
        )


        setEditingId(
            null
        )
    }


    /* =====================================================
       GUARDAR
    ===================================================== */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault()


        if (
            !editingId &&
            !imageFile
        ) {
            setMessage(
                "Selecciona una imagen para la promoción."
            )

            return
        }


        try {
            setSaving(
                true
            )

            setMessage(
                ""
            )


            let promotionRef


            if (editingId) {
                promotionRef =
                    doc(
                        db,
                        "promotions",
                        editingId
                    )

            } else {
                promotionRef =
                    doc(
                        collection(
                            db,
                            "promotions"
                        )
                    )
            }


            const promotionId =
                promotionRef.id


            const oldStoragePath =
                formData.imageStoragePath


            const uploadedImage =
                await uploadPromotionImage(
                    promotionId
                )


            if (
                !uploadedImage.imageUrl
            ) {
                setMessage(
                    "Selecciona una imagen para la promoción."
                )

                return
            }


            const promotionData = {
                title:
                    formData.title
                        .trim(),

                description:
                    formData.description
                        .trim(),

                price:
                    Number(
                        formData.price
                    ),

                imageUrl:
                    uploadedImage.imageUrl,

                imageStoragePath:
                    uploadedImage.imageStoragePath ||
                    "",

                active:
                    formData.active
            }


            if (editingId) {

                await updateDoc(
                    promotionRef,
                    promotionData
                )


                if (
                    imageFile &&
                    oldStoragePath &&
                    oldStoragePath !==
                        uploadedImage.imageStoragePath
                ) {
                    await deleteStorageImage(
                        oldStoragePath
                    )
                }


                setMessage(
                    "Promoción actualizada correctamente."
                )

            } else {

                await setDoc(
                    promotionRef,
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
            setSaving(
                false
            )
        }
    }


    /* =====================================================
       EDITAR
    ===================================================== */

    const handleEdit = (
        promotion
    ) => {
        setEditingId(
            promotion.firebaseId
        )


        setFormData({
            title:
                promotion.title ||
                "",

            description:
                promotion.description ||
                "",

            price:
                promotion.price ??
                "",

            imageUrl:
                promotion.imageUrl ||
                "",

            imageStoragePath:
                promotion.imageStoragePath ||
                "",

            active:
                promotion.active !==
                false
        })


        setImageFile(
            null
        )


        setImagePreview(
            promotion.imageUrl ||
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

    const toggleActive = async (
        promotion
    ) => {
        try {
            const newValue =
                promotion.active ===
                false


            const promotionRef =
                doc(
                    db,
                    "promotions",
                    promotion.firebaseId
                )


            await updateDoc(
                promotionRef,
                {
                    active:
                        newValue
                }
            )


            setPromotions(
                (
                    current
                ) =>
                    current.map(
                        (
                            item
                        ) =>
                            item.firebaseId ===
                            promotion.firebaseId
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
                "Error al cambiar promoción:",
                error
            )


            setMessage(
                "No se pudo cambiar el estado."
            )
        }
    }


    /* =====================================================
       ELIMINAR
    ===================================================== */

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


            if (
                promotion.imageStoragePath
            ) {
                await deleteStorageImage(
                    promotion.imageStoragePath
                )
            }


            setPromotions(
                (
                    current
                ) =>
                    current.filter(
                        (
                            item
                        ) =>
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
                    PROMOCIONES
                </span>


                <h1>
                    {editingId
                        ? "Editar promoción"
                        : "Nueva promoción"}
                </h1>


                <p>
                    Crea ofertas, modifica precios
                    y sube las imágenes directamente
                    desde tu teléfono o computadora.
                </p>

            </section>


            <form
                className="admin-form"
                onSubmit={
                    handleSubmit
                }
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


                <label className="admin-full-field">

                    Imagen de la promoción

                    <input
                        type="file"
                        accept="image/*"
                        onChange={
                            handleImageChange
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
                            alt="Vista previa de promoción"
                        />

                    </div>

                )}


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
                        disabled={
                            saving
                        }
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

                ) : promotions.length ===
                  0 ? (

                    <p className="admin-empty">
                        No hay promociones
                        guardadas en Firestore.
                    </p>

                ) : (

                    <div className="admin-grid">

                        {promotions.map(
                            (
                                promotion
                            ) => (

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
                                            ).toFixed(
                                                2
                                            )}
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