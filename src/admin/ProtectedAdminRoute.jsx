import { useEffect, useState } from "react"
import {
    Navigate,
    useLocation
} from "react-router-dom"
import {
    onAuthStateChanged
} from "firebase/auth"
import {
    doc,
    getDoc
} from "firebase/firestore"

import {
    auth,
    db
} from "../firebase/firebase"


function ProtectedAdminRoute({ children }) {
    const location = useLocation()

    const [checking, setChecking] = useState(true)
    const [authorized, setAuthorized] = useState(false)


    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                auth,
                async (user) => {
                    if (!user) {
                        setAuthorized(false)
                        setChecking(false)
                        return
                    }

                    try {
                        const adminRef = doc(
                            db,
                            "admins",
                            user.uid
                        )

                        const adminSnapshot =
                            await getDoc(adminRef)

                        const isAdmin =
                            adminSnapshot.exists() &&
                            adminSnapshot.data()?.role ===
                                "admin"

                        setAuthorized(isAdmin)
                    } catch (error) {
                        console.error(
                            "Error verificando administrador:",
                            error
                        )

                        setAuthorized(false)
                    } finally {
                        setChecking(false)
                    }
                }
            )

        return () => unsubscribe()
    }, [])


    if (checking) {
        return (
            <main className="admin-page">
                <p>
                    Verificando acceso...
                </p>
            </main>
        )
    }


    if (!authorized) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        )
    }


    return children
}


export default ProtectedAdminRoute