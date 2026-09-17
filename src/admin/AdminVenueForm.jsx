import {
    useEffect,
    useRef,
    useState
} from "react"

import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "firebase/firestore"

import {
    Link,
    useNavigate,
    useParams
} from "react-router-dom"

import {
    db
} from "../firebase/firebase"

import "./Admin.css"


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


const getAreaCenter = (
    points = []
) => {
    if (!points.length) {
        return {
            x: 50,
            y: 50
        }
    }

    const total =
        points.reduce(
            (result, point) => ({
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
            total.x /
            points.length,

        y:
            total.y /
            points.length
    }
}


/* =====================================================
   MAPA DEFAULT
===================================================== */

const createDefaultSeatingMap = () => ({
    enabled: true,

    stage: {
        label: "ESCENARIO",
        x: 50,
        y: 8,
        width: 76,
        height: 10,
        rotation: 0
    },

    markers: [
        {
            id: "bar",
            label: "BAR",
            x: 12,
            y: 91,
            width: 13,
            height: 8,
            rotation: 0
        },

        {
            id: "entrance",
            label: "ENTRADA",
            x: 87,
            y: 91,
            width: 14,
            height: 8,
            rotation: 0
        }
    ],

    seats: [
        {
            id: "M1",
            label: "M1",
            type: "table",
            x: 18,
            y: 31,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M2",
            label: "M2",
            type: "table",
            x: 39,
            y: 31,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M3",
            label: "M3",
            type: "table",
            x: 61,
            y: 31,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M4",
            label: "M4",
            type: "table",
            x: 82,
            y: 31,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M5",
            label: "M5",
            type: "table",
            x: 18,
            y: 52,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M6",
            label: "M6",
            type: "table",
            x: 39,
            y: 52,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M7",
            label: "M7",
            type: "table",
            x: 61,
            y: 52,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "M8",
            label: "M8",
            type: "table",
            x: 82,
            y: 52,
            width: 9,
            height: 10,
            rotation: 0,
            capacity: 4
        },

        {
            id: "V1",
            label: "V1",
            type: "vip",
            x: 28,
            y: 73,
            width: 11,
            height: 10,
            rotation: 0,
            capacity: 6
        },

        {
            id: "V2",
            label: "V2",
            type: "vip",
            x: 50,
            y: 73,
            width: 11,
            height: 10,
            rotation: 0,
            capacity: 6
        },

        {
            id: "V3",
            label: "V3",
            type: "vip",
            x: 72,
            y: 73,
            width: 11,
            height: 10,
            rotation: 0,
            capacity: 6
        }
    ],

    standingAreas: []
})


/* =====================================================
   NORMALIZAR MAPA
===================================================== */

const normalizeMap = (
    map
) => {
    const fallback =
        createDefaultSeatingMap()

    if (!map) {
        return fallback
    }


    return {
        enabled:
            map.enabled !==
            false,

        stage: {
            ...fallback.stage,
            ...(map.stage || {}),

            width:
                Number(
                    map.stage
                        ?.width
                ) ||
                fallback.stage.width,

            height:
                Number(
                    map.stage
                        ?.height
                ) ||
                fallback.stage.height,

            rotation:
                Number(
                    map.stage
                        ?.rotation
                ) || 0
        },

        markers:
            Array.isArray(
                map.markers
            )
                ? map.markers.map(
                      (
                          marker
                      ) => ({
                          ...marker,

                          width:
                              Number(
                                  marker.width
                              ) || 13,

                          height:
                              Number(
                                  marker.height
                              ) || 8,

                          rotation:
                              Number(
                                  marker.rotation
                              ) || 0
                      })
                  )
                : fallback.markers,

        seats:
            Array.isArray(
                map.seats
            )
                ? map.seats.map(
                      (
                          seat
                      ) => ({
                          id:
                              seat.id ||
                              "",

                          label:
                              seat.label ||
                              seat.id ||
                              "",

                          type:
                              seat.type ===
                              "vip"
                                  ? "vip"
                                  : "table",

                          x:
                              Number(
                                  seat.x
                              ) || 0,

                          y:
                              Number(
                                  seat.y
                              ) || 0,

                          width:
                              Number(
                                  seat.width
                              ) ||
                              (
                                  seat.type ===
                                  "vip"
                                      ? 11
                                      : 9
                              ),

                          height:
                              Number(
                                  seat.height
                              ) || 10,

                          rotation:
                              Number(
                                  seat.rotation
                              ) || 0,

                          capacity:
                              Number(
                                  seat.capacity
                              ) || 1
                      })
                  )
                : fallback.seats,

        standingAreas:
            Array.isArray(
                map.standingAreas
            )
                ? map.standingAreas.map(
                      (
                          area,
                          areaIndex
                      ) => ({
                          id:
                              area.id ||
                              `standing-${areaIndex + 1}`,

                          label:
                              area.label ||
                              "Área General",

                          capacity:
                              Number(
                                  area.capacity
                              ) || 1,

                          points:
                              Array.isArray(
                                  area.points
                              )
                                  ? area.points.map(
                                        (
                                            point
                                        ) => ({
                                            x:
                                                Number(
                                                    point.x
                                                ) || 0,

                                            y:
                                                Number(
                                                    point.y
                                                ) || 0
                                        })
                                    )
                                  : []
                      })
                  )
                : []
    }
}


/* =====================================================
   COMPONENTE
===================================================== */

function AdminVenueForm() {
    const {
        venueId
    } = useParams()

    const navigate =
        useNavigate()

    const isEditing =
        Boolean(
            venueId
        )

    const previewRef =
        useRef(null)

    const dragRef =
        useRef(null)


    const [
        formData,
        setFormData
    ] = useState({
        name: "",
        active: true,

        seatingMap:
            createDefaultSeatingMap()
    })


    const [
        selected,
        setSelected
    ] = useState(null)


    const [
        loading,
        setLoading
    ] = useState(
        isEditing
    )


    const [
        saving,
        setSaving
    ] = useState(false)


    const [
        message,
        setMessage
    ] = useState("")


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
       CARGAR LOCAL
    ===================================================== */

    useEffect(() => {
        if (!venueId) {
            return
        }


        async function loadVenue() {
            try {
                const snapshot =
                    await getDoc(
                        doc(
                            db,
                            "venues",
                            venueId
                        )
                    )


                if (
                    !snapshot.exists()
                ) {
                    setMessage(
                        "Local no encontrado."
                    )

                    return
                }


                const data =
                    snapshot.data()


                setFormData({
                    name:
                        data.name ||
                        "",

                    active:
                        data.active !==
                        false,

                    seatingMap:
                        normalizeMap(
                            data.seatingMap
                        )
                })

            } catch (error) {
                console.error(
                    "Error al cargar local:",
                    error
                )

                setMessage(
                    "No se pudo cargar el local."
                )

            } finally {
                setLoading(false)
            }
        }


        loadVenue()

    }, [
        venueId
    ])


    /* =====================================================
       DATOS GENERALES
    ===================================================== */

    const handleNameChange = (
        event
    ) => {
        setFormData(
            (current) => ({
                ...current,

                name:
                    event.target.value
            })
        )
    }


    const handleActiveChange = (
        event
    ) => {
        setFormData(
            (current) => ({
                ...current,

                active:
                    event.target.checked
            })
        )
    }


    const handleMapEnabled = (
        event
    ) => {
        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    enabled:
                        event.target
                            .checked
                }
            })
        )
    }


    /* =====================================================
       POSICIÓN DEL POINTER
    ===================================================== */

    const getPointerPosition = (
        event
    ) => {
        const preview =
            previewRef.current

        if (!preview) {
            return null
        }


        const rect =
            preview
                .getBoundingClientRect()


        return {
            x:
                (
                    (
                        event.clientX -
                        rect.left
                    ) /
                    rect.width
                ) *
                100,

            y:
                (
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) *
                100
        }
    }


    /* =====================================================
       INICIAR DRAG
    ===================================================== */

    const startDrag = (
        event,
        kind,
        index = null,
        pointIndex = null
    ) => {
        event.preventDefault()
        event.stopPropagation()


        event.currentTarget
            .setPointerCapture?.(
                event.pointerId
            )


        dragRef.current = {
            kind,
            index,
            pointIndex
        }


        if (
            kind ===
            "areaPoint"
        ) {
            setSelected({
                kind:
                    "area",

                index
            })
        } else {
            setSelected({
                kind,
                index
            })
        }
    }


    /* =====================================================
       ACTUALIZAR POSICIÓN
    ===================================================== */

    const updatePosition = (
        kind,
        index,
        rawX,
        rawY
    ) => {
        setFormData(
            (current) => {
                const map = {
                    ...current
                        .seatingMap
                }


                if (
                    kind ===
                    "stage"
                ) {
                    const width =
                        Number(
                            map.stage
                                .width
                        ) || 20

                    const height =
                        Number(
                            map.stage
                                .height
                        ) || 8


                    map.stage = {
                        ...map.stage,

                        x:
                            clamp(
                                rawX,
                                width / 2,
                                100 -
                                    width / 2
                            ),

                        y:
                            clamp(
                                rawY,
                                height / 2,
                                100 -
                                    height / 2
                            )
                    }
                }


                if (
                    kind ===
                    "marker"
                ) {
                    const markers = [
                        ...map.markers
                    ]

                    const marker = {
                        ...markers[
                            index
                        ]
                    }

                    const width =
                        Number(
                            marker.width
                        ) || 10

                    const height =
                        Number(
                            marker.height
                        ) || 8


                    marker.x =
                        clamp(
                            rawX,
                            width / 2,
                            100 -
                                width / 2
                        )

                    marker.y =
                        clamp(
                            rawY,
                            height / 2,
                            100 -
                                height / 2
                        )


                    markers[index] =
                        marker

                    map.markers =
                        markers
                }


                if (
                    kind ===
                    "seat"
                ) {
                    const seats = [
                        ...map.seats
                    ]

                    const seat = {
                        ...seats[
                            index
                        ]
                    }

                    const width =
                        Number(
                            seat.width
                        ) || 8

                    const height =
                        Number(
                            seat.height
                        ) || 8


                    seat.x =
                        clamp(
                            rawX,
                            width / 2,
                            100 -
                                width / 2
                        )

                    seat.y =
                        clamp(
                            rawY,
                            height / 2,
                            100 -
                                height / 2
                        )


                    seats[index] =
                        seat

                    map.seats =
                        seats
                }


                return {
                    ...current,

                    seatingMap:
                        map
                }
            }
        )
    }


    /* =====================================================
       VÉRTICE ÁREA DE PIE
    ===================================================== */

    const updateStandingPoint = (
        areaIndex,
        pointIndex,
        rawX,
        rawY
    ) => {
        setFormData(
            (current) => {
                const areas = [
                    ...current
                        .seatingMap
                        .standingAreas
                ]


                const area = {
                    ...areas[
                        areaIndex
                    ]
                }


                const points =
                    area.points.map(
                        (
                            point,
                            index
                        ) => (
                            index ===
                            pointIndex
                                ? {
                                      x:
                                          clamp(
                                              rawX,
                                              1,
                                              99
                                          ),

                                      y:
                                          clamp(
                                              rawY,
                                              1,
                                              99
                                          )
                                  }
                                : point
                        )
                    )


                area.points =
                    points

                areas[areaIndex] =
                    area


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        standingAreas:
                            areas
                    }
                }
            }
        )
    }


    /* =====================================================
       MOVER POINTER
    ===================================================== */

    const handlePointerMove = (
        event
    ) => {
        const drag =
            dragRef.current

        if (!drag) {
            return
        }


        const position =
            getPointerPosition(
                event
            )


        if (!position) {
            return
        }


        if (
            drag.kind ===
            "areaPoint"
        ) {
            updateStandingPoint(
                drag.index,
                drag.pointIndex,
                position.x,
                position.y
            )

            return
        }


        updatePosition(
            drag.kind,
            drag.index,
            position.x,
            position.y
        )
    }


    const stopDrag = () => {
        dragRef.current =
            null
    }


    /* =====================================================
       ESCENARIO
    ===================================================== */

    const updateStageField = (
        field,
        value
    ) => {
        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    stage: {
                        ...current
                            .seatingMap
                            .stage,

                        [field]:
                            field ===
                            "label"
                                ? value
                                : Number(
                                      value
                                  )
                    }
                }
            })
        )
    }


    /* =====================================================
       MARCADORES
    ===================================================== */

    const updateMarkerField = (
        index,
        field,
        value
    ) => {
        setFormData(
            (current) => {
                const markers = [
                    ...current
                        .seatingMap
                        .markers
                ]


                markers[index] = {
                    ...markers[index],

                    [field]:
                        field ===
                        "label"
                            ? value
                            : Number(
                                  value
                              )
                }


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        markers
                    }
                }
            }
        )
    }


    /* =====================================================
       MESAS
    ===================================================== */

    const updateSeatField = (
        index,
        field,
        value
    ) => {
        setFormData(
            (current) => {
                const seats = [
                    ...current
                        .seatingMap
                        .seats
                ]

                const oldSeat = {
                    ...seats[
                        index
                    ]
                }


                const numeric =
                    [
                        "capacity",
                        "width",
                        "height",
                        "rotation"
                    ].includes(
                        field
                    )


                oldSeat[field] =
                    numeric
                        ? Number(
                              value
                          )
                        : value


                if (
                    field === "id" &&
                    (
                        !oldSeat.label ||
                        oldSeat.label ===
                            seats[index]
                                .id
                    )
                ) {
                    oldSeat.label =
                        value
                }


                seats[index] =
                    oldSeat


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        seats
                    }
                }
            }
        )
    }


    /* =====================================================
       SIGUIENTE ID MESA
    ===================================================== */

    const getNextSeatId = (
        type
    ) => {
        const prefix =
            type === "vip"
                ? "V"
                : "M"


        const numbers =
            formData
                .seatingMap
                .seats
                .filter(
                    (seat) =>
                        seat.type ===
                        type
                )
                .map(
                    (seat) =>
                        Number(
                            String(
                                seat.id ||
                                ""
                            ).replace(
                                /\D/g,
                                ""
                            )
                        )
                )
                .filter(
                    Number.isFinite
                )


        return `${prefix}${
            numbers.length
                ? Math.max(
                      ...numbers
                  ) + 1
                : 1
        }`
    }


    /* =====================================================
       AÑADIR MESA
    ===================================================== */

    const addSeat = (
        type
    ) => {
        const id =
            getNextSeatId(
                type
            )

        const index =
            formData
                .seatingMap
                .seats
                .length


        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    seats: [
                        ...current
                            .seatingMap
                            .seats,

                        {
                            id,
                            label: id,
                            type,

                            x: 50,

                            y:
                                type ===
                                "vip"
                                    ? 72
                                    : 50,

                            width:
                                type ===
                                "vip"
                                    ? 11
                                    : 9,

                            height: 10,

                            rotation: 0,

                            capacity:
                                type ===
                                "vip"
                                    ? 6
                                    : 4
                        }
                    ]
                }
            })
        )


        setSelected({
            kind:
                "seat",

            index
        })
    }


    /* =====================================================
       ELIMINAR MESA
    ===================================================== */

    const removeSeat = (
        index
    ) => {
        const seat =
            formData
                .seatingMap
                .seats[
                    index
                ]


        if (
            !window.confirm(
                `¿Eliminar ${seat?.label || "esta ubicación"}?`
            )
        ) {
            return
        }


        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    seats:
                        current
                            .seatingMap
                            .seats
                            .filter(
                                (
                                    _,
                                    seatIndex
                                ) =>
                                    seatIndex !==
                                    index
                            )
                }
            })
        )


        setSelected(
            null
        )
    }


    /* =====================================================
       ÁREA DE PIE
    ===================================================== */

    const addStandingArea = () => {
        const number =
            formData
                .seatingMap
                .standingAreas
                .length + 1


        const index =
            formData
                .seatingMap
                .standingAreas
                .length


        const newArea = {
            id:
                `general-${number}`,

            label:
                number === 1
                    ? "Área General"
                    : `Área General ${number}`,

            capacity: 80,

            points: [
                {
                    x: 30,
                    y: 39
                },

                {
                    x: 50,
                    y: 34
                },

                {
                    x: 70,
                    y: 39
                },

                {
                    x: 74,
                    y: 55
                },

                {
                    x: 50,
                    y: 62
                },

                {
                    x: 26,
                    y: 55
                }
            ]
        }


        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    standingAreas: [
                        ...current
                            .seatingMap
                            .standingAreas,

                        newArea
                    ]
                }
            })
        )


        setSelected({
            kind:
                "area",

            index
        })
    }


    const updateStandingAreaField = (
        index,
        field,
        value
    ) => {
        setFormData(
            (current) => {
                const areas = [
                    ...current
                        .seatingMap
                        .standingAreas
                ]


                areas[index] = {
                    ...areas[index],

                    [field]:
                        field ===
                        "capacity"
                            ? Math.max(
                                  1,
                                  Number(
                                      value
                                  ) || 1
                              )
                            : value
                }


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        standingAreas:
                            areas
                    }
                }
            }
        )
    }


    /* =====================================================
       AÑADIR VÉRTICE
    ===================================================== */

    const addAreaVertex = (
        areaIndex
    ) => {
        setFormData(
            (current) => {
                const areas = [
                    ...current
                        .seatingMap
                        .standingAreas
                ]


                const area = {
                    ...areas[
                        areaIndex
                    ]
                }


                const points = [
                    ...area.points
                ]


                if (
                    points.length >=
                    10
                ) {
                    return current
                }


                let longestIndex =
                    0

                let longestDistance =
                    -1


                points.forEach(
                    (
                        point,
                        index
                    ) => {
                        const next =
                            points[
                                (
                                    index +
                                    1
                                ) %
                                points.length
                            ]


                        const dx =
                            next.x -
                            point.x

                        const dy =
                            next.y -
                            point.y

                        const distance =
                            dx * dx +
                            dy * dy


                        if (
                            distance >
                            longestDistance
                        ) {
                            longestDistance =
                                distance

                            longestIndex =
                                index
                        }
                    }
                )


                const currentPoint =
                    points[
                        longestIndex
                    ]

                const nextPoint =
                    points[
                        (
                            longestIndex +
                            1
                        ) %
                        points.length
                    ]


                const midpoint = {
                    x:
                        (
                            currentPoint.x +
                            nextPoint.x
                        ) /
                        2,

                    y:
                        (
                            currentPoint.y +
                            nextPoint.y
                        ) /
                        2
                }


                points.splice(
                    longestIndex + 1,
                    0,
                    midpoint
                )


                area.points =
                    points

                areas[areaIndex] =
                    area


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        standingAreas:
                            areas
                    }
                }
            }
        )
    }


    /* =====================================================
       QUITAR VÉRTICE
    ===================================================== */

    const removeAreaVertex = (
        areaIndex
    ) => {
        setFormData(
            (current) => {
                const areas = [
                    ...current
                        .seatingMap
                        .standingAreas
                ]


                const area = {
                    ...areas[
                        areaIndex
                    ]
                }


                if (
                    area.points.length <=
                    3
                ) {
                    return current
                }


                area.points =
                    area.points.slice(
                        0,
                        -1
                    )


                areas[areaIndex] =
                    area


                return {
                    ...current,

                    seatingMap: {
                        ...current
                            .seatingMap,

                        standingAreas:
                            areas
                    }
                }
            }
        )
    }


    /* =====================================================
       ELIMINAR ÁREA
    ===================================================== */

    const removeStandingArea = (
        index
    ) => {
        const area =
            formData
                .seatingMap
                .standingAreas[
                    index
                ]


        if (
            !window.confirm(
                `¿Eliminar "${area?.label || "Área de pie"}"?`
            )
        ) {
            return
        }


        setFormData(
            (current) => ({
                ...current,

                seatingMap: {
                    ...current
                        .seatingMap,

                    standingAreas:
                        current
                            .seatingMap
                            .standingAreas
                            .filter(
                                (
                                    _,
                                    areaIndex
                                ) =>
                                    areaIndex !==
                                    index
                            )
                }
            })
        )


        setSelected(
            null
        )
    }


    /* =====================================================
       ICONOS
    ===================================================== */

    const getMarkerIcon = (
        marker
    ) => {
        if (
            marker.id ===
            "bar"
        ) {
            return "🍹"
        }


        if (
            marker.id ===
            "entrance"
        ) {
            return "🚪"
        }


        return "📍"
    }


    /* =====================================================
       SELECCIÓN
    ===================================================== */

    const selectedStage =
        selected?.kind ===
        "stage"


    const selectedMarker =
        selected?.kind ===
        "marker"
            ? formData
                  .seatingMap
                  .markers[
                      selected.index
                  ]
            : null


    const selectedSeat =
        selected?.kind ===
        "seat"
            ? formData
                  .seatingMap
                  .seats[
                      selected.index
                  ]
            : null


    const selectedArea =
        selected?.kind ===
        "area"
            ? formData
                  .seatingMap
                  .standingAreas[
                      selected.index
                  ]
            : null


    /* =====================================================
       GUARDAR
    ===================================================== */

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault()


        const cleanSeats =
            formData
                .seatingMap
                .seats
                .filter(
                    (seat) =>
                        seat.id.trim()
                )
                .map(
                    (seat) => ({
                        id:
                            seat.id.trim(),

                        label:
                            (
                                seat.label ||
                                seat.id
                            ).trim(),

                        type:
                            seat.type ===
                            "vip"
                                ? "vip"
                                : "table",

                        x:
                            Number(
                                seat.x
                            ),

                        y:
                            Number(
                                seat.y
                            ),

                        width:
                            Number(
                                seat.width
                            ),

                        height:
                            Number(
                                seat.height
                            ),

                        rotation:
                            Number(
                                seat.rotation
                            ) || 0,

                        capacity:
                            Math.max(
                                1,
                                Number(
                                    seat.capacity
                                ) || 1
                            )
                    })
                )


        const ids =
            cleanSeats.map(
                (seat) =>
                    seat.id
            )


        if (
            new Set(ids).size !==
            ids.length
        ) {
            setMessage(
                "Cada mesa o VIP debe tener un ID único."
            )

            return
        }


        const cleanAreas =
            formData
                .seatingMap
                .standingAreas
                .filter(
                    (area) =>
                        area.points
                            ?.length >= 3
                )
                .map(
                    (area) => ({
                        id:
                            area.id.trim(),

                        label:
                            area.label.trim(),

                        capacity:
                            Math.max(
                                1,
                                Number(
                                    area.capacity
                                ) || 1
                            ),

                        points:
                            area.points.map(
                                (
                                    point
                                ) => ({
                                    x:
                                        Number(
                                            point.x
                                        ),

                                    y:
                                        Number(
                                            point.y
                                        )
                                })
                            )
                    })
                )


        try {
            setSaving(true)
            setMessage("")


            const venueData = {
                name:
                    formData.name
                        .trim(),

                active:
                    formData.active,

                seatingMap: {
                    enabled:
                        formData
                            .seatingMap
                            .enabled,

                    stage: {
                        label:
                            formData
                                .seatingMap
                                .stage
                                .label
                                .trim() ||
                            "ESCENARIO",

                        x:
                            Number(
                                formData
                                    .seatingMap
                                    .stage.x
                            ),

                        y:
                            Number(
                                formData
                                    .seatingMap
                                    .stage.y
                            ),

                        width:
                            Number(
                                formData
                                    .seatingMap
                                    .stage.width
                            ),

                        height:
                            Number(
                                formData
                                    .seatingMap
                                    .stage.height
                            ),

                        rotation:
                            Number(
                                formData
                                    .seatingMap
                                    .stage.rotation
                            ) || 0
                    },

                    markers:
                        formData
                            .seatingMap
                            .markers
                            .map(
                                (
                                    marker,
                                    index
                                ) => ({
                                    id:
                                        marker.id ||
                                        `marker-${index + 1}`,

                                    label:
                                        marker.label
                                            .trim(),

                                    x:
                                        Number(
                                            marker.x
                                        ),

                                    y:
                                        Number(
                                            marker.y
                                        ),

                                    width:
                                        Number(
                                            marker.width
                                        ),

                                    height:
                                        Number(
                                            marker.height
                                        ),

                                    rotation:
                                        Number(
                                            marker.rotation
                                        ) || 0
                                })
                            ),

                    seats:
                        cleanSeats,

                    standingAreas:
                        cleanAreas
                }
            }


            if (isEditing) {

                await updateDoc(
                    doc(
                        db,
                        "venues",
                        venueId
                    ),
                    venueData
                )

            } else {

                const documentId =
                    createSlug(
                        formData.name
                    )


                if (!documentId) {
                    setMessage(
                        "No se pudo generar el ID del local."
                    )

                    return
                }


                const venueRef =
                    doc(
                        db,
                        "venues",
                        documentId
                    )


                const existing =
                    await getDoc(
                        venueRef
                    )


                if (
                    existing.exists()
                ) {
                    setMessage(
                        `Ya existe un local con el ID "${documentId}".`
                    )

                    return
                }


                await setDoc(
                    venueRef,
                    venueData
                )
            }


            navigate(
                "/admin/eventos"
            )

        } catch (error) {
            console.error(
                "Error al guardar local:",
                error
            )


            setMessage(
                "No se pudo guardar el local."
            )

        } finally {
            setSaving(false)
        }
    }


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <main className="admin-page">
                <p className="admin-empty">
                    Cargando local...
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
                    LOCAL
                </span>

                <h1>
                    {isEditing
                        ? "Editar local"
                        : "Crear local"}
                </h1>

                <p>
                    Diseña visualmente la
                    distribución completa
                    del espacio.
                </p>

            </section>


            <form
                className="admin-form admin-venue-form"
                onSubmit={
                    handleSubmit
                }
            >

                <label className="admin-full-field">

                    Nombre del local

                    <input
                        type="text"
                        value={
                            formData.name
                        }
                        onChange={
                            handleNameChange
                        }
                        required
                    />

                </label>


                <label className="admin-checkbox-label">

                    <input
                        type="checkbox"
                        checked={
                            formData.active
                        }
                        onChange={
                            handleActiveChange
                        }
                    />

                    Local activo

                </label>


                <section className="admin-visual-layout-editor">

                    <div className="admin-visual-layout-top">

                        <div>

                            <span className="admin-kicker">
                                PLANO
                            </span>

                            <h2>
                                Diseñador del local
                            </h2>

                            <p>
                                Mueve los objetos y
                                moldea las áreas
                                directamente sobre
                                el plano.
                            </p>

                        </div>


                        <label className="admin-checkbox-label">

                            <input
                                type="checkbox"
                                checked={
                                    formData
                                        .seatingMap
                                        .enabled
                                }
                                onChange={
                                    handleMapEnabled
                                }
                            />

                            Plano activo

                        </label>

                    </div>


                    {/* HERRAMIENTAS */}

                    <div className="admin-layout-toolbar">

                        <button
                            type="button"
                            className="admin-add-button"
                            onClick={() =>
                                addSeat(
                                    "table"
                                )
                            }
                        >
                            + Mesa
                        </button>


                        <button
                            type="button"
                            className="admin-add-button admin-add-vip-button"
                            onClick={() =>
                                addSeat(
                                    "vip"
                                )
                            }
                        >
                            + VIP
                        </button>


                        <button
                            type="button"
                            className="admin-add-button admin-add-standing-button"
                            onClick={
                                addStandingArea
                            }
                        >
                            + Área de pie
                        </button>

                    </div>


                    {/* PLANO */}

                    <div
                        ref={
                            previewRef
                        }
                        className="admin-floor-plan"
                        onPointerMove={
                            handlePointerMove
                        }
                        onPointerUp={
                            stopDrag
                        }
                        onPointerCancel={
                            stopDrag
                        }
                        onPointerDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setSelected(
                                    null
                                )
                            }
                        }}
                    >

                        {/* =====================
                            ÁREAS DE PIE
                        ===================== */}

                        <svg
                            className="admin-standing-layer"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                        >

                            {formData
                                .seatingMap
                                .standingAreas
                                .map(
                                    (
                                        area,
                                        areaIndex
                                    ) => {

                                        const points =
                                            area.points
                                                .map(
                                                    (
                                                        point
                                                    ) =>
                                                        `${point.x},${point.y}`
                                                )
                                                .join(
                                                    " "
                                                )


                                        return (
                                            <g
                                                key={
                                                    area.id
                                                }
                                            >

                                                <polygon
                                                    points={
                                                        points
                                                    }
                                                    className={
                                                        selected?.kind ===
                                                            "area" &&
                                                        selected?.index ===
                                                            areaIndex
                                                            ? "admin-standing-polygon selected"
                                                            : "admin-standing-polygon"
                                                    }
                                                    onPointerDown={(
                                                        event
                                                    ) => {
                                                        event.stopPropagation()

                                                        setSelected({
                                                            kind:
                                                                "area",

                                                            index:
                                                                areaIndex
                                                        })
                                                    }}
                                                />


                                                {area.points.map(
                                                    (
                                                        point,
                                                        pointIndex
                                                    ) => (

                                                        <circle
                                                            key={
                                                                pointIndex
                                                            }
                                                            cx={
                                                                point.x
                                                            }
                                                            cy={
                                                                point.y
                                                            }
                                                            r="1.5"
                                                            className="admin-standing-vertex"
                                                            onPointerDown={(
                                                                event
                                                            ) =>
                                                                startDrag(
                                                                    event,
                                                                    "areaPoint",
                                                                    areaIndex,
                                                                    pointIndex
                                                                )
                                                            }
                                                        />

                                                    )
                                                )}

                                            </g>
                                        )
                                    }
                                )}

                        </svg>


                        {/* LABEL ÁREAS */}

                        {formData
                            .seatingMap
                            .standingAreas
                            .map(
                                (
                                    area,
                                    index
                                ) => {

                                    const center =
                                        getAreaCenter(
                                            area.points
                                        )


                                    return (
                                        <button
                                            type="button"
                                            key={`${area.id}-label`}
                                            className="admin-standing-label"
                                            style={{
                                                left:
                                                    `${center.x}%`,

                                                top:
                                                    `${center.y}%`
                                            }}
                                            onClick={() =>
                                                setSelected({
                                                    kind:
                                                        "area",

                                                    index
                                                })
                                            }
                                        >
                                            <strong>
                                                {
                                                    area.label
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    area.capacity
                                                }{" "}
                                                personas
                                            </small>

                                        </button>
                                    )
                                }
                            )}


                        {/* ESCENARIO */}

                        <button
                            type="button"
                            className={[
                                "admin-floor-stage",

                                selectedStage
                                    ? "selected"
                                    : ""
                            ].join(
                                " "
                            )}
                            style={{
                                left:
                                    `${formData.seatingMap.stage.x}%`,

                                top:
                                    `${formData.seatingMap.stage.y}%`,

                                width:
                                    `${formData.seatingMap.stage.width}%`,

                                height:
                                    `${formData.seatingMap.stage.height}%`,

                                transform:
                                    `translate(-50%, -50%) rotate(${formData.seatingMap.stage.rotation}deg)`
                            }}
                            onPointerDown={(
                                event
                            ) =>
                                startDrag(
                                    event,
                                    "stage"
                                )
                            }
                        >
                            🎤{" "}
                            {
                                formData
                                    .seatingMap
                                    .stage
                                    .label
                            }
                        </button>


                        {/* BAR / ENTRADA */}

                        {formData
                            .seatingMap
                            .markers
                            .map(
                                (
                                    marker,
                                    index
                                ) => (

                                    <button
                                        type="button"
                                        key={
                                            marker.id
                                        }
                                        className={[
                                            "admin-floor-marker",

                                            selected?.kind ===
                                                "marker" &&
                                            selected.index ===
                                                index
                                                ? "selected"
                                                : ""
                                        ].join(
                                            " "
                                        )}
                                        style={{
                                            left:
                                                `${marker.x}%`,

                                            top:
                                                `${marker.y}%`,

                                            width:
                                                `${marker.width}%`,

                                            height:
                                                `${marker.height}%`,

                                            transform:
                                                `translate(-50%, -50%) rotate(${marker.rotation}deg)`
                                        }}
                                        onPointerDown={(
                                            event
                                        ) =>
                                            startDrag(
                                                event,
                                                "marker",
                                                index
                                            )
                                        }
                                    >
                                        <span>
                                            {
                                                getMarkerIcon(
                                                    marker
                                                )
                                            }
                                        </span>

                                        {
                                            marker.label
                                        }

                                    </button>

                                )
                            )}


                        {/* MESAS */}

                        {formData
                            .seatingMap
                            .seats
                            .map(
                                (
                                    seat,
                                    index
                                ) => (

                                    <button
                                        type="button"
                                        key={`${seat.id}-${index}`}
                                        className={[
                                            "admin-floor-seat",

                                            seat.type ===
                                            "vip"
                                                ? "vip"
                                                : "table",

                                            selected?.kind ===
                                                "seat" &&
                                            selected.index ===
                                                index
                                                ? "selected"
                                                : ""
                                        ].join(
                                            " "
                                        )}
                                        style={{
                                            left:
                                                `${seat.x}%`,

                                            top:
                                                `${seat.y}%`,

                                            width:
                                                `${seat.width}%`,

                                            height:
                                                `${seat.height}%`,

                                            transform:
                                                `translate(-50%, -50%) rotate(${seat.rotation}deg)`
                                        }}
                                        onPointerDown={(
                                            event
                                        ) =>
                                            startDrag(
                                                event,
                                                "seat",
                                                index
                                            )
                                        }
                                    >

                                        <span className="admin-floor-seat-name">
                                            {
                                                seat.label
                                            }
                                        </span>

                                        <small>
                                            {
                                                seat.capacity
                                            }
                                            p
                                        </small>

                                    </button>

                                )
                            )}

                    </div>


                    {/* PROPIEDADES */}

                    <div className="admin-layout-properties">

                        {!selected && (
                            <div className="admin-layout-nothing-selected">

                                <strong>
                                    Selecciona algo
                                </strong>

                                <p>
                                    Mesa, VIP, escenario,
                                    barra, entrada o área
                                    de pie.
                                </p>

                            </div>
                        )}


                        {/* ESCENARIO */}

                        {selectedStage && (

                            <div className="admin-layout-property-card">

                                <div className="admin-layout-property-title">
                                    <div>
                                        <span>
                                            🎤
                                        </span>

                                        <div>
                                            <small>
                                                ESCENARIO
                                            </small>

                                            <h3>
                                                {
                                                    formData
                                                        .seatingMap
                                                        .stage
                                                        .label
                                                }
                                            </h3>
                                        </div>
                                    </div>
                                </div>


                                <div className="admin-property-grid">

                                    <label>
                                        Nombre

                                        <input
                                            value={
                                                formData
                                                    .seatingMap
                                                    .stage
                                                    .label
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStageField(
                                                    "label",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Ancho

                                        <input
                                            type="range"
                                            min="15"
                                            max="95"
                                            value={
                                                formData
                                                    .seatingMap
                                                    .stage
                                                    .width
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStageField(
                                                    "width",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Alto

                                        <input
                                            type="range"
                                            min="5"
                                            max="30"
                                            value={
                                                formData
                                                    .seatingMap
                                                    .stage
                                                    .height
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStageField(
                                                    "height",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Girar:{" "}
                                        {
                                            formData
                                                .seatingMap
                                                .stage
                                                .rotation
                                        }
                                        °

                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={
                                                formData
                                                    .seatingMap
                                                    .stage
                                                    .rotation
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStageField(
                                                    "rotation",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>

                            </div>

                        )}


                        {/* BAR / ENTRADA */}

                        {selectedMarker && (

                            <div className="admin-layout-property-card">

                                <div className="admin-layout-property-title">

                                    <div>
                                        <span>
                                            {
                                                getMarkerIcon(
                                                    selectedMarker
                                                )
                                            }
                                        </span>

                                        <div>
                                            <small>
                                                ELEMENTO
                                            </small>

                                            <h3>
                                                {
                                                    selectedMarker.label
                                                }
                                            </h3>
                                        </div>
                                    </div>

                                </div>


                                <div className="admin-property-grid">

                                    <label>
                                        Nombre

                                        <input
                                            value={
                                                selectedMarker.label
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateMarkerField(
                                                    selected.index,
                                                    "label",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Ancho

                                        <input
                                            type="range"
                                            min="5"
                                            max="40"
                                            value={
                                                selectedMarker.width
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateMarkerField(
                                                    selected.index,
                                                    "width",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Alto

                                        <input
                                            type="range"
                                            min="4"
                                            max="25"
                                            value={
                                                selectedMarker.height
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateMarkerField(
                                                    selected.index,
                                                    "height",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Girar:{" "}
                                        {
                                            selectedMarker.rotation
                                        }
                                        °

                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={
                                                selectedMarker.rotation
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateMarkerField(
                                                    selected.index,
                                                    "rotation",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>

                            </div>

                        )}


                        {/* MESA */}

                        {selectedSeat && (

                            <div className="admin-layout-property-card">

                                <div className="admin-layout-property-title">

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
                                                    selectedSeat.label
                                                }
                                            </h3>
                                        </div>
                                    </div>


                                    <button
                                        type="button"
                                        className="admin-layout-delete"
                                        onClick={() =>
                                            removeSeat(
                                                selected.index
                                            )
                                        }
                                    >
                                        Eliminar
                                    </button>

                                </div>


                                <div className="admin-property-grid">

                                    <label>
                                        ID

                                        <input
                                            value={
                                                selectedSeat.id
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "id",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Nombre

                                        <input
                                            value={
                                                selectedSeat.label
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "label",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Tipo

                                        <select
                                            value={
                                                selectedSeat.type
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "type",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="table">
                                                Mesa
                                            </option>

                                            <option value="vip">
                                                VIP
                                            </option>
                                        </select>
                                    </label>


                                    <label>
                                        Capacidad

                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={
                                                selectedSeat.capacity
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "capacity",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Ancho

                                        <input
                                            type="range"
                                            min="4"
                                            max="30"
                                            value={
                                                selectedSeat.width
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "width",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Alto

                                        <input
                                            type="range"
                                            min="4"
                                            max="30"
                                            value={
                                                selectedSeat.height
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "height",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Girar:{" "}
                                        {
                                            selectedSeat.rotation
                                        }
                                        °

                                        <input
                                            type="range"
                                            min="-180"
                                            max="180"
                                            value={
                                                selectedSeat.rotation
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateSeatField(
                                                    selected.index,
                                                    "rotation",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>

                            </div>

                        )}


                        {/* ÁREA DE PIE */}

                        {selectedArea && (

                            <div className="admin-layout-property-card">

                                <div className="admin-layout-property-title">

                                    <div>
                                        <span>
                                            👥
                                        </span>

                                        <div>
                                            <small>
                                                ÁREA DE PIE
                                            </small>

                                            <h3>
                                                {
                                                    selectedArea.label
                                                }
                                            </h3>
                                        </div>
                                    </div>


                                    <button
                                        type="button"
                                        className="admin-layout-delete"
                                        onClick={() =>
                                            removeStandingArea(
                                                selected.index
                                            )
                                        }
                                    >
                                        Eliminar
                                    </button>

                                </div>


                                <div className="admin-property-grid">

                                    <label>
                                        Nombre

                                        <input
                                            value={
                                                selectedArea.label
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStandingAreaField(
                                                    selected.index,
                                                    "label",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>


                                    <label>
                                        Capacidad aproximada

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                selectedArea.capacity
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateStandingAreaField(
                                                    selected.index,
                                                    "capacity",
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>

                                </div>


                                <div className="admin-vertex-actions">

                                    <span>
                                        {
                                            selectedArea
                                                .points
                                                .length
                                        }{" "}
                                        vértices
                                    </span>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            addAreaVertex(
                                                selected.index
                                            )
                                        }
                                        disabled={
                                            selectedArea
                                                .points
                                                .length >=
                                            10
                                        }
                                    >
                                        + Vértice
                                    </button>


                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeAreaVertex(
                                                selected.index
                                            )
                                        }
                                        disabled={
                                            selectedArea
                                                .points
                                                .length <=
                                            3
                                        }
                                    >
                                        − Vértice
                                    </button>

                                </div>


                                <p className="admin-area-help">
                                    Arrastra los puntos blancos
                                    del área directamente en el
                                    plano para cambiar su forma.
                                </p>

                            </div>

                        )}

                    </div>

                </section>


                <div className="admin-form-actions">

                    <button
                        type="submit"
                        className="admin-save-button"
                        disabled={
                            saving
                        }
                    >
                        {saving
                            ? "Guardando..."
                            : isEditing
                              ? "Guardar local"
                              : "Crear local"}
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


export default AdminVenueForm