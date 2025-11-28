// Global variable to store current attraction data
let currentDestination = null;

// Initialize after page loads
document.addEventListener('DOMContentLoaded', init);

// Initialization function
function init() {
    // Support two routing formats: /Detail/{id} or ?id=
    const idFromPath = getIdFromPath();
    const destId = idFromPath || getUrlParam('id');
    if (!destId) {
        showError('No attraction information found, please return to the list page and select again');
        return;
    }

    // Load attraction data
    loadDestinationData(destId);
}

// Extract parameters from URL query string
function getUrlParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

// Extract id from path /Destination/Detail/{id} (if exists)
function getIdFromPath() {
    const parts = window.location.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last && /^\d+$/.test(last)) return last;
    return null;
}

// Load attraction data (from backend unified interface)
function loadDestinationData(targetId) {
    showLoading();

    fetch('/Destination/AllData')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load data');
            return response.json();
        })
        .then(data => {
            const list = data && data.destinations ? data.destinations : [];
            currentDestination = list.find(dest => {
                const id = dest.id || dest.Id;
                return id === parseInt(targetId);
            });

            if (currentDestination) {
                renderDetailPage(currentDestination);
            } else {
                showError('Attraction information not found, please check if the ID is correct');
            }
        })
        .catch(error => {
            console.error('Loading error:', error);
            showError('Failed to load attraction information, please try again later');
        });
}

// Show loading status
function showLoading() {
    const contentContainer = document.getElementById('destination-content');
    if (!contentContainer) return;
    contentContainer.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading attraction information...</p>
    </div>
  `;
}

// Render detail page content
function renderDetailPage(dest) {
    const contentContainer = document.getElementById('destination-content');
    if (!contentContainer) return;

    // 1. Update page title
    document.title = `${dest.name || dest.Name} - Attraction Details`;

    // 2. Generate detail page HTML
    const mainImg = (dest.mainImage || dest.MainImage || '').split('/').pop();
    const subImgs = (dest.subImages || dest.SubImages || []).map(s => s.split('/').pop());
    const mainImgPath = mainImg ? `/Content/Images/${mainImg}` : '/Content/Images/placeholder.jpg';

    contentContainer.innerHTML = `
    <!-- Attraction images section -->
    <div class="detail-images">
      <img src="${mainImgPath}" alt="${escapeHtml(dest.name || dest.Name)}" class="main-img" onerror="handleImageError(this, '/Content/Images/placeholder.jpg')">
      <div class="sub-images">
        ${subImgs.map(img => `<img src="/Content/Images/${img}" alt="${escapeHtml(dest.name || dest.Name)} scenery" onerror="handleImageError(this, '/Content/Images/placeholder.jpg')">`).join('')}
      </div>
    </div>

    <!-- Attraction information -->
    <div class="detail-info">
      <h1>${escapeHtml(dest.name || dest.Name)}</h1>
      <div class="info-tags">
        <span class="region-tag">${escapeHtml(dest.region || dest.Region || '')}</span>
        <span class="type-tag">${escapeHtml((dest.type || dest.Type || []).join(' / '))}</span>
        <span class="rating-tag">${formatStarRating(dest.rating || dest.Rating || 0)}</span>
      </div>
      <div class="description">
        <h2>Attraction Introduction</h2>
        <p>${escapeHtml(dest.description || dest.Description || '')}</p>
      </div>
      <div class="address">
        <h3>Address</h3>
        <p>${escapeHtml(dest.address || dest.Address || '')}</p>
      </div>
      ${(dest.keywords || dest.Keywords || []).length > 0 ? `
        <div class="keywords">
          <h3>Core Keywords</h3>
          <p>${escapeHtml((dest.keywords || dest.Keywords).join(', '))}</p>
        </div>
      ` : ''}
      
      <!-- Favorite function -->
      <div class="action-buttons">
        <button class="favorite-btn" onclick="toggleFavorite(${dest.id || dest.Id})">
          ${isFavorite(dest.id || dest.Id) ? '★ Favorited' : '☆ Favorite Attraction'}
        </button>
      </div>
    </div>
  `;
}

// Image load error handling
function handleImageError(img, fallbackSrc) {
    img.onerror = null; // Prevent loop
    img.src = fallbackSrc || '/Content/Images/placeholder.jpg';
    img.alt = 'Image failed to load';
    img.style.opacity = '0.7';
}

// Favorite function (keep original logic)
function toggleFavorite(destinationId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let favoritesData = JSON.parse(localStorage.getItem('favorites_data') || '{}');
    const index = favorites.indexOf(destinationId);

    if (index > -1) {
        favorites.splice(index, 1);
        delete favoritesData[destinationId];
        showMessage('Removed from favorites', 'info');
    } else {
        favorites.push(destinationId);
        favoritesData[destinationId] = { timestamp: Date.now() };
        showMessage('Added to favorites', 'success');
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('favorites_data', JSON.stringify(favoritesData));

    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.textContent = isFavorite(destinationId) ? '★ Favorited' : '☆ Favorite Attraction';
    }
}

function isFavorite(destinationId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(destinationId);
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => { messageDiv.remove(); }, 3000);
}

function showError(message) {
    const contentContainer = document.getElementById('destination-content');
    if (!contentContainer) return;
    contentContainer.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">${escapeHtml(message)}</p>
      <a href="/Destination/Index" class="back-btn">Return to Attraction List</a>
    </div>
  `;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
}