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
                const querySnapshot =
                    await getDocs(
                        collection(
                            db,
                            "galleryCategories"
                        )
                    )


                const categories =
                    querySnapshot.docs.map(
                        (document) => ({
                            firebaseId:
                                document.id,

                            ...document.data()
                        })
                    )


                const activeCategories =
                    categories
                        .filter(
                            (category) =>
                                category.active !== false
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
            } catch (firebaseError) {
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

                                    <img
                                        src={
                                            category.imageUrl
                                        }
                                        alt={
                                            category.title
                                        }
                                        loading="lazy"
                                    />


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