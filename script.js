const carouselContainer = document.querySelector('.carousel-container');
const carouselTrack = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');
const dotsContainer = document.querySelector('.carousel-dots');

let slideWidth;
let currentSlideIndex = 0;
let autoPlayInterval;

const setSlidePosition = () => {
    if (slides.length === 0) return;

    slideWidth = carouselContainer.getBoundingClientRect().width; 
    
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
        slide.style.width = slideWidth + 'px';
    });

    carouselTrack.style.transform = 'translateX(-' + (slideWidth * currentSlideIndex) + 'px)';
};

const createDots = () => {
    dotsContainer.innerHTML = '';
    if (slides.length <= 1) {
        dotsContainer.style.display = 'none';
        return;
    } else {
        dotsContainer.style.display = 'block';
    }

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', 'false');
        dotsContainer.appendChild(dot);
    });
    updateDots(currentSlideIndex);
    slides[currentSlideIndex].classList.add('active');
};

const updateDots = (index) => {
    const dots = Array.from(dotsContainer.children);
    dots.forEach((dot, idx) => {
        if (idx === index) {
            dot.classList.add('active');
            dot.setAttribute('aria-selected', 'true');
        } else {
            dot.classList.remove('active');
            dot.setAttribute('aria-selected', 'false');
        }
    });
};

const moveToSlide = (track, targetIndex) => {
    const newPosition = -slideWidth * targetIndex;
    track.style.transform = 'translateX(' + newPosition + 'px)';
    
    currentSlideIndex = targetIndex;
    updateDots(currentSlideIndex);

    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlideIndex].classList.add('active');
};

const startAutoPlay = () => {
    clearInterval(autoPlayInterval);
    if (slides.length <= 1) return;

    autoPlayInterval = setInterval(() => {
        let nextIndex = currentSlideIndex + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0;
        }
        moveToSlide(carouselTrack, nextIndex);
    }, 6000);
};

nextButton.addEventListener('click', () => {
    if (slides.length <= 1) return;
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0;
    }
    moveToSlide(carouselTrack, nextIndex);
    startAutoPlay();
});

prevButton.addEventListener('click', () => {
    if (slides.length <= 1) return;
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) {
        prevIndex = slides.length - 1;
    }
    moveToSlide(carouselTrack, prevIndex);
    startAutoPlay();
});

dotsContainer.addEventListener('click', e => {
    if (slides.length <= 1) return;
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        moveToSlide(carouselTrack, targetIndex);
        startAutoPlay();
    }
});

carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
});

carouselContainer.addEventListener('mouseleave', () => {
    startAutoPlay();
});

document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition();
    createDots();
    startAutoPlay();
    
    if (slides.length <= 1) {
        nextButton.style.display = 'none';
        prevButton.style.display = 'none';
    } else {
        nextButton.style.display = 'flex';
        prevButton.style.display = 'flex';
    }
});

window.addEventListener('resize', () => {
    setSlidePosition();
    createDots();
});
