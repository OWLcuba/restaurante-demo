import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore"

import { db } from "../firebase/firebase"

const imageByName = {
    // ENTRANTES
    "Chicharrones Qbola": "/images/Menu/Entrantes/Chicharrones Qbola.png",
    "Coctel de Camaron": "/images/Menu/Entrantes/Coctel de Camaron.jpeg",
    "Croquetas": "/images/Menu/Entrantes/Croqueta.jpeg",
    "Eperlan de Pescado": "/images/Menu/Entrantes/Eperlan de Pescado.png",
    "Picadera Qbola": "/images/Menu/Entrantes/Picadera Qbola.jpeg",
    "Tamales con Chicharron": "/images/Menu/Entrantes/Tamales con chicharron.jpeg",
    "Tostones Rellenos": "/images/Menu/Entrantes/Tostones Rellenos.jpeg",

    // PIZZA / PASTA
    "Espaguetis": "/images/Menu/Pizza/espaguetis.jpeg",
    "Pizza Hawaiana": "/images/Menu/Pizza/hawaiana.jpeg",

    // PRINCIPALES
    "Bistec de Palomilla": "/images/Menu/Principales/bistec de palomilla.jpeg",
    "Cerdo Asado": "/images/Menu/Principales/Cerdo Azado.jpeg",
    "Chilindron de Cordero": "/images/Menu/Principales/chilindron de cordero.jpeg",
    "Fajita de Res": "/images/Menu/Principales/fajita de res.jpeg",
    "Paella": "/images/Menu/Principales/paella.jpeg",
    "Ropa Vieja": "/images/Menu/Principales/ropa vieja.jpeg",
    "Rueda de Sierra": "/images/Menu/Principales/rueda de sierras.jpeg",
    "Ternera Guisada": "/images/Menu/Principales/ternera guisada.jpeg",

    // SANDWICH
    "Pan con Jamon y Queso": "/images/Menu/Sandwich/pan con jamon y queso.jpeg",
    "Pan con Lechon": "/images/Menu/Sandwich/pan con lechon.jpeg",
    "Pan con Minuta": "/images/Menu/Sandwich/Pan con minuta.jpeg",
    "Pan con Bistec de Cerdo": "/images/Menu/Sandwich/pan con vistect.jpeg",
    "Pan con Bistec de Res": "/images/Menu/Sandwich/pan con vistect.jpeg",
    "Sandwich Cubano": "/images/Menu/Sandwich/sandwich cubano.jpeg",

    // ACOMPAÑANTES
    "Arroz Congri": "/images/Menu/Side/Arros congri.jpeg",
    "Ensalada del Dia": "/images/Menu/Side/ensalada del dia.jpeg",
    "Frijoles Negros": "/images/Menu/Side/frijoles negros.jpeg",
    "Maduros Fritos": "/images/Menu/Side/maduros fritos.jpeg"
}

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}

export async function updateMenuImages() {
    try {
        const snapshot = await getDocs(
            collection(db, "menuItems")
        )

        let updatedCount = 0
        let notFoundCount = 0

        for (const document of snapshot.docs) {
            const item = document.data()

            const itemName = normalizeText(item.name)

            const matchedEntry = Object.entries(
                imageByName
            ).find(([name]) => {
                return normalizeText(name) === itemName
            })

            if (!matchedEntry) {
                continue
            }

            const [, newImageUrl] = matchedEntry

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

            updatedCount += 1

            console.log(
                `✅ ${item.name} -> ${newImageUrl}`
            )
        }

        Object.keys(imageByName).forEach((expectedName) => {
            const exists = snapshot.docs.some((document) => {
                const item = document.data()

                return (
                    normalizeText(item.name) ===
                    normalizeText(expectedName)
                )
            })

            if (!exists) {
                notFoundCount += 1

                console.warn(
                    `⚠️ No encontrado en Firestore: ${expectedName}`
                )
            }
        })

        console.log(
            `✅ ${updatedCount} imágenes actualizadas`
        )

        if (notFoundCount > 0) {
            console.log(
                `⚠️ ${notFoundCount} nombres no coincidieron con Firestore`
            )
        }
    } catch (error) {
        console.error(
            "❌ Error actualizando imágenes del menú:",
            error
        )
    }
}