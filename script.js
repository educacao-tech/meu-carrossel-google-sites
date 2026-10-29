document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURAÇÕES E ESTADO ---
    const CONFIG = {
        remoteUrl: 'https://educacao-tech.github.io/noticias_2025/news.json',
        localUrl: 'news.json',
        cacheKey: 'sme_carrossel_news_cache_v2',
        maxSlides: 6,
        fetchTimeoutMs: 3500,
        autoplayDelay: 5000
    };

    // --- 2. SELETORES GLOBAIS ---
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
    const categoryFiltersContainer = document.getElementById('category-filters');

    // Modal de Prévia Rápida
    const newsModal = document.getElementById('news-modal');
    const modalImage = document.getElementById('modal-image');
    const modalCategory = document.getElementById('modal-category');
    const modalDate = document.getElementById('modal-date');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalLink = document.getElementById('modal-link');

    // Estado da aplicação
    let allMasterNews = [];       // Lista completa de notícias consolidadas
    let currentFilteredNews = []; // Notícias após filtro ativo de categoria
    let activeCategory = 'all';   // Categoria selecionada
    let slides = [];              // Slides atuais do DOM
    let currentIndex = 0;
    let autoPlayInterval = null;
    let isPausedManually = false;
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;

    // Respeita preferência do usuário por movimento reduzido (Acessibilidade)
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        isPausedManually = true;
    }

    // --- 3. REGISTRO DE SERVICE WORKER (PWA & OFFLINE) ---
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
    }

    // --- 4. HELPERS E ANALYTICS ---

    // Telemetria anônima de cliques e engajamento
    const trackEvent = (action, label) => {
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', action, { event_label: label });
            }
            const logs = JSON.parse(sessionStorage.getItem('sme_news_analytics') || '[]');
            logs.push({ action, label, time: new Date().toISOString() });
            sessionStorage.setItem('sme_news_analytics', JSON.stringify(logs.slice(-50)));
        } catch (_) {}
    };

    // Comunica altura ao Google Sites para evitar barras de rolagem internas
    const sendHeightToParent = () => {
        try {
            const height = Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.scrollHeight
            );
            window.parent.postMessage({
                type: 'meu-carrossel-resize',
                source: 'meu-carrossel',
                height: height + 10
            }, '*');
        } catch (_) {}
    };

    if (window.ResizeObserver) {
        new ResizeObserver(() => sendHeightToParent()).observe(document.body);
    }

    // Toast de notificação para "Link copiado!"
    let toastTimeout = null;
    const showToast = (message = '✓ Link copiado com sucesso!') => {
        let toast = document.getElementById('copy-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copy-toast';
            toast.className = 'copy-toast';
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    };

    // Helper para escapar strings HTML
    const escapeHTML = (str) => {
        if (!str) return "";
        return String(str).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        })[m]);
    };

    // Classificação inteligente de categoria
    const getCategory = (item) => {
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        if (text.includes('matrícula') || text.includes('eja') || text.includes('inscrição') || text.includes('vagas')) return 'Matrículas';
        if (text.includes('alimentação') || text.includes('merenda') || text.includes('cozinha') || text.includes('cardápio')) return 'Alimentação';
        if (text.includes('tecnologia') || text.includes('inovação') || text.includes('digital') || text.includes('robótica')) return 'Tecnologia';
        if (text.includes('esporte') || text.includes('gincana') || text.includes('ginástica') || text.includes('clima')) return 'Esporte & Lazer';
        if (text.includes('leitura') || text.includes('livro') || text.includes('alfabetização') || text.includes('saresp') || text.includes('fluência')) return 'Pedagógico';
        if (text.includes('prêmio') || text.includes('reconhecimento') || text.includes('destaque') || text.includes('ouro') || text.includes('ods') || text.includes('mec') || text.includes('fórum')) return 'Destaque';
        return 'Geral';
    };

    // Estimativa do tempo de leitura da matéria
    const estimateReadingTime = (item) => {
        const text = `${item.title || ''} ${item.description || ''}`;
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 45));
        return `${minutes} min de leitura`;
    };

    // Converte data para timestamp numérico garantindo ordenação perfeita
    const getTimeFromItem = (item) => {
        if (!item) return 0;
        if (item.date) {
            const isoMatch = String(item.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoMatch) {
                return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])).getTime();
            }
            const timestamp = Date.parse(item.date);
            if (!isNaN(timestamp)) return timestamp;
        }
        if (item.displayDate) {
            const brMatch = String(item.displayDate).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (brMatch) {
                return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1])).getTime();
            }
            const meses = {
                janeiro: 0, fevereiro: 1, marco: 2, março: 2, abril: 3, maio: 4, junho: 5,
                julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
            };
            const textMatch = String(item.displayDate).toLowerCase().match(/(\d{1,2})\s+des+([a-zç]+)s+des+(\d{4})/);
            if (textMatch && meses[textMatch[2]] !== undefined) {
                return new Date(Number(textMatch[3]), meses[textMatch[2]], Number(textMatch[1])).getTime();
            }
        }
        return 0;
    };

    // Identifica se a notícia é recente
    const isRecentNews = (item, index) => {
        if (index === 0) return true;
        const time = getTimeFromItem(item);
        if (!time) return false;
        const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
    };

    const debounce = (func, delay = 250) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // --- 5. MODAL DE PRÉVIA RÁPIDA ---

    const openPreviewModal = (newsItem) => {
        if (!newsModal || !newsItem) return;
        trackEvent('preview_open', newsItem.title);

        modalImage.src = newsItem.imageUrl || '';
        modalImage.alt = newsItem.altText || newsItem.title || 'Imagem da notícia';
        modalCategory.textContent = getCategory(newsItem);
        
        let formattedDate = newsItem.displayDate || newsItem.date || '';
        modalDate.textContent = `${formattedDate} • ⏱️ ${estimateReadingTime(newsItem)}`;
        modalTitle.textContent = newsItem.title || '';
        modalDescription.textContent = newsItem.description || '';
        modalLink.href = newsItem.link || '#';

        newsModal.removeAttribute('hidden');
        // Força reflow para transição CSS suave
        newsModal.offsetHeight;
        newsModal.classList.add('active');

        // Pausa autoplay enquanto lê a prévia
        clearInterval(autoPlayInterval);
    };

    const closePreviewModal = () => {
        if (!newsModal) return;
        newsModal.classList.remove('active');
        setTimeout(() => {
            newsModal.setAttribute('hidden', '');
            resetAutoPlay();
        }, 300);
    };

    // Fechar modal ao clicar no botão fechar ou overlay
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]')) {
            closePreviewModal();
        }
    });

    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && newsModal && !newsModal.hasAttribute('hidden')) {
            closePreviewModal();
        }
    });

    // --- 6. RENDERIZAÇÃO DOS FILTROS POR CATEGORIA ---

    const renderCategoryFilters = () => {
        if (!categoryFiltersContainer || allMasterNews.length === 0) return;

        // Extrai categorias existentes e conta matérias
        const categoryCounts = { all: allMasterNews.length };
        allMasterNews.forEach(item => {
            const cat = getCategory(item);
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const categories = Object.keys(categoryCounts).filter(k => k !== 'all');

        let html = `<button type="button" class="filter-pill ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
            Todas <span aria-hidden="true">(${categoryCounts.all})</span>
        </button>`;

        categories.forEach(cat => {
            html += `<button type="button" class="filter-pill ${activeCategory === cat ? 'active' : ''}" data-category="${escapeHTML(cat)}">
                ${escapeHTML(cat)} <span aria-hidden="true">(${categoryCounts[cat]})</span>
            </button>`;
        });

        categoryFiltersContainer.innerHTML = html;

        // Event listener para as pílulas
        categoryFiltersContainer.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                if (cat === activeCategory) return;
                activeCategory = cat;
                trackEvent('filter_category', cat);

                categoryFiltersContainer.querySelectorAll('.filter-pill').forEach(b => {
                    b.classList.toggle('active', b.dataset.category === cat);
                });

                applyCurrentFilter();
            });
        });
    };

    const applyCurrentFilter = () => {
        if (activeCategory === 'all') {
            currentFilteredNews = allMasterNews.slice(0, CONFIG.maxSlides || undefined);
        } else {
            currentFilteredNews = allMasterNews
                .filter(item => getCategory(item) === activeCategory)
                .slice(0, CONFIG.maxSlides || undefined);
        }

        generateCarouselSlides(currentFilteredNews);
        setupInteractiveControls();
    };

    // --- 7. RENDERIZAÇÃO DOS SLIDES DO CARROSSEL ---

    const generateCarouselSlides = (newsData) => {
        if (!Array.isArray(newsData)) return;

        if (newsData.length === 0) {
            carouselTrack.innerHTML = '<div class="carousel-slide"><p style="text-align: center; padding: 40px; width: 100%; color: var(--text-color-secondary);">Nenhuma notícia nesta categoria no momento.</p></div>';
            slides = Array.from(carouselTrack.children);
            if (spinner) spinner.style.display = 'none';
            return;
        }

        const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        let slidesHTML = '';
        newsData.forEach((newsItem, index) => {
            let formattedDate = newsItem.displayDate;
            if (newsItem.date) {
                const dateObj = new Date(newsItem.date + 'T00:00:00');
                formattedDate = dateFormatter.format(dateObj);
            }

            const slideId = `slide${index + 1}`;
            const slideTitleId = `${slideId}-title`;
            const escapedTitle = escapeHTML(newsItem.title);
            const escapedDescription = escapeHTML(newsItem.description);
            const escapedLink = encodeURI(newsItem.link || '#');
            const readMoreText = escapeHTML(newsItem.readMoreText || 'Leia Mais');
            const altText = escapeHTML(newsItem.altText || newsItem.title || 'Imagem da notícia');

            // Badges
            const category = getCategory(newsItem);
            const isRecent = isRecentNews(newsItem, index);
            const recentBadgeHTML = isRecent ? '<span class="badge badge-recent">✨ Recente</span>' : '';
            const categoryBadgeHTML = category ? `<span class="badge badge-category">${escapeHTML(category)}</span>` : '';
            const readTime = estimateReadingTime(newsItem);

            // Ações de Compartilhamento
            const shareText = encodeURIComponent(`${newsItem.title}\n\nLeia mais em: ${newsItem.link}`);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

            const instagramIconHTML = newsItem.instagramLink
                ? `<a href="${escapeHTML(newsItem.instagramLink)}" target="_blank" rel="noopener noreferrer" class="action-btn instagram-icon" aria-label="Ver no Instagram" onclick="event.stopPropagation()" tabindex="-1" title="Ver no Instagram">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                   </a>`
                : '';

            const actionsHTML = `
                <div class="slide-actions" onclick="event.stopPropagation()">
                    <button type="button" class="action-btn preview-btn" data-news-idx="${index}" aria-label="Abrir prévia rápida" title="Prévia Rápida" tabindex="-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="action-btn whatsapp-btn" aria-label="Compartilhar notícia no WhatsApp" title="Compartilhar no WhatsApp" tabindex="-1" onclick="trackEvent('share_whatsapp', '${escapedTitle}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                    </a>
                    <button type="button" class="action-btn copy-btn" data-link="${escapedLink}" aria-label="Copiar link da notícia" title="Copiar Link" tabindex="-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    ${instagramIconHTML}
                </div>
            `;

            slidesHTML += `
                <div class="carousel-slide" role="tabpanel" id="${slideId}" aria-labelledby="${slideTitleId}">
                    <div class="slide-body">
                        <a 
                            href="${escapedLink}" 
                            target="_blank" 
                            class="slide-link" 
                            aria-label="Leia a notícia: ${escapedTitle}" 
                            tabindex="-1"
                            data-description="${escapedDescription}"
                            onclick="trackEvent('read_more_click', '${escapedTitle}')">
                            <div class="slide-date">${formattedDate} • ⏱️ ${readTime}</div>
                            <div class="slide-image-wrapper">
                                <div class="slide-badges">
                                    ${recentBadgeHTML}
                                    ${categoryBadgeHTML}
                                </div>
                                <div class="slide-image-bg" style="background-image: url('${newsItem.imageUrl}');" aria-hidden="true"></div>
                                <img class="slide-image" 
                                     src="${newsItem.imageUrl}" 
                                     alt="${altText}" 
                                     loading="${index === 0 ? 'eager' : 'lazy'}"
                                     fetchpriority="${index === 0 ? 'high' : 'auto'}">
                            </div>
                            <div class="slide-content" data-read-more="${readMoreText}"> 
                                <div class="slide-title" id="${slideTitleId}">${newsItem.title}</div>
                                <p class="slide-description"></p>
                            </div>
                        </a>
                        ${actionsHTML}
                    </div>
                </div>
            `;
        });

        carouselTrack.innerHTML = slidesHTML;
        slides = Array.from(carouselTrack.children);

        // Enquadramento e tratamento de erro de imagens
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

                if (img.complete && img.naturalWidth > 0) applyAspect();
                else img.addEventListener('load', applyAspect);

                img.addEventListener('error', () => {
                    img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22450%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%2323262e%22/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20fill%3D%22%23bbb%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EImagem%20Indispon%C3%ADvel%3C/text%3E%3C/svg%3E';
                    if (bg) bg.style.backgroundImage = 'none';
                });
            }
        });

        sendHeightToParent();
    };

    // Gera os pontos de navegação com miniaturas (Thumbnails)
    const generateDots = () => {
        carouselDotsContainer.innerHTML = '';
        const numDots = slides.length;
        for (let i = 0; i < numDots; i++) {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-controls', slides[i].id);
            dot.setAttribute('aria-label', `Ir para a notícia ${i + 1}`);
            dot.setAttribute('tabindex', i === 0 ? '0' : '-1');

            // Thumbnail tooltip para desktop
            const newsItem = currentFilteredNews[i];
            if (newsItem) {
                const thumb = document.createElement('div');
                thumb.className = 'dot-thumb';
                thumb.innerHTML = `
                    <img src="${newsItem.imageUrl || ''}" alt="" loading="lazy">
                    <span class="dot-thumb-title">${escapeHTML(newsItem.title || '')}</span>
                `;
                dot.appendChild(thumb);
            }

            dot.addEventListener('click', () => {
                moveTo(i);
                resetAutoPlay();
            });
            carouselDotsContainer.appendChild(dot);
        }
    };

    const updateDots = (targetIndex) => {
        const dots = Array.from(carouselDotsContainer.children);
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === targetIndex);
            dot.setAttribute('aria-selected', index === targetIndex ? 'true' : 'false');
            dot.setAttribute('aria-current', index === targetIndex ? 'true' : 'false');
            dot.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
        });
    };

    // Contador formatado com dois dígitos: 01 / 06
    const updateCounter = (current, total) => {
        if (carouselCounter) {
            const curPad = String(current + 1).padStart(2, '0');
            const totPad = String(total).padStart(2, '0');
            carouselCounter.innerHTML = `<span class="visually-hidden">Notícia ${current + 1} de ${total}</span><span class="counter-display" aria-hidden="true"><strong>${curPad}</strong> / ${totPad}</span>`;
        }
    };

    const moveTo = (targetIndex, withAnimation = true) => {
        if (slides.length === 0) return;
        const newTransform = -targetIndex * 100;
        carouselTrack.style.transition = withAnimation && !prefersReducedMotion ? 'transform 0.5s ease-in-out' : 'none';
        carouselTrack.style.transform = `translateX(${newTransform}%)`;
        if (!withAnimation) carouselTrack.offsetHeight;

        slides.forEach((slide, index) => {
            const isActive = index === targetIndex;
            const descriptionEl = slide.querySelector('.slide-description');
            if (isActive && descriptionEl) {
                const link = slide.querySelector('.slide-link');
                descriptionEl.innerHTML = link.dataset.description || '';
            }

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

        if (liveAnnouncer && slides[targetIndex]) {
            const titleEl = slides[targetIndex].querySelector('.slide-title');
            if (titleEl) liveAnnouncer.textContent = `Notícia atual: ${titleEl.textContent}`;
        }
        resetProgressBar();
        sendHeightToParent();
    };

    const resetProgressBar = () => {
        if (!progressBar || prefersReducedMotion) return;

        [progressBar, progressCircle].forEach(el => {
            if (!el) return;
            el.style.transition = 'none';
            if (el === progressBar) {
                el.style.width = '0%';
                el.style.backgroundColor = 'var(--primary-color)';
            } else {
                el.style.strokeDashoffset = '88';
                el.style.stroke = 'white';
            }

            el.offsetHeight;

            if (!isPausedManually) {
                if (el === progressBar) {
                    el.style.transition = 'width 5000ms linear, background-color 1000ms linear 4000ms';
                    el.style.width = '100%';
                    el.style.backgroundColor = '#28a745';
                } else {
                    el.style.transition = 'stroke-dashoffset 5000ms linear, stroke 1000ms linear 4000ms';
                    el.style.strokeDashoffset = '0';
                    el.style.stroke = '#28a745';
                }
            }
        });
    };

    const resetAutoPlay = () => {
        clearInterval(autoPlayInterval);
        if (!isPausedManually && !prefersReducedMotion && slides.length > 1) {
            autoPlayInterval = setInterval(() => nextButton.click(), CONFIG.autoplayDelay);
            resetProgressBar();
        }
    };

    // --- 8. CARREGAMENTO E MESCLAGEM COM STALE-WHILE-REVALIDATE ---

    const fetchWithTimeout = async (url, timeoutMs) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    };

    const fetchAndMergeNews = async () => {
        const newsMap = new Map();

        // 1. Notícias locais
        try {
            const localResponse = await fetch(CONFIG.localUrl);
            if (localResponse.ok) {
                const localData = await localResponse.json();
                if (Array.isArray(localData)) {
                    localData.forEach(item => {
                        if (item && item.published) {
                            const key = item.link || item.title;
                            newsMap.set(key, item);
                        }
                    });
                }
            }
        } catch (localErr) {
            console.warn("Aviso ao carregar notícias locais:", localErr.message);
        }

        // 2. Notícias remotas (Google Sites / educacao-tech)
        try {
            const remoteData = await fetchWithTimeout(CONFIG.remoteUrl, CONFIG.fetchTimeoutMs);
            if (Array.isArray(remoteData)) {
                remoteData.forEach(item => {
                    if (item && item.published) {
                        const key = item.link || item.title;
                        if (!newsMap.has(key)) {
                            newsMap.set(key, item);
                        }
                    }
                });
            }
        } catch (remoteError) {
            console.warn("Aviso: Falha ao carregar fonte remota:", remoteError.message);
        }

        if (newsMap.size === 0) return null;

        // Ordena estritamente por data decrescente
        return Array.from(newsMap.values())
            .sort((a, b) => getTimeFromItem(b) - getTimeFromItem(a));
    };

    const setupInteractiveControls = () => {
        if (slides.length <= 1) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            carouselDotsContainer.style.display = 'none';
            if (slides.length === 1) moveTo(0);
            return;
        }

        prevButton.style.display = '';
        nextButton.style.display = '';
        carouselDotsContainer.style.display = '';

        generateDots();
        prevButton.setAttribute('aria-controls', 'carousel-track');
        nextButton.setAttribute('aria-controls', 'carousel-track');
        carouselContainer.setAttribute('aria-roledescription', 'carrossel');

        if (playPauseBtn) {
            const iconSpan = playPauseBtn.querySelector('.play-pause-icon');
            if (prefersReducedMotion) {
                playPauseBtn.setAttribute('aria-pressed', 'true');
                if (iconSpan) iconSpan.textContent = '▶';
            }

            playPauseBtn.onclick = () => {
                isPausedManually = !isPausedManually;
                playPauseBtn.setAttribute('aria-pressed', isPausedManually);
                playPauseBtn.setAttribute('aria-label', isPausedManually ? 'Retomar reprodução automática' : 'Pausar reprodução automática');
                if (iconSpan) iconSpan.textContent = isPausedManually ? '▶' : '⏸';

                if (isPausedManually) {
                    clearInterval(autoPlayInterval);
                    if (progressBar) progressBar.style.transition = 'none';
                    if (progressCircle) progressCircle.style.transition = 'none';
                } else {
                    resetAutoPlay();
                }
            };
        }

        moveTo(0);
        resetAutoPlay();
    };

    // --- 9. INICIALIZAÇÃO DA APLICAÇÃO ---

    const init = async () => {
        let hasRenderedFromCache = false;

        // 1º: Leitura imediata do Cache (Stale-While-Revalidate)
        try {
            const cachedJSON = localStorage.getItem(CONFIG.cacheKey);
            if (cachedJSON) {
                const cachedData = JSON.parse(cachedJSON);
                if (Array.isArray(cachedData) && cachedData.length > 0) {
                    if (spinner) spinner.style.display = 'none';
                    allMasterNews = cachedData;
                    renderCategoryFilters();
                    applyCurrentFilter();
                    hasRenderedFromCache = true;
                }
            }
        } catch (_) {}

        if (!hasRenderedFromCache) {
            carouselTrack.innerHTML = `
                <div class="carousel-slide">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            `;
        }

        // 2º: Busca em segundo plano na rede
        try {
            const freshData = await fetchAndMergeNews();
            if (freshData && freshData.length > 0) {
                const currentCache = localStorage.getItem(CONFIG.cacheKey);
                const freshJSON = JSON.stringify(freshData);

                if (!hasRenderedFromCache || currentCache !== freshJSON) {
                    localStorage.setItem(CONFIG.cacheKey, freshJSON);
                    if (spinner) spinner.style.display = 'none';
                    allMasterNews = freshData;
                    renderCategoryFilters();
                    applyCurrentFilter();
                }
            } else if (!hasRenderedFromCache) {
                throw new Error("Nenhum dado retornado");
            }
        } catch (err) {
            console.error("Erro ao carregar notícias atualizadas:", err);
            if (!hasRenderedFromCache) {
                if (spinner) spinner.style.display = 'none';
                carouselContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Erro ao carregar notícias.</p>';
            }
        }

        // Navegação por botões
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

        window.addEventListener('resize', debounce(() => {
            moveTo(currentIndex, false);
            sendHeightToParent();
        }));

        // Teclado
        carouselContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const nextIndex = e.key === 'ArrowRight' 
                    ? (currentIndex + 1) % slides.length 
                    : (currentIndex - 1 + slides.length) % slides.length;
                moveTo(nextIndex);
                resetAutoPlay();
            }
        });

        // Swipe
        carouselTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) >= swipeThreshold) {
                if (diff < 0) nextButton.click();
                else prevButton.click();
            }
        });

        // Pausa no hover e foco
        carouselContainer.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselContainer.addEventListener('mouseleave', () => resetAutoPlay());
        carouselContainer.addEventListener('focusin', () => clearInterval(autoPlayInterval));
        carouselContainer.addEventListener('focusout', () => resetAutoPlay());

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) clearInterval(autoPlayInterval);
            else resetAutoPlay();
        });

        // Event delegation para Copiar Link e Prévia Rápida
        document.addEventListener('click', (e) => {
            // Copiar link
            const copyBtn = e.target.closest('.copy-btn');
            if (copyBtn) {
                e.preventDefault();
                e.stopPropagation();
                const link = copyBtn.dataset.link;
                if (link) {
                    trackEvent('copy_link', link);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(link).then(() => showToast('✓ Link copiado para a área de transferência!'));
                    } else {
                        const temp = document.createElement('textarea');
                        temp.value = link;
                        document.body.appendChild(temp);
                        temp.select();
                        document.execCommand('copy');
                        document.body.removeChild(temp);
                        showToast('✓ Link copiado para a área de transferência!');
                    }
                }
                return;
            }

            // Prévia rápida
            const previewBtn = e.target.closest('.preview-btn');
            if (previewBtn) {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(previewBtn.dataset.newsIdx, 10);
                const newsItem = currentFilteredNews[idx];
                if (newsItem) {
                    openPreviewModal(newsItem);
                }
            }
        });
    };

    init();
});
