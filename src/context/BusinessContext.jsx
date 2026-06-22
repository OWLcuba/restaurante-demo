import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react"

import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
    const [businessData, setBusinessData] = useState(null)
    const [loadingBusiness, setLoadingBusiness] = useState(true)
    const [businessError, setBusinessError] = useState("")

    useEffect(() => {
        async function loadBusinessData() {
            try {
                const businessRef = doc(db, "business", "main")
                const businessSnapshot = await getDoc(businessRef)

                if (!businessSnapshot.exists()) {
                    throw new Error(
                        "No existe el documento business/main"
                    )
                }

                setBusinessData({
                    firebaseId: businessSnapshot.id,
                    ...businessSnapshot.data()
                })
            } catch (error) {
                console.error(
                    "Error al cargar la información del negocio:",
                    error
                )

                setBusinessError(
                    "No se pudo cargar la información del restaurante."
                )
            } finally {
                setLoadingBusiness(false)
            }
        }

        loadBusinessData()
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