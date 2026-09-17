import {
    addDoc,
    collection,
    serverTimestamp
} from "firebase/firestore"

import {
    db
} from "../firebase/firebase"


const SESSION_ID_KEY =
    "qbola_analytics_session_id"

const SESSION_TRACKED_KEY =
    "qbola_analytics_session_tracked"

const LAST_PAGE_VIEW_KEY =
    "qbola_analytics_last_page_view"


/* =====================================================
   SESSION ID
===================================================== */

export const getAnalyticsSessionId = () => {
    let sessionId =
        sessionStorage.getItem(
            SESSION_ID_KEY
        )


    if (!sessionId) {
        sessionId =
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`


        sessionStorage.setItem(
            SESSION_ID_KEY,
            sessionId
        )
    }


    return sessionId
}


/* =====================================================
   LIMPIAR DATOS
===================================================== */

const cleanData = (
    data
) => {
    return Object.fromEntries(
        Object.entries(
            data
        ).filter(
            (
                [
                    _,
                    value
                ]
            ) =>
                value !==
                    undefined &&
                value !==
                    null
        )
    )
}


/* =====================================================
   TRACK EVENT
===================================================== */

export const trackWebAction = async (
    type,
    details = {}
) => {
    try {
        const sessionId =
            getAnalyticsSessionId()


        const payload = {
            type,

            category:
                details.category ||
                "other",

            sessionId,

            source:
                "website",

            path:
                details.path ||
                `${window.location.pathname}${window.location.search}`,

            referrer:
                document.referrer ||
                "",

            createdAt:
                serverTimestamp(),

            ...cleanData(
                details
            )
        }


        await addDoc(
            collection(
                db,
                "webAnalytics"
            ),
            payload
        )


        return true

    } catch (error) {
        console.error(
            "Analytics error:",
            error
        )

        return false
    }
}


/* =====================================================
   SESSION
===================================================== */

export const trackSession = () => {
    const alreadyTracked =
        sessionStorage.getItem(
            SESSION_TRACKED_KEY
        )


    if (alreadyTracked) {
        return
    }


    /*
        Lo marcamos antes para evitar
        duplicados por React StrictMode.
    */

    sessionStorage.setItem(
        SESSION_TRACKED_KEY,
        "1"
    )


    trackWebAction(
        "session_start",
        {
            category:
                "traffic"
        }
    )
}


/* =====================================================
   PAGE VIEW
===================================================== */

export const trackPageView = (
    path
) => {
    const previousRaw =
        sessionStorage.getItem(
            LAST_PAGE_VIEW_KEY
        )


    if (previousRaw) {
        try {
            const previous =
                JSON.parse(
                    previousRaw
                )


            const samePage =
                previous.path ===
                path


            const veryRecent =
                Date.now() -
                    previous.time <
                1500


            if (
                samePage &&
                veryRecent
            ) {
                return
            }

        } catch {
            // ignorar
        }
    }


    sessionStorage.setItem(
        LAST_PAGE_VIEW_KEY,
        JSON.stringify({
            path,
            time:
                Date.now()
        })
    )


    trackWebAction(
        "page_view",
        {
            category:
                "traffic",

            path
        }
    )
}