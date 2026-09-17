import { Link } from "react-router-dom"

import "./Admin.css"

function Admin() {
    return (
        <main className="admin-page">
            <section className="admin-header">
                <span className="admin-kicker">
                    PANEL DE ADMINISTRACIÓN
                </span>

                <h1>Gestiona Q&apos; Bola</h1>

                <p>
                    Desde aquí podrás administrar el contenido principal
                    del restaurante.
                </p>
            </section>

            <section className="admin-grid">
                <article className="admin-card">
                    <span>🏪</span>

                    <div>
                        <h2>Restaurante</h2>

                        <p>
                            Nombre, teléfono, dirección, horarios
                            y enlaces.
                        </p>
                    </div>

                    <Link
                        to="/admin/restaurante"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>

                <article className="admin-card">
                    <span>🍽️</span>

                    <div>
                        <h2>Menú</h2>

                        <p>
                            Agregar, editar, activar o desactivar platos.
                        </p>
                    </div>

                    <Link
                        to="/admin/menu"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>

                <article className="admin-card">
                    <span>🔥</span>

                    <div>
                        <h2>Promociones</h2>

                        <p>
                            Cambia ofertas, precios e imágenes.
                        </p>
                    </div>

                    <Link
                        to="/admin/promociones"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>

                <article className="admin-card">
                    <span>🎉</span>

                    <div>
                        <h2>Fiestas</h2>

                        <p>
                            Gestiona combos, precios y contenido.
                        </p>
                    </div>

                    <Link
                        to="/admin/fiestas"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>

                <article className="admin-card">
                    <span>🎤</span>

                    <div>
                        <h2>Eventos</h2>

                        <p>
                            Artistas, fechas, entradas, VIP y mesas.
                        </p>
                    </div>

                    <Link
                        to="/admin/eventos"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>

                <article className="admin-card">
                    <span>📸</span>

                    <div>
                        <h2>Galería</h2>

                        <p>
                            Fotos y categorías de la galería.
                        </p>
                    </div>

                    <Link
                        to="/admin/galeria"
                        className="admin-card-button"
                    >
                        Administrar
                    </Link>
                </article>


                <article className="admin-card">

                    <span>
                        📊
                    </span>

                    <div>

                        <h2>
                            Resultados web
                        </h2>

                        <p>
                            Sesiones, llamadas, mapas,
                            DoorDash, fiestas y eventos.
                        </p>

                    </div>

                    <Link
                        to="/admin/estadisticas"
                        className="admin-card-button"
                    >
                        Ver estadísticas
                    </Link>

                </article>

            </section>
        </main>
    )
}

export default Admin