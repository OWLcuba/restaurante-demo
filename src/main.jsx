import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { updateDrinkImages } from "./scripts/updateDrinkImages"

import "./index.css"
import App from "./App.jsx"


createRoot(
    document.getElementById("root")
).render(
    <StrictMode>
        <App />
    </StrictMode>
)