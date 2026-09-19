import {
    initializeApp,
    getApps
} from "firebase/app"

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc
} from "firebase/firestore"

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth"


/* =====================================================
   FIREBASE VIEJO — SOLO LECTURA
===================================================== */

const oldFirebaseConfig = {
    apiKey: "AIzaSyAwLnWOHIcjqY0xmzcf2T9_FZRPD01Vx7k",
    authDomain: "restaurante-demo-e8430.firebaseapp.com",
    projectId: "restaurante-demo-e8430",
    storageBucket: "restaurante-demo-e8430.firebasestorage.app",
    messagingSenderId: "65300795495",
    appId: "1:65300795495:web:07c92f17e0fb1a849544c2"
}


/* =====================================================
   FIREBASE NUEVO — DESTINO
===================================================== */

const newFirebaseConfig = {
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  apiKey: "AIzaSyB_tykISV76pK0R_DhHQFpnpuWptvAz8L0",
  authDomain: "qbola-sanantonio.firebaseapp.com",
  projectId: "qbola-sanantonio",
  storageBucket: "qbola-sanantonio.firebasestorage.app",
  messagingSenderId: "1052818038226",
  appId: "1:1052818038226:web:fc8a53bf77777f51a13c0b",
  measurementId: "G-RZBWT154DM"

}


/* =====================================================
   COLECCIONES QUE VAMOS A COPIAR
===================================================== */

const collectionsToMigrate = [
    "business",
    "menuItems",
    "menuCategories",
    "promotions",
    "partyPackages",
    "specialEvents",
    "gallery",
    "galleryCategories",
    "venues"
]


/* =====================================================
   INICIALIZAR LOS DOS FIREBASE
===================================================== */

const oldApp =
    getApps().find(
        (app) =>
            app.name === "migration-old"
    ) ||
    initializeApp(
        oldFirebaseConfig,
        "migration-old"
    )


const newApp =
    getApps().find(
        (app) =>
            app.name === "migration-new"
    ) ||
    initializeApp(
        newFirebaseConfig,
        "migration-new"
    )


const oldDb =
    getFirestore(oldApp)

const newDb =
    getFirestore(newApp)

const newAuth =
    getAuth(newApp)


/* =====================================================
   COPIAR UNA COLECCIÓN
===================================================== */

async function migrateCollection(
    collectionName
) {

    console.log(
        `\n📦 Leyendo: ${collectionName}`
    )


    const sourceSnapshot =
        await getDocs(
            collection(
                oldDb,
                collectionName
            )
        )


    if (sourceSnapshot.empty) {

        console.warn(
            `⚠️ ${collectionName}: no contiene documentos`
        )

        return {
            collectionName,
            copied: 0
        }
    }


    let copied = 0


    for (
        const sourceDocument
        of sourceSnapshot.docs
    ) {

        const data =
            sourceDocument.data()


        /*
            IMPORTANTE:
            conservamos exactamente
            el mismo ID del documento.
        */

        const destinationRef =
            doc(
                newDb,
                collectionName,
                sourceDocument.id
            )


        await setDoc(
            destinationRef,
            data,
            {
                merge: true
            }
        )


        copied += 1


        console.log(
            `   ✅ ${collectionName}/${sourceDocument.id}`
        )
    }


    console.log(
        `✅ ${collectionName}: ${copied} documentos copiados`
    )


    return {
        collectionName,
        copied
    }
}


/* =====================================================
   MIGRACIÓN COMPLETA
===================================================== */

export async function migrateFirebaseData(
    email,
    password
) {

    if (!email || !password) {

        console.error(
            "❌ Necesitas email y contraseña del admin del Firebase nuevo."
        )

        return
    }


    console.log(
        "======================================"
    )

    console.log(
        "🚀 MIGRACIÓN FIREBASE"
    )

    console.log(
        "Viejo: restaurante-demo-e8430"
    )

    console.log(
        "Nuevo: qbola-sanantonio"
    )

    console.log(
        "======================================"
    )


    try {

        /*
            Iniciamos sesión únicamente
            en el Firebase NUEVO.

            Esto permite que las reglas
            reconozcan admins/{UID}.
        */

        console.log(
            "\n🔐 Autenticando administrador..."
        )


        await signInWithEmailAndPassword(
            newAuth,
            email,
            password
        )


        console.log(
            `✅ Admin autenticado: ${newAuth.currentUser.email}`
        )


        const results = []


        for (
            const collectionName
            of collectionsToMigrate
        ) {

            try {

                const result =
                    await migrateCollection(
                        collectionName
                    )


                results.push(
                    result
                )

            } catch (error) {

                console.error(
                    `❌ Error migrando ${collectionName}:`,
                    error
                )


                results.push({
                    collectionName,
                    copied: 0,
                    error: true
                })

            }
        }


        console.log(
            "\n======================================"
        )

        console.log(
            "📊 RESUMEN DE MIGRACIÓN"
        )

        console.log(
            "======================================"
        )


        let totalCopied = 0


        results.forEach(
            (result) => {

                if (result.error) {

                    console.log(
                        `❌ ${result.collectionName}`
                    )

                } else {

                    console.log(
                        `✅ ${result.collectionName}: ${result.copied}`
                    )

                    totalCopied +=
                        result.copied
                }

            }
        )


        console.log(
            "--------------------------------------"
        )

        console.log(
            `✅ TOTAL: ${totalCopied} documentos copiados`
        )

        console.log(
            "======================================"
        )


        await signOut(
            newAuth
        )


        console.log(
            "🔒 Sesión temporal cerrada."
        )

        console.log(
            "🎯 MIGRACIÓN FINALIZADA."
        )


    } catch (error) {

        console.error(
            "❌ Error general durante la migración:",
            error
        )

    }
}