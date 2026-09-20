import {
    useEffect,
    useState
} from "react"

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc
} from "firebase/firestore"

import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
} from "firebase/storage"

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom"

import {
    db,
    storage
} from "../firebase/firebase"

import {
    processImage
} from "../utils/processImage"

import "./Admin.css"


/* =====================================================
   OFERTAS DEFAULT
===================================================== */

const createDefaultOffers = () => [
    {
        type: "general",
        name: "Entrada General",
        description: "",
        price: "",
        available: 0,
        active: true
    },
    {
        type: "table",
        name: "Mesa",
        description: "",
        price: "",
        available: 0,
        active: true
    },
    {
        type: "vip",
        name: "Experiencia VIP",
        description: "",
        price: "",
        available: 0,
        active: true
    }
]


/* =====================================================
   FORM DEFAULT
===================================================== */

const createEmptyForm = () => ({
    title: "",
    venueId: "",
    date: "",
    dateLabel: "",
    description: "",
    imageUrl: "",
    imageStoragePath: "",
    active: true,

    offers:
        createDefaultOffers(),

    seatStatus: {},

    standingAvailability: {}
})


/* =====================================================
   HELPERS
===================================================== */

const clamp = (
    value,
    min,
    max
) => {
    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    )
}


const normalizeSeatStatus = (
    status
) => {
    if (
        status === "reserved" ||
        status === "blocked"
    ) {
        return status
    }

    return "available"
}


const getStandingAreaCenter = (
    points = []
) => {
    if (!points.length) {
        return {
            x: 50,
            y: 50
        }
    }


    const totals =
        points.reduce(
            (
                result,
                point
            ) => ({
                x:
                    result.x +
                    Number(
                        point.x
                    ),

                y:
                    result.y +
                    Number(
                        point.y
                    )
            }),
            {
                x: 0,
                y: 0
            }
        )


    return {
        x:
            totals.x /
            points.length,

        y:
            totals.y /
            points.length
    }
}


const getAreaCapacity = (
    area
) => {
    return Math.max(
        0,
        Number(
            area?.capacity
        ) || 0
    )
}


