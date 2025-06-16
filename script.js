``javascript
const carouselContainer = document.querySelector('.carousel-container'); // Pegar o contêiner para o hover
const carouselTrack = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');
const dotsContainer = document.querySelector('.carousel-dots');

let slideWidth;
let currentSlideIndex = 0;
let autoPlayInterval; // Variável para controlar o intervalo do auto-play

// Função para posicionar os slides e recalcular a largura ao redimensionar
const setSlidePosition = () => {
    slideWidth = slides[0].getBoundingClientRect().width;
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });
    carouselTrack.style.transform = 'translateX(-' + slides[currentSlideIndex].style.left + ')';
};

// Cria os pontos de navegação
const createDots = () => {
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        // Adiciona atributos ARIA para acessibilidade
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', 'false');
        dot.setAttribute('aria-controls', `carousel-slide-${index}`); // Opcional: Se cada slide tivesse um ID
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
            dot.setAttribute('aria-selected', 'true'); // Ativa o ARIA para o ponto ativo
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

// Função para iniciar o auto-play
const startAutoPlay = () => {
    // Limpa qualquer intervalo existente para evitar duplicação
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
        const nextSlide = slides[currentSlideIndex + 1] || slides[0];
        moveToSlide(carouselTrack, nextSlide);
    }, 6000); // Muda a cada 6 segundos
};

// Event Listeners para botões de navegação
nextButton.addEventListener('click', () => {
    const nextSlide = slides[currentSlideIndex + 1] || slides[0];
    moveToSlide(carouselTrack, nextSlide);
    startAutoPlay(); // Reinicia o auto-play após clique manual
});

prevButton.addEventListener('click', () => {
    const prevSlide = slides[currentSlideIndex - 1] || slides[slides.length - 1];
    moveToSlide(carouselTrack, prevSlide);
    startAutoPlay(); // Reinicia o auto-play após clique manual
});

// Event Listeners para os pontos de navegação
dotsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        const targetSlide = slides[targetIndex];
        moveToSlide(carouselTrack, targetSlide);
        startAutoPlay(); // Reinicia o auto-play após clique manual
    }
});

// Pausar o auto-play no hover
carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
});

// Retomar o auto-play ao tirar o mouse
carouselContainer.addEventListener('mouseleave', () => {
    startAutoPlay();
});

// Inicializa a posição dos slides e os pontos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition();
    createDots();
    startAutoPlay(); // Inicia o auto-play quando a página é carregada
});

// Atualiza a largura do slide em caso de redimensionamento da janela
window.addEventListener('resize', setSlidePosition);