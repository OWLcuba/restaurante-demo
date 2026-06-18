import "./Home.css"
import businessData from "../data/businessData"

function Home() {

    return (

        <section className="hero">

            <div className="hero-main">

                <div className="hero-content">

                    <span className="subtitle">
                        Sabor que enamora
                    </span>

                    <h1>
                        {businessData.slogan}
                    </h1>

                    <p>
                        {businessData.description}
                    </p>

                    <div className="hero-buttons">

                        <a
                            className="primary-btn"
                            href="#menu"
                        >
                            Ver menú
                        </a>

                        <a
                            className="secondary-btn"
                            href={`tel:${businessData.phone}`}
                        >
                            📞 Ordenar por llamada
                        </a>

                    </div>

                </div>

                <div className="hero-image">
                    <img
                        src="/images/restaurant-cover.png"
                        alt={businessData.name}
                    />
                </div>

            </div>

            <div className="info-cards">

                <div>
                    ☎️
                    <p>Llámanos</p>
                    <strong>{businessData.displayPhone}</strong>
                </div>

                <div>
                    📍
                    <p>Visítanos</p>
                    <strong>{businessData.shortAddress.line2}</strong>
                </div>

                <div>
                    ⏰
                    <p>Horario</p>
                    <strong>{businessData.shortHours}</strong>
                </div>

            </div>

        </section>

    )

}

export default Home