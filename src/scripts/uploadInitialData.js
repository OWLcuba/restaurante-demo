import { doc, writeBatch } from "firebase/firestore"
import { db } from "../firebase/firebase"

import businessData from "../data/businessData"
import menuItems from "../data/menuData"
import promotions from "../data/promotionsData"
import galleryImages from "../data/galleryData"
import galleryCategories from "../data/galleryCategoriesData"

export async function uploadInitialData() {
    try {
        const batch = writeBatch(db)

        const businessRef = doc(db, "business", "main")
        batch.set(businessRef, businessData)

        menuItems.forEach((item) => {
            const itemRef = doc(db, "menuItems", String(item.id))
            batch.set(itemRef, item)
        })

        promotions.forEach((promotion) => {
            const promotionRef = doc(
                db,
                "promotions",
                String(promotion.id)
            )

            batch.set(promotionRef, promotion)
        })

        galleryImages.forEach((image) => {
            const imageRef = doc(
                db,
                "gallery",
                String(image.id)
            )

            batch.set(imageRef, image)
        })

        galleryCategories.forEach((category) => {
            const categoryRef = doc(
                db,
                "galleryCategories",
                category.id
            )

            batch.set(categoryRef, category)
        })

        console.log(
            "Categorías que se intentarán subir:",
            galleryCategories
        )

        await batch.commit()

        console.log("✅ Datos iniciales subidos correctamente a Firestore")
    } catch (error) {
        console.error("❌ Error al subir los datos:", error)
    }
}