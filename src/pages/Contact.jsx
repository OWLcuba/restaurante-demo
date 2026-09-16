import "./Contact.css"

import { useBusiness } from "../context/BusinessContext"

function Contact() {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()

    if (loadingBusiness || !businessData) {
        return null
    }

    return (
        <section className="contact">
            <h2>Visítanos</h2>

            <p className="contact-subtitle">
                Ven y disfruta el auténtico sabor latino
            </p>

            <div className="contact-container">
                <div className="contact-info">
                    <div>
                        <h3>📍 Dirección</h3>

                        <p>
                            {businessData.shortAddress?.line1} <br />
                            {businessData.shortAddress?.line2}
                        </p>
                    </div>

                    <div>
                        <h3>🕒 Horarios</h3>

                        {businessData.hours?.map((item, index) => (
                            <p key={index}>
                                <strong>{item.days}:</strong>{" "}
                                {item.time}
                            </p>
                        ))}
                    </div>

                    <div className="contact-buttons">
                        <a href={`tel:${businessData.phone}`}>
                            📞 Llamar
                        </a>

                        <a
                            href={`https://wa.me/${businessData.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            💬 WhatsApp
                        </a>

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            businessData.address
                            )}`}
                            arget="_blank"
                            rel="noopener noreferrer"
                        >
                            📍 Cómo llegar
                        </a>

                        
                    </div>
                </div>

                <div className="map">
                    <iframe
                        title={`Mapa de ${businessData.name}`}
                        src={businessData.mapUrl}
                        loading="lazy"
                    />
                </div>
            </div>
        </section>
    )
}

export default Contact