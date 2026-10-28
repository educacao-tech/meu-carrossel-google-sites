document.addEventListener('DOMContentLoaded', () => {
    // --- 2. SELETORES E VARIÁVEIS GLOBAIS ---
    const carouselContainer = document.querySelector('.carousel-container');
    const carouselTrack = document.querySelector('.carousel-track');
    const spinner = document.querySelector('.spinner');
    const carouselCounter = document.querySelector('.carousel-counter');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const carouselDotsContainer = document.querySelector('.carousel-dots');
    const progressBar = document.querySelector('.autoplay-progress-bar');
    const progressCircle = document.querySelector('.progress-ring__bar');
    const liveAnnouncer = document.getElementById('live-announcer');
    const playPauseBtn = document.querySelector('.carousel-play-pause');
    let slides = []; // Será preenchido após a geração dos slides
    let currentIndex = 0; // Começa no primeiro slide
    let autoPlayInterval = null;
    let isPausedManually = false;
    // Variáveis para o controle do swipe
    let touchStartX = 0;

    let touchEndX = 0;
    const swipeThreshold = 50; // Mínimo de pixels para considerar um swipe


    // --- 3. FUNÇÕES DO CARROSSEL ---

    // Helper para escapar strings HTML e evitar quebras de layout ou problemas de segurança
    const escapeHTML = (str) => {
        if (!str) return "";
        return str.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        })[m]);
    };

    // Gera o HTML dos slides a partir dos dados (newsData)
    const generateCarouselSlides = (newsData) => {
        if (!Array.isArray(newsData)) {
            console.error("Dados inválidos: newsData deve ser um array.");
            return;
        }

        const publishedNews = newsData
            .filter(item => item.published)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (publishedNews.length === 0) {
            carouselContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhuma notícia disponível no momento.</p>';
            if (spinner) spinner.style.display = 'none';
            return;
        }

        // Formatador de data para Português do Brasil
        const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        let slidesHTML = '';
        publishedNews.forEach((newsItem, index) => {
            // Cria o ícone do Instagram apenas se o link existir
            const instagramIconHTML = newsItem.instagramLink
                ? `<a href="${newsItem.instagramLink}" target="_blank" rel="noopener noreferrer" class="instagram-icon" aria-label="Ver no Instagram" onclick="event.stopPropagation()" tabindex="-1">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                   </a>`
                : '';

            // Formata a data automaticamente se displayDate não existir ou para garantir padrão
            let formattedDate = newsItem.displayDate;
            if (newsItem.date) {
                const dateObj = new Date(newsItem.date + 'T00:00:00'); // Garante fuso local/correto
                formattedDate = dateFormatter.format(dateObj);
            }

            const slideId = `slide${index + 1}`;
            const slideTitleId = `${slideId}-title`;
            const escapedTitle = escapeHTML(newsItem.title);
            const escapedDescription = escapeHTML(newsItem.description);

            slidesHTML += `
                <div class="carousel-slide" role="tabpanel" id="${slideId}" aria-labelledby="${slideTitleId}">
                    <div class="slide-body">
                        <a 
                            href="${newsItem.link}" 
                            target="_blank" 
                            class="slide-link" 
                            aria-label="Leia a notícia: ${escapedTitle}" 
                            tabindex="-1"
                            data-description="${escapedDescription}">
                            <div class="slide-date">${formattedDate}</div>
                            <div class="slide-image-wrapper">
                                <div class="slide-image-bg" style="background-image: url('${newsItem.imageUrl}');" aria-hidden="true"></div>
                                <img class="slide-image" src="${newsItem.imageUrl}" alt="${newsItem.altText}" loading="${index === 0 ? 'eager' : 'lazy'}">
                            </div>
                            <div class="slide-content" data-read-more="${newsItem.readMoreText}"> 
                                <div class="slide-title" id="${slideTitleId}">${newsItem.title}</div>
                                <p class="slide-description"></p>
                            </div>
                        </a>
                        ${instagramIconHTML}
                    </div>
                </div>
            `;
        });
        carouselTrack.innerHTML = slidesHTML; // Inserção única no DOM
        slides = Array.from(carouselTrack.children);

        // Enquadramento automático e tratamento de erro de imagens
        slides.forEach(slide => {
            const img = slide.querySelector('.slide-image');
            const bg = slide.querySelector('.slide-image-bg');
            const wrapper = slide.querySelector('.slide-image-wrapper');
            if (img) {
                const applyAspect = () => {
                    if (img.naturalWidth && img.naturalHeight && wrapper) {
                        wrapper.style.setProperty('--img-aspect', `${img.naturalWidth} / ${img.naturalHeight}`);
                    }
                };

                if (img.complete && img.naturalWidth > 0) {
                    applyAspect();
                } else {
                    img.addEventListener('load', applyAspect);
                }

                img.addEventListener('error', () => {
                    img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22450%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f2f5%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%23999%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EImagem%20Indispon%C3%ADvel%3C/text%3E%3C/svg%3E';
                    if (bg) bg.style.backgroundImage = 'none';
                });
            }
        });
    };

    // Gera os pontos de navegação
    const generateDots = () => {
        const numDots = slides.length; // Um ponto por slide
        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('button'); // Usar <button> é melhor para acessibilidade
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', slides[i].id); // CORREÇÃO: Usar o ID do slide correspondente
            dot.setAttribute('aria-label', `Ir para a notícia ${i + 1}`);
            dot.setAttribute('tabindex', i === 0 ? '0' : '-1'); // Apenas o primeiro dot é focado inicialmente via Tab
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
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === targetIndex);
            dot.setAttribute('aria-selected', index === targetIndex ? 'true' : 'false');
            dot.setAttribute('aria-current', index === targetIndex ? 'true' : 'false');
            dot.setAttribute('tabindex', index === targetIndex ? '0' : '-1'); // Atualiza qual dot recebe foco via Tab
        });
    };

    // Atualiza o contador de slides
    const updateCounter = (current, total) => {
        if (carouselCounter) {
            // Formato visual: "1 / 10". Texto para leitores de tela: "Notícia 1 de 10".
            carouselCounter.innerHTML = `<span class="visually-hidden">Notícia ${current + 1} de ${total}</span><span aria-hidden="true">${current + 1} / ${total}</span>`;
        }
    };

    // Move o carrossel para o índice alvo
    const moveTo = (targetIndex, withAnimation = true) => {
        const newTransform = -targetIndex * 100; // Move por 100% da largura do slide

        // Controla a animação de transição
        carouselTrack.style.transition = withAnimation ? 'transform 0.5s ease-in-out' : 'none';
        carouselTrack.style.transform = `translateX(${newTransform}%)`;
        // Garante que a animação seja reativada após um ajuste sem animação
        if (!withAnimation) carouselTrack.offsetHeight; // Força o navegador a aplicar o estilo 'none'

        // Gerencia a classe ativa e atributos ARIA para animações e acessibilidade
        slides.forEach((slide, index) => {
            const isActive = index === targetIndex;
            const descriptionEl = slide.querySelector('.slide-description');
            if (isActive && descriptionEl) {
                const link = slide.querySelector('.slide-link');
                descriptionEl.innerHTML = link.dataset.description || '';
            }

            // Garante que apenas elementos no slide ativo sejam focáveis via teclado
            const focusableElements = slide.querySelectorAll('a, button, [tabindex]');
            focusableElements.forEach(el => {
                el.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', !isActive);
        });

        currentIndex = targetIndex;
        updateDots(targetIndex);
        updateCounter(targetIndex, slides.length);
        
        // Anuncia o título da notícia para leitores de tela
        if (liveAnnouncer && slides[targetIndex]) {
            liveAnnouncer.textContent = `Notícia atual: ${slides[targetIndex].querySelector('.slide-title').textContent}`;
        }
        resetProgressBar();

        // Restaura a animação após a execução
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';
    };
    
    // --- Melhoria: Função Debounce ---
    const debounce = (func, delay = 250) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    };

    // Reinicia a animação da barra de progresso
    const resetProgressBar = () => {
        if (!progressBar) return;
        
        [progressBar, progressCircle].forEach(el => {
            if (!el) return;
            el.style.transition = 'none';
            if (el === progressBar) {
                el.style.width = '0%';
                el.style.backgroundColor = 'var(--primary-color)'; // Reseta para a cor original (azul)
            } else {
                el.style.strokeDashoffset = '88';
                el.style.stroke = 'white'; // Reseta a cor para branco no início
            }
            
            el.offsetHeight; // Force reflow
            
            if (!isPausedManually) {
                if (el === progressBar) {
                    // Aplica a transição de largura e cor sincronizada com o anel
                    el.style.transition = 'width 5000ms linear, background-color 1000ms linear 4000ms';
                    el.style.width = '100%';
                    el.style.backgroundColor = '#28a745'; // Muda para verde no final
                } else {
                    // Aplica a transição de cor com delay de 4 segundos
                    el.style.transition = 'stroke-dashoffset 5000ms linear, stroke 1000ms linear 4000ms';
                    el.style.strokeDashoffset = '0';
                    el.style.stroke = '#28a745'; // Verde (pode usar var(--primary-color) se preferir)
                }
            }
        });
    };

    // Reinicia o autoplay
    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        if (!isPausedManually) {
            autoPlayInterval = setInterval(() => nextButton.click(), 5000);
            resetProgressBar();
        }
    };

    // --- 4. INICIALIZAÇÃO E EVENTOS ---
    const init = async () => {
        // Exibe Skeleton Screen enquanto carrega
        carouselTrack.innerHTML = `
            <div class="carousel-slide">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text short"></div>
            </div>
        `;

        try {
            const response = await fetch('news.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newsData = await response.json();
            if (spinner) spinner.style.display = 'none'; // Esconde o spinner
            generateCarouselSlides(newsData);
        } catch (error) {
            console.error("Não foi possível carregar as notícias:", error);
            carouselContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Erro ao carregar notícias.</p>';
            return;
        }

        // Se houver apenas um slide, exiba-o estaticamente sem controles de navegação.
        if (slides.length <= 1) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            carouselDotsContainer.style.display = 'none';
            if (slides.length === 1) {
                moveTo(0); // Garante que o único slide seja exibido corretamente
            }
            return; // Encerra a inicialização do carrossel interativo
        }

        generateDots();
        
        // Melhora a acessibilidade dos botões de navegação
        prevButton.setAttribute('aria-controls', 'carousel-track');
        nextButton.setAttribute('aria-controls', 'carousel-track');
        carouselContainer.setAttribute('aria-roledescription', 'carrossel');

        // Controle de Play/Pause
        if (playPauseBtn) {
            const iconSpan = playPauseBtn.querySelector('.play-pause-icon');
            playPauseBtn.addEventListener('click', () => {
                isPausedManually = !isPausedManually;
                playPauseBtn.setAttribute('aria-pressed', isPausedManually);
                playPauseBtn.setAttribute('aria-label', isPausedManually ? 'Retomar reprodução automática' : 'Pausar reprodução automática');
                
                if (iconSpan) {
                    iconSpan.textContent = isPausedManually ? '▶' : '⏸';
                }
                
                if (isPausedManually) {
                    clearInterval(autoPlayInterval);
                    // Pausa visualmente as barras
                    if (progressBar) progressBar.style.transition = 'none';
                    if (progressCircle) progressCircle.style.transition = 'none';
                } else {
                    resetAutoPlay();
                }
            });
        }

        // O moveTo(0) já chama updateCounter e updateDots
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
        window.addEventListener('resize', debounce(() => {
            // Recalcula a posição sem animação para um ajuste suave
            moveTo(currentIndex, false);
        }));

        // --- Navegação por Teclado ---
        carouselContainer.addEventListener('keydown', (e) => {
            const dots = Array.from(carouselDotsContainer.children);
            const isDotFocused = dots.includes(document.activeElement);

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault(); // Evita scroll da página
                
                let nextIndex;
                if (e.key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % slides.length;
                } else {
                    nextIndex = (currentIndex - 1 + slides.length) % slides.length;
                }

                moveTo(nextIndex);
                resetAutoPlay();

                // Se o foco já estava nos dots, movemos o foco visual para o novo dot ativo
                // Isso segue o padrão de design "Tabs" do ARIA
                if (isDotFocused) {
                    setTimeout(() => {
                        carouselDotsContainer.children[nextIndex].focus();
                    }, 10);
                }
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

    // --- Melhoria: Pausar autoplay no hover ---
    carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    carouselContainer.addEventListener('mouseleave', () => resetAutoPlay());
    // Pausa também quando o usuário foca em um elemento dentro do carrossel
    carouselContainer.addEventListener('focusin', () => clearInterval(autoPlayInterval));
    carouselContainer.addEventListener('focusout', () => resetAutoPlay());

    // --- Melhoria: Pausar autoplay quando a aba não estiver visível ---
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(autoPlayInterval);
        } else {
            resetAutoPlay();
        }
    });

    init();
});
