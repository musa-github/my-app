import { useEffect, useState } from 'react';
import './Carousel.css';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    title: 'Serene Mountains'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1000&q=80',
    title: 'Mystic Forest'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
    title: 'Golden Sunset'
  },{
    id: 4,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
    title: 'Hello Sunset'
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