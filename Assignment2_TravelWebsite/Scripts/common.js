/**
* Common JavaScript functions for all pages
* Including: global search, navigation bar status, utility functions, etc.
*/
document.addEventListener('DOMContentLoaded', function () {
    // Initialize navigation bar active state
    initNavbarActive();

    // Bind global search function (navigation bar search box)
    bindGlobalSearch();
});

/**
 * Initialize navigation bar active state: highlight corresponding navigation item based on current URL
 */
function initNavbarActive() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const currentPage = window.location.pathname;

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');

        // Remove all active states
        link.classList.remove('active');
        link.style.borderBottom = 'none';
        link.style.color = '#555';

        // Check current page and set active state
        if ((currentPage.includes('index.html') || currentPage === '/') && linkHref === 'index.html') {
            setActiveNav(link);
        } else if (currentPage.includes('list.html') && linkHref === 'list.html') {
            setActiveNav(link);
        } else if (currentPage.includes('detail.html') && linkHref === 'list.html') {
            // Highlight list page link when on detail page
            setActiveNav(link);
        } else if (currentPage.includes('favorites.html') && linkHref === 'favorites.html') {
            setActiveNav(link);
        }
    });
}

/**
 * Set navigation link to active state
 */
function setActiveNav(link) {
    link.classList.add('active');
    link.style.borderBottom = '2px solid #3498db';
    link.style.color = '#3498db';
}

/**
 * Bind global search function
 */
function bindGlobalSearch() {
    // Delay execution to ensure navigation bar is loaded
    setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        if (!searchInput || !searchBtn) {
            console.error('Search elements not found');
            return;
        }

        console.log('Search function bound');

        // Search button click event
        searchBtn.addEventListener('click', function () {
            performGlobalSearch();
        });

        // Enter key triggers search
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });

        // Perform global search
        function performGlobalSearch() {
            const searchKey = searchInput.value.trim();
            console.log('Performing search:', searchKey);

            if (!searchKey) {
                alert('Please enter search content');
                return;
            }

            // Priority: call server-side search interface; fallback to fetching all data and searching client-side if error occurs
            searchDestination(searchKey);
        }
    }, 500);
}

/**
 * Search attractions (prefer backend Search API, fallback to AllData if failed)
 */
function searchDestination(searchKey) {
    const encoded = encodeURIComponent(searchKey);
    fetch(`/Destination/Search?searchKey=${encoded}`)
        .then(response => {
            if (!response.ok) throw new Error('Search API unresponsive');
            return response.json();
        })
        .then(result => {
            // Server returns { success = true, data = [...] } format
            const matched = (result && result.success && Array.isArray(result.data)) ? result.data : [];
            if (matched.length > 0) {
                // Jump to first matching detail page
                const first = matched[0];
                const id = first.id || first.Id;
                if (id !== undefined) {
                    window.location.href = `/Destination/Detail/${id}`;
                    return;
                }
            }
            // If no direct match, jump to list page with search keyword
            window.location.href = `/Destination/Index?search=${encoded}`;
        })
        .catch(err => {
            console.warn('Search API error, falling back to AllData:', err);
            // Fallback: fetch all data and find first match client-side
            fetch('/Destination/AllData')
                .then(r => {
                    if (!r.ok) throw new Error('AllData unresponsive');
                    return r.json();
                })
                .then(data => {
                    const list = (data && data.destinations) ? data.destinations : [];
                    const lower = searchKey.toLowerCase();
                    const matched = list.find(d => {
                        const name = (d.name || d.Name || '').toLowerCase();
                        const keywords = (d.keywords || d.Keywords || []).map(k => (k || '').toLowerCase());
                        return name.includes(lower) || keywords.some(k => k.includes(lower));
                    });
                    if (matched) {
                        const id = matched.id || matched.Id;
                        window.location.href = `/Destination/Detail/${id}`;
                    } else {
                        window.location.href = `/Destination/Index?search=${encoded}`;
                    }
                })
                .catch(() => {
                    // Final fallback: jump to list page with keyword in URL
                    window.location.href = `/Destination/Index?search=${encoded}`;
                });
        });
}

/**
 * Utility function: format star rating
 */
function formatStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    stars += '☆'.repeat(5 - stars.length);
    return `${stars} ${rating.toFixed(1)}`;
}