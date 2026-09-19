import fs from "fs"
import path from "path"
import crypto from "crypto"

import {
    cert,
    initializeApp
} from "firebase-admin/app"

import {
    getStorage
} from "firebase-admin/storage"


/* =====================================================
   CREDENCIAL ADMIN LOCAL
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


/* =====================================================
   FIREBASE ADMIN
===================================================== */

const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket:
        "qbola-sanantonio.firebasestorage.app"
})

const bucket =
    getStorage(app).bucket()


/* =====================================================
   CARPETA LOCAL DEL MENÚ
===================================================== */

const sourceRoot = path.resolve(
    "public/images/Menu"
)


/* =====================================================
   MAPA DE CARPETAS
===================================================== */

const folderMap = {
    "Cocktails-Alcohol":
        "menu/cocktails-alcohol",

    "Drinks":
        "menu/drinks",

    "Entrantes":
        "menu/entrantes",

    "Pizza":
        "menu/pizza",

    "postres":
        "menu/postres",

    "Principales":
        "menu/principales",

    "Sandwich":
        "menu/sandwich",

    "Side":
        "menu/side"
}


/* =====================================================
   LIMPIAR NOMBRES
===================================================== */

function cleanFileName(fileName) {
    const extension =
        path.extname(fileName)
            .toLowerCase()

    const originalBaseName =
        path.basename(
            fileName,
            path.extname(fileName)
        )

    const cleanBaseName =
        originalBaseName
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
        cleanBaseName +
        extension
    )
}


/* =====================================================
   CREAR URL DE DESCARGA FIREBASE
===================================================== */

function createDownloadUrl(
    remotePath,
    token
) {
    const encodedPath =
        encodeURIComponent(
            remotePath
        )

    return (
        `https://firebasestorage.googleapis.com/v0/b/` +
        `${bucket.name}/o/${encodedPath}` +
        `?alt=media&token=${token}`
    )
}


/* =====================================================
   SUBIR UNA CARPETA
===================================================== */

async function uploadFolder(
    localFolder,
    remoteFolder
) {
    if (
        !fs.existsSync(
            localFolder
        )
    ) {
        console.warn(
            `⚠️ No existe la carpeta: ${localFolder}`
        )

        return 0
    }


    const entries =
        fs.readdirSync(
            localFolder,
            {
                withFileTypes: true
            }
        )


    let uploaded = 0


    for (
        const entry
        of entries
    ) {

        if (
            !entry.isFile()
        ) {
            continue
        }


        const localPath =
            path.join(
                localFolder,
                entry.name
            )


        const cleanName =
            cleanFileName(
                entry.name
            )


        const remotePath =
            `${remoteFolder}/${cleanName}`


        const token =
            crypto.randomUUID()


        console.log("")
        console.log(
            `⬆️ ${entry.name}`
        )

        console.log(
            `   → ${remotePath}`
        )


        await bucket.upload(
            localPath,
            {
                destination:
                    remotePath,

                metadata: {
                    cacheControl:
                        "public,max-age=31536000",

                    metadata: {
                        firebaseStorageDownloadTokens:
                            token
                    }
                }
            }
        )


        const downloadUrl =
            createDownloadUrl(
                remotePath,
                token
            )


        uploaded += 1


        console.log(
            "✅ SUBIDA"
        )

        console.log(
            `🔗 ${downloadUrl}`
        )
    }


    return uploaded
}


/* =====================================================
   EJECUTAR TODO
===================================================== */

async function main() {

    console.log("")
    console.log(
        "======================================"
    )

    console.log(
        "🚀 SUBIENDO MENÚ A FIREBASE STORAGE"
    )

    console.log(
        "======================================"
    )


    let totalUploaded = 0


    for (
        const [
            localFolderName,
            remoteFolder
        ]
        of Object.entries(
            folderMap
        )
    ) {

        console.log("")
        console.log(
            `📁 ${localFolderName}`
        )


        const localFolder =
            path.join(
                sourceRoot,
                localFolderName
            )


        const count =
            await uploadFolder(
                localFolder,
                remoteFolder
            )


        totalUploaded +=
            count
    }


    console.log("")
    console.log(
        "======================================"
    )

    console.log(
        `🎯 FINALIZADO: ${totalUploaded} imágenes subidas`
    )

    console.log(
        "======================================"
    )
}


main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {

        console.error("")
        console.error(
            "❌ ERROR SUBIENDO IMÁGENES:"
        )

        console.error(
            error
        )

        process.exit(1)
    })