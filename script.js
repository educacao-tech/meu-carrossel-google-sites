const carouselContainer = document.querySelector('.carousel-container');
const carouselTrack = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide')); // Array dos slides REAIS
const nextButton = document.querySelector('.next');
const prevButton = document.querySelector('.prev');
const dotsContainer = document.querySelector('.carousel-dots');

let slideWidth;
let currentSlideIndex = 0; // Índice do slide atual (0 para o primeiro, 1 para o segundo)
let autoPlayInterval;

// Função para definir a largura dos slides e a posição inicial do carrossel
const setSlidePosition = () => {
    // Garante que o carrossel funciona mesmo com poucas imagens
    if (slides.length === 0) return;

    slideWidth = slides[0].getBoundingClientRect().width; // Pega a largura do primeiro slide
    
    // Posiciona cada slide lado a lado
    slides.forEach((slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    });

    // Move o track para exibir o slide inicial (currentSlideIndex)
    carouselTrack.style.transform = 'translateX(-' + (slideWidth * currentSlideIndex) + 'px)';
};

// Cria os pontos de navegação (dots)
const createDots = () => {
    dotsContainer.innerHTML = ''; // Limpa os dots existentes para recriar
    if (slides.length <= 1) { // Não cria dots se houver 1 ou 0 slides
        dotsContainer.style.display = 'none';
        return;
    } else {
        dotsContainer.style.display = 'block'; // Garante que os dots apareçam se houver mais de um slide
    }

    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', 'false');
        dotsContainer.appendChild(dot);
    });
    updateDots(currentSlideIndex); // Atualiza o dot ativo
    slides[currentSlideIndex].classList.add('active'); // Marca o slide inicial como ativo
};

// Atualiza o estado dos pontos de navegação
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
    // Calcula a nova posição X do carrossel
    const newPosition = -slideWidth * targetIndex;
    track.style.transform = 'translateX(' + newPosition + 'px)';
    
    currentSlideIndex = targetIndex;
    updateDots(currentSlideIndex);

    // Remove a classe 'active' de todos e adiciona ao slide atual
    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentSlideIndex].classList.add('active');
};

// Inicia ou reinicia o auto-play
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
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0; // Volta para o primeiro slide
    }
    moveToSlide(carouselTrack, nextIndex);
    startAutoPlay(); // Reinicia o auto-play
});

// Evento de clique no botão "Anterior"
prevButton.addEventListener('click', () => {
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) {
        prevIndex = slides.length - 1; // Vai para o último slide
    }
    moveToSlide(carouselTrack, prevIndex);
    startAutoPlay(); // Reinicia o auto-play
});

// Evento de clique nos pontos de navegação
dotsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('dot')) {
        const targetIndex = parseInt(e.target.dataset.index);
        moveToSlide(carouselTrack, targetIndex);
        startAutoPlay(); // Reinicia o auto-play
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

// Inicializa o carrossel quando o DOM é completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    setSlidePosition(); // Define a posição inicial dos slides
    createDots(); // Cria os pontos de navegação
    startAutoPlay(); // Inicia o auto-play
    // Esconde os botões de navegação se houver apenas um slide
    if (slides.length <= 1) {
        nextButton.style.display = 'none';
        prevButton.style.display = 'none';
        // dotsContainer display já é tratado em createDots()
    } else {
        nextButton.style.display = 'flex'; // Certifica que aparecem se houver mais de um
        prevButton.style.display = 'flex';
    }
});

// Atualiza a posição dos slides e recria os dots ao redimensionar a janela
window.addEventListener('resize', () => {
    setSlidePosition();
    createDots(); // Recria os dots para garantir que correspondam ao número de slides atual
});
