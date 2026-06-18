const businessData = {
    name: "La Cocina Latina",

    slogan: "Auténtico sabor latino",

    description: "Disfruta platos tradicionales preparados con sabor casero, ingredientes frescos y el toque latino que nos representa.",

    phone: "+12105551234",

    displayPhone: "(210) 555-1234",

    whatsapp: "12105551234",

    whatsappMessage: "Hola, quiero hacer un pedido en La Cocina Latina.",

     floatingAction: {
        type: "whatsapp",
        label: "Ordenar por WhatsApp",
        icon: "💬",
        url: "https://wa.me/12105551234?text=Hola%2C%20quiero%20hacer%20un%20pedido%20en%20La%20Cocina%20Latina."
    },

    address: "123 Main Street, San Antonio, TX",

    shortAddress: {
        line1: "123 Main Street",
        line2: "San Antonio, TX"
    },

    shortHours: "10AM - 9PM",


    hours: [
        {
            days: "Lunes - Jueves",
            time: "10:00 AM - 9:00 PM"
        },
        {
            days: "Viernes - Domingo",
            time: "10:00 AM - 11:00 PM"
        }
    ],

    mapUrl: "https://maps.google.com/maps?q=San%20Antonio&t=&z=13&ie=UTF8&iwloc=&output=embed",

googleMapsUrl: "https://www.google.com/maps/search/123 Main Street, San Antonio, TX",

delivery: {
    active: true,
    platform: "DoorDash",
    label: "Ordenar en DoorDash",
    url: "https://www.doordash.com/store/guerreros-mexican-restaurant-san-antonio-27508083/30295552/?event_type=autocomplete&pickup=false"
}

};



export default businessData;