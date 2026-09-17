import {
    useEffect
} from "react"

import {
    useLocation
} from "react-router-dom"

import {
    trackPageView,
    trackSession,
    trackWebAction
} from "../utils/analytics"


function AnalyticsTracker() {
    const location =
        useLocation()


    /* =====================================================
       SESIÓN
    ===================================================== */

    useEffect(() => {
        trackSession()
    }, [])


    /* =====================================================
       PÁGINAS VISITADAS
    ===================================================== */

    useEffect(() => {
        trackPageView(
            `${location.pathname}${location.search}`
        )
    }, [
        location.pathname,
        location.search
    ])


    /* =====================================================
       CLICS GLOBALES
    ===================================================== */

    useEffect(() => {
        const handleClick = (
            event
        ) => {
            const link =
                event.target.closest(
                    "a"
                )


            if (!link) {
                return
            }


            const href =
                link.getAttribute(
                    "href"
                ) || ""


            const absoluteHref =
                link.href ||
                href


            const label =
                link.textContent
                    ?.trim()
                    .replace(
                        /\s+/g,
                        " "
                    ) ||
                ""


            /* =========================
               LLAMADAS
            ========================= */

            if (
                href.startsWith(
                    "tel:"
                )
            ) {
                trackWebAction(
                    "phone_click",
                    {
                        category:
                            "contact",

                        label
                    }
                )

                return
            }


            /* =========================
               DOORDASH
            ========================= */

            if (
                absoluteHref
                    .toLowerCase()
                    .includes(
                        "doordash"
                    )
            ) {
                trackWebAction(
                    "doordash_click",
                    {
                        category:
                            "doordash",

                        label
                    }
                )

                return
            }


            /* =========================
               MAPA
            ========================= */

            const lowerHref =
                absoluteHref
                    .toLowerCase()


            if (
                lowerHref.includes(
                    "google.com/maps"
                ) ||
                lowerHref.includes(
                    "maps.google.com"
                ) ||
                lowerHref.includes(
                    "maps.app.goo.gl"
                ) ||
                lowerHref.includes(
                    "goo.gl/maps"
                )
            ) {
                trackWebAction(
                    "map_open",
                    {
                        category:
                            "location",

                        label
                    }
                )

                return
            }


            /* =========================
               WHATSAPP GENERAL
            ========================= */

            if (
                lowerHref.includes(
                    "wa.me"
                ) ||
                lowerHref.includes(
                    "api.whatsapp.com"
                )
            ) {
                trackWebAction(
                    "contact_whatsapp",
                    {
                        category:
                            "contact",

                        label
                    }
                )
            }
        }


        document.addEventListener(
            "click",
            handleClick,
            true
        )


        return () => {
            document.removeEventListener(
                "click",
                handleClick,
                true
            )
        }

    }, [])


    return null
}


export default AnalyticsTracker