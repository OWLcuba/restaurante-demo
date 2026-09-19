import {
    useEffect,
    useState
} from "react"

import {
    collection,
    getDocs
} from "firebase/firestore"

import {
    Link,
    useParams
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


function GalleryCategory() {
    const { category } =
        useParams()

    const [
        images,
        setImages
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
        async function loadGalleryImages() {
            try {
                setLoading(true)
                setError("")

                /*
                    PLATOS Y BEBIDAS
                    reutilizan menuItems.
                */

                if (
                    category === "platos" ||
                    category === "bebidas"
                ) {
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


                    const filteredItems =
                        menuItems
                            .filter(
                                (item) =>
                                    item.active !==
                                        false &&
                                    item.imageUrl
                            )
                            .filter(
                                (item) => {
                                    const drink =
                                        isDrinkCategory(
                                            item.category
                                        )

                                    if (
                                        category ===
                                        "bebidas"
                                    ) {
                                        return drink
                                    }

                                    return !drink
                                }
                            )
                            .map(
                                (item) => ({
                                    firebaseId:
                                        item.firebaseId,

                                    title:
                                        item.name,

                                    imageUrl:
                                        item.imageUrl
                                })
                            )


                    setImages(
                        filteredItems
                    )

                    return
                }


                /*
                    RESTAURANTE / EVENTOS
                    usan la colección gallery.
                */

                const gallerySnapshot =
                    await getDocs(
                        collection(
                            db,
                            "gallery"
                        )
                    )


                const galleryData =
                    gallerySnapshot.docs.map(
                        (document) => ({
                            firebaseId:
                                document.id,

                            ...document.data()
                        })
                    )


                const filteredImages =
                    galleryData
                        .filter(
                            (image) =>
                                image.category ===
                                    category &&
                                image.active !==
                                    false &&
                                image.imageUrl
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.order ??
                                    a.id ??
                                    0
                                ) -
                                Number(
                                    b.order ??
                                    b.id ??
                                    0
                                )
                        )


                setImages(
                    filteredImages
                )

            } catch (
                firebaseError
            ) {
                console.error(
                    "Error al cargar la categoría de galería:",
                    firebaseError
                )

                setError(
                    "No se pudieron cargar las imágenes."
                )
            } finally {
                setLoading(false)
            }
        }


        loadGalleryImages()
    }, [
        category
    ])


    const categoryTitle =
        category
            ? category
                  .charAt(0)
                  .toUpperCase() +
              category.slice(1)
            : "Galería"


    return (
        <main className="gallery-section gallery-category-page">

            <div className="gallery-page-top">

                <Link
                    to="/#galeria"
                    className="gallery-back-link"
                >
                    ← Volver a la galería
                </Link>

            </div>


            <div className="gallery-header gallery-category-header">

                <span className="gallery-kicker">
                    GALERÍA
                </span>

                <h1>
                    {categoryTitle}
                </h1>

                <p>
                    Algunos de nuestros
                    momentos favoritos.
                </p>

            </div>


            {loading && (
                <p className="gallery-status">
                    Cargando imágenes...
                </p>
            )}


            {error && (
                <p className="gallery-status">
                    {error}
                </p>
            )}


            {!loading &&
                !error &&
                images.length === 0 && (
                    <p className="gallery-status">
                        Todavía no hay imágenes
                        en esta categoría.
                    </p>
                )}


            {!loading &&
                !error &&
                images.length > 0 && (

                    <div className="gallery-grid gallery-images-grid">

                        {images.map(
                            (image) => (

                                <article
                                    key={
                                        image.firebaseId
                                    }
                                    className="gallery-card gallery-photo-card"
                                >

                                    <img
                                        src={
                                            image.imageUrl
                                        }
                                        alt={
                                            image.title ||
                                            "Q' Bola"
                                        }
                                        loading="lazy"
                                    />


                                    {image.title && (
                                        <div className="gallery-overlay gallery-photo-overlay">

                                            <h3>
                                                {
                                                    image.title
                                                }
                                            </h3>

                                        </div>
                                    )}

                                </article>
                            )
                        )}

                    </div>
                )}

        </main>
    )
}


export default GalleryCategory