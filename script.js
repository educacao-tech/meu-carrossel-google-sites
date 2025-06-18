const carouselContainer = document.querySelector('.carousel-container');
const carouselTrack = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');
const dotsContainer = document.querySelector('.carousel-dots');

let slideWidth;
let currentSlideIndex = 0;
let autoPlayInterval;

// Define a largura dos slides e a posição inicial do carrossel
const setSlidePosition = () => {
    if (slides.length === 0) return;

    // A largura de cada slide é a largura visível do container
    slideWidth = carouselContainer.getBoundingClientRect().width; 
    
    // Posiciona cada slide horizontalmente
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
        slide.style.width = slideWidth + 'px'; // Garante que cada slide tenha a largura correta
    });

    // Move o "track" para exibir o slide inicial
    carouselTrack.style.transform = 'translateX(-' + (slideWidth * currentSlideIndex) + 'px)';
};

// Cria os pontos de navegação (dots) na parte inferior
const createDots = () => {
    dotsContainer.innerHTML = ''; // Limpa pontos existentes
    if (slides.length <= 1) { // Não cria dots se houver 1 ou 0 slides
        dotsContainer.style.display = 'none';
        return;
    } else {
        dotsContainer.style.display = 'block'; // Garante que os dots apareçam se houver mais de um
    }

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', 'false');
        dotsContainer.appendChild(dot);
    });
    updateDots(currentSlideIndex); // Ativa o dot do slide atual
    slides[currentSlideIndex].classList.add('active'); // Marca o slide inicial como ativo
};

// Atualiza o estado visual dos pontos de navegação
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

// Move o carrossel para um slide específico
const moveToSlide = (track, targetIndex) => {
    const newPosition = -slideWidth * targetIndex;
    track.style.transform = 'translateX(' + newPosition + 'px)';
    
    currentSlideIndex = targetIndex;
    updateDots(currentSlideIndex);

    slides.forEach(slide => slide.classList.remove('active')); // Remove 'active' de todos
    slides[currentSlideIndex].classList.add('active'); // Adiciona 'active' ao slide atual
};

// Inicia ou reinicia o auto-play do carrossel
const startAutoPlay = () => {
    clearInterval(autoPlayInterval); // Limpa qualquer auto-play anterior
    if (slides.length <= 1) return; // Não faz auto-play se houver 1 ou 0 slides

    autoPlayInterval = setInterval(() => {
        let nextIndex = currentSlideIndex + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0; // Volta para o primeiro slide se for o último
        }
        moveToSlide(carouselTrack, nextIndex);
    }, 6000); // Muda a cada 6 segundos
};

// Evento de clique no botão "Próximo"
nextButton.addEventListener('click', () => {
    if (slides.length <= 1) return;
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0; // Volta para o primeiro slide
    }
    moveToSlide(carouselTrack, nextIndex);
    startAutoPlay(); // Reinicia o auto-play ao clicar
});

// Evento de clique no botão "Anterior"
prevButton.addEventListener('click', () => {
    if (slides.length <= 1) return;
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) {
        prevIndex = slides.length - 1; // Vai para o último slide
    }
    moveToSlide(carouselTrack, prevIndex);
    startAutoPlay(); // Reinicia o auto-play ao clicar
});

// Evento de clique nos pontos de navegação
dotsContainer.addEventListener('click', e => {
    if (slides.length <= 1) return;
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        moveToSlide(carouselTrack, targetIndex);
        startAutoPlay(); // Reinicia o auto-play ao clicar no dot
    }
});

// Pausa o auto-play ao passar o mouse sobre o carrossel
carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoPlayInterval);
});

// Retoma o auto-play ao tirar o mouse do carrossel
carouselContainer.addEventListener('mouseleave', () => {
    startAutoPlay();
});

// Inicializa o carrossel quando o HTML é completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition(); // Define as posições iniciais
    createDots(); // Cria os dots de navegação
    startAutoPlay(); // Inicia o auto-play
    
    // Esconde os botões se houver apenas um slide
    if (slides.length <= 1) {
        nextButton.style.display = 'none';
        prevButton.style.display = 'none';
    } else {
        nextButton.style.display = 'flex'; // Garante que apareçam se houver mais de um
        prevButton.style.display = 'flex';
    }
});

// Atualiza o carrossel ao redimensionar a janela
window.addEventListener('resize', () => {
    setSlidePosition();
    createDots();
});
