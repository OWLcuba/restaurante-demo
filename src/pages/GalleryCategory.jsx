import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { Link, useParams } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Gallery.css"

function GalleryCategory() {
    const { category } = useParams()

    const [images, setImages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadGalleryImages() {
            try {
                const querySnapshot = await getDocs(
                    collection(db, "gallery")
                )

                const galleryData = querySnapshot.docs.map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))

                const filteredImages = galleryData
                    .filter((image) => image.category === category)
                    .sort((a, b) => Number(a.id) - Number(b.id))

                setImages(filteredImages)
            } catch (firebaseError) {
                console.error(
                    "Error al cargar la categoría de galería:",
                    firebaseError
                )

                setError("No se pudieron cargar las imágenes.")
            } finally {
                setLoading(false)
            }
        }

        loadGalleryImages()
    }, [category])

    const categoryTitle =
        category.charAt(0).toUpperCase() + category.slice(1)

    return (
        <main className="gallery-section">
            <Link to="/#galeria" className="gallery-back-link">
                ← Volver a la galería
            </Link>

            <h1>{categoryTitle}</h1>

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

            {!loading && !error && images.length === 0 && (
                <p className="gallery-status">
                    Todavía no hay imágenes en esta categoría.
                </p>
            )}

            {!loading && !error && images.length > 0 && (
                <div className="gallery-grid">
                    {images.map((image) => (
                        <article
                            key={image.firebaseId}
                            className="gallery-card"
                        >
                            <img
                                src={image.imageUrl}
                                alt={image.title}
                            />

                            <div className="gallery-overlay">
                                <h3>{image.title}</h3>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </main>
    )
}

export default GalleryCategory