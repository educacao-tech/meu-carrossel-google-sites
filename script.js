document.addEventListener('DOMContentLoaded', () => {
    // --- 2. SELETORES E VARIÁVEIS GLOBAIS ---
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    let slides = []; // Será preenchido após a geração dos slides
    let currentIndex = 0;
    let autoPlayInterval = null;

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

        publishedNews.forEach((newsItem, index) => {
            const slideId = `slide${index + 1}`;
            const slideTitleId = `${slideId}-title`;
            const slideHTML = `
                <div class="carousel-slide" role="tabpanel" id="${slideId}" aria-labelledby="${slideTitleId}">
                    <img class="slide-image" src="${newsItem.imageUrl}" alt="${newsItem.altText}">
                    <div class="slide-content">
                        <p class="slide-date">${newsItem.displayDate}</p>
                        <h3 class="slide-title" id="${slideTitleId}">${newsItem.title}</h3>
                        <a href="${newsItem.link}" target="_blank" class="read-more-btn">${newsItem.readMoreText}</a>
                    </div>
                </div>
            `;
            carouselTrack.innerHTML += slideHTML;
        });
        slides = Array.from(carouselTrack.children);
    };

    // Gera os pontos de navegação
    const generateDots = () => {
        slides.forEach((_, index) => {
            const dot = document.createElement('button'); // Usar <button> é melhor para acessibilidade
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', `slide${index + 1}`);
            dot.setAttribute('aria-label', `Ir para a notícia ${index + 1}`);
            dot.addEventListener('click', () => {
                moveTo(index);
                resetAutoPlay();
            });
            carouselDotsContainer.appendChild(dot);
        });
    };

    // Atualiza a aparência do ponto ativo
    const updateDots = (targetIndex) => {
        const dots = Array.from(carouselDotsContainer.children);
        dots.forEach((dot, index) => dot.classList.toggle('active', index === targetIndex));
    };

    // Move o carrossel para o índice alvo
    const moveTo = (targetIndex) => {
        const targetSlide = slides[targetIndex];
        carouselTrack.style.transform = `translateX(-${targetSlide.offsetLeft}px)`;
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

        // Define a largura do track para acomodar todos os slides
        carouselTrack.style.width = `${slides.length * 100}%`;

        generateDots();
        moveTo(0); // Posiciona no slide inicial

        // Event Listeners para os botões
        prevButton.addEventListener('click', () => {
            const newIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
            moveTo(newIndex);
            resetAutoPlay();
        });

        nextButton.addEventListener('click', () => {
            const newIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
            moveTo(newIndex);
            resetAutoPlay();
        });

        // Ajusta a posição do carrossel ao redimensionar a janela
        window.addEventListener('resize', () => {
            moveTo(currentIndex);
        });

        // Inicia o auto-play
        resetAutoPlay();
    };

    init();
});
