import { useState } from "react"

import {
    browserLocalPersistence,
    setPersistence,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth"

import {
    doc,
    getDoc
} from "firebase/firestore"

import {
    Navigate,
    useLocation,
    useNavigate
} from "react-router-dom"

import {
    auth,
    db
} from "../firebase/firebase"

import "./Admin.css"


function AdminLogin() {
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")


    const handleSubmit = async (event) => {
        event.preventDefault()

        try {
            setLoading(true)
            setMessage("")

            await setPersistence(
                auth,
                browserLocalPersistence
            )

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password
                )

            const adminRef = doc(
                db,
                "admins",
                credential.user.uid
            )

            const adminSnapshot =
                await getDoc(adminRef)


            const adminData =
                adminSnapshot.exists()
                    ? adminSnapshot.data()
                    : null


            const hasAdminRole =
                adminData &&
                (
                    adminData.role === "admin" ||
                    adminData.role === "owner"
                )


            const isActive =
                adminData?.active === true


            if (
                !adminSnapshot.exists() ||
                !hasAdminRole ||
                !isActive
            ) {
                await signOut(auth)

                setMessage(
                    "Este usuario no tiene permisos de administrador."
                )

                return
            }


            const destination =
                location.state?.from ||
                "/admin"


            navigate(
                destination,
                {
                    replace: true
                }
            )

        } catch (error) {
            console.error(
                "Error al iniciar sesión:",
                error
            )

            setMessage(
                "Correo o contraseña incorrectos."
            )

        } finally {
            setLoading(false)
        }
    }


    if (auth.currentUser) {
        return (
            <Navigate
                to="/admin"
                replace
            />
        )
    }


    return (
        <main className="admin-page">

            <section className="admin-header">

                <span className="admin-kicker">
                    ADMINISTRACIÓN
                </span>

                <h1>
                    Iniciar sesión
                </h1>

                <p>
                    Accede al panel de administración
                    de Q&apos; Bola.
                </p>

            </section>


            <form
                className="admin-form admin-login-form"
                onSubmit={handleSubmit}
            >

                <label>
                    Correo electrónico

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        autoComplete="email"
                        required
                    />
                </label>


                <label>
                    Contraseña

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        autoComplete="current-password"
                        required
                    />
                </label>


                <button
                    type="submit"
                    className="admin-save-button"
                    disabled={loading}
                >
                    {loading
                        ? "Entrando..."
                        : "Entrar"}
                </button>


                {message && (
                    <p className="admin-message">
                        {message}
                    </p>
                )}

            </form>

        </main>
    )
}


export default AdminLogin