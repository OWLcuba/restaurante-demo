import "./PromotionCard.css"

import {
    useBusiness
} from "../context/BusinessContext"


function PromotionCard({
    promotion
}) {
    const {
        businessData,
        loadingBusiness
    } = useBusiness()


    const formatPrice = (
        price
    ) => {
        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {
            return ""
        }


        const numericPrice =
            typeof price === "number"
                ? price
                : Number(
                      String(
                          price
                      )
                          .replace(
                              "$",
                              ""
                          )
                          .replace(
                              ",",
                              ""
                          )
                          .trim()
                  )


        if (
            Number.isFinite(
                numericPrice
            )
        ) {
            return `$${numericPrice.toFixed(
                2
            )}`
        }


        return price
    }


    const delivery =
        businessData?.delivery


    return (
        <article className="promotion-card">

            <div className="promotion-image-wrapper">

                <img
                    className="promotion-image"
                    src={
                        promotion.imageUrl
                    }
                    alt={
                        promotion.title
                    }
                    loading="lazy"
                />

                <span className="promotion-badge">
                    🔥 PROMOCIÓN
                </span>

            </div>


            <div className="promotion-content">

                <span className="promotion-label">
                    ESPECIAL
                </span>


                <h3>
                    {promotion.title}
                </h3>


                <p>
                    {
                        promotion.description
                    }
                </p>


                <strong>
                    {formatPrice(
                        promotion.price
                    )}
                </strong>


                {!loadingBusiness &&
                    delivery?.active &&
                    delivery?.url && (

                        <a
                            className="promotion-button"
                            href={
                                delivery.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {
                                delivery.label ||
                                `Ordenar en ${
                                    delivery.platform ||
                                    "línea"
                                }`
                            }
                        </a>

                    )}

            </div>

        </article>
    )
}


export default PromotionCard