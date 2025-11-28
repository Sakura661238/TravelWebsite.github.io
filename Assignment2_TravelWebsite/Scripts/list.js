// Global variables
let allDestinations = [];
let currentFiltered = [];
let sortOrder = "desc";
let currentPage = 1;
const itemsPerPage = 6;

document.addEventListener('DOMContentLoaded', init);

function init() {
    bindEvents();
    loadData();
}

function loadData() {
    fetch('/Destination/AllData')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load data from server');
            return response.json();
        })
        .then(data => {
            const rawList = data && data.destinations ? data.destinations : (Array.isArray(data) ? data : []);
            // Normalize fields (compatible with PascalCase / camelCase)
            allDestinations = rawList.map(d => {
                const id = d.id || d.Id;
                const name = d.name || d.Name || 'Unknown';
                const region = d.region || d.Region || '';
                const type = d.type || d.Type || [];
                const rating = (typeof d.rating !== 'undefined' ? d.rating : d.Rating) || 0;
                const keywords = d.keywords || d.Keywords || [];
                const description = d.description || d.Description || '';
                const rawImage = d.listImage || d.ListImage || '';
                const filename = (rawImage || '').toString().split('/').pop();
                const listImage = filename ? `/Content/Images/${filename}` : '/Content/Images/placeholder.jpg';
                return { id, name, region, type: Array.isArray(type) ? type : [type].filter(Boolean), rating, keywords, description, listImage };
            });

            currentFiltered = [...allDestinations];

            // Populate filter options (regions/types)
            initFilterOptions({
                destinations: allDestinations,
                regions: data.regions || []
            });

            handleUrlParams();
            sortDestinations(currentFiltered, sortOrder);
            renderDestinations(currentFiltered);
            updatePagination();
        })
        .catch(err => {
            console.error(err);
            showError('Failed to load data, please refresh the page and try again.');
        });
}

function initFilterOptions(data) {
    const regionSelect = document.getElementById('region-filter');
    const typeContainer = document.querySelector('.checkbox-group');

    if (regionSelect) {
        // regions may be array of objects or strings
        const regionsArr = (data.regions && data.regions.length) ? data.regions.map(r => (r.Name || r.name || r)) : [...new Set((data.destinations || []).map(d => d.region))];
        // Prevent duplicate appending
        if (regionSelect.options.length <= 1) {
            regionsArr.forEach(regionName => {
                const option = document.createElement('option');
                option.value = regionName;
                option.textContent = regionName;
                regionSelect.appendChild(option);
            });
        }
    }

    if (typeContainer) {
        const types = [...new Set((data.destinations || []).flatMap(d => d.type || []))];
        typeContainer.innerHTML = '';
        types.forEach((type, idx) => {
            const id = `type-${idx}`;
            const label = document.createElement('label');
            label.setAttribute('for', id);
            label.innerHTML = `<input id="${id}" type="checkbox" value="${type}" /> ${type}`;
            typeContainer.appendChild(label);
        });
    }
}

function bindEvents() {
    const region = document.getElementById('region-filter');
    const checkboxGroup = document.querySelector('.checkbox-group');
    const sortBtn = document.getElementById('sort-rating');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (region) region.addEventListener('change', handleFilter);
    if (checkboxGroup) checkboxGroup.addEventListener('change', handleFilter);
    if (sortBtn) {
        sortBtn.addEventListener('click', handleSort);
        // keyboard support for toggle button
        sortBtn.setAttribute('role', 'button');
        sortBtn.setAttribute('tabindex', '0');
        sortBtn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSort();
            }
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', handleFilter);
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleFilter();
            }
        });
    }
}

function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const region = params.get('region') || '';
    const search = params.get('search') || '';
    const page = parseInt(params.get('page') || '1', 10);
    const sort = params.get('sort') || 'desc';
    const types = params.getAll('types');

    sortOrder = sort === 'asc' ? 'asc' : 'desc';
    currentPage = isNaN(page) || page < 1 ? 1 : page;

    const regionSelect = document.getElementById('region-filter');
    const searchInput = document.getElementById('search-input');

    if (regionSelect) regionSelect.value = region;
    if (searchInput) searchInput.value = search;

    setTimeout(() => {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = types.includes(cb.value);
        });
        updateSortButtonText();
        handleFilter();
    }, 50);
}

