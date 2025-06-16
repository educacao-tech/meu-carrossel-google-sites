document.addEventListener('DOMContentLoaded', () => {
    const carouselSlide = document.querySelector('.carousel-slide');
    const images = document.querySelectorAll('.carousel-slide img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.carousel-dots');

    let counter = 0; // Índice da imagem atual
    const slideWidth = images[0].clientWidth; // Largura de uma única imagem

    // Cria os pontos de navegação dinamicamente
    images.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.carousel-dots .dot');

    // Função para atualizar os pontos ativos
    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === counter) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    // Função para ir para um slide específico
    function goToSlide(index) {
        counter = index;
        carouselSlide.style.transform = `translateX(${-slideWidth * counter}px)`;
        updateDots();
    }

    // Botão Próximo
    nextBtn.addEventListener('click', () => {
        if (counter < images.length - 1) {
            counter++;
        } else {
            counter = 0; // Volta para o primeiro slide
        }
        carouselSlide.style.transform = `translateX(${-slideWidth * counter}px)`;
        updateDots();
    });

    // Botão Anterior
    prevBtn.addEventListener('click', () => {
        if (counter > 0) {
            counter--;
        } else {
            counter = images.length - 1; // Vai para o último slide
        }
        carouselSlide.style.transform = `translateX(${-slideWidth * counter}px)`;
        updateDots();
    });

    // (Opcional) Autoplay do carrossel
    // setInterval(() => {
    //     nextBtn.click();
    // }, 3000); // Mude a imagem a cada 3 segundos
});