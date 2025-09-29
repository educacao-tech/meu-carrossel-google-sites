document.addEventListener('DOMContentLoaded', () => {
    // --- 2. SELETORES E VARIÁVEIS GLOBAIS ---
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    let slides = []; // Será preenchido após a geração dos slides
    let currentIndex = 0; // Começa no primeiro slide
    let autoPlayInterval = null;
    // Variáveis para o controle do swipe
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // Mínimo de pixels para considerar um swipe


    // --- 3. FUNÇÕES DO CARROSSEL ---

    // Gera o HTML dos slides a partir dos dados (newsData)
    const generateCarouselSlides = (newsData) => {
        const publishedNews = newsData
            .filter(item => item.published)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (publishedNews.length === 0) {
            carouselContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhuma notícia disponível no momento.</p>';
            return;
        }

        let slidesHTML = '';
        publishedNews.forEach((newsItem, index) => {
            const slideId = `slide${index + 1}`;
            const slideTitleId = `${slideId}-title`;
            // Adicionado loading="lazy" para performance
            // O HTML é concatenado na variável slidesHTML
            slidesHTML += `
                <div class="carousel-slide" role="tabpanel" id="${slideId}" aria-labelledby="${slideTitleId}">
                    <a href="${newsItem.link}" target="_blank" class="slide-link" aria-label="Leia a notícia: ${newsItem.title}" tabindex="-1">
                        <img class="slide-image" src="${newsItem.imageUrl}" alt="${newsItem.altText}" loading="lazy">
                        <div class="slide-content">
                            <div class="slide-title" id="${slideTitleId}">${newsItem.title}</div>
                        </div>
                    </a>
                </div>
            `;
        });
        carouselTrack.innerHTML = slidesHTML; // Inserção única no DOM
        slides = Array.from(carouselTrack.children);
    };

    // Gera os pontos de navegação
    const generateDots = () => {
        const numDots = slides.length; // Um ponto por slide
        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('button'); // Usar <button> é melhor para acessibilidade
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Ir para a notícia ${i + 1}`);
            dot.addEventListener('click', () => {
                moveTo(i);
                resetAutoPlay();
            });
            carouselDotsContainer.appendChild(dot);
        }
    };

    // Atualiza a aparência do ponto ativo
    const updateDots = (targetIndex) => {
        const dots = Array.from(carouselDotsContainer.children);
        dots.forEach((dot, index) => dot.classList.toggle('active', index === targetIndex));
    };

    // Move o carrossel para o índice alvo
    const moveTo = (targetIndex) => {
        const slideWidth = slides[0].offsetWidth;
        const newTransform = -targetIndex * slideWidth;
        carouselTrack.style.transform = `translateX(${newTransform}px)`;

        // A classe 'active' não é mais necessária para o estilo de slide único

        currentIndex = targetIndex;
        updateDots(targetIndex);
    };
    
    // Reinicia o autoplay
    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => nextButton.click(), 5000);
    };

    // --- 4. INICIALIZAÇÃO E EVENTOS ---
    const init = async () => {
        try {
            const response = await fetch('news.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newsData = await response.json();
            generateCarouselSlides(newsData);
        } catch (error) {
            console.error("Não foi possível carregar as notícias:", error);
            carouselContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Erro ao carregar notícias.</p>';
            return;
        }

        if (slides.length <= 1) {
            if(slides.length === 1) generateDots(); // Gera o ponto mesmo para um slide
            // Esconde os botões de navegação se houver 1 ou menos slides
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            return; // Não inicializa botões e autoplay se não houver slides ou apenas um
        }

        generateDots();
        moveTo(0); // Posiciona no slide inicial

        // Event Listeners para os botões
        prevButton.addEventListener('click', () => {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
            moveTo(newIndex);
            resetAutoPlay();
        });

        nextButton.addEventListener('click', () => {
            const newIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
            moveTo(newIndex);
            resetAutoPlay();
        });

        // Ajusta a posição do carrossel ao redimensionar a janela
        window.addEventListener('resize', () => {
            moveTo(currentIndex);
        });

        // Melhoria: Pausa o autoplay ao passar o mouse
        carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselContainer.addEventListener('mouseleave', () => resetAutoPlay());

        // --- Melhoria: Navegação por Teclado ---
        carouselContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault(); // Previne o scroll da página
                prevButton.click();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault(); // Previne o scroll da página
                nextButton.click();
            }
        });

        // --- Melhoria: Navegação por Gestos (Swipe) ---
        carouselTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        const handleSwipe = () => {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) < swipeThreshold) return; // Ignora se o swipe for muito curto

            if (swipeDistance < 0) {
                // Swipe para a esquerda
                nextButton.click();
            } else {
                // Swipe para a direita
                prevButton.click();
            }
        };

        // Inicia o auto-play
        resetAutoPlay();
    };

    init();
});
