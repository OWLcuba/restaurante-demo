import {
    useEffect,
    useState
} from "react"

import {
    collection,
    getDocs
} from "firebase/firestore"

import {
    Link
} from "react-router-dom"

import {
    db
} from "../firebase/firebase"

import "./Gallery.css"


function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}


function isDrinkCategory(category) {
    const normalized =
        normalizeText(category)

    return (
        normalized.includes("bebidas") ||
        normalized.includes("drinks") ||
        normalized.includes("cocktails") ||
        normalized.includes("alcohol")
    )
}


function Gallery() {
    const [
        galleryCategories,
        setGalleryCategories
    ] = useState([])

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        error,
        setError
    ] = useState("")


    useEffect(() => {
        async function loadGalleryCategories() {
            try {
                /*
                    CARGAMOS CATEGORÍAS
                */

                const categoriesSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "galleryCategories"
                        )
                    )


                const categories =
                    categoriesSnapshot.docs.map(
                        (document) => ({
                            firebaseId:
                                document.id,

                            ...document.data()
                        })
                    )


                /*
                    CARGAMOS MENU ITEMS
                    PARA SACAR PORTADAS
                    DE PLATOS Y BEBIDAS
                */

                const menuSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "menuItems"
                        )
                    )


                const menuItems =
                    menuSnapshot.docs.map(
                        (document) => ({
                            firebaseId:
                                document.id,

                            ...document.data()
                        })
                    )


                const activeMenuItems =
                    menuItems.filter(
                        (item) =>
                            item.active !== false &&
                            item.imageUrl
                    )


                /*
                    BUSCAMOS UNA FOTO
                    PARA PLATOS
                */

                const dishImage =
                    activeMenuItems.find(
                        (item) =>
                            !isDrinkCategory(
                                item.category
                            )
                    )?.imageUrl || ""


                /*
                    BUSCAMOS UNA FOTO
                    PARA BEBIDAS
                */

                const drinkImage =
                    activeMenuItems.find(
                        (item) =>
                            isDrinkCategory(
                                item.category
                            )
                    )?.imageUrl || ""


                /*
                    REEMPLAZAMOS PORTADAS
                    DE PLATOS Y BEBIDAS
                */

                const categoriesWithDynamicImages =
                    categories.map(
                        (category) => {

                            if (
                                category.id ===
                                "platos"
                            ) {
                                return {
                                    ...category,

                                    imageUrl:
                                        dishImage ||
                                        category.imageUrl
                                }
                            }


                            if (
                                category.id ===
                                "bebidas"
                            ) {
                                return {
                                    ...category,

                                    imageUrl:
                                        drinkImage ||
                                        category.imageUrl
                                }
                            }


                            return category
                        }
                    )


                const activeCategories =
                    categoriesWithDynamicImages
                        .filter(
                            (category) =>
                                category.active !==
                                false
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.order ?? 0
                                ) -
                                Number(
                                    b.order ?? 0
                                )
                        )


                setGalleryCategories(
                    activeCategories
                )

            } catch (
                firebaseError
            ) {
                console.error(
                    "Error al cargar las categorías de la galería:",
                    firebaseError
                )

                setError(
                    "No se pudieron cargar las categorías de la galería."
                )
            } finally {
                setLoading(false)
            }
        }


        loadGalleryCategories()
    }, [])


    return (
        <section
            className="gallery-section"
            id="galeria"
        >

            <div className="gallery-header">

                <span className="gallery-kicker">
                    MOMENTOS Q&apos; BOLA
                </span>

                <h2>
                    Nuestra Galería
                </h2>

                <p>
                    Conoce nuestros platos,
                    celebraciones y momentos
                    especiales.
                </p>

            </div>


            {loading && (
                <p className="gallery-status">
                    Cargando galería...
                </p>
            )}


            {error && (
                <p className="gallery-status">
                    {error}
                </p>
            )}


            {!loading &&
                !error &&
                galleryCategories.length ===
                    0 && (
                    <p className="gallery-status">
                        Todavía no hay categorías
                        disponibles.
                    </p>
                )}


            {!loading &&
                !error &&
                galleryCategories.length >
                    0 && (

                    <div className="gallery-grid">

                        {galleryCategories.map(
                            (
                                category
                            ) => (

                                <Link
                                    key={
                                        category.firebaseId ||
                                        category.id
                                    }
                                    to={`/gallery/${category.id}`}
                                    className="gallery-card"
                                >

                                    {category.imageUrl ? (
                                        <img
                                            src={
                                                category.imageUrl
                                            }
                                            alt={
                                                category.title
                                            }
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="gallery-card-placeholder">
                                            Sin imagen
                                        </div>
                                    )}


                                    <div className="gallery-overlay">

                                        <span className="gallery-card-label">
                                            EXPLORAR
                                        </span>

                                        <h3>
                                            {
                                                category.title
                                            }
                                        </h3>

                                        <p>
                                            {
                                                category.description
                                            }
                                        </p>

                                        <div className="gallery-card-action">
                                            Ver fotos →
                                        </div>

                                    </div>

                                </Link>
                            )
                        )}

                    </div>
                )}

        </section>
    )
}


export default Gallery