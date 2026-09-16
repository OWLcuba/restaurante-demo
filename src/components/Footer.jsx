import "./Footer.css"

import { useBusiness } from "../context/BusinessContext"

function Footer() {
    const currentYear = new Date().getFullYear()

    const {
        businessData,
        loadingBusiness
    } = useBusiness()

    if (loadingBusiness || !businessData) {
        return null
    }

    return (
        <footer className="footer">
            <h3 className="footer-brand">
                <img
                    src="/images/logo.jpg"
                    alt={businessData.name}
                    className="footer-logo"
                />

                {businessData.name}
            </h3>

            <p>
                © {currentYear} {businessData.name}. Todos los derechos reservados.
            </p>
        </footer>
    )
}

export default Footer