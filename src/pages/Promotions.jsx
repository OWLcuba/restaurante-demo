import {
    useEffect,
    useState
} from "react"

import {
    collection,
    getDocs
} from "firebase/firestore"

import {
    db
} from "../firebase/firebase"

import PromotionCard
    from "../components/PromotionCard.jsx"

import "./Promotions.css"


function Promotions() {
    const [
        promotions,
        setPromotions
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
        async function loadPromotions() {
            try {
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
                            (document) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .filter(
                            (promotion) =>
                                promotion.active !==
                                false
                        )
                        .sort(
                            (a, b) =>
                                (
                                    a.title || ""
                                ).localeCompare(
                                    b.title || ""
                                )
                        )


                setPromotions(
                    data
                )
            } catch (firebaseError) {
                console.error(
                    "Error al cargar promociones:",
                    firebaseError
                )

                setError(
                    "No se pudieron cargar las promociones."
                )
            } finally {
                setLoading(false)
            }
        }


        loadPromotions()
    }, [])


    return (
        <section
            className="promotions-section"
            id="promociones"
        >

            <div className="promotions-header">

                <span className="promotions-kicker">
                    ESPECIALES DE LA CASA
                </span>


                <h2>
                    Promociones
                </h2>


                <p className="promotions-subtitle">
                    Especiales preparados para
                    disfrutar más por menos.
                </p>

            </div>


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


            {!loading &&
                !error &&
                promotions.length ===
                    0 && (
                    <p className="promotions-status">
                        No hay promociones
                        disponibles en este
                        momento.
                    </p>
                )}


            {!loading &&
                !error &&
                promotions.length >
                    0 && (

                    <div className="promotions-grid">

                        {promotions.map(
                            (
                                promotion
                            ) => (
                                <PromotionCard
                                    key={
                                        promotion.firebaseId
                                    }
                                    promotion={
                                        promotion
                                    }
                                />
                            )
                        )}

                    </div>
                )}

        </section>
    )
}


export default Promotions