import "./MenuCard.css"


function MenuCard({ item }) {

    const formatPrice = (price) => {
        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {
            return "Precio por confirmar"
        }


        const numericPrice =
            typeof price === "number"
                ? price
                : Number(
                      String(price)
                          .replace("$", "")
                          .replace(",", "")
                          .trim()
                  )


        if (
            !Number.isFinite(
                numericPrice
            )
        ) {
            return price
        }


        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(
            numericPrice
        )
    }


    return (
        <article className="menu-card">

            <div className="menu-card-image-wrapper">

                <img
                    className="food-image"
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                />

            </div>


            <div className="menu-card-content">

                <span className="menu-card-category">
                    {item.category}
                </span>


                <h3>
                    {item.name}
                </h3>


                <p>
                    {item.description}
                </p>


                <strong>
                    {formatPrice(
                        item.price
                    )}
                </strong>

            </div>

        </article>
    )
}


export default MenuCard