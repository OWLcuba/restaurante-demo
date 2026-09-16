import businessData from "../data/businessData"

import "./PromotionCard.css"


function PromotionCard({ promotion }) {
    const formatPrice = (price) => {
        const numericPrice =
            Number(price)

        if (
            Number.isFinite(numericPrice)
        ) {
            return `$${numericPrice.toFixed(2)}`
        }

        return price || ""
    }


    return (
        <div className="promotion-card">
            <img
                className="promotion-image"
                src={promotion.imageUrl}
                alt={promotion.title}
            />

            <div className="promotion-content">
                <span>
                    🔥 Promoción
                </span>

                <h3>
                    {promotion.title}
                </h3>

                <p>
                    {promotion.description}
                </p>

                <strong>
                    {formatPrice(
                        promotion.price
                    )}
                </strong>


                {businessData.delivery?.active && (
                    <a
                        className="promotion-button"
                        href={
                            businessData.delivery.url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {
                            businessData.delivery.label
                        }
                    </a>
                )}
            </div>
        </div>
    )
}


export default PromotionCard