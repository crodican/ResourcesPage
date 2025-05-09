// --- DOM Elements ---
const searchInput = document.getElementById('search-input');
const searchButton = document.querySelector('.searchButton');
const chipsArea = document.getElementById('chips-area');
const countyFiltersDiv = document.getElementById('county-filters');
const populationFiltersDiv = document.getElementById('population-filters');
const resourceTypeFiltersDiv = document.getElementById('resource-type-filters');
const categoryFiltersDiv = document.getElementById('category-filters');
const resourceListDiv = document.getElementById('resource-list');
const resultsCounter = document.getElementById('results-counter');
const loadMoreButton = document.getElementById('load-more-button');
const loadMoreDiv = document.getElementById('load-more');
const sortBySelect = document.getElementById('sort-by');
const mapDiv = document.getElementById('map'); // Added map div

// --- API and Configuration ---
const API_BASE_URL = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
const RESOURCES_PER_PAGE = 25;
const MAPTILER_API_KEY = '1nPjVtGASMJJCaJkeKXQ'; // Your MapTiler API Key

const CATEGORY_OPTIONS = {
    'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Government', 'Other'],
    'Family Support': ['Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources', 'Government', 'Other'],
    'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance', 'Government', 'Other'],
    'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other']
};

// --- Constants for Filter Types and API Params ---
const FILTER_TYPES = {
    SEARCH: 'search',
    COUNTIES: 'counties',
    POPULATIONS: 'populations',
    RESOURCE_TYPES: 'resourceTypes',
    CATEGORIES: 'categories'
};

const API_PARAMS = {
    PAGE: 'page',
    LIMIT: 'limit',
    SORT: 'sort',
    SEARCH: 'search',
    COUNTY: 'County',
    POPULATIONS: 'Populations',
    RESOURCE_TYPE: 'Resource Type',
    CATEGORY: 'Category'
};

// --- State Variables ---
let activeFilters = {
    [FILTER_TYPES.SEARCH]: '',
    [FILTER_TYPES.COUNTIES]: [],
    [FILTER_TYPES.POPULATIONS]: [],
    [FILTER_TYPES.RESOURCE_TYPES]: [],
    [FILTER_TYPES.CATEGORIES]: []
};
let currentPage = 1;
let totalResourceCount = 0;
let allFetchedResources = []; // To store all resources fetched for map updates

// --- Map Variables ---
let map;
let mapMarkers = []; // To store maplibre marker instances

// --- Utility Functions ---
// calculateDistance and deg2rad are currently unused for API calls.
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in miles
    return distance;
}

// --- Map Functions ---
/**
 * Initializes the MapLibre GL JS map.
 */
