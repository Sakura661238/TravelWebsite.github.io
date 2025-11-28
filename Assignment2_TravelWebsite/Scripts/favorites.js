/**
* Favorites page functionality
*/

// Global variables
let favoriteDestinations = [];
let allDestinations = [];

// Initialize after page loads
document.addEventListener('DOMContentLoaded', function () {
    // Delay execution to ensure navigation bar is loaded
    setTimeout(() => {
        initFavoritesPage();
    }, 300);
});

function initFavoritesPage() {
    loadAllDestinations();
    bindEvents();
    validateFavoriteData();
}

function loadAllDestinations() {
    // Uniformly call backend interface, do not directly access static JSON
    fetch('/Destination/AllData')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load data');
            return response.json();
        })
        .then(data => {
            allDestinations = data.destinations || [];
            loadFavoriteDestinations();
        })
        .catch(error => {
            console.error('Error loading attraction data:', error);
            showError('Failed to load attraction data, please refresh the page and try again');
        });
}

function loadFavoriteDestinations() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favoriteDestinations = allDestinations.filter(dest => {
        const id = dest.id || dest.Id;
        return favorites.includes(id);
    });
    updateFavoritesCount();
    renderFavorites();
}

function updateFavoritesCount() {
    const countElement = document.getElementById('favorites-count');
    if (countElement) {
        countElement.textContent = favoriteDestinations.length;
    }
}

function renderFavorites() {
    const container = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    if (!container) return;

    if (favoriteDestinations.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.add('show');
        return;
    }

    if (emptyState) emptyState.classList.remove('show');

    const sortBy = document.getElementById('sort-favorites') ? document.getElementById('sort-favorites').value : 'date';
    const sortedDestinations = sortFavorites(favoriteDestinations, sortBy);

    container.innerHTML = sortedDestinations.map(dest => {
        const favoriteTime = getFavoriteTimestamp(dest.id || dest.Id);
        const timeText = favoriteTime ? formatTimeAgo(favoriteTime) : 'Recently favorited';
        const listImage = (dest.listImage || dest.ListImage || '').split('/').pop();
        const imgPath = listImage ? `/Content/Images/${listImage}` : '/Content/Images/placeholder.jpg';
        return `
      <div class="favorite-card" data-id="${dest.id || dest.Id}">
        <img src="${imgPath}" alt="${escapeHtml(dest.name || dest.Name)}" onerror="handleImageError(this, '/Content/Images/placeholder.jpg')">
        <div class="favorite-card-content">
          <h3><a href="/Destination/Detail/${dest.id || dest.Id}">${escapeHtml(dest.name || dest.Name)}</a></h3>
          <div class="region">${escapeHtml(dest.region || dest.Region || '')}</div>
          <div class="type">${escapeHtml((dest.type || dest.Type || []).join(' / '))}</div>
          <div class="rating">${formatStarRating(dest.rating || dest.Rating || 0)}</div>
          <div class="favorite-time">Favorited on: ${timeText}</div>
          <div class="favorite-card-actions">
            <a href="/Destination/Detail/${dest.id || dest.Id}" class="view-detail">View Details</a>
            <button class="remove-favorite" onclick="removeFromFavorites(${dest.id || dest.Id})" title="Remove from favorites">
              ★
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

function sortFavorites(destinations, sortBy) {
    const sorted = [...destinations];
    switch (sortBy) {
        case 'rating':
            return sorted.sort((a, b) => (b.rating || b.Rating) - (a.rating || a.Rating));
        case 'name':
            return sorted.sort((a, b) => ((a.name || a.Name || '').localeCompare(b.name || b.Name || '', 'en-US')));
        case 'date':
        default:
            return sorted.sort((a, b) => {
                const timeA = getFavoriteTimestamp(a.id || a.Id);
                const timeB = getFavoriteTimestamp(b.id || b.Id);
                if (timeA && timeB) return timeB - timeA;
                if (timeA && !timeB) return -1;
                if (!timeA && timeB) return 1;
                return (b.id || b.Id) - (a.id || a.Id);
            });
    }
}

function getFavoriteTimestamp(destinationId) {
    try {
        const favoritesData = JSON.parse(localStorage.getItem('favorites_data') || '{}');
        return favoritesData[destinationId]?.timestamp || null;
    } catch (error) {
        console.error('Failed to get favorite timestamp:', error);
        return null;
    }
}

function clearFavoriteData(destinationId) {
    try {
        const favoritesData = JSON.parse(localStorage.getItem('favorites_data') || '{}');
        if (favoritesData[destinationId]) {
            delete favoritesData[destinationId];
            localStorage.setItem('favorites_data', JSON.stringify(favoritesData));
        }
    } catch (error) {
        console.error('Failed to clear favorite data:', error);
    }
}

function validateFavoriteData() {
    try {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoritesData = JSON.parse(localStorage.getItem('favorites_data') || '{}');
        let fixed = false;
        Object.keys(favoritesData).forEach(id => {
            const numericId = parseInt(id);
            if (!favorites.includes(numericId)) {
                delete favoritesData[id];
                fixed = true;
            }
        });
        if (fixed) {
            localStorage.setItem('favorites_data', JSON.stringify(favoritesData));
        }
        return fixed;
    } catch (error) {
        console.error('Failed to validate favorite data:', error);
        return false;
    }
}

function removeFromFavorites(destinationId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(id => id !== destinationId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    clearFavoriteData(destinationId);
    favoriteDestinations = favoriteDestinations.filter(dest => (dest.id || dest.Id) !== destinationId);
    updateFavoritesCount();
    renderFavorites();
    showMessage('Removed from favorites', 'info');
    if (favoriteDestinations.length === 0) {
        const emptyState = document.getElementById('empty-favorites');
        if (emptyState) emptyState.classList.add('show');
    }
}

function clearAllFavorites() {
    if (favoriteDestinations.length === 0) {
        showMessage('You haven\'t favorited any attractions yet', 'info');
        return;
    }
    if (confirm('Are you sure you want to clear all favorites? This action cannot be undone.')) {
        localStorage.setItem('favorites', '[]');
        localStorage.setItem('favorites_data', '{}');
        favoriteDestinations = [];
        updateFavoritesCount();
        renderFavorites();
        const emptyState = document.getElementById('empty-favorites');
        if (emptyState) emptyState.classList.add('show');
        showMessage('All favorites have been cleared', 'info');
    }
}

function bindEvents() {
    const sortSelect = document.getElementById('sort-favorites');
    if (sortSelect) {
        sortSelect.addEventListener('change', renderFavorites);
    }
    const clearBtn = document.getElementById('clear-all');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFavorites);
    }
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minute = 60 * 1000;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    if (diff < minute) return 'Just now';
    if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
    if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
    if (diff < week) return `${Math.floor(diff / day)} days ago`;
    if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
    return new Date(timestamp).toLocaleDateString('en-US');
}

function handleImageError(img, fallbackSrc) {
    img.onerror = null;
    img.src = fallbackSrc;
    img.alt = 'Image failed to load';
    img.style.opacity = '0.7';
}

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        animation: 'slideIn 0.3s ease-out'
    });
    const bgColors = { success: '#27ae60', info: '#3498db', error: '#e74c3c' };
    messageDiv.style.backgroundColor = bgColors[type] || bgColors.info;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

function showError(message) {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    container.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">${escapeHtml(message)}</p>
      <button onclick="location.reload()" class="retry-btn">Retry</button>
    </div>
  `;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
}