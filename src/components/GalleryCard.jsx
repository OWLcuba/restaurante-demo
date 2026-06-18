import "./GalleryCard.css"


function GalleryCard({item}) {

    return (

        <div className="gallery-card">

            <img
                className="gallery-image"
                src={item.imageUrl}
                alt={item.title}
            />

            <div className="gallery-title">

                <h3>
                    {item.title}
                </h3>

            </div>

        </div>

    )

}


export default GalleryCard