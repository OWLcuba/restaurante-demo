import "./WhatsAppButton.css"
import businessData from "../data/businessData"

function WhatsAppButton() {

    const action = businessData.floatingAction

    if (!action) {
        return null
    }

    return (
        <a
            className="whatsapp-button"
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={action.label}
            title={action.label}
        >
            {action.icon}
        </a>
    )
}

export default WhatsAppButton