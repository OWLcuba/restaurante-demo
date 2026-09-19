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


const rootDir =
    process.cwd()

const serviceAccountPath =
    path.join(
        rootDir,
        "local-secrets",
        "qbola-admin.json"
    )

const serviceAccount =
    JSON.parse(
        fs.readFileSync(
            serviceAccountPath,
            "utf8"
        )
    )


const app =
    initializeApp({
        credential:
            cert(serviceAccount),

        storageBucket:
            "qbola-sanantonio.firebasestorage.app"
    })


const db =
    getFirestore(app)

const bucket =
    getStorage(app).bucket()


async function uploadFile(
    localPath,
    remotePath
) {
    if (
        !fs.existsSync(localPath)
    ) {
        console.log(
            `❌ No existe: ${localPath}`
        )

        return null
    }


    const token =
        crypto.randomUUID()


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


    const url =
        `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(remotePath)}?alt=media&token=${token}`


    console.log(
        `✅ Subida: ${remotePath}`
    )

    console.log(
        `   ${url}`
    )


    return url
}


async function main() {
    console.log(
        "\n🚀 Subiendo imágenes...\n"
    )


    /*
        BUSINESS
    */

    const logoPath =
        path.join(
            rootDir,
            "public",
            "images",
            "business",
            "logo.jpg"
        )


    const coverPath =
        path.join(
            rootDir,
            "public",
            "images",
            "business",
            "restaurant-cover.jpg"
        )


    const logoUrl =
        await uploadFile(
            logoPath,
            "business/logo/logo.jpg"
        )


    const coverUrl =
        await uploadFile(
            coverPath,
            "business/cover/restaurant-cover.jpg"
        )


    /*
        EVENTO
    */

    const yonkiPath =
        path.join(
            rootDir,
            "public",
            "images",
            "Eventos",
            "yonki.webp"
        )


    const yonkiUrl =
        await uploadFile(
            yonkiPath,
            "events/yonki.webp"
        )


    console.log(
        "\n📝 Actualizando Firestore...\n"
    )


    /*
        BUSINESS/MAIN
    */

    const businessRef =
        db
            .collection("business")
            .doc("main")


    const businessUpdate = {}


    if (logoUrl) {
        businessUpdate.logoUrl =
            logoUrl
    }


    if (coverUrl) {
        businessUpdate.coverImageUrl =
            coverUrl
    }


    if (
        Object.keys(
            businessUpdate
        ).length > 0
    ) {
        await businessRef.set(
            businessUpdate,
            {
                merge: true
            }
        )

        console.log(
            "✅ business/main actualizado"
        )
    }


    /*
        SPECIAL EVENTS
    */

    if (yonkiUrl) {
        const eventsSnapshot =
            await db
                .collection(
                    "specialEvents"
                )
                .get()


        let updatedEvents = 0


        for (
            const document
            of eventsSnapshot.docs
        ) {
            const data =
                document.data()

            const searchableText =
                [
                    document.id,
                    data.id,
                    data.title,
                    data.name
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()


            if (
                searchableText.includes(
                    "yonki"
                )
            ) {
                await document.ref.update({
                    imageUrl:
                        yonkiUrl
                })

                updatedEvents++

                console.log(
                    `✅ Evento actualizado: ${document.id}`
                )
            }
        }


        if (
            updatedEvents === 0
        ) {
            console.log(
                "⚠️ No encontré ningún evento Yonki para actualizar."
            )
        }
    }


    console.log(
        "\n🎉 Proceso terminado.\n"
    )
}


main()
    .catch(
        (error) => {
            console.error(
                "\n❌ Error:\n",
                error
            )

            process.exit(1)
        }
    )