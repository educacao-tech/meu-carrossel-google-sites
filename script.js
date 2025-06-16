const carouselTrack = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');
const dotsContainer = document.querySelector('.carousel-dots');

let slideWidth; // Declarada aqui para ser acessível globalmente

// Função para posicionar os slides e recalcular a largura ao redimensionar
const setSlidePosition = () => {
    slideWidth = slides[0].getBoundingClientRect().width;
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });
    // Garante que o carrossel esteja na posição correta após redimensionamento
    carouselTrack.style.transform = 'translateX(-' + slides[currentSlideIndex].style.left + ')';
};

let currentSlideIndex = 0;

// Cria os pontos de navegação
const createDots = () => {
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        dotsContainer.appendChild(dot);
    });
    updateDots(currentSlideIndex); // Ativa o primeiro ponto
    slides[currentSlideIndex].classList.add('active'); // Ativa o texto do primeiro slide
};

const updateDots = (index) => {
    const dots = Array.from(dotsContainer.children);
    dots.forEach((dot, idx) => {
        if (idx === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
};

const moveToSlide = (track, targetSlide) => {
    track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
    currentSlideIndex = slides.indexOf(targetSlide);
    updateDots(currentSlideIndex);
    // Remove a classe 'active' de todos os slides e adiciona apenas ao slide atual
    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlideIndex].classList.add('active');
};

// Event Listeners para botões de navegação
nextButton.addEventListener('click', () => {
    const nextSlide = slides[currentSlideIndex + 1] || slides[0]; // Volta para o início se for o último
    moveToSlide(carouselTrack, nextSlide);
});

prevButton.addEventListener('click', () => {
    const prevSlide = slides[currentSlideIndex - 1] || slides[slides.length - 1]; // Vai para o último se for o primeiro
    moveToSlide(carouselTrack, prevSlide);
});

// Event Listeners para os pontos de navegação
dotsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        const targetSlide = slides[targetIndex];
        moveToSlide(carouselTrack, targetSlide);
    }
});

// Inicializa a posição dos slides e os pontos ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition();
    createDots();
});

// Atualiza a largura do slide em caso de redimensionamento da janela
window.addEventListener('resize', setSlidePosition);

// Auto-play (opcional)
setInterval(() => {
    const nextSlide = slides[currentSlideIndex + 1] || slides[0];
    moveToSlide(carouselTrack, nextSlide);
}, 6000); // Muda a cada 6 segundos