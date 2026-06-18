import promotions from "../data/promotionsData"
import PromotionCard from "../components/PromotionCard"

import "./Promotions.css"

function Promotions() {

    return (
        <section className="promotions-section">

            <h2>Promociones</h2>

            <p className="promotions-subtitle">
                Especiales preparados para disfrutar más por menos.
            </p>

            <div className="promotions-grid">

                {
                    promotions.map(promotion => (

                        <PromotionCard
                            key={promotion.id}
                            promotion={promotion}
                        />

                    ))
                }

            </div>

        </section>
    )

}

export default Promotions