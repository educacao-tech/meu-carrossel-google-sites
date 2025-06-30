document.addEventListener('DOMContentLoaded', () => {
    const carouselTrack = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const dotsContainer = document.querySelector('.carousel-dots');

    let currentIndex = 0;
    // Recalcula a largura do slide em tempo real
    const getSlideWidth = () => slides[0].clientWidth; 
    let slideWidth = getSlideWidth();
    let autoSlideInterval;

    // Função para atualizar a posição do carrossel
    const updateCarousel = () => {
        carouselTrack.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
        updateDots();
    };

    // Função para criar e atualizar os pontos de navegação
    const createDots = () => {
        dotsContainer.innerHTML = ''; // Limpa os dots existentes
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', `slide${index + 1}`);
            if (index === currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.setAttribute('aria-selected', 'false');
            }
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
                resetAutoSlide();
            });
            dotsContainer.appendChild(dot);
        });
    };

    const updateDots = () => {
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
                dot.setAttribute('aria-selected', 'true');
            } else {
                dot.classList.remove('active');
                dot.setAttribute('aria-selected', 'false');
            }
        });
    };

    // Navegação para o próximo slide
    const goToNextSlide = () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    };

    // Navegação para o slide anterior
    const goToPrevSlide = () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    };

    // Event listeners para os botões de navegação
    nextButton.addEventListener('click', () => {
        goToNextSlide();
        resetAutoSlide();
    });

    prevButton.addEventListener('click', () => {
        goToPrevSlide();
        resetAutoSlide();
    });

    // Função para iniciar a passagem automática de slides
    const startAutoSlide = () => {
        autoSlideInterval = setInterval(goToNextSlide, 5000); // Muda a cada 5 segundos
    };

    // Função para resetar (reiniciar) a passagem automática
    const resetAutoSlide = () => {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    };

    // Ajusta a largura dos slides em caso de redimensionamento da janela
    window.addEventListener('resize', () => {
        slideWidth = getSlideWidth(); // Recalcula a largura ao redimensionar
        updateCarousel(); // Reajusta a posição para a nova largura
    });

    // Inicialização do carrossel
    createDots(); // Cria os dots na inicialização
    updateCarousel(); // Garante que o carrossel comece no slide correto
    startAutoSlide(); // Inicia a passagem automática

    // Pausa a passagem automática ao passar o mouse sobre o carrossel
    carouselTrack.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
    carouselTrack.addEventListener('mouseleave', startAutoSlide);

    // Adiciona funcionalidade de navegação por teclado (setas)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            goToPrevSlide();
            resetAutoSlide();
        } else if (event.key === 'ArrowRight') {
            goToNextSlide();
            resetAutoSlide();
        }
    });

    // Adiciona funcionalidade de deslizar (swipe) para dispositivos móveis
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        if (touchEndX < touchStartX - 50) { // Deslize para a esquerda (próximo)
            goToNextSlide();
            resetAutoSlide();
        }
        if (touchEndX > touchStartX + 50) { // Deslize para a direita (anterior)
            goToPrevSlide();
            resetAutoSlide();
        }
    });
});
