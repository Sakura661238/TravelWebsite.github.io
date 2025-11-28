/**
* Home page exclusive JavaScript functions
*/
document.addEventListener('DOMContentLoaded', function () {
    // Initialize banner carousel
    initBannerCarousel();

    // Only fetch and render from backend if server-side rendered "recommendations/regions" content is missing (avoid overwriting server-rendered content)
    const regionsContainer = document.querySelector('.regions');
    const recGrid = document.querySelector('.destinations-grid');
    if ((regionsContainer && regionsContainer.children.length === 0) || (recGrid && recGrid.children.length === 0)) {
        loadHomeData();
    }
});

/**
 * Banner carousel functionality
 */
function initBannerCarousel() {
    try {
        const slides = Array.from(document.querySelectorAll('.banner-slide'));
        if (!slides || slides.length === 0) return;

        let indicators = Array.from(document.querySelectorAll('.indicator'));
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const banner = document.querySelector('.banner');

        // Rebuild indicators if their count doesn't match slides (ensure consistent length to prevent out-of-bounds errors)
        if (!indicators || indicators.length !== slides.length) {
            const container = document.querySelector('.carousel-indicators');
            if (container) {
                container.innerHTML = '';
                for (let i = 0; i < slides.length; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'indicator' + (i === 0 ? ' active' : '');
                    container.appendChild(btn);
                }
                indicators = Array.from(container.querySelectorAll('.indicator'));
            } else {
                // Create indicator container if it doesn't exist and add to banner
                if (banner) {
                    const newContainer = document.createElement('div');
                    newContainer.className = 'carousel-indicators';
                    for (let i = 0; i < slides.length; i++) {
                        const btn = document.createElement('button');
                        btn.className = 'indicator' + (i === 0 ? ' active' : '');
                        newContainer.appendChild(btn);
                    }
                    banner.appendChild(newContainer);
                    indicators = Array.from(newContainer.querySelectorAll('.indicator'));
                }
            }
        }

        if (slides.length <= 1) return;

        let currentIndex = 0;
        let autoPlayInterval = null;

        function showSlide(index) {
            if (index < 0 || index >= slides.length) return;
            slides.forEach(s => s.classList.remove('active'));
            indicators.forEach(i => i.classList.remove('active'));
            slides[index].classList.add('active');
            if (indicators[index]) indicators[index].classList.add('active');
            currentIndex = index;
        }

        function nextSlide() {
            showSlide((currentIndex + 1) % slides.length);
        }

        function prevSlide() {
            showSlide((currentIndex - 1 + slides.length) % slides.length);
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayInterval = setInterval(nextSlide, 5000);
        }

        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }

        // Bind safe event handlers (existence check)
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                stopAutoPlay();
                prevSlide();
                startAutoPlay();
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                stopAutoPlay();
                nextSlide();
                startAutoPlay();
            });
        }

        indicators.forEach((indicator, idx) => {
            indicator.addEventListener('click', () => {
                stopAutoPlay();
                showSlide(idx);
                startAutoPlay();
            });
        });

        if (banner) {
            banner.addEventListener('mouseenter', stopAutoPlay);
            banner.addEventListener('mouseleave', startAutoPlay);
            banner.addEventListener('touchstart', e => {
                if (e.changedTouches && e.changedTouches[0]) {
                    banner._touchStartX = e.changedTouches[0].screenX;
                    stopAutoPlay();
                }
            });
            banner.addEventListener('touchend', e => {
                if (e.changedTouches && e.changedTouches[0]) {
                    const touchEndX = e.changedTouches[0].screenX;
                    const diff = (banner._touchStartX || 0) - touchEndX;
                    const threshold = 50;
                    if (Math.abs(diff) > threshold) {
                        if (diff > 0) nextSlide(); else prevSlide();
                    }
                    startAutoPlay();
                }
            });
        }

        // Initialization
        showSlide(0);
        startAutoPlay();
    } catch (ex) {
        // Don't let carousel errors block other JS
        console.error('Carousel init error:', ex);
    }
}
/**
 * Load home page data
 */
function loadHomeData() {
    // Use API provided by backend controller (do not directly request static files under App_Data)
    fetch('/Destination/AllData')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load data');
            return response.json();
        })
        .then(data => {
            // data.destinations / data.regions
            const dests = data.destinations || [];
            const regions = data.regions || [];

            // Render recommended attractions (skip if page is already server-rendered)
            if (document.querySelector('.destinations-grid') && document.querySelector('.destinations-grid').children.length === 0) {
                renderRecommendedDestinations(dests);
            }

            // Render region entries, generate links to MVC (/Destination?region=...)
            if (document.querySelector('.regions') && document.querySelector('.regions').children.length === 0) {
                renderRegions(regions);
            }
        })
        .catch(error => console.error('Home page data loading error:', error));
}


/**
 * Render recommended destinations
 */
function renderRecommendedDestinations(destinations) {
    const grid = document.querySelector('.destinations-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const recommended = destinations
        .filter(dest => (dest.rating || dest.Rating) >= 4.6)
        .sort((a, b) => (b.rating || b.Rating) - (a.rating || a.Rating))
        .slice(0, 6);

    recommended.forEach(dest => {
        const img = (dest.listImage || dest.ListImage || '').split('/').pop();
        const imagePath = img ? `/Content/Images/${img}` : '/Content/Images/placeholder.jpg';
        const name = dest.name || dest.Name || 'Unnamed';
        const id = dest.id || dest.Id || '';
        const card = document.createElement('div');
        card.className = 'dest-card';
        card.innerHTML = `
            <img src="${imagePath}" alt="${name}">
            <h3>${name}</h3>
            <div class="rating">★★★★★ ${dest.rating || dest.Rating}</div>
            <a href="/Destination/Detail/${id}" class="view-detail">View Details</a>
        `;
        grid.appendChild(card);
    });

    initDestCardHover();
}

/**
 * Render region entries
 */
function renderRegions(regions) {
    const container = document.querySelector('.regions');
    if (!container) return;
    container.innerHTML = '';

    // regions may be an array of objects (Id, Name, Intro, ImagePath)
    const displayRegions = regions.slice(0, 8);
    displayRegions.forEach(region => {
        const name = region.Name || region.name || '';
        const id = region.Id || region.id || '';
        // Use backend MVC routing for navigation, avoid pointing to non-existent static pages
        const href = `/Destination?region=${encodeURIComponent(name)}`;
        const imgFile = (region.ImagePath || region.imagePath || (`region${id}.jpg`)).split('/').pop();
        const imgPath = imgFile ? `/Content/Images/${imgFile}` : '/Content/Images/placeholder.jpg';

        const item = document.createElement('a');
        item.className = 'region-item';
        item.href = href;
        item.innerHTML = `
            <img src="${imgPath}" alt="${name}">
            <span>${name}</span>
        `;
        container.appendChild(item);
    });
}


/**
 * Destination card hover animation
 */
function initDestCardHover() {
    const cards = document.querySelectorAll('.dest-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
            this.style.transform = 'translateY(-6px)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            this.style.transform = 'translateY(0)';
        });
    });
} 