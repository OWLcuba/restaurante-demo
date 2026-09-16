import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react"

import {
    doc,
    onSnapshot
} from "firebase/firestore"

import { db } from "../firebase/firebase"

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
    const [businessData, setBusinessData] = useState(null)
    const [loadingBusiness, setLoadingBusiness] = useState(true)
    const [businessError, setBusinessError] = useState("")

    useEffect(() => {
        const businessRef = doc(
            db,
            "business",
            "main"
        )

        const unsubscribe = onSnapshot(
            businessRef,
            (businessSnapshot) => {
                if (!businessSnapshot.exists()) {
                    console.error(
                        "No existe business/main"
                    )

                    setBusinessError(
                        "No existe la información del restaurante."
                    )

                    setLoadingBusiness(false)

                    return
                }

                const data = {
                    firebaseId: businessSnapshot.id,
                    ...businessSnapshot.data()
                }

                console.log(
                    "DATOS RECIBIDOS DE FIRESTORE:",
                    data
                )

                setBusinessData(data)
                setBusinessError("")
                setLoadingBusiness(false)
            },
            (error) => {
                console.error(
                    "ERROR FIRESTORE:",
                    error
                )

                setBusinessError(
                    "No se pudo cargar la información del restaurante."
                )

                setLoadingBusiness(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return (
        <BusinessContext.Provider
            value={{
                businessData,
                loadingBusiness,
                businessError
            }}
        >
            {children}
        </BusinessContext.Provider>
    )
}

export function useBusiness() {
    const context = useContext(BusinessContext)

    if (!context) {
        throw new Error(
            "useBusiness debe usarse dentro de BusinessProvider"
        )
    }

    return context
}