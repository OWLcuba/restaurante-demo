import { useState } from "react"

import menuItems from "../data/menuData"
import MenuCard from "../components/MenuCard"

import "./Menu.css"

function Menu() {

    const categories = ["Todos", ...new Set(menuItems.map(item => item.category))]

    const [selectedCategory, setSelectedCategory] = useState("Todos")

    const filteredItems = selectedCategory === "Todos"
        ? menuItems
        : menuItems.filter(item => item.category === selectedCategory)

    return (

        <section className="menu-section">

            <h2>Nuestro Menú</h2>

            <p className="menu-subtitle">
                Elige una categoría y descubre nuestros platos favoritos.
            </p>

            <div className="menu-categories">

                {
                    categories.map(category => (

                        <button
                            key={category}
                            className={
                                selectedCategory === category
                                    ? "category-btn active"
                                    : "category-btn"
                            }
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>

                    ))
                }

            </div>

            <div className="menu-grid">

                {
                    filteredItems.map(item => (

                        <MenuCard
                            key={item.id}
                            item={item}
                        />

                    ))
                }

            </div>

        </section>

    )

}

export default Menu