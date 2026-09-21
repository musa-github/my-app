import { useEffect, useState } from 'react';
import './Carousel.css';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1624985947227-6abdf50fb47d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fGxpZnR8ZW58MHx8MHx8fDA%3D',
    title: 'Home lift'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1547630824-eed1be6a27b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGlmdHxlbnwwfHwwfHx8MA%3D%3D',
    title: 'Cargo lift'
  },
  {
    id: 3,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSynOhYhAQceHdu8-l0gkpZUj366Auzhwd5CMJlrD0dfQ&s=10',
    title: 'ARD'
  },{
    id: 4,
    image: 'https://plus.unsplash.com/premium_photo-1663011223783-e3686f74b948?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Z2VuZXJhdG9yfGVufDB8fDB8fHww',
    title: 'Generatore'
  }
];

export default function Carousel({ autoPlay = true, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  // Auto-move effect
  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const slideTimer = setInterval(() => {
      nextSlide();
    }, interval);

    // Clean up timer on unmount or slide change
    return () => clearInterval(slideTimer);
  }, [currentIndex, autoPlay, interval, isPaused]);

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => setIsPaused(true)}  /* Pause on hover */
      onMouseLeave={() => setIsPaused(false)} /* Resume on mouse leave */
    >
      {/* Slider Viewport */}
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="carousel-slide">
              <img src={slide.image} alt={slide.title} />
              <div className="carousel-caption">{slide.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        className="carousel-btn btn-prev"
        onClick={prevSlide}
        aria-label="Previous Slide"
      >
        &#10094;
      </button>
      <button
        className="carousel-btn btn-next"
        onClick={nextSlide}
        aria-label="Next Slide"
      >
        &#10095;
      </button>

      {/* Pagination Dots */}
      <div className="carousel-dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`dot ${currentIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}