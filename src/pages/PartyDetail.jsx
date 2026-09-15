import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Link, useParams } from "react-router-dom"

import { db } from "../firebase/firebase"

import "./Parties.css"

function PartyDetail() {
    const { packageId } = useParams()

    const [partyPackage, setPartyPackage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadPartyPackage() {
            try {
                const packageRef = doc(
                    db,
                    "partyPackages",
                    packageId
                )

                const packageSnapshot = await getDoc(packageRef)

                if (!packageSnapshot.exists()) {
                    setError("Combo no encontrado.")
                    return
                }

                setPartyPackage({
                    firebaseId: packageSnapshot.id,
                    ...packageSnapshot.data()
                })
            } catch (firebaseError) {
                console.error(
                    "Error al cargar el combo:",
                    firebaseError
                )

                setError("No se pudo cargar este combo.")
            } finally {
                setLoading(false)
            }
        }

        loadPartyPackage()
    }, [packageId])

    if (loading) {
        return (
            <main className="parties-page">
                <p className="party-status">
                    Cargando combo...
                </p>
            </main>
        )
    }

    if (error || !partyPackage) {
        return (
            <main className="parties-page">
                <h1>{error || "Combo no encontrado"}</h1>

                <Link
                    to="/fiestas"
                    className="party-back-link"
                >
                    ← Volver a Fiestas
                </Link>
            </main>
        )
    }

    return (
        <main className="parties-page">
            <Link
                to="/fiestas"
                className="party-back-link"
            >
                ← Volver a Fiestas
            </Link>

            <section className="party-detail">
                <img
                    src={partyPackage.imageUrl}
                    alt={partyPackage.title}
                    className="party-detail-image"
                />

                <div className="party-detail-content">
                    <span className="party-serves">
                        Para {partyPackage.serves} personas
                    </span>

                    <h1>{partyPackage.title}</h1>

                    <p>{partyPackage.description}</p>

                    <h3>Incluye</h3>

                    <ul>
                        {partyPackage.includes?.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>

                    <strong className="party-detail-price">
                        ${Number(
                            partyPackage.price
                        ).toFixed(2)}
                    </strong>

                    <button type="button">
                        Reservar este combo
                    </button>
                </div>
            </section>
        </main>
    )
}

export default PartyDetail