function initializeMap() {
    if (!mapDiv) {
        console.error("Map container element not found.");
        return;
    }
    try {
        map = new maplibregl.Map({
            container: 'map', // container id
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`, // your Maptiler style
            center: [-77.0369, 38.9072],
            zoom: 15.5,
            pitch: 45,
            bearing: -17.6,
            canvasContextAttributes: {antialias: true}
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add the Geolocate Control
        const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true // Request high accuracy for better results
            },
            trackUserLocation: true, // Set to true to keep the map centered on the user's location
            showUserHeading: true // Show the user's heading (if available)
        });

        map.addControl(geolocateControl, 'top-left'); // Add it to the top-left corner

    } catch (error) {
        console.error("Error initializing map:", error);
        if (mapDiv) {
            mapDiv.innerHTML = "<div class='alert alert-danger'>Could not load the map.</div>";
        }
    }
}

/**
 * Updates map markers based on the provided resources (using default SVG color).
 * @param {Array<Object>} resources - Array of resource objects to display on the map.
 */
function updateMapMarkers(resources) {
    if (!map) {
        console.warn("Map not initialized, cannot update markers.");
        return;
    }

    // Clear existing markers
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    if (!resources || resources.length === 0) {
        return;
    }

    const bounds = new maplibregl.LngLatBounds();
    let validMarkersExist = false;
    const markerColor = '#55298a'; // The color you want

    resources.forEach(resource => {
        const lat = parseFloat(resource.Latitude);
        const lon = parseFloat(resource.Longitude);

        if (!isNaN(lat) && !isNaN(lon)) {
            validMarkersExist = true;
            const popupContent = `... (same popup content as before) ...`;

            const popup = new maplibregl.Popup({ offset: 25, maxWidth: '320px' })
                .setHTML(popupContent);

            const marker = new maplibregl.Marker({ color: markerColor }) // Using the color option
                .setLngLat([lon, lat])
                .setPopup(popup)
                .addTo(map);

            marker._resourceId = resource['Location Name'];
            mapMarkers.push(marker);
            bounds.extend([lon, lat]);
        }
    });

    if (validMarkersExist && !bounds.isEmpty()) {
        if (resources.length <= RESOURCES_PER_PAGE * 2 || currentPage === 1 ) {
            map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
    } else if (currentPage === 1 && allFetchedResources.length === 0) {
        map.flyTo({ center: [-77.0369, 38.9072], zoom: 6 });
    }
}


// --- API Interaction ---
function constructApiUrl() {
    const params = new URLSearchParams();
    params.append(API_PARAMS.PAGE, currentPage);
    params.append(API_PARAMS.LIMIT, RESOURCES_PER_PAGE);

    const sortValue = sortBySelect.value;
    if (sortValue === 'alphabetical') { // HTML options are: distance (label: Alphabetical), alphabetical (label: Distance)
        params.append(API_PARAMS.SORT, 'Location Name');
    } else if (sortValue === 'distance') {
        // For actual distance sort from API, API would need to support it with user's location.
        // Currently, this option's label in HTML is "Distance", but value is "alphabetical"
        // The HTML has: <option value="distance">Alphabetical</option> <option value="alphabetical">Distance</option>
        // Assuming "Distance" option (value='alphabetical') means sort by distance if possible,
        // or it's a placeholder. If API doesn't support server-side distance sort, this is client-side.
        // For now, let's assume if value is 'distance', it implies an API parameter if available.
        // The current `constructApiUrl` is set up for 'Location Name' if sortValue is 'alphabetical' (which has "Distance" as label).
        // And if sortValue is 'distance' (which has "Alphabetical" as label), it sorts by 'Location Name' in HTML. This seems swapped.
        // Let's fix the sort mapping based on value:
        // HTML: <option value="name_asc">Alphabetical (A-Z)</option>
        // HTML: <option value="distance_user">Distance (Nearest)</option> // (Requires user location)
        // For now, I'll use your existing setup logic. If 'distance' option (label Alphabetical) is chosen, sort by name.
        // If 'alphabetical' option (label Distance) is chosen, it's a placeholder or needs user location.
        // The provided HTML for sort is:
        // <option value="distance">Alphabetical</option>  -> so this should sort alphabetically
        // <option value="alphabetical">Distance</option> -> this implies distance sort
        if (sortValue === 'distance') { // This is the option with "Alphabetical" text
             params.append(API_PARAMS.SORT, 'Location Name');
        } else if (sortValue === 'alphabetical') { // This is the option with "Distance" text
            console.warn('API sorting by distance from user not implemented. Defaulting to relevance or current sort.');
            // If you implement user location for distance sorting:
            // if (userLatitude && userLongitude) {
            //    params.append('latitude', userLatitude);
            //    params.append('longitude', userLongitude);
            //    params.append(API_PARAMS.SORT, 'distance');
            // }
        }
    }


    if (activeFilters[FILTER_TYPES.SEARCH]) {
        params.append(API_PARAMS.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
    }
    activeFilters[FILTER_TYPES.COUNTIES].forEach(county => params.append(API_PARAMS.COUNTY, county));
    activeFilters[FILTER_TYPES.POPULATIONS].forEach(population => params.append(API_PARAMS.POPULATIONS, population));
    activeFilters[FILTER_TYPES.RESOURCE_TYPES].forEach(type => params.append(API_PARAMS.RESOURCE_TYPE, type));
    activeFilters[FILTER_TYPES.CATEGORIES].forEach(category => params.append(API_PARAMS.CATEGORY, category));

    return `${API_BASE_URL}?${params.toString()}`;
}

async function fetchResources(url, shouldAppend = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}, URL: ${url}`);
            resourceListDiv.innerHTML = `<div class="alert alert-danger">Failed to load resources. Server returned status ${response.status}. Please try again later.</div>`;
            updateLoadMoreVisibility(true);
            if (!shouldAppend) allFetchedResources = [];
            updateMapMarkers(allFetchedResources); // Clear map on error
            return;
        }
        const data = await response.json();
        const newResources = data.list || [];
        const pageInfo = data.pageInfo || {};

        if (!shouldAppend) {
            totalResourceCount = pageInfo.totalRows || 0;
            allFetchedResources = newResources; // Replace all fetched resources
        } else {
            totalResourceCount = pageInfo.totalRows || totalResourceCount;
            allFetchedResources = allFetchedResources.concat(newResources); // Append to all fetched resources
        }

        if (shouldAppend) {
            renderResources(newResources, true);
        } else {
            renderResources(newResources, false);
        }
        updateResultsCounter();
        updateLoadMoreVisibility();
        updateMapMarkers(allFetchedResources); // Update map with all currently displayed/fetched resources

    } catch (error) {
        console.error('Error fetching resources:', error);
        resourceListDiv.innerHTML = '<div class="alert alert-danger">An error occurred while fetching resources. Please check your connection and try again.</div>';
        updateLoadMoreVisibility(true);
        if (!shouldAppend) allFetchedResources = [];
        updateMapMarkers(allFetchedResources); // Clear map on error
    }
}

