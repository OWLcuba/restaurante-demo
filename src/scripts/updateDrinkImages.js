import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore"

import { db } from "../firebase/firebase"

const imageByName = {
    "Cafe Cubano": "/images/Menu/Drinks/cafe.jpeg",
    "Cafe Cortado": "/images/Menu/Drinks/cafe.jpeg",
    "Cafe Q bola": "/images/Menu/Drinks/cafe.jpeg"
}

export async function updateDrinkImages() {
    try {
        const snapshot = await getDocs(
            collection(db, "menuItems")
        )

        let updated = 0

        for (const document of snapshot.docs) {
            const item = document.data()

            const newImageUrl =
                imageByName[item.name]

            if (!newImageUrl) {
                continue
            }

            await updateDoc(
                doc(
                    db,
                    "menuItems",
                    document.id
                ),
                {
                    imageUrl: newImageUrl
                }
            )

            console.log(
                `✅ ${item.name} -> ${newImageUrl}`
            )

            updated += 1
        }

        console.log(
            `✅ ${updated} cafés actualizados`
        )
    } catch (error) {
        console.error(
            "❌ Error actualizando cafés:",
            error
        )
    }
}