const createStandingAvailability = (
    areas = [],
    savedAvailability = null,
    legacyTotal = null
) => {
    const result = {}


    if (
        savedAvailability &&
        typeof savedAvailability ===
            "object" &&
        Object.keys(
            savedAvailability
        ).length > 0
    ) {
        areas.forEach(
            (area) => {
                const capacity =
                    getAreaCapacity(
                        area
                    )


                const saved =
                    Number(
                        savedAvailability[
                            area.id
                        ]
                    )


                result[
                    area.id
                ] =
                    Number.isFinite(
                        saved
                    )
                        ? clamp(
                              saved,
                              0,
                              capacity
                          )
                        : capacity
            }
        )


        return result
    }


    const hasLegacyTotal =
        legacyTotal !== "" &&
        legacyTotal !== null &&
        legacyTotal !== undefined &&
        Number.isFinite(
            Number(
                legacyTotal
            )
        )


    if (hasLegacyTotal) {
        const totalCapacity =
            areas.reduce(
                (
                    total,
                    area
                ) =>
                    total +
                    getAreaCapacity(
                        area
                    ),
                0
            )


        let remaining =
            clamp(
                Number(
                    legacyTotal
                ),
                0,
                totalCapacity
            )


        areas.forEach(
            (area) => {
                const capacity =
                    getAreaCapacity(
                        area
                    )


                const available =
                    Math.min(
                        capacity,
                        remaining
                    )


                result[
                    area.id
                ] =
                    available


                remaining -=
                    available
            }
        )


        return result
    }


    areas.forEach(
        (area) => {
            result[
                area.id
            ] =
                getAreaCapacity(
                    area
                )
        }
    )


    return result
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminEventForm() {
    const {
        eventId
    } = useParams()


    const navigate =
        useNavigate()


    const isEditing =
        Boolean(
            eventId
        )


    const [
        venues,
        setVenues
    ] = useState([])


    const [
        formData,
        setFormData
    ] = useState(
        createEmptyForm()
    )


    const [
        selectedSeatId,
        setSelectedSeatId
    ] = useState(null)


    const [
        selectedAreaId,
        setSelectedAreaId
    ] = useState(null)


    const [
        loading,
        setLoading
    ] = useState(true)


    const [
        saving,
        setSaving
    ] = useState(false)


    const [
        message,
        setMessage
    ] = useState("")


    const [
        imageFile,
        setImageFile
    ] = useState(null)


    const [
        imagePreview,
        setImagePreview
    ] = useState("")


    /* =====================================================
       FECHA
    ===================================================== */

    const createDateLabel = (
        dateValue
    ) => {
        if (!dateValue) {
            return ""
        }


        const [
            year,
            month,
            day
        ] =
            dateValue.split("-")


        const months = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC"
        ]


        const monthIndex =
            Number(month) - 1


        if (
            !year ||
            !day ||
            monthIndex < 0 ||
            monthIndex > 11
        ) {
            return ""
        }


        return `${Number(
            day
        )} ${months[monthIndex]} ${year}`
    }


    /* =====================================================
       SLUG
    ===================================================== */

    const createSlug = (
        text
    ) => {
        return text
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
    }


    /* =====================================================
       IMAGEN DEL EVENTO
    ===================================================== */

    const handleImageChange =
        async (
            event
        ) => {
            const file =
                event.target.files?.[0]


            if (!file) {
                return
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {
                setMessage(
                    "Selecciona un archivo de imagen válido."
                )

                return
            }


            if (
                file.size >
                15 * 1024 * 1024
            ) {
                setMessage(
                    "La imagen original no puede superar 15 MB."
                )

                return
            }


            try {
                setMessage(
                    "Procesando imagen..."
                )


                const processedFile =
                    await processImage(
                        file
                    )


                if (
                    imagePreview.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        imagePreview
                    )
                }


                setImageFile(
                    processedFile
                )


                setImagePreview(
                    URL.createObjectURL(
                        processedFile
                    )
                )


                setMessage(
                    ""
                )

            } catch (error) {
                console.error(
                    "Error procesando imagen:",
                    error
                )


                setImageFile(
                    null
                )


                setMessage(
                    "No se pudo procesar esa imagen. Prueba con otra foto."
                )
            }
        }


    /* =====================================================
       SUBIR IMAGEN
    ===================================================== */

    const uploadEventImage =
        async (
            documentId
        ) => {
            if (!imageFile) {
                return {
                    imageUrl:
                        formData.imageUrl,

                    imageStoragePath:
                        formData.imageStoragePath
                }
            }


            const storagePath =
                `events/${documentId}/event-${Date.now()}.jpg`


            const imageRef =
                ref(
                    storage,
                    storagePath
                )


            await uploadBytes(
                imageRef,
                imageFile,
                {
                    contentType:
                        imageFile.type
                }
            )


            const imageUrl =
                await getDownloadURL(
                    imageRef
                )


            return {
                imageUrl,

                imageStoragePath:
                    storagePath
            }
        }


    /* =====================================================
       BORRAR IMAGEN ANTERIOR
    ===================================================== */

    const deleteOldEventImage =
        async (
            storagePath
        ) => {
            if (!storagePath) {
                return
            }


            try {
                await deleteObject(
                    ref(
                        storage,
                        storagePath
                    )
                )

            } catch (error) {
                console.warn(
                    "No se pudo eliminar la imagen anterior del evento:",
                    error
                )
            }
        }


    /* =====================================================
       LIMPIAR PREVIEW
    ===================================================== */

    useEffect(() => {
        return () => {
            if (
                imagePreview.startsWith(
                    "blob:"
                )
            ) {
                URL.revokeObjectURL(
                    imagePreview
                )
            }
        }
    }, [
        imagePreview
    ])


    /* =====================================================
       CARGAR LOCALES + EVENTO
    ===================================================== */

    useEffect(() => {
        async function loadData() {
            try {
                const venueSnapshot =
                    await getDocs(
                        collection(
                            db,
                            "venues"
                        )
                    )


                const venueData =
                    venueSnapshot.docs
                        .map(
                            (
                                document
                            ) => ({
                                firebaseId:
                                    document.id,

                                ...document.data()
                            })
                        )
                        .filter(
                            (venue) =>
                                venue.active !==
                                false
                        )
                        .sort(
                            (a, b) =>
                                (
                                    a.name ||
                                    ""
                                ).localeCompare(
                                    b.name ||
                                    ""
                                )
                        )


                setVenues(
                    venueData
                )


                if (!eventId) {
                    return
                }


                const eventSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "specialEvents",
                            eventId
                        )
                    )


                if (
                    !eventSnapshot.exists()
                ) {
                    setMessage(
                        "Evento no encontrado."
                    )

                    return
                }


                const eventData =
                    eventSnapshot.data()


                const matchingVenue =
                    venueData.find(
                        (venue) =>
                            venue.firebaseId ===
                                eventData.venueId ||
                            venue.name ===
                                eventData.venue
                    )


                const areas =
                    Array.isArray(
                        matchingVenue
                            ?.seatingMap
                            ?.standingAreas
                    )
                        ? matchingVenue
                              .seatingMap
                              .standingAreas
                        : []


                const generalOffer =
                    Array.isArray(
                        eventData.offers
                    )
                        ? eventData.offers.find(
                              (offer) =>
                                  (
                                      offer.type ||
                                      ""
                                  ).toLowerCase() ===
                                  "general"
                          )
                        : null


                const standingAvailability =
                    createStandingAvailability(
                        areas,
                        eventData
                            .standingAvailability,
                        generalOffer
                            ?.available
                    )


                setFormData({
                    title:
                        eventData.title ||
                        "",

                    venueId:
                        matchingVenue
                            ?.firebaseId ||
                        eventData.venueId ||
                        "",

                    date:
                        eventData.date ||
                        "",

                    dateLabel:
                        eventData.dateLabel ||
                        "",

                    description:
                        eventData.description ||
                        "",

                    imageUrl:
                        eventData.imageUrl ||
                        "",

                    imageStoragePath:
                        eventData.imageStoragePath ||
                        "",

                    active:
                        eventData.active !==
                        false,

                    offers:
                        Array.isArray(
                            eventData.offers
                        )
                            ? eventData.offers.map(
                                  (
                                      offer
                                  ) => ({
                                      type:
                                          (
                                              offer.type ||
                                              "general"
                                          ).toLowerCase(),

                                      name:
                                          offer.name ||
                                          "",

                                      description:
                                          offer.description ||
                                          "",

                                      price:
                                          offer.price ??
                                          "",

                                      available:
                                          offer.available ??
                                          0,

                                      active:
                                          offer.active !==
                                          false
                                  })
                              )
                            : createDefaultOffers(),

                    seatStatus:
                        eventData.seatStatus ||
                        {},

                    standingAvailability
                })


                setImagePreview(
                    eventData.imageUrl ||
                    ""
                )

            } catch (error) {
                console.error(
                    "Error al cargar formulario de evento:",
                    error
                )


                setMessage(
                    "No se pudo cargar el evento."
                )

            } finally {
                setLoading(
                    false
                )
            }
        }


        loadData()

    }, [
        eventId
    ])


    /* =====================================================
       LOCAL SELECCIONADO
    ===================================================== */

    const selectedVenue =
        venues.find(
            (venue) =>
                venue.firebaseId ===
                formData.venueId
        ) || null


    const seatingMap =
        selectedVenue
            ?.seatingMap ||
        null


    const venueSeats =
        Array.isArray(
            seatingMap?.seats
        )
            ? seatingMap.seats
            : []


    const standingAreas =
        Array.isArray(
            seatingMap
                ?.standingAreas
        )
            ? seatingMap
                  .standingAreas
            : []


    const tableSeats =
        venueSeats.filter(
            (seat) =>
                seat.type ===
                "table"
        )


    const vipSeats =
        venueSeats.filter(
            (seat) =>
                seat.type ===
                "vip"
        )


    /* =====================================================
       GENERAL
    ===================================================== */

    const totalStandingCapacity =
        standingAreas.reduce(
            (
                total,
                area
            ) =>
                total +
                getAreaCapacity(
                    area
                ),
            0
        )


    const getStandingAvailable = (
        area
    ) => {
        const capacity =
            getAreaCapacity(
                area
            )


        const saved =
            Number(
                formData
                    .standingAvailability
                    ?.[
                        area.id
                    ]
            )


        return Number.isFinite(
            saved
        )
            ? clamp(
                  saved,
                  0,
                  capacity
              )
            : capacity
    }


    const availableGeneral =
        standingAreas.reduce(
            (
                total,
                area
            ) =>
                total +
                getStandingAvailable(
                    area
                ),
            0
        )


    const selectedArea =
        selectedAreaId
            ? standingAreas.find(
                  (area) =>
                      area.id ===
                      selectedAreaId
              ) || null
            : null


    const setStandingAvailable = (
        areaId,
        value
    ) => {
        const area =
            standingAreas.find(
                (item) =>
                    item.id ===
                    areaId
            )


        if (!area) {
            return
        }


        const capacity =
            getAreaCapacity(
                area
            )


        const cleanValue =
            clamp(
                Number(
                    value
                ) || 0,
                0,
                capacity
            )


        setFormData(
            (current) => ({
                ...current,

                standingAvailability: {
                    ...current
                        .standingAvailability,

                    [areaId]:
                        cleanValue
                }
            })
        )
    }


    const adjustStandingAvailable = (
        areaId,
        amount
    ) => {
        const area =
            standingAreas.find(
                (item) =>
                    item.id ===
                    areaId
            )


        if (!area) {
            return
        }


        const current =
            getStandingAvailable(
                area
            )


        setStandingAvailable(
            areaId,
            current +
                amount
        )
    }


    /* =====================================================
       MESAS / VIP
    ===================================================== */

    const getSeatStatus = (
        seatId
    ) => {
        return normalizeSeatStatus(
            formData
                .seatStatus?.[
                    seatId
                ]
        )
    }


    const setSeatStatus = (
        seatId,
        status
    ) => {
        setFormData(
            (current) => ({
                ...current,

                seatStatus: {
                    ...current
                        .seatStatus,

                    [seatId]:
                        normalizeSeatStatus(
                            status
                        )
                }
            })
        )
    }


    const countAvailableSeats = (
        type
    ) => {
        return venueSeats
            .filter(
                (seat) =>
                    seat.type ===
                    type
            )
            .filter(
                (seat) =>
                    getSeatStatus(
                        seat.id
                    ) ===
                    "available"
            )
            .length
    }


    const availableTables =
        countAvailableSeats(
            "table"
        )


    const availableVip =
        countAvailableSeats(
            "vip"
        )


    const selectedSeat =
        selectedSeatId
            ? venueSeats.find(
                  (seat) =>
                      seat.id ===
                      selectedSeatId
              ) || null
            : null


    /* =====================================================
       DISPONIBILIDAD DE OFERTAS
    ===================================================== */

    const getOfferAvailability = (
        offerType
    ) => {
        const type =
            (
                offerType ||
                ""
            ).toLowerCase()


        if (
            type ===
            "general"
        ) {
            return availableGeneral
        }


        if (
            type ===
            "table"
        ) {
            return availableTables
        }


        if (
            type ===
            "vip"
        ) {
            return availableVip
        }


        return null
    }


    const getOfferTotal = (
        offerType
    ) => {
        const type =
            (
                offerType ||
                ""
            ).toLowerCase()


        if (
            type ===
            "general"
        ) {
            return totalStandingCapacity
        }


        if (
            type ===
            "table"
        ) {
            return tableSeats.length
        }


        if (
            type ===
            "vip"
        ) {
            return vipSeats.length
        }


        return 0
    }


    /* =====================================================
       CAMBIOS GENERALES
    ===================================================== */

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target


        setFormData(
            (current) => {
                const updated = {
                    ...current,

                    [name]:
                        type ===
                        "checkbox"
                            ? checked
                            : value
                }


                if (
                    name ===
                    "date"
                ) {
                    updated.dateLabel =
                        createDateLabel(
                            value
                        )
                }


                if (
                    name ===
                        "venueId" &&
                    value !==
                        current.venueId
                ) {
                    const newVenue =
                        venues.find(
                            (venue) =>
                                venue.firebaseId ===
                                value
                        )


                    const areas =
                        Array.isArray(
                            newVenue
                                ?.seatingMap
                                ?.standingAreas
                        )
                            ? newVenue
                                  .seatingMap
                                  .standingAreas
                            : []


                    updated.seatStatus =
                        {}


                    updated.standingAvailability =
                        createStandingAvailability(
                            areas
                        )


                    setSelectedSeatId(
                        null
                    )


                    setSelectedAreaId(
                        null
                    )
                }


                return updated
            }
        )
    }


    /* =====================================================
       OFERTAS
    ===================================================== */

    const handleOfferChange = (
        index,
        event
    ) => {
        const {
            name,
            value,
            type,
            checked
        } = event.target


        setFormData(
            (current) => {
                const offers = [
                    ...current.offers
                ]


                offers[index] = {
                    ...offers[index],

                    [name]:
                        type ===
                        "checkbox"
                            ? checked
                            : value
                }


                return {
                    ...current,
                    offers
                }
            }
        )
    }


    const addOffer = () => {
        setFormData(
            (current) => ({
                ...current,

                offers: [
                    ...current.offers,

                    {
                        type:
                            "general",

                        name: "",

                        description:
                            "",

                        price: "",

                        available:
                            0,

                        active:
                            true
                    }
                ]
            })
        )
    }


    const removeOffer = (
        index
    ) => {
        setFormData(
            (current) => ({
                ...current,

                offers:
                    current.offers.filter(
                        (
                            _,
                            offerIndex
                        ) =>
                            offerIndex !==
                            index
                    )
            })
        )
    }


    /* =====================================================
       GUARDAR
    ===================================================== */

    const handleSubmit =
        async (
            submitEvent
        ) => {
            submitEvent.preventDefault()


            if (!selectedVenue) {
                setMessage(
                    "Debes seleccionar un local."
                )

                return
            }


            if (
                !isEditing &&
                !imageFile
            ) {
                setMessage(
                    "Selecciona una imagen para el evento."
                )

                return
            }


            try {
                setSaving(
                    true
                )

                setMessage(
                    ""
                )


                const documentId =
                    isEditing
                        ? eventId
                        : createSlug(
                              formData.title
                          )


                if (!documentId) {
                    setMessage(
                        "No se pudo generar el ID del evento."
                    )

                    return
                }


                if (!isEditing) {
                    const eventRef =
                        doc(
                            db,
                            "specialEvents",
                            documentId
                        )


                    const existingEvent =
                        await getDoc(
                            eventRef
                        )


                    if (
                        existingEvent.exists()
                    ) {
                        setMessage(
                            `Ya existe un evento con el ID "${documentId}".`
                        )

                        return
                    }
                }


                const oldImageStoragePath =
                    formData.imageStoragePath


                const uploadedImage =
                    await uploadEventImage(
                        documentId
                    )


                if (
                    !uploadedImage.imageUrl
                ) {
                    setMessage(
                        "Selecciona una imagen para el evento."
                    )

                    return
                }


                const cleanOffers =
                    formData.offers
                        .filter(
                            (offer) =>
                                offer.name.trim()
                        )
                        .map(
                            (offer) => {
                                const offerType =
                                    (
                                        offer.type ||
                                        "general"
                                    )
                                        .trim()
                                        .toLowerCase()


                                const automatic =
                                    getOfferAvailability(
                                        offerType
                                    )


                                return {
                                    type:
                                        offerType,

                                    name:
                                        offer.name
                                            .trim(),

                                    description:
                                        offer.description
                                            .trim(),

                                    price:
                                        offer.price ===
                                        ""
                                            ? 0
                                            : Number(
                                                  offer.price
                                              ),

                                    available:
                                        automatic !==
                                        null
                                            ? automatic
                                            : Number(
                                                  offer.available
                                              ) || 0,

                                    active:
                                        offer.active
                                }
                            }
                        )


                const cleanSeatStatus =
                    {}


                venueSeats.forEach(
                    (seat) => {
                        cleanSeatStatus[
                            seat.id
                        ] =
                            getSeatStatus(
                                seat.id
                            )
                    }
                )


                const cleanStandingAvailability =
                    {}


                standingAreas.forEach(
                    (area) => {
                        cleanStandingAvailability[
                            area.id
                        ] =
                            getStandingAvailable(
                                area
                            )
                    }
                )


                const eventData = {
                    title:
                        formData.title
                            .trim(),

                    venueId:
                        selectedVenue
                            .firebaseId,

                    venue:
                        selectedVenue.name,

                    date:
                        formData.date,

                    dateLabel:
                        formData.dateLabel
                            .trim() ||
                        createDateLabel(
                            formData.date
                        ),

                    description:
                        formData.description
                            .trim(),

                    imageUrl:
                        uploadedImage.imageUrl,

                    imageStoragePath:
                        uploadedImage.imageStoragePath ||
                        "",

                    active:
                        formData.active,

                    offers:
                        cleanOffers,

                    seatStatus:
                        cleanSeatStatus,

                    standingAvailability:
                        cleanStandingAvailability,

                    inventoryCapacity: {
                        general:
                            totalStandingCapacity,

                        table:
                            tableSeats.length,

                        vip:
                            vipSeats.length
                    }
                }


                if (isEditing) {

                    await updateDoc(
                        doc(
                            db,
                            "specialEvents",
                            eventId
                        ),
                        eventData
                    )

                } else {

                    await setDoc(
                        doc(
                            db,
                            "specialEvents",
                            documentId
                        ),
                        eventData
                    )
                }


                if (
                    imageFile &&
                    oldImageStoragePath &&
                    oldImageStoragePath !==
                        uploadedImage.imageStoragePath
                ) {
                    await deleteOldEventImage(
                        oldImageStoragePath
                    )
                }


                navigate(
                    "/admin/eventos"
                )

            } catch (error) {
                console.error(
                    "Error al guardar evento:",
                    error
                )


                setMessage(
                    "No se pudo guardar el evento."
                )

            } finally {
                setSaving(
                    false
                )
            }
        }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <main className="admin-page">

                <p className="admin-empty">
                    Cargando...
                </p>

            </main>
        )
    }


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <main className="admin-page">

            <Link
                to="/admin/eventos"
                className="admin-back-link"
            >
                ← Volver a Eventos
            </Link>


            <section className="admin-header">

                <span className="admin-kicker">
                    EVENTO
                </span>

                <h1>
                    {isEditing
                        ? "Editar evento"
                        : "Crear evento"}
                </h1>

                <p>
                    Configura el evento,
                    sus ofertas y la
                    disponibilidad del local.
                </p>

            </section>


            {venues.length ===
                0 && (

                <div className="admin-message">

                    Primero debes crear
                    un local.

                    <br />
                    <br />

                    <Link
                        to="/admin/locales/nuevo"
                        className="admin-back-link"
                    >
                        + Crear local
                    </Link>

                </div>

            )}


            <form
                className="admin-form admin-event-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label>
                    Nombre del evento

                    <input
                        type="text"
                        name="title"
                        value={
                            formData.title
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />
                </label>


                <label>
                    Local

                    <select
                        name="venueId"
                        value={
                            formData.venueId
                        }
                        onChange={
                            handleChange
                        }
                        required
                    >

                        <option value="">
                            Selecciona un local
                        </option>


                        {venues.map(
                            (venue) => (

                                <option
                                    key={
                                        venue.firebaseId
                                    }
                                    value={
                                        venue.firebaseId
                                    }
                                >
                                    {
                                        venue.name
                                    }
                                </option>

                            )
                        )}

                    </select>

                </label>


                <label>
                    Descripción

                    <textarea
                        name="description"
                        value={
                            formData.description
                        }
                        onChange={
                            handleChange
                        }
                        rows="5"
                        required
                    />

                </label>


                <label>
                    Fecha

                    <input
                        type="date"
                        name="date"
                        value={
                            formData.date
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </label>


                <label>
                    Texto de fecha

                    <input
                        type="text"
                        name="dateLabel"
                        value={
                            formData.dateLabel
                        }
                        onChange={
                            handleChange
                        }
                        required
                    />

                </label>


                <label className="admin-full-field">

                    Imagen del evento

                    <input
                        type="file"
                        accept="image/*"
                        onChange={
                            handleImageChange
                        }
                    />

                </label>


                {imagePreview && (

                    <div className="admin-upload-preview">

                        <p>
                            Vista previa
                        </p>

                        <img
                            src={
                                imagePreview
                            }
                            alt="Vista previa del evento"
                        />

                    </div>

                )}


                <label className="admin-checkbox-label">

                    <input
                        type="checkbox"
                        name="active"
                        checked={
                            formData.active
                        }
                        onChange={
                            handleChange
                        }
                    />

                    Evento activo

                </label>


                <section className="admin-offers-editor">

                    <div className="admin-offers-header">

                        <div>

                            <span className="admin-kicker">
                                OFERTAS
                            </span>

                            <h2>
                                Entradas y opciones
                            </h2>

                        </div>


                        <button
                            type="button"
                            className="admin-add-button"
                            onClick={
                                addOffer
                            }
                        >
                            + Agregar oferta
                        </button>

                    </div>


                    {formData.offers.map(
                        (
                            offer,
                            index
                        ) => {

                            const available =
                                getOfferAvailability(
                                    offer.type
                                )


                            const total =
                                getOfferTotal(
                                    offer.type
                                )


                            return (
                                <article
                                    key={
                                        index
                                    }
                                    className="admin-offer-editor"
                                >

                                    <div className="admin-offer-title">

                                        <strong>
                                            Oferta{" "}
                                            {index + 1}
                                        </strong>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeOffer(
                                                    index
                                                )
                                            }
                                        >
                                            Eliminar
                                        </button>

                                    </div>


                                    <div className="admin-offer-grid">

                                        <label>
                                            Tipo

                                            <select
                                                name="type"
                                                value={
                                                    offer.type
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                            >

                                                <option value="general">
                                                    General
                                                </option>

                                                <option value="table">
                                                    Mesa
                                                </option>

                                                <option value="vip">
                                                    VIP
                                                </option>

                                            </select>

                                        </label>


                                        <label>
                                            Nombre

                                            <input
                                                type="text"
                                                name="name"
                                                value={
                                                    offer.name
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                required
                                            />

                                        </label>


                                        <label>
                                            Precio

                                            <input
                                                type="number"
                                                name="price"
                                                value={
                                                    offer.price
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                min="0"
                                                step="0.01"
                                            />

                                        </label>


                                        <label>
                                            Disponibles

                                            <div className="admin-auto-availability">

                                                <strong>
                                                    {
                                                        available ??
                                                        0
                                                    }
                                                    /
                                                    {
                                                        total
                                                    }
                                                </strong>

                                                <span>
                                                    desde el inventario del evento
                                                </span>

                                            </div>

                                        </label>


                                        <label className="admin-offer-description">

                                            Descripción

                                            <textarea
                                                name="description"
                                                value={
                                                    offer.description
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                                rows="3"
                                            />

                                        </label>


                                        <label className="admin-checkbox-label">

                                            <input
                                                type="checkbox"
                                                name="active"
                                                checked={
                                                    offer.active
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleOfferChange(
                                                        index,
                                                        event
                                                    )
                                                }
                                            />

                                            Oferta activa

                                        </label>

                                    </div>

                                </article>
                            )
                        }
                    )}

                </section>


                <section className="admin-event-layout-section">

                    <div className="admin-event-layout-heading">

                        <div>

                            <span className="admin-kicker">
                                INVENTARIO
                            </span>

                            <h2>
                                Disponibilidad del evento
                            </h2>

                            <p>
                                El local define la capacidad inicial.
                                Aquí controlas lo que todavía está disponible
                                para este evento.
                            </p>

                        </div>


                        {selectedVenue && (

                            <Link
                                to={`/admin/locales/${selectedVenue.firebaseId}/editar`}
                                className="admin-event-edit-venue"
                            >
                                Editar local
                            </Link>

                        )}

                    </div>


                    {!selectedVenue ? (

                        <div className="admin-event-layout-empty">
                            Selecciona un local.
                        </div>

                    ) : !seatingMap ? (

                        <div className="admin-event-layout-empty">
                            Este local no tiene plano.
                        </div>

                    ) : (

                        <>

                            <div className="admin-event-capacity-summary">

                                <article>

                                    <span>
                                        👥
                                    </span>

                                    <div>

                                        <strong>
                                            {
                                                availableGeneral
                                            }
                                            /
                                            {
                                                totalStandingCapacity
                                            }
                                        </strong>

                                        <small>
                                            general disponible
                                        </small>

                                    </div>

                                </article>


                                <article>

                                    <span>
                                        🪑
                                    </span>

                                    <div>

                                        <strong>
                                            {
                                                availableTables
                                            }
                                            /
                                            {
                                                tableSeats.length
                                            }
                                        </strong>

                                        <small>
                                            mesas disponibles
                                        </small>

                                    </div>

                                </article>


                                <article>

                                    <span>
                                        ⭐
                                    </span>

                                    <div>

                                        <strong>
                                            {
                                                availableVip
                                            }
                                            /
                                            {
                                                vipSeats.length
                                            }
                                        </strong>

                                        <small>
                                            VIP disponibles
                                        </small>

                                    </div>

                                </article>

                            </div>


                            <div className="admin-event-status-legend">

                                <span>
                                    <i className="available" />
                                    Disponible
                                </span>

                                <span>
                                    <i className="reserved" />
                                    Reservada
                                </span>

                                <span>
                                    <i className="blocked" />
                                    Bloqueada
                                </span>

                            </div>


                            <div className="admin-floor-plan admin-event-floor-plan">

                                <svg
                                    className="admin-standing-layer"
                                    viewBox="0 0 100 100"
                                    preserveAspectRatio="none"
                                >

                                    {standingAreas.map(
                                        (
                                            area
                                        ) => {

                                            const points =
                                                area.points
                                                    ?.map(
                                                        (
                                                            point
                                                        ) =>
                                                            `${point.x},${point.y}`
                                                    )
                                                    .join(
                                                        " "
                                                    ) ||
                                                ""


                                            const isSelected =
                                                selectedAreaId ===
                                                area.id


                                            return (
                                                <polygon
                                                    key={
                                                        area.id
                                                    }
                                                    points={
                                                        points
                                                    }
                                                    className={[
                                                        "admin-standing-polygon",
                                                        "admin-event-standing-polygon",

                                                        isSelected
                                                            ? "selected"
                                                            : ""
                                                    ].join(
                                                        " "
                                                    )}
                                                    onClick={() => {
                                                        setSelectedAreaId(
                                                            area.id
                                                        )

                                                        setSelectedSeatId(
                                                            null
                                                        )
                                                    }}
                                                />
                                            )
                                        }
                                    )}

                                </svg>


                                {standingAreas.map(
                                    (
                                        area
                                    ) => {

                                        const center =
                                            getStandingAreaCenter(
                                                area.points
                                            )


                                        return (
                                            <button
                                                type="button"
                                                key={`${area.id}-label`}
                                                className={[
                                                    "admin-standing-label",
                                                    "admin-event-standing-label",

                                                    selectedAreaId ===
                                                    area.id
                                                        ? "selected"
                                                        : ""
                                                ].join(
                                                    " "
                                                )}
                                                style={{
                                                    left:
                                                        `${center.x}%`,

                                                    top:
                                                        `${center.y}%`
                                                }}
                                                onClick={() => {
                                                    setSelectedAreaId(
                                                        area.id
                                                    )

                                                    setSelectedSeatId(
                                                        null
                                                    )
                                                }}
                                            >

                                                <strong>
                                                    {
                                                        area.label
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        getStandingAvailable(
                                                            area
                                                        )
                                                    }
                                                    /
                                                    {
                                                        getAreaCapacity(
                                                            area
                                                        )
                                                    }
                                                </small>

                                            </button>
                                        )
                                    }
                                )}


                                {seatingMap.stage && (

                                    <div
                                        className="admin-floor-stage admin-event-static-object"
                                        style={{
                                            left:
                                                `${seatingMap.stage.x ?? 50}%`,

                                            top:
                                                `${seatingMap.stage.y ?? 8}%`,

                                            width:
                                                `${seatingMap.stage.width ?? 76}%`,

                                            height:
                                                `${seatingMap.stage.height ?? 10}%`,

                                            transform:
                                                `translate(-50%, -50%) rotate(${seatingMap.stage.rotation ?? 0}deg)`
                                        }}
                                    >
                                        🎤{" "}
                                        {
                                            seatingMap.stage.label ||
                                            "ESCENARIO"
                                        }
                                    </div>

                                )}


                                {seatingMap.markers
                                    ?.map(
                                        (
                                            marker
                                        ) => (

                                            <div
                                                key={
                                                    marker.id
                                                }
                                                className="admin-floor-marker admin-event-static-object"
                                                style={{
                                                    left:
                                                        `${marker.x ?? 50}%`,

                                                    top:
                                                        `${marker.y ?? 50}%`,

                                                    width:
                                                        `${marker.width ?? 13}%`,

                                                    height:
                                                        `${marker.height ?? 8}%`,

                                                    transform:
                                                        `translate(-50%, -50%) rotate(${marker.rotation ?? 0}deg)`
                                                }}
                                            >

                                                <span>
                                                    {marker.id ===
                                                    "bar"
                                                        ? "🍹"
                                                        : marker.id ===
                                                            "entrance"
                                                          ? "🚪"
                                                          : "📍"}
                                                </span>

                                                {
                                                    marker.label
                                                }

                                            </div>

                                        )
                                    )}


                                {venueSeats.map(
                                    (
                                        seat
                                    ) => {

                                        const status =
                                            getSeatStatus(
                                                seat.id
                                            )


                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    seat.id
                                                }
                                                className={[
                                                    "admin-floor-seat",
                                                    "admin-event-seat",

                                                    seat.type ===
                                                    "vip"
                                                        ? "vip"
                                                        : "table",

                                                    status,

                                                    selectedSeatId ===
                                                    seat.id
                                                        ? "selected"
                                                        : ""
                                                ].join(
                                                    " "
                                                )}
                                                style={{
                                                    left:
                                                        `${seat.x ?? 50}%`,

                                                    top:
                                                        `${seat.y ?? 50}%`,

                                                    width:
                                                        `${seat.width ?? 9}%`,

                                                    height:
                                                        `${seat.height ?? 10}%`,

                                                    transform:
                                                        `translate(-50%, -50%) rotate(${seat.rotation ?? 0}deg)`
                                                }}
                                                onClick={() => {
                                                    setSelectedSeatId(
                                                        seat.id
                                                    )

                                                    setSelectedAreaId(
                                                        null
                                                    )
                                                }}
                                            >

                                                <span className="admin-floor-seat-name">
                                                    {
                                                        seat.label ||
                                                        seat.id
                                                    }
                                                </span>

                                                <small>
                                                    {
                                                        seat.capacity ||
                                                        1
                                                    }
                                                    p
                                                </small>

                                            </button>
                                        )
                                    }
                                )}

                            </div>


                            {selectedArea && (

                                <div className="admin-event-selected-general">

                                    <div className="admin-event-selected-seat-title">

                                        <div>

                                            <span>
                                                👥
                                            </span>

                                            <div>

                                                <small>
                                                    GENERAL
                                                </small>

                                                <h3>
                                                    {
                                                        selectedArea.label
                                                    }
                                                </h3>

                                            </div>

                                        </div>


                                        <strong>
                                            Capacidad:{" "}
                                            {
                                                getAreaCapacity(
                                                    selectedArea
                                                )
                                            }{" "}
                                            personas
                                        </strong>

                                    </div>


                                    <div className="admin-general-availability-editor">

                                        <span>
                                            Entradas disponibles
                                        </span>


                                        <div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    adjustStandingAvailable(
                                                        selectedArea.id,
                                                        -1
                                                    )
                                                }
                                            >
                                                −
                                            </button>


                                            <input
                                                type="number"
                                                min="0"
                                                max={
                                                    getAreaCapacity(
                                                        selectedArea
                                                    )
                                                }
                                                value={
                                                    getStandingAvailable(
                                                        selectedArea
                                                    )
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setStandingAvailable(
                                                        selectedArea.id,
                                                        event.target.value
                                                    )
                                                }
                                            />


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    adjustStandingAvailable(
                                                        selectedArea.id,
                                                        1
                                                    )
                                                }
                                            >
                                                +
                                            </button>

                                        </div>


                                        <small>
                                            Si vendes entradas fuera de la web,
                                            reduce aquí la disponibilidad.
                                        </small>

                                    </div>

                                </div>

                            )}


                            {selectedSeat && (

                                <div className="admin-event-selected-seat">

                                    <div className="admin-event-selected-seat-title">

                                        <div>

                                            <span>
                                                {selectedSeat.type ===
                                                "vip"
                                                    ? "⭐"
                                                    : "🪑"}
                                            </span>

                                            <div>

                                                <small>
                                                    {selectedSeat.type ===
                                                    "vip"
                                                        ? "VIP"
                                                        : "MESA"}
                                                </small>

                                                <h3>
                                                    {
                                                        selectedSeat.label ||
                                                        selectedSeat.id
                                                    }
                                                </h3>

                                            </div>

                                        </div>


                                        <strong>
                                            Capacidad:{" "}
                                            {
                                                selectedSeat.capacity ||
                                                1
                                            }{" "}
                                            personas
                                        </strong>

                                    </div>


                                    <div className="admin-event-seat-statuses">

                                        <button
                                            type="button"
                                            className={
                                                getSeatStatus(
                                                    selectedSeat.id
                                                ) ===
                                                "available"
                                                    ? "active available"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSeatStatus(
                                                    selectedSeat.id,
                                                    "available"
                                                )
                                            }
                                        >
                                            Disponible
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                getSeatStatus(
                                                    selectedSeat.id
                                                ) ===
                                                "reserved"
                                                    ? "active reserved"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSeatStatus(
                                                    selectedSeat.id,
                                                    "reserved"
                                                )
                                            }
                                        >
                                            Reservada
                                        </button>


                                        <button
                                            type="button"
                                            className={
                                                getSeatStatus(
                                                    selectedSeat.id
                                                ) ===
                                                "blocked"
                                                    ? "active blocked"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSeatStatus(
                                                    selectedSeat.id,
                                                    "blocked"
                                                )
                                            }
                                        >
                                            Bloqueada
                                        </button>

                                    </div>

                                </div>

                            )}

                        </>
                    )}

                </section>


                <div className="admin-form-actions">

                    <button
                        type="submit"
                        className="admin-save-button"
                        disabled={
                            saving ||
                            venues.length ===
                                0
                        }
                    >
                        {saving
                            ? imageFile
                                ? "Subiendo imagen..."
                                : "Guardando..."
                            : isEditing
                              ? "Guardar cambios"
                              : "Crear evento"}
                    </button>

                </div>


                {message && (

                    <p className="admin-message">
                        {message}
                    </p>

                )}

            </form>

        </main>
    )
}


export default AdminEventForm