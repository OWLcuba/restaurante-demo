import "./MenuCard.css"


function MenuCard({item}) {

    return (

        <div className="menu-card">


            <img 
                className="food-image"
                src={item.imageUrl}
                alt={item.name}
            />


            <h3>
                {item.name}
            </h3>


            <p>
                {item.description}
            </p>


            <strong>
                {item.price}
            </strong>


        </div>

    )

}


export default MenuCard