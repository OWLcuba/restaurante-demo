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
   FORM VACÍO
===================================================== */

const emptyForm = {
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    imageStoragePath: "",
    active: true
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminMenu() {
    const [
        items,
        setItems
    ] = useState([])


    const [
        categories,
        setCategories
    ] = useState([])


    const [
        formData,
        setFormData
    ] = useState(
        emptyForm
    )


    const [
        newCategory,
        setNewCategory
    ] = useState("")


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
        categorySaving,
        setCategorySaving
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
       UTILIDADES
    ===================================================== */

    const normalizeText = (
        value
    ) => {
        return String(
            value ||
            ""
        )
            .trim()
            .toLowerCase()
    }


    const slugify = (
        value
    ) => {
        return String(
            value ||
            ""
        )
            .normalize(
                "NFD"
            )
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


    const parsePrice = (
        value
    ) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return ""
        }


        const cleaned =
            String(
                value
            )
                .replace(
                    "$",
                    ""
                )
                .replace(
                    ",",
                    ""
                )
                .trim()


        const number =
            Number(
                cleaned
            )


        return Number.isFinite(
            number
        )
            ? number
            : ""
    }


    const formatPrice = (
        value
    ) => {
        const number =
            parsePrice(
                value
            )


        if (
            number === ""
        ) {
            return "Precio por confirmar"
        }


        return `$${Number(
            number
        ).toFixed(
            2
        )}`
    }


    /* =====================================================
       CARPETA STORAGE SEGÚN CATEGORÍA
    ===================================================== */

    const getStorageFolder = (
        category
    ) => {
        const slug =
            slugify(
                category
            )


        const aliases = {
            "cocktails":
                "cocktails-alcohol",

            "cocktail":
                "cocktails-alcohol",

            "cocktails-alcohol":
                "cocktails-alcohol",

            "cocteles":
                "cocktails-alcohol",

            "coctel":
                "cocktails-alcohol",

            "alcohol":
                "cocktails-alcohol",

            "drinks":
                "drinks",

            "drink":
                "drinks",

            "bebidas":
                "drinks",

            "bebida":
                "drinks",

            "entradas":
                "entrantes",

            "entrante":
                "entrantes",

            "entrantes":
                "entrantes",

            "appetizers":
                "entrantes",

            "pizza":
                "pizza",

            "pizzas":
                "pizza",

            "postre":
                "postres",

            "postres":
                "postres",

            "dessert":
                "postres",

            "desserts":
                "postres",

            "principales":
                "principales",

            "principal":
                "principales",

            "main":
                "principales",

            "mains":
                "principales",

            "sandwich":
                "sandwich",

            "sandwiches":
                "sandwich",

            "sandwichs":
                "sandwich",

            "side":
                "side",

            "sides":
                "side",

            "acompanantes":
                "side",

            "acompanamientos":
                "side"
        }


        return aliases[
            slug
        ] ||
        slug ||
        "otros"
    }


    /* =====================================================
       EXTENSIÓN DE ARCHIVO
    ===================================================== */

    const getFileExtension = (
        file
    ) => {
        const fileName =
            file?.name ||
            ""


        const pieces =
            fileName.split(
                "."
            )


        if (
            pieces.length >
            1
        ) {
            return pieces
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
       CARGAR DATOS
    ===================================================== */

    const loadData =
        async () => {
            try {
                setLoading(
                    true
                )


                const [
                    menuSnapshot,
                    categorySnapshot
                ] =
                    await Promise.all([
                        getDocs(
                            collection(
                                db,
                                "menuItems"
                            )
                        ),

                        getDocs(
                            collection(
                                db,
                                "menuCategories"
                            )
                        )
                    ])


                const menuData =
                    menuSnapshot.docs
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


                let categoryData =
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
                                    a.order ||
                                    0
                                ) -
                                Number(
                                    b.order ||
                                    0
                                )
                        )


                /*
                    Detectamos categorías
                    existentes en platos viejos.
                */

                const oldCategoryNames =
                    []


                menuData.forEach(
                    (
                        item
                    ) => {
                        const name =
                            String(
                                item.category ||
                                ""
                            ).trim()


                        if (!name) {
                            return
                        }


                        const alreadyExists =
                            oldCategoryNames.some(
                                (
                                    existing
                                ) =>
                                    normalizeText(
                                        existing
                                    ) ===
                                    normalizeText(
                                        name
                                    )
                            )


                        if (
                            !alreadyExists
                        ) {
                            oldCategoryNames.push(
                                name
                            )
                        }
                    }
                )


                /*
                    Categorías usadas por platos
                    pero todavía no guardadas.
                */

                const missingCategories =
                    oldCategoryNames.filter(
                        (
                            name
                        ) =>
                            !categoryData.some(
                                (
                                    category
                                ) =>
                                    normalizeText(
                                        category.name
                                    ) ===
                                    normalizeText(
                                        name
                                    )
                            )
                    )


                /*
                    Migración automática.
                */

                if (
                    missingCategories.length >
                    0
                ) {
                    let nextOrder =
                        categoryData.length >
                        0
                            ? Math.max(
                                  ...categoryData.map(
                                      (
                                          category
                                      ) =>
                                          Number(
                                              category.order ||
                                                  0
                                          )
                                  )
                              ) +
                              1
                            : 1


                    for (
                        const categoryName
                        of missingCategories
                    ) {
                        await addDoc(
                            collection(
                                db,
                                "menuCategories"
                            ),
                            {
                                name:
                                    categoryName,

                                order:
                                    nextOrder,

                                active:
                                    true
                            }
                        )


                        nextOrder +=
                            1
                    }


                    const newCategorySnapshot =
                        await getDocs(
                            collection(
                                db,
                                "menuCategories"
                            )
                        )


                    categoryData =
                        newCategorySnapshot.docs
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
                                        a.order ||
                                            0
                                    ) -
                                    Number(
                                        b.order ||
                                            0
                                    )
                            )
                }


                setItems(
                    menuData
                )


                setCategories(
                    categoryData
                )

            } catch (error) {
                console.error(
                    "Error al cargar menú:",
                    error
                )


                setMessage(
                    "No se pudo cargar el menú."
                )

            } finally {
                setLoading(
                    false
                )
            }
        }


    useEffect(() => {
        loadData()
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
       FORMULARIO DE PLATO
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
       SUBIR IMAGEN
    ===================================================== */

    const uploadMenuImage =
        async (
            itemId
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


            const folder =
                getStorageFolder(
                    formData.category
                )


            const itemSlug =
                slugify(
                    formData.name
                ) ||
                "plato"


            const storagePath =
                `menu/${folder}/${itemId}-${itemSlug}-${Date.now()}.${extension}`


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
       BORRAR ARCHIVO STORAGE
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
       RESET FORM
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
       SIGUIENTE ID VISUAL
    ===================================================== */

    const getNextId = () => {
        if (
            items.length ===
            0
        ) {
            return 1
        }


        const highestId =
            Math.max(
                ...items.map(
                    (
                        item
                    ) =>
                        Number(
                            item.id ||
                            0
                        )
                )
            )


        return (
            highestId +
            1
        )
    }


    /* =====================================================
       GUARDAR PLATO
    ===================================================== */

    const handleSubmit =
        async (
            event
        ) => {
            event.preventDefault()


            if (
                !formData.category
            ) {
                setMessage(
                    "Selecciona una categoría."
                )

                return
            }


            const numericPrice =
                parsePrice(
                    formData.price
                )


            if (
                numericPrice ===
                ""
            ) {
                setMessage(
                    "El precio no es válido."
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


                let menuRef


                if (editingId) {
                    menuRef =
                        doc(
                            db,
                            "menuItems",
                            editingId
                        )

                } else {
                    menuRef =
                        doc(
                            collection(
                                db,
                                "menuItems"
                            )
                        )
                }


                const itemDocumentId =
                    menuRef.id


                const oldStoragePath =
                    formData.imageStoragePath


                const uploadedImage =
                    await uploadMenuImage(
                        itemDocumentId
                    )


                const menuData = {
                    name:
                        formData.name
                            .trim(),

                    description:
                        formData.description
                            .trim(),

                    price:
                        numericPrice,

                    category:
                        formData.category
                            .trim(),

                    imageUrl:
                        uploadedImage.imageUrl ||
                        "",

                    imageStoragePath:
                        uploadedImage.imageStoragePath ||
                        "",

                    active:
                        formData.active
                }


                if (editingId) {

                    await updateDoc(
                        menuRef,
                        menuData
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
                        "Plato actualizado correctamente."
                    )

                } else {

                    await setDoc(
                        menuRef,
                        {
                            ...menuData,

                            id:
                                getNextId()
                        }
                    )


                    setMessage(
                        "Plato creado correctamente."
                    )
                }


                resetForm()


                await loadData()

            } catch (error) {
                console.error(
                    "Error al guardar plato:",
                    error
                )


                setMessage(
                    "No se pudo guardar el plato."
                )

            } finally {
                setSaving(
                    false
                )
            }
        }


    /* =====================================================
       EDITAR PLATO
    ===================================================== */

    const handleEdit = (
        item
    ) => {
        setEditingId(
            item.firebaseId
        )


        setFormData({
            name:
                item.name ||
                "",

            description:
                item.description ||
                "",

            price:
                parsePrice(
                    item.price
                ),

            category:
                item.category ||
                "",

            imageUrl:
                item.imageUrl ||
                "",

            imageStoragePath:
                item.imageStoragePath ||
                "",

            active:
                item.active !==
                false
        })


        setImageFile(
            null
        )


        setImagePreview(
            item.imageUrl ||
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
        item
    ) => {
        try {
            const newValue =
                item.active ===
                false


            await updateDoc(
                doc(
                    db,
                    "menuItems",
                    item.firebaseId
                ),
                {
                    active:
                        newValue
                }
            )


            setItems(
                (
                    current
                ) =>
                    current.map(
                        (
                            menuItem
                        ) =>
                            menuItem.firebaseId ===
                            item.firebaseId
                                ? {
                                      ...menuItem,

                                      active:
                                          newValue
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


    /* =====================================================
       ELIMINAR PLATO
    ===================================================== */

    const handleDelete = async (
        item
    ) => {
        const confirmed =
            window.confirm(
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


            if (
                item.imageStoragePath
            ) {
                await deleteStorageImage(
                    item.imageStoragePath
                )
            }


            setItems(
                (
                    current
                ) =>
                    current.filter(
                        (
                            menuItem
                        ) =>
                            menuItem.firebaseId !==
                            item.firebaseId
                    )
            )


            if (
                editingId ===
                item.firebaseId
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


    /* =====================================================
       CREAR CATEGORÍA
    ===================================================== */

    const handleAddCategory =
        async (
            event
        ) => {
            event.preventDefault()


            const name =
                newCategory.trim()


            if (!name) {
                setMessage(
                    "Escribe el nombre de la categoría."
                )

                return
            }


            const duplicated =
                categories.some(
                    (
                        category
                    ) =>
                        normalizeText(
                            category.name
                        ) ===
                        normalizeText(
                            name
                        )
                )


            if (duplicated) {
                setMessage(
                    "Esa categoría ya existe."
                )

                return
            }


            try {
                setCategorySaving(
                    true
                )


                setMessage(
                    ""
                )


                const nextOrder =
                    categories.length >
                    0
                        ? Math.max(
                              ...categories.map(
                                  (
                                      category
                                  ) =>
                                      Number(
                                          category.order ||
                                              0
                                      )
                              )
                          ) +
                          1
                        : 1


                await addDoc(
                    collection(
                        db,
                        "menuCategories"
                    ),
                    {
                        name,

                        order:
                            nextOrder,

                        active:
                            true
                    }
                )


                setNewCategory(
                    ""
                )


                setMessage(
                    "Categoría creada correctamente."
                )


                await loadData()

            } catch (error) {
                console.error(
                    "Error al crear categoría:",
                    error
                )


                setMessage(
                    "No se pudo crear la categoría."
                )

            } finally {
                setCategorySaving(
                    false
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
            const categoryInUse =
                items.some(
                    (
                        item
                    ) =>
                        normalizeText(
                            item.category
                        ) ===
                        normalizeText(
                            category.name
                        )
                )


            if (
                categoryInUse
            ) {
                setMessage(
                    `No puedes eliminar "${category.name}" porque todavía tiene platos asociados.`
                )

                return
            }


            const confirmed =
                window.confirm(
                    `¿Eliminar la categoría "${category.name}"?`
                )


            if (!confirmed) {
                return
            }


            try {
                await deleteDoc(
                    doc(
                        db,
                        "menuCategories",
                        category.firebaseId
                    )
                )


                if (
                    normalizeText(
                        formData.category
                    ) ===
                    normalizeText(
                        category.name
                    )
                ) {
                    setFormData(
                        (
                            current
                        ) => ({
                            ...current,

                            category:
                                ""
                        })
                    )
                }


                setMessage(
                    "Categoría eliminada correctamente."
                )


                await loadData()

            } catch (error) {
                console.error(
                    "Error al eliminar categoría:",
                    error
                )


                setMessage(
                    "No se pudo eliminar la categoría."
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
                    MENÚ
                </span>


                <h1>
                    {editingId
                        ? "Editar plato"
                        : "Nuevo plato"}
                </h1>


                <p>
                    Crea, modifica y controla
                    los platos disponibles en
                    el menú.
                </p>

            </section>


            {/* =========================
                PLATO
            ========================= */}

            <form
                className="admin-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>
                    Nombre

                    <input
                        type="text"
                        name="name"
                        value={
                            formData.name
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </label>


                <label>
                    Categoría

                    <select
                        name="category"
                        value={
                            formData.category
                        }
                        onChange={
                            handleChange
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
                                        category.name
                                    }
                                >
                                    {
                                        category.name
                                    }
                                </option>

                            )
                        )}

                    </select>

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

                    Imagen del plato

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
                            alt="Vista previa del plato"
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

                    Plato activo

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
                            ? imageFile
                                ? "Subiendo imagen..."
                                : "Guardando..."
                            : editingId
                              ? "Guardar cambios"
                              : "Crear plato"}
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


            {/* =========================
                CATEGORÍAS
            ========================= */}

            <section className="admin-section">

                <div className="admin-section-title">

                    <span className="admin-kicker">
                        CATEGORÍAS
                    </span>

                    <h2>
                        Administrar categorías
                    </h2>

                    <p>
                        Las categorías aparecen
                        automáticamente en la lista
                        al crear o editar un plato.
                    </p>

                </div>


                <form
                    className="admin-form"
                    onSubmit={
                        handleAddCategory
                    }
                >

                    <label>
                        Nueva categoría

                        <input
                            type="text"
                            value={
                                newCategory
                            }
                            onChange={(
                                event
                            ) =>
                                setNewCategory(
                                    event.target.value
                                )
                            }
                            placeholder="Ej: Postres"
                        />

                    </label>


                    <div className="admin-form-actions">

                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={
                                categorySaving
                            }
                        >
                            {categorySaving
                                ? "Añadiendo..."
                                : "Añadir categoría"}
                        </button>

                    </div>

                </form>


                {categories.length ===
                0 ? (

                    <p className="admin-empty">
                        Todavía no hay categorías.
                    </p>

                ) : (

                    <div className="admin-grid">

                        {categories.map(
                            (
                                category,
                                index
                            ) => {

                                const itemCount =
                                    items.filter(
                                        (
                                            item
                                        ) =>
                                            normalizeText(
                                                item.category
                                            ) ===
                                            normalizeText(
                                                category.name
                                            )
                                    ).length


                                return (
                                    <article
                                        key={
                                            category.firebaseId
                                        }
                                        className="admin-card admin-content-card"
                                    >

                                        <div>

                                            <span className="admin-status">
                                                Categoría{" "}
                                                {index +
                                                    1}
                                            </span>


                                            <h2>
                                                {
                                                    category.name
                                                }
                                            </h2>


                                            <p>
                                                {
                                                    itemCount
                                                }{" "}
                                                {itemCount ===
                                                1
                                                    ? "plato"
                                                    : "platos"}
                                            </p>

                                        </div>


                                        <div className="admin-card-actions">

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


            {/* =========================
                PLATOS ACTUALES
            ========================= */}

            <section className="admin-section">

                <div className="admin-section-title">

                    <span className="admin-kicker">
                        PLATOS
                    </span>

                    <h2>
                        Menú actual
                    </h2>

                </div>


                {loading ? (

                    <p>
                        Cargando menú...
                    </p>

                ) : items.length ===
                  0 ? (

                    <p className="admin-empty">
                        Todavía no hay platos
                        guardados en Firestore.
                    </p>

                ) : (

                    <div className="admin-grid">

                        {items.map(
                            (
                                item
                            ) => (

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
                                            alt={
                                                item.name
                                            }
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
                                            {
                                                item.category
                                            }
                                        </p>


                                        <h2>
                                            {
                                                item.name
                                            }
                                        </h2>


                                        <p>
                                            {
                                                item.description
                                            }
                                        </p>


                                        <strong className="admin-price">
                                            {
                                                formatPrice(
                                                    item.price
                                                )
                                            }
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

                            )
                        )}

                    </div>

                )}

            </section>

        </main>
    )
}


export default AdminMenu