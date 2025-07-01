document.addEventListener('DOMContentLoaded', () => {
    const carouselTrack = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const carouselDotsContainer = document.querySelector('.carousel-dots');

    let currentIndex = 0;
    const slideWidth = slides[0].offsetWidth; // Largura de um slide

    // Função para mover o carrossel para um slide específico
    const moveToSlide = (track, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.offsetLeft + 'px)';
    };

    // Função para atualizar os pontos de navegação
    const updateDots = (dotsContainer, targetIndex) => {
        const dots = Array.from(dotsContainer.children);
        dots.forEach((dot, index) => {
            if (index === targetIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    // Função para gerar os pontos de navegação dinamicamente
    const generateDots = () => {
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', `slide${index + 1}`);
            dot.setAttribute('aria-label', `Ir para o slide ${index + 1}`);
            dot.addEventListener('click', () => {
                currentIndex = index;
                moveToSlide(carouselTrack, slides[currentIndex]);
                updateDots(carouselDotsContainer, currentIndex);
            });
            carouselDotsContainer.appendChild(dot);
        });
        updateDots(carouselDotsContainer, currentIndex); // Ativa o primeiro ponto
    };

    // Event Listeners para os botões de navegação
    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = slides.length - 1; // Volta para o último slide
        }
        moveToSlide(carouselTrack, slides[currentIndex]);
        updateDots(carouselDotsContainer, currentIndex);
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < slides.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0; // Volta para o primeiro slide
        }
        moveToSlide(carouselTrack, slides[currentIndex]);
        updateDots(carouselDotsContainer, currentIndex);
    });

    // Ajusta a posição do carrossel ao redimensionar a janela
    window.addEventListener('resize', () => {
        moveToSlide(carouselTrack, slides[currentIndex]);
    });

    // Inicializa os pontos ao carregar a página
    generateDots();

    // Opcional: Adiciona auto-play (descomente para ativar)
    // setInterval(() => {
    //     nextButton.click();
    // }, 5000); // Muda a cada 5 segundos
});
