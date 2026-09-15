import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { Link } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Parties.css"

function Parties() {
    const [partyPackages, setPartyPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadPartyPackages() {
            try {
                const querySnapshot = await getDocs(
                    collection(db, "partyPackages")
                )

                const packages = querySnapshot.docs.map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))

                const activePackages = packages
                    .filter((item) => item.active !== false)
                    .sort(
                        (a, b) =>
                            Number(a.firebaseId) - Number(b.firebaseId)
                    )

                setPartyPackages(activePackages)
            } catch (firebaseError) {
                console.error(
                    "Error al cargar los combos para fiestas:",
                    firebaseError
                )

                setError("No se pudieron cargar los combos.")
            } finally {
                setLoading(false)
            }
        }

        loadPartyPackages()
    }, [])

    return (
        <main className="parties-page">
            <section className="parties-hero">
                <h1>Fiestas y Catering</h1>

                <p>
                    Combos preparados para cumpleaños, reuniones
                    y celebraciones en casa.
                </p>
            </section>

            {loading && (
                <p className="party-status">
                    Cargando combos...
                </p>
            )}

            {error && (
                <p className="party-status">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <section className="party-packages">
                    {partyPackages.map((partyPackage) => (
                        <article
                            key={partyPackage.firebaseId}
                            className="party-card"
                        >
                            <img
                                src={partyPackage.imageUrl}
                                alt={partyPackage.title}
                            />

                            <div className="party-card-content">
                                <span className="party-serves">
                                    Para {partyPackage.serves} personas
                                </span>

                                <h2>{partyPackage.title}</h2>

                                <p>
                                    {partyPackage.description}
                                </p>

                                <strong>
                                    ${Number(
                                        partyPackage.price
                                    ).toFixed(2)}
                                </strong>

                                <Link
                                    to={`/fiestas/${partyPackage.firebaseId}`}
                                    className="party-card-button"
                                >
                                    Ver combo
                                </Link>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </main>
    )
}

export default Parties