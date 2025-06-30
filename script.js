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

    // Função para mostrar o spinner e adicionar a classe 'loading'
    const showSpinner = (slideElement) => {
        slideElement.classList.add('loading'); 
    };

    // Função para ocultar o spinner e remover a classe 'loading'
    const hideSpinner = (slideElement) => {
        slideElement.classList.remove('loading');
    };

    // Função para carregar uma imagem e gerenciar o spinner
    const loadImage = (imgElement, slideElement) => {
        // Se a imagem ainda não está completa ou o src está diferente (caso o carrossel mude as imagens dinamicamente)
        // Usamos imgElement.naturalWidth === 0 para verificar se a imagem ainda não carregou corretamente
        if (!imgElement.complete || imgElement.naturalWidth === 0) { 
            showSpinner(slideElement);
            imgElement.onload = () => {
                hideSpinner(slideElement);
            };
            imgElement.onerror = () => {
                console.error('Erro ao carregar imagem:', imgElement.src);
                hideSpinner(slideElement); // Esconde o spinner mesmo com erro
            };
        } else {
            hideSpinner(slideElement); // Se já estiver carregada, apenas esconde o spinner
        }
    };

    // Função para atualizar a posição do carrossel
    const updateCarousel = () => {
        carouselTrack.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
        updateDots();
        // Lógica para carregar a imagem do slide atual
        const currentSlide = slides[currentIndex];
        const currentImage = currentSlide.querySelector('img');
        if (currentImage) {
            // Garante que o spinner apareça para o slide ativo enquanto a imagem carrega
            loadImage(currentImage, currentSlide);
        }
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
    createDots();
    updateCarousel(); // Chama updateCarousel para carregar a primeira imagem e mostrar/esconder spinner
    startAutoSlide();

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

    // Carrega todas as imagens de uma vez ao carregar a página (opcional, para garantir que os spinners apareçam)
    slides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img) {
            loadImage(img, slide);
        }
    });
});document.addEventListener('DOMContentLoaded', () => {
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

    // Função para mostrar o spinner e adicionar a classe 'loading'
    const showSpinner = (slideElement) => {
        slideElement.classList.add('loading'); 
    };

    // Função para ocultar o spinner e remover a classe 'loading'
    const hideSpinner = (slideElement) => {
        slideElement.classList.remove('loading');
    };

    // Função para carregar uma imagem e gerenciar o spinner
    const loadImage = (imgElement, slideElement) => {
        // Se a imagem ainda não está completa ou o src está diferente (caso o carrossel mude as imagens dinamicamente)
        // Usamos imgElement.naturalWidth === 0 para verificar se a imagem ainda não carregou corretamente
        if (!imgElement.complete || imgElement.naturalWidth === 0) { 
            showSpinner(slideElement);
            imgElement.onload = () => {
                hideSpinner(slideElement);
            };
            imgElement.onerror = () => {
                console.error('Erro ao carregar imagem:', imgElement.src);
                hideSpinner(slideElement); // Esconde o spinner mesmo com erro
            };
        } else {
            hideSpinner(slideElement); // Se já estiver carregada, apenas esconde o spinner
        }
    };

    // Função para atualizar a posição do carrossel
    const updateCarousel = () => {
        carouselTrack.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
        updateDots();
        // Lógica para carregar a imagem do slide atual
        const currentSlide = slides[currentIndex];
        const currentImage = currentSlide.querySelector('img');
        if (currentImage) {
            // Garante que o spinner apareça para o slide ativo enquanto a imagem carrega
            loadImage(currentImage, currentSlide);
        }
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
    createDots();
    updateCarousel(); // Chama updateCarousel para carregar a primeira imagem e mostrar/esconder spinner
    startAutoSlide();

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

    // Carrega todas as imagens de uma vez ao carregar a página (opcional, para garantir que os spinners apareçam)
    slides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img) {
            loadImage(img, slide);
        }
    });
});
