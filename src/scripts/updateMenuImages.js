import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore"

import { db } from "../firebase/firebase"


/*
    IMPORTANTE:
    Aquí usamos los nombres EXACTOS de los platos
    tal como aparecen en tu Admin.
*/

const imageByName = {

    /* =========================
       ENTRANTES
    ========================= */

    "Croquetas Q bola":
        "/images/Menu/Entrantes/Croqueta.jpeg",

    "Tamal Cubano con Chicharron":
        "/images/Menu/Entrantes/Tamales con chicharron.jpeg",

    "Tamal cubano con Masas de Cerdo":
        "/images/Menu/Entrantes/Tamales con chicharron.jpeg",

    "Tostones Rellenos":
        "/images/Menu/Entrantes/Tostones Rellenos.jpeg",

    "Picadera Q bola":
        "/images/Menu/Entrantes/Picadera Qbola.jpeg",

    "Coctel de Camarones":
        "/images/Menu/Entrantes/Coctel de Camaron.jpeg",

    "Eperlan de Pescado":
        "/images/Menu/Entrantes/Eperlan de Pescado.png",

    "Chicharrones Q bola":
        "/images/Menu/Entrantes/Chicharrones Qbola.png",


    /* =========================
       SANDWICHES
    ========================= */

    "Sandwich Cubano":
        "/images/Menu/Sandwich/sandwich cubano.jpeg",

    "Pan con Bistec de Cerdo":
        "/images/Menu/Sandwich/pan con vistect.jpeg",

    "Pan con Bistec de Res":
        "/images/Menu/Sandwich/pan con vistect.jpeg",

    "Pan con Minuta":
        "/images/Menu/Sandwich/Pan con minuta.jpeg",

    "Pan con Lechon":
        "/images/Menu/Sandwich/pan con lechon.jpeg",

    "Sandwich de Jamon y Queso":
        "/images/Menu/Sandwich/pan con jamon y queso.jpeg",


    /* =========================
       PRINCIPALES
    ========================= */

    "Ropa Vieja":
        "/images/Menu/Principales/ropa vieja.jpeg",

    "Cerdo asado":
        "/images/Menu/Principales/Cerdo Azado.jpeg",

    "Bistec de Palomilla Encebollado":
        "/images/Menu/Principales/bistec de palomilla.jpeg",

    "Fajitas de res":
        "/images/Menu/Principales/fajita de res.jpeg",

    "Ternera Guisada":
        "/images/Menu/Principales/ternera guisada.jpeg",

    "Chilindron de Cordero":
        "/images/Menu/Principales/chilindron de cordero.jpeg",

    "Paella del Mar":
        "/images/Menu/Principales/paella.jpeg",

    "Rueda de Sierra Frita":
        "/images/Menu/Principales/rueda de sierras.jpeg",


    /* =========================
       PIZZA / PASTA
    ========================= */

    "Pizza Hawaiana":
        "/images/Menu/Pizza/hawaiana.jpeg",

    "Spaghetti de Queso":
        "/images/Menu/Pizza/espaguetis.jpeg",

    "Spaghetti de Jamon":
        "/images/Menu/Pizza/espaguetis.jpeg",

    "Spaghetti de Chorizo":
        "/images/Menu/Pizza/espaguetis.jpeg",


    /* =========================
       ACOMPAÑANTES
    ========================= */

    "Frijoles Negros":
        "/images/Menu/Side/frijoles negros.jpeg",

    "Arroz Congri":
        "/images/Menu/Side/Arros congri.jpeg",

    "Chips de Platano/Malanga":
        "/images/Menu/Side/maduros fritos.jpeg",

    "Vegetales del Dia":
        "/images/Menu/Side/ensalada del dia.jpeg",


    /* =========================
       POSTRES
    ========================= */

    "Copa Lolita":
        "/images/Menu/postres/copa lolita.jpeg"
}


/*
    Normalizamos los nombres para evitar problemas
    por mayúsculas, acentos o espacios.
*/

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
}


export async function updateMenuImages() {

    try {

        console.log(
            "🔄 Comenzando actualización de imágenes..."
        )


        const snapshot = await getDocs(
            collection(
                db,
                "menuItems"
            )
        )


        let updatedCount = 0


        for (const documentSnapshot of snapshot.docs) {

            const item =
                documentSnapshot.data()


            const normalizedItemName =
                normalizeText(
                    item.name
                )


            const matchedEntry =
                Object.entries(
                    imageByName
                ).find(
                    ([menuName]) =>
                        normalizeText(
                            menuName
                        ) ===
                        normalizedItemName
                )


            if (!matchedEntry) {
                continue
            }


            const [
                matchedName,
                imageUrl
            ] = matchedEntry


            await updateDoc(
                doc(
                    db,
                    "menuItems",
                    documentSnapshot.id
                ),
                {
                    imageUrl
                }
            )


            updatedCount += 1


            console.log(
                `✅ ${item.name}`
            )

            console.log(
                `   → ${imageUrl}`
            )

        }


        console.log("")
        console.log(
            `✅ TERMINADO: ${updatedCount} imágenes actualizadas.`
        )


        /*
            Revisamos si algún nombre del mapa
            no apareció en Firestore.
        */

        const missingItems = []


        Object.keys(
            imageByName
        ).forEach(
            (expectedName) => {

                const exists =
                    snapshot.docs.some(
                        (
                            documentSnapshot
                        ) => {

                            const item =
                                documentSnapshot.data()

                            return (
                                normalizeText(
                                    item.name
                                ) ===
                                normalizeText(
                                    expectedName
                                )
                            )
                        }
                    )


                if (!exists) {
                    missingItems.push(
                        expectedName
                    )
                }

            }
        )


        if (
            missingItems.length > 0
        ) {

            console.warn(
                "⚠️ Estos platos no fueron encontrados:"
            )

            missingItems.forEach(
                (name) =>
                    console.warn(
                        `⚠️ ${name}`
                    )
            )

        } else {

            console.log(
                "🎯 Todos los nombres del mapa fueron encontrados."
            )

        }

    } catch (error) {

        console.error(
            "❌ Error actualizando imágenes:",
            error
        )

    }
}