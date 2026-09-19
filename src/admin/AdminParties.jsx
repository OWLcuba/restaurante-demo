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
    serves: "",
    imageUrl: "",
    imageStoragePath: "",
    includesText: "",
    active: true
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminParties() {
    const [
        packages,
        setPackages
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
       CARGAR COMBOS
    ===================================================== */

    const loadPackages = async () => {
        try {
            setLoading(true)


            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "partyPackages"
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
                            Number(
                                a.firebaseId
                            ) -
                            Number(
                                b.firebaseId
                            )
                    )


            setPackages(
                data
            )

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
       CAMBIOS DEL FORMULARIO
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

    const uploadPartyImage =
        async (
            packageId
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
                `parties/${packageId}/party-${Date.now()}.${extension}`


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
       SIGUIENTE ID
    ===================================================== */

    const getNextDocumentId =
        () => {
            if (
                packages.length ===
                0
            ) {
                return "1"
            }


            const numericIds =
                packages
                    .map(
                        (
                            item
                        ) =>
                            Number(
                                item.firebaseId
                            )
                    )
                    .filter(
                        (
                            id
                        ) =>
                            Number.isFinite(
                                id
                            )
                    )


            if (
                numericIds.length ===
                0
            ) {
                return "1"
            }


            return String(
                Math.max(
                    ...numericIds
                ) + 1
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
                "Selecciona una imagen para el combo."
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


            const documentId =
                editingId ||
                getNextDocumentId()


            const oldStoragePath =
                formData.imageStoragePath


            const uploadedImage =
                await uploadPartyImage(
                    documentId
                )


            if (
                !uploadedImage.imageUrl
            ) {
                setMessage(
                    "Selecciona una imagen para el combo."
                )

                return
            }


            const includes =
                formData.includesText
                    .split("\n")
                    .map(
                        (
                            item
                        ) =>
                            item.trim()
                    )
                    .filter(
                        Boolean
                    )


            const packageData = {
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

                serves:
                    Number(
                        formData.serves
                    ),

                imageUrl:
                    uploadedImage.imageUrl,

                imageStoragePath:
                    uploadedImage.imageStoragePath ||
                    "",

                includes,

                active:
                    formData.active
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
                    "Combo actualizado correctamente."
                )

            } else {

                await setDoc(
                    doc(
                        db,
                        "partyPackages",
                        documentId
                    ),
                    packageData
                )


                setMessage(
                    `Combo creado correctamente con ID ${documentId}.`
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
            setSaving(
                false
            )
        }
    }


    /* =====================================================
       EDITAR
    ===================================================== */

    const handleEdit = (
        partyPackage
    ) => {
        setEditingId(
            partyPackage.firebaseId
        )


        setFormData({
            title:
                partyPackage.title ||
                "",

            description:
                partyPackage.description ||
                "",

            price:
                partyPackage.price ??
                "",

            serves:
                partyPackage.serves ??
                "",

            imageUrl:
                partyPackage.imageUrl ||
                "",

            imageStoragePath:
                partyPackage.imageStoragePath ||
                "",

            includesText:
                Array.isArray(
                    partyPackage.includes
                )
                    ? partyPackage.includes.join(
                          "\n"
                      )
                    : "",

            active:
                partyPackage.active !==
                false
        })


        setImageFile(
            null
        )


        setImagePreview(
            partyPackage.imageUrl ||
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
        partyPackage
    ) => {
        try {
            const newValue =
                partyPackage.active ===
                false


            await updateDoc(
                doc(
                    db,
                    "partyPackages",
                    partyPackage.firebaseId
                ),
                {
                    active:
                        newValue
                }
            )


            setPackages(
                (
                    current
                ) =>
                    current.map(
                        (
                            item
                        ) =>
                            item.firebaseId ===
                            partyPackage.firebaseId
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
                "No se pudo cambiar el estado."
            )
        }
    }


    /* =====================================================
       ELIMINAR
    ===================================================== */

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


            if (
                partyPackage.imageStoragePath
            ) {
                await deleteStorageImage(
                    partyPackage.imageStoragePath
                )
            }


            setPackages(
                (
                    current
                ) =>
                    current.filter(
                        (
                            item
                        ) =>
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
                    FIESTAS Y CATERING
                </span>


                <h1>
                    {editingId
                        ? "Editar combo"
                        : "Nuevo combo"}
                </h1>


                <p>
                    Administra los paquetes
                    y sube sus imágenes
                    directamente desde tu
                    teléfono o computadora.
                </p>

            </section>


            <form
                className="admin-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>
                    Nombre del combo

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
                    Personas

                    <input
                        type="number"
                        name="serves"
                        value={
                            formData.serves
                        }
                        onChange={
                            handleChange
                        }
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
                        onChange={
                            handleChange
                        }
                        rows="5"
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
                        required
                    />

                </label>


                <label className="admin-full-field">

                    Imagen del combo

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
                            alt="Vista previa del combo"
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

                    Combo activo

                </label>


                <label className="admin-full-field">

                    Incluye

                    <textarea
                        name="includesText"
                        value={
                            formData.includesText
                        }
                        onChange={
                            handleChange
                        }
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
                        disabled={
                            saving
                        }
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

                ) : packages.length ===
                  0 ? (

                    <p className="admin-empty">
                        No hay combos guardados
                        en Firestore.
                    </p>

                ) : (

                    <div className="admin-grid">

                        {packages.map(
                            (
                                partyPackage
                            ) => (

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
                                            ).toFixed(
                                                2
                                            )}
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