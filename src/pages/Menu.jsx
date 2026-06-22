import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"

import { db } from "../firebase/firebase"
import MenuCard from "../components/MenuCard"

import "./Menu.css"

function Menu() {
    const [menuItems, setMenuItems] = useState([])
    const [selectedCategory, setSelectedCategory] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function loadMenuItems() {
            try {
                const querySnapshot = await getDocs(
                    collection(db, "menuItems")
                )

                const items = querySnapshot.docs.map((document) => ({
                    firebaseId: document.id,
                    ...document.data()
                }))

                items.sort((a, b) => Number(a.id) - Number(b.id))

                setMenuItems(items)

                if (items.length > 0) {
                    setSelectedCategory(items[0].category)
                }
            } catch (firebaseError) {
                console.error(
                    "Error al cargar el menú desde Firestore:",
                    firebaseError
                )

                setError("No se pudo cargar el menú.")
            } finally {
                setLoading(false)
            }
        }

        loadMenuItems()
    }, [])

    const categories = [
        ...new Set(menuItems.map((item) => item.category))
    ]

    const filteredItems = menuItems.filter(
        (item) => item.category === selectedCategory
    )

    return (
        <section className="menu-section" id="menu">
            <h2>Nuestro Menú</h2>

            <p className="menu-subtitle">
                Elige una categoría y descubre nuestros platos favoritos.
            </p>

            {loading && (
                <p className="menu-status">
                    Cargando menú...
                </p>
            )}

            {error && (
                <p className="menu-status">
                    {error}
                </p>
            )}

            {!loading && !error && (
                <>
                    <div className="menu-categories">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={
                                    selectedCategory === category
                                        ? "category-btn active"
                                        : "category-btn"
                                }
                                onClick={() =>
                                    setSelectedCategory(category)
                                }
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="menu-grid">
                        {filteredItems.map((item) => (
                            <MenuCard
                                key={item.firebaseId}
                                item={item}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    )
}

export default Menu