function handleFilter() {
    const searchKey = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const selectedRegion = document.getElementById('region-filter')?.value || '';
    const selectedTypes = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value);

    currentFiltered = allDestinations.filter(dest => {
        const matchSearch = !searchKey ||
            (dest.name || '').toLowerCase().includes(searchKey) ||
            (dest.description || '').toLowerCase().includes(searchKey) ||
            (dest.keywords || []).some(k => (k || '').toLowerCase().includes(searchKey));

        const matchRegion = !selectedRegion || dest.region === selectedRegion;

        // Change to "match all" (AND): when multiple types are selected, destination must include all selected types
        const matchType = selectedTypes.length === 0 || selectedTypes.every(t => (dest.type || []).includes(t));

        return matchSearch && matchRegion && matchType;
    });

    currentPage = 1;
    sortDestinations(currentFiltered, sortOrder);
    renderDestinations(currentFiltered);
    updatePagination();
    updateURL();
}

function handleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    updateSortButtonText();
    updateSortButtonAria();
    sortDestinations(currentFiltered, sortOrder);
    renderDestinations(currentFiltered);
    updatePagination();
    updateURL();
}

function updateSortButtonText() {
    const btn = document.getElementById('sort-rating');
    if (btn) {
        btn.textContent = `Sort by rating (${sortOrder === 'desc' ? 'highest to lowest' : 'lowest to highest'})`;
    }
}

function updateSortButtonAria() {
    const btn = document.getElementById('sort-rating');
    if (btn) {
        btn.setAttribute('aria-pressed', (sortOrder === 'desc').toString());
    }
}

function sortDestinations(destinations, order) {
    destinations.sort((a, b) => {
        return order === "desc" ? (b.rating - a.rating) : (a.rating - b.rating);
    });
}

function renderDestinations(destinations) {
    const listContainer = document.querySelector('.destinations-list');
    listContainer.innerHTML = '';

    if (!destinations || destinations.length === 0) {
        listContainer.innerHTML = '<p class="no-result">No matching attractions found, please try other filter conditions～</p>';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = destinations.slice(startIndex, endIndex);

    currentItems.forEach(dest => {
        const card = document.createElement('div');
        card.className = 'dest-card';
        const image = dest.listImage || '/Content/Images/placeholder.jpg';
        const brief = (dest.description || '').length > 100 ? (dest.description.substring(0, 100) + '...') : (dest.description || '');
        card.innerHTML = `
            <img src="${image}" alt="${escapeHtml(dest.name)}" onerror="this.src='/Content/Images/placeholder.jpg'">
            <div class="dest-info">
                <h3><a href="/Destination/Detail/${dest.id}">${escapeHtml(dest.name)}</a></h3>
                <div class="region">Region: ${escapeHtml(dest.region)}</div>
                <div class="type">Type: ${escapeHtml((dest.type || []).join(' / '))}</div>
                <div class="rating">★★★★★ ${dest.rating}</div>
                <p class="brief">${escapeHtml(brief)}</p>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function updatePagination() {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(currentFiltered.length / itemsPerPage);

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}" aria-label="Previous Page">Previous Page</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += i === currentPage ? `<span class="page-current" aria-current="page">${i}</span>` : `<button class="page-btn" data-page="${i}" aria-label="Page ${i}">${i}</button>`;
    }
    if (currentPage < totalPages) html += `<button class="page-btn" data-page="${currentPage + 1}" aria-label="Next Page">Next Page</button>`;
    html += `<span class="page-info">Page ${currentPage} of ${totalPages} (${currentFiltered.length} attractions)</span>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            currentPage = parseInt(this.getAttribute('data-page'), 10);
            renderDestinations(currentFiltered);
            updatePagination();
            updateURL();
            document.querySelector('.destinations-list').scrollIntoView({ behavior: 'smooth' });
        });
        // keyboard support
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

function updateURL() {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('sort', sortOrder);

    const region = document.getElementById('region-filter')?.value;
    if (region) params.set('region', region);

    const search = (document.getElementById('search-input')?.value || '').trim();
    if (search) params.set('search', search);

    const selectedTypes = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value);
    selectedTypes.forEach(t => params.append('types', t));

    const newUrl = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
}

function showError(message) {
    const listContainer = document.querySelector('.destinations-list');
    if (listContainer) listContainer.innerHTML = `<p class="no-result">${message}</p>`;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
}