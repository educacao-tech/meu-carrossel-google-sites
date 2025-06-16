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
    slideWidth = slides[0].getBoundingClientRect().width;
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });
    carouselTrack.style.transform = 'translateX(-' + slides[currentSlideIndex].style.left + ')';
};

const createDots = () => {
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

const moveToSlide = (track, targetSlide) => {
    track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
    currentSlideIndex = slides.indexOf(targetSlide);
    updateDots(currentSlideIndex);
    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlideIndex].classList.add('active');
};

const startAutoPlay = () => {
    clearInterval(autoPlayInterval); // Garante que não há múltiplos intervalos rodando
    autoPlayInterval = setInterval(() => {
        const nextSlide = slides[currentSlideIndex + 1] || slides[0]; // Volta ao primeiro slide se for o último
        moveToSlide(carouselTrack, nextSlide);
    }, 6000); // Muda a cada 6 segundos
};

nextButton.addEventListener('click', () => {
    const nextSlide = slides[currentSlideIndex + 1] || slides[0];
    moveToSlide(carouselTrack, nextSlide);
    startAutoPlay(); // Reinicia o auto-play após clique manual
});

prevButton.addEventListener('click', () => {
    const prevSlide = slides[currentSlideIndex - 1] || slides[slides.length - 1]; // Vai para o último slide se for o primeiro
    moveToSlide(carouselTrack, prevSlide);
    startAutoPlay(); // Reinicia o auto-play após clique manual
});

dotsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        const targetSlide = slides[targetIndex];
        moveToSlide(carouselTrack, targetSlide);
        startAutoPlay(); // Reinicia o auto-play após clique manual
    }
});

// Pausar o auto-play no hover do carrossel
carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
});

// Retomar o auto-play ao tirar o mouse do carrossel
carouselContainer.addEventListener('mouseleave', () => {
    startAutoPlay();
});

// Inicializa tudo quando a página é carregada
document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition();
    createDots();
    startAutoPlay(); // Inicia o auto-play automaticamente
});

// Atualiza o layout do carrossel ao redimensionar a janela
window.addEventListener('resize', setSlidePosition);
