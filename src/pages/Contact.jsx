import "./Contact.css"

import {
    useBusiness
} from "../context/BusinessContext"


function Contact() {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    if (
        loadingBusiness ||
        !businessData
    ) {
        return null
    }


    const fallbackMapsUrl =
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            businessData.address || ""
        )}`


    const fallbackMapEmbed =
        `https://maps.google.com/maps?q=${encodeURIComponent(
            businessData.address || ""
        )}` +
        `&t=&z=13&ie=UTF8&iwloc=&output=embed`


    return (
        <section className="contact">

            <div className="contact-header">

                <span className="contact-kicker">
                    VEN A CONOCERNOS
                </span>


                <h2>
                    Visítanos
                </h2>


                <p className="contact-subtitle">
                    Ven y disfruta del auténtico
                    sabor cubano de Q&apos; Bola.
                </p>

            </div>


            <div className="contact-container">

                {/* =====================
                    INFORMACIÓN
                ===================== */}

                <div className="contact-info">

                    <div className="contact-info-block">

                        <div className="contact-info-icon">
                            📍
                        </div>


                        <div>

                            <span className="contact-info-label">
                                UBICACIÓN
                            </span>

                            <h3>
                                Dirección
                            </h3>

                            <p>
                                {
                                    businessData
                                        .shortAddress
                                        ?.line1
                                }

                                <br />

                                {
                                    businessData
                                        .shortAddress
                                        ?.line2
                                }
                            </p>

                        </div>

                    </div>


                    <div className="contact-divider" />


                    <div className="contact-info-block">

                        <div className="contact-info-icon">
                            🕒
                        </div>


                        <div className="contact-hours">

                            <span className="contact-info-label">
                                HORARIO
                            </span>

                            <h3>
                                Estamos abiertos
                            </h3>


                            {businessData.hours?.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <p
                                        key={
                                            index
                                        }
                                    >
                                        <strong>
                                            {
                                                item.days
                                            }
                                        </strong>

                                        <span>
                                            {
                                                item.time
                                            }
                                        </span>
                                    </p>
                                )
                            )}

                        </div>

                    </div>


                    <div className="contact-divider" />


                    {/* =====================
                        ACCIONES
                    ===================== */}

                    <div className="contact-buttons">

                        <a
                            href={`tel:${businessData.phone}`}
                            className="contact-button contact-button-call"
                        >
                            <span>
                                📞
                            </span>

                            Llamar
                        </a>


                        <a
                            href={`https://wa.me/${businessData.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contact-button contact-button-whatsapp"
                        >
                            <span>
                                💬
                            </span>

                            WhatsApp
                        </a>


                        <a
                            href={
                                businessData.googleMapsUrl ||
                                fallbackMapsUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="contact-button contact-button-map"
                        >
                            <span>
                                📍
                            </span>

                            Cómo llegar
                        </a>

                    </div>

                </div>


                {/* =====================
                    MAPA
                ===================== */}

                <div className="map">

                    <div className="map-header">

                        <div>

                            <span>
                                ENCUÉNTRANOS
                            </span>

                            <strong>
                                {
                                    businessData.name
                                }
                            </strong>

                        </div>


                        <span className="map-status">
                            ● ABIERTO
                        </span>

                    </div>


                    <iframe
                        title={`Mapa de ${businessData.name}`}
                        src={
                            businessData.mapUrl ||
                            fallbackMapEmbed
                        }
                        loading="lazy"
                    />

                </div>

            </div>

        </section>
    )
}


export default Contact