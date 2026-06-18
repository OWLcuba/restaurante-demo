import galleryImages from "../data/galleryData"
import GalleryCard from "../components/GalleryCard"

import "./Gallery.css"


function Gallery(){

    return (

        <section className="gallery-section">

            <h2>
                Nuestra Galería
            </h2>


            <p>
                Momentos, sabores y experiencias que compartimos.
            </p>


            <div className="gallery-grid">

                {

                    galleryImages.map(item => (

                        <GalleryCard
                            key={item.id}
                            item={item}
                        />

                    ))

                }

            </div>


        </section>

    )

}


export default Gallery