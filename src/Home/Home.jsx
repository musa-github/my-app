import Carousel from "./Carousel";
import Style from "./Home.module.css";
const Home = () => {
 return (
   <div className={Style.homeContainer}>
    <h2 className={Style.heading}>About us:</h2>
    <p className={Style.profile}>
Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptatum nisi delectus quod impedit nam perferendis, cum quia ab quae molestias esse natus mollitia. Assumenda exercitationem cumque, consequuntur libero cupiditate nam.
Laborum consequuntur nam, eum soluta autem assumenda vel, illo eaque architecto quisquam molestias. Aliquam voluptate officia eos, est expedita blanditiis ea sed architecto, accusamus omnis dolorem delectus, quas soluta dolore.
    </p>
    <div className={Style.mediaContainer}>
        <Carousel/>

        <iframe className={Style.video} width="560" height="300" src="https://www.youtube.com/embed/wE8AsupuJAI?si=B6dPx0HgCE9uQZ1n" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>
   </div>
 )
}

export default Home;