import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"

import { db } from "../firebase/firebase"
import PromotionCard from "../components/PromotionCard"

import "./Promotions.css"

function Promotions() {
    const [promotions, setPromotions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadPromotions() {
            try {
                const querySnapshot = await getDocs(
                    collection(db, "promotions")
                )

                const promotionsData = querySnapshot.docs.map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))

                promotionsData.sort(
                    (a, b) => Number(a.id) - Number(b.id)
                )

                setPromotions(promotionsData)
            } catch (firebaseError) {
                console.error(
                    "Error al cargar las promociones desde Firestore:",
                    firebaseError
                )

                setError("No se pudieron cargar las promociones.")
            } finally {
                setLoading(false)
            }
        }

        loadPromotions()
    }, [])

    const activePromotions = promotions.filter(
        (promotion) => promotion.active !== false
    )

    return (
        <section className="promotions-section">
            <h2>Promociones</h2>

            <p className="promotions-subtitle">
                Especiales preparados para disfrutar más por menos.
            </p>

            {loading && (
                <p className="promotions-status">
                    Cargando promociones...
                </p>
            )}

            {error && (
                <p className="promotions-status">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <div className="promotions-grid">
                    {activePromotions.map((promotion) => (
                        <PromotionCard
                            key={promotion.firebaseId}
                            promotion={promotion}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

export default Promotions