// --- UI Rendering ---
function renderCategoryFilters() {
    if (!categoryFiltersDiv) return;
    categoryFiltersDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const selectedResourceTypes = activeFilters[FILTER_TYPES.RESOURCE_TYPES];
    const visibleCategories = new Set(['Government', 'Other']);

    selectedResourceTypes.forEach(type => {
        if (CATEGORY_OPTIONS[type]) {
            CATEGORY_OPTIONS[type].forEach(cat => visibleCategories.add(cat));
        }
    });

    Array.from(visibleCategories).sort().forEach(category => {
        const id = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
        const isChecked = activeFilters[FILTER_TYPES.CATEGORIES].includes(category);
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
            <input class="form-check-input category-filter" type="checkbox" value="${category}" id="${id}" ${isChecked ? 'checked' : ''}>
            <label class="form-check-label" for="${id}">${category}</label>
        `;
        fragment.appendChild(div);
    });
    categoryFiltersDiv.appendChild(fragment);
}

function renderResources(resourcesToRender, shouldAppend = false) {
    if (!resourceListDiv) return;
    if (!shouldAppend) {
        resourceListDiv.innerHTML = '';
    }

    if (resourcesToRender && resourcesToRender.length > 0) {
        const fragment = document.createDocumentFragment();
        resourcesToRender.forEach(resource => {
            const cardElement = document.createElement('div');
            // Ensure a unique ID for the resource if available, otherwise use Location Name
            const resourceIdentifier = resource.ID || resource['Location Name'] || Math.random().toString(36).substring(7);
            cardElement.innerHTML = `
                <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${resource.Website || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" target="_blank" rel="noopener noreferrer" aria-label="Visit website for ${resource['Location Name'] || 'resource'}"> <i class="bi bi-globe"></i> </a>
                            <a href="${resource['Phone URL'] || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" aria-label="Call ${resource['Location Name'] || 'resource'}"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="#" class="map-view-link d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}" data-resource-id="${resourceIdentifier}"> <i class="bi bi-geo-alt-fill"></i> </a>
                        </div>
                        <div class="card-body col-10 p-4">
                            <h3 class="text-secondary">${resource['Location Name'] || 'N/A'}</h3>
                            <h5 class="text-dark">${resource.Organization || 'N/A'}</h5>
                            <div class="mb-2">
                                ${resource['Resource Type'] ? `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.RESOURCE_TYPES}" data-value="${resource['Resource Type']}">${resource['Resource Type']}</span>` : ''}
                                ${resource.Category ? `<span class="badge badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.CATEGORIES}" data-value="${resource.Category}">${resource.Category}</span>` : ''}
                            </div>
                            <h6>Phone: ${resource.Phone || 'N/A'}</h6>
                            <p>${resource.Address || 'N/A'} <br>
                                ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}<br />
                                ${resource['Google Maps URL'] ? `<strong><a href="${resource['Google Maps URL']}" class="text-secondary" target="_blank" rel="noopener noreferrer">Directions</a></strong>` : ''}
                            </p>
                            ${(resource['Populations Served'] && resource['Populations Served'].trim() !== '') ? `<h6>Populations Served:</h6><div>
                                ${(resource['Populations Served'] || '').split(',').map(pop => pop.trim()).filter(pop => pop).map(pop => `<span class="badge badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.POPULATIONS}" data-value="${pop}">${pop}</span>`).join('')}
                            </div>` : ''}
                            ${resource.County ? `<h6>County:</h6><div>
                                <span class="badge badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.COUNTIES}" data-value="${resource.County}">${resource.County}</span>
                            </div>` : ''}
                            <div class="row d-flex justify-content-end position-relative">
                                ${resource.Image ? `<div class="col-md-auto d-flex justify-content-end align-items-end p-2" style="position:relative"><img class="cardImage" src="${resource.Image}" alt="${resource.Organization || resource['Location Name'] || 'Resource logo'}" ></div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            fragment.appendChild(cardElement.firstElementChild);
        });
        resourceListDiv.appendChild(fragment);
    } else if (!shouldAppend) {
        resourceListDiv.innerHTML = '<div class="alert alert-info">No resources found with the current filters.</div>';
    }
}

function updateResultsCounter() {
    if (!resultsCounter || !resourceListDiv) return;
    const currentlyDisplayedCount = resourceListDiv.querySelectorAll('.resourceCard').length;
    resultsCounter.textContent = `Showing ${currentlyDisplayedCount} of ${totalResourceCount} results`;
}

function updateLoadMoreVisibility(forceHide = false) {
    if (!loadMoreDiv || !resourceListDiv) return;
    const displayedCount = resourceListDiv.querySelectorAll('.resourceCard').length;
    if (forceHide || displayedCount >= totalResourceCount || totalResourceCount === 0) {
        loadMoreDiv.classList.add('d-none');
    } else {
        loadMoreDiv.classList.remove('d-none');
    }
}

// --- Filter Logic ---
function applyFilters(shouldResetPage = true) {
    if (shouldResetPage) {
        currentPage = 1;
        allFetchedResources = []; // Clear all fetched resources when filters change for a new set
    }
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl, false); // `false` means replace, not append
}

function handleFilterChange(event) {
    const checkbox = event.target;
    const value = checkbox.value;
    let filterType = null;

    if (checkbox.classList.contains('county-filter')) filterType = FILTER_TYPES.COUNTIES;
    else if (checkbox.classList.contains('population-filter')) filterType = FILTER_TYPES.POPULATIONS;
    else if (checkbox.classList.contains('resource-type-filter')) filterType = FILTER_TYPES.RESOURCE_TYPES;
    else if (checkbox.classList.contains('category-filter')) filterType = FILTER_TYPES.CATEGORIES;

    if (filterType) {
        if (checkbox.checked) {
            if (!activeFilters[filterType].includes(value)) {
                activeFilters[filterType].push(value);
            }
            addFilterChip(filterType, value);
        } else {
            activeFilters[filterType] = activeFilters[filterType].filter(item => item !== value);
            removeFilterChipFromUI(filterType, value);
        }

        applyFilters(); // This will reset page to 1 and fetch

        if (filterType === FILTER_TYPES.RESOURCE_TYPES) {
            renderCategoryFilters();
        }
    }
}

// --- Chip Management ---
function getChipId(filterType, filterValue) {
    const safeValue = String(filterValue).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `chip-${filterType}-${safeValue}`;
}

function addFilterChip(filterType, filterValue) {
    if (!chipsArea) return;
    const chipId = getChipId(filterType, filterValue);
    if (document.getElementById(chipId)) return;

    const chip = document.createElement('span');
    chip.classList.add('chip', 'badge', 'bg-secondary', 'text-white', 'me-1', 'mb-1'); // Bootstrap classes
    chip.id = chipId;
    chip.textContent = filterValue;

    const closeButton = document.createElement('i');
    closeButton.classList.add('bi', 'bi-x-circle-fill', 'close-chip', 'ms-2');
    closeButton.style.cursor = 'pointer';
    closeButton.setAttribute('aria-label', `Remove ${filterValue} filter`);
    closeButton.addEventListener('click', () => {
        removeFilter(filterType, filterValue);
    });

    chip.appendChild(closeButton);
    chipsArea.appendChild(chip);
}

function removeFilter(filterType, filterValue) {
    if (filterType === FILTER_TYPES.SEARCH) {
        activeFilters[FILTER_TYPES.SEARCH] = '';
        if (searchInput) searchInput.value = '';
    } else {
        activeFilters[filterType] = activeFilters[filterType].filter(item => item !== filterValue);
        // Construct the class name more carefully: e.g., 'county-filter', not 'counties-filter'
        const checkboxClassName = filterType.endsWith('s') ? filterType.slice(0, -1) + '-filter' : filterType + '-filter';
        const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }

    removeFilterChipFromUI(filterType, filterValue);
    applyFilters(); // This will reset page to 1 and fetch

    if (filterType === FILTER_TYPES.RESOURCE_TYPES) {
        renderCategoryFilters();
    }
}

function removeFilterChipFromUI(filterType, filterValue) {
    if (!chipsArea) return;
    const chipId = getChipId(filterType, filterValue);
    const chipToRemove = document.getElementById(chipId);
    if (chipToRemove) {
        chipsArea.removeChild(chipToRemove);
    }
}

// --- Event Listeners Setup ---
function initializeEventListeners() {
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            if (searchInput) searchInput.focus();
        }
    });

    if (sortBySelect) {
        sortBySelect.addEventListener('change', () => {
            applyFilters(); // Sort change should refetch from page 1
        });
    }

    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            const apiUrl = constructApiUrl();
            fetchResources(apiUrl, true); // `true` means append
        });
    }

    if (countyFiltersDiv) countyFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (populationFiltersDiv) populationFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (resourceTypeFiltersDiv) resourceTypeFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (categoryFiltersDiv) categoryFiltersDiv.addEventListener('change', handleFilterChangeDelegated);

    if (resourceListDiv) {
        resourceListDiv.addEventListener('click', handleResourceBadgeClickDelegated);
        resourceListDiv.addEventListener('click', handleMapViewLinkClickDelegated); // New listener for map links
    }
}

function handleSearch() {
    if (!searchInput) return;
    const searchTerm = searchInput.value.trim();

    // Remove old search chip if search term changed
    if (activeFilters[FILTER_TYPES.SEARCH] && activeFilters[FILTER_TYPES.SEARCH] !== searchTerm) {
        removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
    }

    activeFilters[FILTER_TYPES.SEARCH] = searchTerm;
    if (searchTerm) {
        addFilterChip(FILTER_TYPES.SEARCH, searchTerm);
    } else {
        removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH] || ''); // Remove if term is now empty
    }
    applyFilters(); // This will reset page to 1 and fetch
}

function handleFilterChangeDelegated(event) {
    if (event.target.matches('input[type="checkbox"].county-filter') ||
        event.target.matches('input[type="checkbox"].population-filter') ||
        event.target.matches('input[type="checkbox"].resource-type-filter') ||
        event.target.matches('input[type="checkbox"].category-filter')) {
        handleFilterChange(event);
    }
}

function handleResourceBadgeClickDelegated(event) {
    const badge = event.target.closest('.badge[data-filter][data-value]');
    if (badge) {
        const filterType = badge.dataset.filter;
        const filterValue = badge.dataset.value;

        if (filterType && filterValue && activeFilters[filterType] !== undefined) {
            if ((Array.isArray(activeFilters[filterType]) && activeFilters[filterType].includes(filterValue)) || activeFilters[filterType] === filterValue) {
                return; // Already active
            }

            if (Array.isArray(activeFilters[filterType])) {
                const checkboxClassName = filterType.endsWith('s') ? filterType.slice(0, -1) + '-filter' : filterType + '-filter';
                const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);

                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    // The 'change' event on the checkbox will trigger handleFilterChange,
                    // which updates activeFilters, chips, and applies filters.
                    // Manually dispatch if needed or ensure handleFilterChange is robust.
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);
                } else if (!checkbox) { // For tags that might not have a direct filter checkbox (though less common now)
                    activeFilters[filterType].push(filterValue);
                    addFilterChip(filterType, filterValue);
                    applyFilters();
                    if (filterType === FILTER_TYPES.RESOURCE_TYPES) {
                        renderCategoryFilters();
                    }
                }
            }
        }
    }
}

/**
 * Delegated event handler for map view links in resource cards.
 * @param {Event} event
 */
function handleMapViewLinkClickDelegated(event) {
    const mapLink = event.target.closest('a.map-view-link');
    if (mapLink && map) {
        event.preventDefault();
        const lat = parseFloat(mapLink.dataset.latitude);
        const lon = parseFloat(mapLink.dataset.longitude);
        const resourceId = mapLink.dataset.resourceId; // Using 'Location Name' as ID for now

        if (!isNaN(lat) && !isNaN(lon)) {
            map.flyTo({
                center: [lon, lat],
                zoom: 17, // Zoom in closer
                speed: 3.5
            });

            // Find the marker and open its popup
            const targetMarker = mapMarkers.find(m => m._resourceId === resourceId);
            if (targetMarker) {
                // Close any other open popups first for a cleaner experience
                mapMarkers.forEach(m => {
                    if (m.getPopup().isOpen()) {
                        m.togglePopup();
                    }
                });
                targetMarker.togglePopup(); // Open the target marker's popup
            }
        } else {
            console.warn("Invalid coordinates for map link:", mapLink.dataset);
        }
    }
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    if (!searchInput || !searchButton || !chipsArea || !countyFiltersDiv || !populationFiltersDiv ||
        !resourceTypeFiltersDiv || !categoryFiltersDiv || !resourceListDiv || !resultsCounter ||
        !loadMoreButton || !loadMoreDiv || !sortBySelect || !mapDiv) { // Added mapDiv check
        console.error("One or more essential DOM elements are missing. Script will not run correctly.");
        if (document.body) { // Basic fallback message
             const errorMsgDiv = document.createElement('div');
             errorMsgDiv.className = 'alert alert-danger m-3';
             errorMsgDiv.textContent = 'Error: Critical page elements are missing. The application may not function correctly.';
             document.body.prepend(errorMsgDiv); // Prepend to be visible
        }
        return;
    }

    initializeMap(); // Initialize map first
    initializeEventListeners();
    const initialApiUrl = constructApiUrl();
    fetchResources(initialApiUrl); // This will now also update map markers
    renderCategoryFilters();
});