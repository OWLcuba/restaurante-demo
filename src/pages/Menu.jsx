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

import MenuCard from "../components/MenuCard"

import "./Menu.css"


function Menu() {
    const [
        menuItems,
        setMenuItems
    ] = useState([])

    const [
        categories,
        setCategories
    ] = useState([])

    const [
        selectedCategory,
        setSelectedCategory
    ] = useState("")

    const [
        loading,
        setLoading
    ] = useState(true)

    const [
        error,
        setError
    ] = useState("")


    useEffect(() => {
        async function loadMenu() {
            try {
                const [
                    menuSnapshot,
                    categorySnapshot
                ] = await Promise.all([
                    getDocs(
                        collection(
                            db,
                            "menuItems"
                        )
                    ),

                    getDocs(
                        collection(
                            db,
                            "menuCategories"
                        )
                    )
                ])


                const items =
                    menuSnapshot.docs
                        .map(
                            (document) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .filter(
                            (item) =>
                                item.active !==
                                false
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.id || 0
                                ) -
                                Number(
                                    b.id || 0
                                )
                        )


                const categoryData =
                    categorySnapshot.docs
                        .map(
                            (document) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .filter(
                            (category) =>
                                category.active !==
                                false
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.order || 0
                                ) -
                                Number(
                                    b.order || 0
                                )
                        )


                /*
                    Solo mostramos categorías
                    que tengan al menos un plato
                    activo.
                */

                const categoriesWithItems =
                    categoryData.filter(
                        (category) =>
                            items.some(
                                (item) =>
                                    item.category ===
                                    category.name
                            )
                    )


                /*
                    Respaldo por si todavía existe
                    alguna categoría antigua que
                    no haya migrado.
                */

                const itemCategories = [
                    ...new Set(
                        items
                            .map(
                                (item) =>
                                    item.category
                            )
                            .filter(Boolean)
                    )
                ]


                const finalCategories =
                    categoriesWithItems.length > 0
                        ? categoriesWithItems.map(
                              (category) =>
                                  category.name
                          )
                        : itemCategories


                setMenuItems(items)
                setCategories(
                    finalCategories
                )


                if (
                    finalCategories.length > 0
                ) {
                    setSelectedCategory(
                        finalCategories[0]
                    )
                }
            } catch (firebaseError) {
                console.error(
                    "Error al cargar el menú desde Firestore:",
                    firebaseError
                )

                setError(
                    "No se pudo cargar el menú."
                )
            } finally {
                setLoading(false)
            }
        }


        loadMenu()
    }, [])


    const filteredItems =
        menuItems.filter(
            (item) =>
                item.category ===
                selectedCategory
        )


    return (
        <section
            className="menu-section"
            id="menu"
        >

            <div className="menu-header">

                <span className="menu-kicker">
                    SABOR DE CASA
                </span>

                <h2>
                    Nuestro Menú
                </h2>

                <p className="menu-subtitle">
                    Elige una categoría y
                    descubre nuestros platos
                    favoritos.
                </p>

            </div>


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


            {!loading &&
                !error &&
                menuItems.length === 0 && (
                    <p className="menu-status">
                        Actualmente no hay platos
                        disponibles.
                    </p>
                )}


            {!loading &&
                !error &&
                menuItems.length > 0 && (
                    <>

                        <div className="menu-categories">

                            {categories.map(
                                (category) => (
                                    <button
                                        key={
                                            category
                                        }
                                        type="button"
                                        className={
                                            selectedCategory ===
                                            category
                                                ? "category-btn active"
                                                : "category-btn"
                                        }
                                        onClick={() =>
                                            setSelectedCategory(
                                                category
                                            )
                                        }
                                    >
                                        {category}
                                    </button>
                                )
                            )}

                        </div>


                        <div className="menu-grid">

                            {filteredItems.map(
                                (item) => (
                                    <MenuCard
                                        key={
                                            item.firebaseId
                                        }
                                        item={
                                            item
                                        }
                                    />
                                )
                            )}

                        </div>

                    </>
                )}

        </section>
    )
}


export default Menu