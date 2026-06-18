import "./Footer.css"
import businessData from "../data/businessData"

function Footer() {

    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <h3>🌶️ {businessData.name}</h3>

            <p>
                © {currentYear} {businessData.name}. Todos los derechos reservados.
            </p>
        </footer>
    )

}

export default Footer