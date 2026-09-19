import fs from "fs"
import path from "path"
import crypto from "crypto"

import {
    cert,
    initializeApp
} from "firebase-admin/app"

import {
    getFirestore
} from "firebase-admin/firestore"

import {
    getStorage
} from "firebase-admin/storage"


/* =====================================================
   FIREBASE ADMIN
===================================================== */

const serviceAccountPath = path.resolve(
    "local-secrets/qbola-admin.json"
)

const serviceAccount = JSON.parse(
    fs.readFileSync(
        serviceAccountPath,
        "utf8"
    )
)

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket:
        "qbola-sanantonio.firebasestorage.app"
})

const db = getFirestore(app)

const bucket =
    getStorage(app).bucket()


/* =====================================================
   MODO
===================================================== */

/*
    Sin --apply:
    SOLO REVISA.

    Con --apply:
    ACTUALIZA FIRESTORE.
*/

const APPLY_CHANGES =
    process.argv.includes("--apply")


/* =====================================================
   UTILIDADES
===================================================== */

function cleanFileName(fileName) {

    const extension =
        path.extname(fileName)
            .toLowerCase()

    const baseName =
        path.basename(
            fileName,
            path.extname(fileName)
        )

    const cleaned =
        baseName
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )

    return (
        cleaned +
        extension
    )
}


function getFileNameFromUrl(
    imageUrl
) {

    if (!imageUrl) {
        return ""
    }


    const cleanUrl =
        String(imageUrl)
            .split("?")[0]


    const decoded =
        decodeURIComponent(
            cleanUrl
        )


    return path.basename(
        decoded
    )
}


function createDownloadUrl(
    storagePath,
    token
) {

    const encodedPath =
        encodeURIComponent(
            storagePath
        )


    return (
        `https://firebasestorage.googleapis.com/v0/b/` +
        `${bucket.name}/o/${encodedPath}` +
        `?alt=media&token=${token}`
    )
}


/* =====================================================
   LEER ARCHIVOS DE STORAGE
===================================================== */

async function buildStorageIndex() {

    console.log(
        "📦 Leyendo archivos de Storage..."
    )


    const [
        files
    ] = await bucket.getFiles({
        prefix: "menu/"
    })


    const index =
        new Map()


    for (
        const file
        of files
    ) {

        /*
            Ignoramos entradas vacías
            o carpetas virtuales.
        */

        if (
            file.name.endsWith("/")
        ) {
            continue
        }


        const storageFileName =
            path.basename(
                file.name
            )


        const normalizedName =
            cleanFileName(
                storageFileName
            )


        if (
            !index.has(
                normalizedName
            )
        ) {
            index.set(
                normalizedName,
                []
            )
        }


        index
            .get(
                normalizedName
            )
            .push(
                file
            )
    }


    console.log(
        `✅ ${files.length} archivos encontrados en menu/`
    )


    return index
}


/* =====================================================
   OBTENER URL FIREBASE
===================================================== */

async function getFirebaseUrl(
    file
) {

    const [
        metadata
    ] = await file.getMetadata()


    let token =
        metadata
            ?.metadata
            ?.firebaseStorageDownloadTokens


    /*
        Por seguridad:
        si algún archivo no tiene token,
        se lo creamos.
    */

    if (!token) {

        token =
            crypto.randomUUID()


        await file.setMetadata({
            metadata: {
                ...(
                    metadata.metadata ||
                    {}
                ),

                firebaseStorageDownloadTokens:
                    token
            }
        })
    }


    /*
        Si por alguna razón tiene varios
        tokens separados por coma,
        usamos el primero.
    */

    token =
        String(token)
            .split(",")[0]
            .trim()


    return createDownloadUrl(
        file.name,
        token
    )
}


/* =====================================================
   ACTUALIZAR MENU ITEMS
===================================================== */

async function main() {

    console.log("")
    console.log(
        "======================================"
    )

    console.log(
        "🖼️ ACTUALIZACIÓN DE URLS DEL MENÚ"
    )

    console.log(
        "======================================"
    )


    console.log(
        APPLY_CHANGES
            ? "⚠️ MODO: APLICAR CAMBIOS"
            : "🔍 MODO: SOLO REVISIÓN"
    )


    const storageIndex =
        await buildStorageIndex()


    const snapshot =
        await db
            .collection(
                "menuItems"
            )
            .get()


    let matched = 0
    let updated = 0
    let missing = 0
    let ambiguous = 0
    let withoutImage = 0


    console.log("")
    console.log(
        `🍽️ ${snapshot.size} platos encontrados en Firestore`
    )


    for (
        const document
        of snapshot.docs
    ) {

        const item =
            document.data()


        const oldImageUrl =
            item.imageUrl || ""


        if (!oldImageUrl) {

            withoutImage += 1

            console.warn(
                `⚪ SIN IMAGEN: ${item.name}`
            )

            continue
        }


        const oldFileName =
            getFileNameFromUrl(
                oldImageUrl
            )


        const normalizedName =
            cleanFileName(
                oldFileName
            )


        const candidates =
            storageIndex.get(
                normalizedName
            )


        if (
            !candidates ||
            candidates.length === 0
        ) {

            missing += 1

            console.warn(
                `❌ NO ENCONTRADA: ${item.name}`
            )

            console.warn(
                `   Imagen vieja: ${oldImageUrl}`
            )

            console.warn(
                `   Buscando: ${normalizedName}`
            )

            continue
        }


        if (
            candidates.length > 1
        ) {

            ambiguous += 1

            console.warn(
                `⚠️ AMBIGUA: ${item.name}`
            )

            candidates.forEach(
                (file) => {
                    console.warn(
                        `   → ${file.name}`
                    )
                }
            )

            continue
        }


        const storageFile =
            candidates[0]


        const newImageUrl =
            await getFirebaseUrl(
                storageFile
            )


        matched += 1


        console.log("")
        console.log(
            `✅ ${item.name}`
        )

        console.log(
            `   OLD → ${oldImageUrl}`
        )

        console.log(
            `   NEW → ${storageFile.name}`
        )


        if (
            APPLY_CHANGES
        ) {

            await document
                .ref
                .update({
                    imageUrl:
                        newImageUrl
                })


            updated += 1
        }
    }


    console.log("")
    console.log(
        "======================================"
    )

    console.log(
        "📊 RESUMEN"
    )

    console.log(
        "======================================"
    )

    console.log(
        `✅ Coincidencias: ${matched}`
    )

    console.log(
        `📝 Actualizadas: ${updated}`
    )

    console.log(
        `❌ No encontradas: ${missing}`
    )

    console.log(
        `⚠️ Ambiguas: ${ambiguous}`
    )

    console.log(
        `⚪ Sin imageUrl: ${withoutImage}`
    )


    if (
        !APPLY_CHANGES
    ) {

        console.log("")
        console.log(
            "🔒 No se modificó Firestore."
        )

        console.log(
            "Si todo se ve correcto, ejecuta:"
        )

        console.log("")
        console.log(
            "node tools/updateMenuImageUrlsFromStorage.mjs --apply"
        )

    } else {

        console.log("")
        console.log(
            "🎯 FIRESTORE ACTUALIZADO"
        )

    }
}


main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {

        console.error("")
        console.error(
            "❌ ERROR:"
        )

        console.error(
            error
        )

        process.exit(1)
    })