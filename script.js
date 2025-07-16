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
const mapDiv = document.getElementById('map');
const resultsSection = document.getElementById('results');
const loaderContainer = document.getElementById('loader-container'); // Loader animation container

// --- API and Configuration ---
const API_BASE_URL = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
const RESOURCES_PER_PAGE = 25;
const MAPTILER_API_KEY = '1nPjVtGASMJJCaJkeKXQ'; // Your MapTiler API Key

const CATEGORY_OPTIONS = {
    'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Government', 'Other'],
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
    POPULATIONS: 'Populations', // Corresponds to 'Populations Served' in NocoDB if that's the column name
    RESOURCE_TYPE: 'Resource Type',
    CATEGORY: 'Category',
    USER_LAT: 'userLat', // For distance sorting
    USER_LON: 'userLon'  // For distance sorting
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
let currentUserLatitude = null;
let currentUserLongitude = null;
let isFetchingLocation = false; // To prevent multiple geolocation requests

// --- Initialize filters from URL ---
const url = new URL(window.location.href);
const urlParams = url.searchParams;

// Read counties from query params
if (urlParams.has('County')) {
    activeFilters[FILTER_TYPES.COUNTIES] = urlParams.getAll('County');
}
if (urlParams.has('Populations')) {
    activeFilters[FILTER_TYPES.POPULATIONS] = urlParams.getAll('Populations');
}
if (urlParams.has('Resource Type')) {
    activeFilters[FILTER_TYPES.RESOURCE_TYPES] = urlParams.getAll('Resource Type');
}
if (urlParams.has('Category')) {
    activeFilters[FILTER_TYPES.CATEGORIES] = urlParams.getAll('Category');
}
if (urlParams.has('search')) {
    activeFilters[FILTER_TYPES.SEARCH] = urlParams.get('search');
}

// --- Map Variables ---
let map;
let mapMarkers = [];

// --- Utility Functions (Great-circle distance, kept for potential other uses, not for sorting) ---
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function calculateGreatCircleDistance(lat1, lon1, lat2, lon2) {
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
function initializeMap() {
    if (!mapDiv) {
        console.error("Map container element not found.");
        return;
    }
    try {
        map = new maplibregl.Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
            center: [-77.0369, 38.9072], // Default center
            zoom: 9, // Adjusted default zoom
            pitch: 30,
        });

        map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

        const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });
        map.addControl(geolocateControl, 'bottom-left');

        // Listen to geolocate success to potentially grab user location for sorting
        geolocateControl.on('geolocate', (e) => {
            currentUserLatitude = e.coords.latitude;
            currentUserLongitude = e.coords.longitude;
            console.log('User location obtained via map control:', currentUserLatitude, currentUserLongitude);
            // If sort by distance was pending, re-apply
            if (sortBySelect && sortBySelect.value === 'distance' && !isFetchingLocation) {
                 // Check if already fetching to avoid loop if 'geolocate' fires after manual request
                console.log("User located via map, re-applying distance sort if active.");
                applyFilters();
            }
        });
         geolocateControl.on('error', (e) => {
            console.warn('Error getting location via map control:', e.message);
            // If distance sort is active, alert user or handle gracefully
            if (sortBySelect && sortBySelect.value === 'distance') {
                alert('Could not get your location for distance sorting. Please ensure location services are enabled.');
                // Optionally, revert to a default sort or disable the distance sort option
                // sortBySelect.value = 'default_sort_value'; // Replace with a sensible default
                // applyFilters();
            }
        });


    } catch (error) {
        console.error("Error initializing map:", error);
        if (mapDiv) {
            mapDiv.innerHTML = "<div class='alert alert-danger'>Could not load the map.</div>";
        }
    }
}

function updateMapMarkers(resources) {
    if (!map) {
        console.warn("Map not initialized, cannot update markers.");
        return;
    }

    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];

    if (!resources || resources.length === 0) {
        return;
    }

    const bounds = new maplibregl.LngLatBounds();
    let validMarkersExist = false;
    const markerColor = '#55298a';

    resources.forEach(resource => {
        const lat = parseFloat(resource.Latitude);
        const lon = parseFloat(resource.Longitude);

        if (!isNaN(lat) && !isNaN(lon)) {
            validMarkersExist = true;
            // Display distance if available (e.g., from distance sort)
            let distanceText = '';
            if (resource.distanceInMiles !== undefined && resource.distanceInMiles !== null) {
                 distanceText = `<p class="text-info lh-1 py-0 mb-1">Distance: ${resource.distanceInMiles.toFixed(1)} miles</p>`;
            } else if (resource.distance !== undefined && resource.distance !== null && resource.distance !== Infinity) {
                // Assuming 'distance' from worker is in meters if not converted
                const distanceInKm = resource.distance / 1000;
                const distanceInMilesVal = distanceInKm * 0.621371;
                distanceText = `<p class="text-info lh-1 py-0 mb-1">Distance: ${distanceInMilesVal.toFixed(1)} miles</p>`;
            }


            const popupContent = `
                <div class="map-popup-container" style="max-width: 300px;">
                    <div class="row no-gutters py-0 px-1">
                        <div class="card-body col-12 p-3">
                            <h3 class="text-secondary fw-bold lh-1 py-0">${resource['Location Name'] || 'N/A'}</h3>
                            <h5 class="text-dark fw-light lh-1 py-0">${resource.Organization || 'N/A'}</h5>
                            ${distanceText}
                            <p class="text-body-tertiary lh-1 py-0 mb-1">${resource.Address || 'N/A'}<br />
                                ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}
                            </p>
                            <p class="mb-0">
                                ${resource['Google Maps URL'] ? `<a class="text-primary fw-bold d-block mb-1" href="${resource['Google Maps URL']}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt-fill"></i> Directions</a>` : ''}
                                ${resource.Website ? `<a class="text-primary d-block mb-1" href="${resource.Website}" target="_blank" rel="noopener noreferrer"><i class="bi bi-globe"></i> Website</a>` : ''}
                                ${resource.Phone ? `<a class="text-primary text-decoration-none fw-bold d-block" href="${resource['Phone URL'] || '#'}"><i class="bi bi-telephone-fill text-primary"></i> ${resource.Phone}</a>` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>`;

            const popup = new maplibregl.Popup({ offset: 25, maxWidth: '320px' })
                .setHTML(popupContent);

            const marker = new maplibregl.Marker({ color: markerColor })
                .setLngLat([lon, lat])
                .setPopup(popup)
                .addTo(map);

            marker._resourceId = resource.ID || resource['Location Name']; // Use a unique ID if available
            mapMarkers.push(marker);
            bounds.extend([lon, lat]);
        }
    });

    if (validMarkersExist && !bounds.isEmpty()) {
        if (resources.length <= RESOURCES_PER_PAGE * 2 || currentPage === 1 ) {
             map.fitBounds(bounds, { padding: 70, maxZoom: 15 }); // Increased padding
        }
    } else if (currentPage === 1 && allFetchedResources.length === 0) {
        // Don't fly to default if user location is set and map is centered there by GeolocateControl
        if (!(map.getCenter().lng === currentUserLongitude && map.getCenter().lat === currentUserLatitude)) {
             map.flyTo({ center: [-77.0369, 38.9072], zoom: 7 });
        }
    }
}


// --- API Interaction ---
function constructApiUrl() {
    const params = new URLSearchParams();
    params.append(API_PARAMS.PAGE, currentPage);
    params.append(API_PARAMS.LIMIT, RESOURCES_PER_PAGE);

    const sortValue = sortBySelect.value;
    if (sortValue) {
        params.append(API_PARAMS.SORT, sortValue);
        // If sorting by distance, add user coordinates
        if (sortValue === 'distance' && currentUserLatitude !== null && currentUserLongitude !== null) {
            params.append(API_PARAMS.USER_LAT, currentUserLatitude);
            params.append(API_PARAMS.USER_LON, currentUserLongitude);
        } else if (sortValue === 'distance' && (currentUserLatitude === null || currentUserLongitude === null)) {
            console.warn("Attempting to sort by distance, but user location is not available.");
            // Potentially remove sort=distance if location is missing to avoid backend error or unwanted behavior
            params.delete(API_PARAMS.SORT);
            // Or you could add a default sort: params.append(API_PARAMS.SORT, 'default_sort_field');
        }
    }
    /*
    IMPORTANT FOR ALPHABETICAL/COUNTY SORT:
    The HTML for the sortBySelect dropdown should have <option> elements
    where the `value` attribute exactly matches the NocoDB column name you want to sort by.
    For example:
    <select id="sort-by" class="form-select">
        <option value="">Sort by...</option>
        <option value="Location Name">Alphabetical (Name)</option> <option value="County">County</option> <option value="distance">Distance (Nearest)</option> <option value="-Location Name">Alphabetical (Name Z-A)</option> </select>
    The backend worker passes these values directly to NocoDB.
    */


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
    console.log("Fetching resources from URL:", url); // Log the URL
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}, URL: ${url}, Response: ${errorText}`);
            resourceListDiv.innerHTML = `<div class="alert alert-danger">Failed to load resources. Server returned status ${response.status}. Please try again later.</div>`;
            updateLoadMoreVisibility(true);
            if (!shouldAppend) allFetchedResources = [];
            updateMapMarkers(allFetchedResources);
            return;
        }
        const data = await response.json();
        const newResources = data.list || [];
        const pageInfo = data.pageInfo || {};

        if (!shouldAppend) {
            totalResourceCount = pageInfo.totalRows || 0;
            allFetchedResources = newResources;
        } else {
            totalResourceCount = pageInfo.totalRows || totalResourceCount; // Use new total if available
            allFetchedResources = allFetchedResources.concat(newResources);
        }

        renderResources(newResources, shouldAppend);
        updateResultsCounter();
        updateLoadMoreVisibility();
        updateMapMarkers(allFetchedResources);

    } catch (error) {
        console.error('Error fetching resources:', error);
        resourceListDiv.innerHTML = '<div class="alert alert-danger">An error occurred while fetching resources. Please check your connection and try again.</div>';
        updateLoadMoreVisibility(true);
        if (!shouldAppend) allFetchedResources = [];
        updateMapMarkers(allFetchedResources);
    }
}

// --- UI Rendering ---
function renderCategoryFilters() {
    if (!categoryFiltersDiv) return;
    categoryFiltersDiv.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const selectedResourceTypes = activeFilters[FILTER_TYPES.RESOURCE_TYPES];
    const visibleCategories = new Set(['Government', 'Other']); // Ensure these are always options

    selectedResourceTypes.forEach(type => {
        if (CATEGORY_OPTIONS[type]) {
            CATEGORY_OPTIONS[type].forEach(cat => visibleCategories.add(cat));
        }
    });

    // Add any currently selected categories even if their parent resource type is deselected
    activeFilters[FILTER_TYPES.CATEGORIES].forEach(cat => visibleCategories.add(cat));


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

function syncCheckboxesWithFilters() {
    const checkboxGroups = {
        [FILTER_TYPES.COUNTIES]: countyFiltersDiv,
        [FILTER_TYPES.POPULATIONS]: populationFiltersDiv,
        [FILTER_TYPES.RESOURCE_TYPES]: resourceTypeFiltersDiv,
        [FILTER_TYPES.CATEGORIES]: categoryFiltersDiv
    };

    for (const filterType in checkboxGroups) {
        const container = checkboxGroups[filterType];
        const selectedValues = activeFilters[filterType];
        if (!container || !selectedValues || selectedValues.length === 0) continue;

        selectedValues.forEach(value => {
            const safeSelector = `input[type="checkbox"][value="${CSS.escape(value)}"]`;
            const checkbox = container.querySelector(safeSelector);
            if (checkbox) checkbox.checked = true;
        });
    }
}

function syncChipsWithFilters() {
    for (const filterType in activeFilters) {
        const values = activeFilters[filterType];
        if (Array.isArray(values)) {
            values.forEach(value => addFilterChip(filterType, value));
        } else if (typeof values === 'string' && values.trim() !== '') {
            addFilterChip(filterType, values);
        }
    }
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
            const resourceIdentifier = resource.ID || resource['Location Name'] || Math.random().toString(36).substring(7);

            // Display distance if available from worker (e.g., after distance sort)
            // The worker might add a 'distance' (meters) or 'distanceInMiles' field.
            let distanceDisplay = '';
            if (resource.distanceInMiles !== undefined && resource.distanceInMiles !== null) {
                 distanceDisplay = `<h6 class="text-info">Distance: ${resource.distanceInMiles.toFixed(1)} miles</h6>`;
            } else if (resource.distance !== undefined && resource.distance !== null && resource.distance !== Infinity) {
                // Assuming 'distance' from worker is in meters if not converted
                const distanceInKm = resource.distance / 1000;
                const distanceInMilesVal = distanceInKm * 0.621371;
                distanceDisplay = `<h6 class="text-info">Distance: ${distanceInMilesVal.toFixed(1)} miles</h6>`;
            }


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
                            ${distanceDisplay}
                            <div class="mb-2">
                                ${resource['Resource Type'] ? `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.RESOURCE_TYPES}" data-value="${resource['Resource Type']}">${resource['Resource Type']}</span>` : ''}
                                ${resource.Category ? `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.CATEGORIES}" data-value="${resource.Category}">${resource.Category}</span>` : ''}
                            </div>
                            <h6>Phone: ${resource.Phone || 'N/A'}</h6>
                            <p>${resource.Address || 'N/A'} <br>
                                ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}<br />
                                ${resource['Google Maps URL'] ? `<strong><a href="${resource['Google Maps URL']}" class="text-secondary" target="_blank" rel="noopener noreferrer">Directions</a></strong>` : ''}
                            </p>
                            ${(resource['Populations Served'] && resource['Populations Served'].trim() !== '') ? `<h6>Populations Served:</h6><div>
                                ${(resource['Populations Served'] || '').split(',').map(pop => pop.trim()).filter(pop => pop).map(pop => `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.POPULATIONS}" data-value="${pop}">${pop}</span>`).join('')}
                            </div>` : ''}
                            ${resource.County ? `<h6>County:</h6><div>
                                <span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.COUNTIES}" data-value="${resource.County}">${resource.County}</span>
                            </div>` : ''}
                            <div class="row d-flex justify-content-end position-relative">
                                ${resource.Image ? `<div class="col-md-auto d-flex justify-content-end align-items-end p-2" style="position:relative"><img class="cardImage"  onerror="this.style.display='none'" src="${resource.Image}" alt="${resource.Organization || resource['Location Name'] || 'Resource logo'}" ></div>` : ''}
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
        allFetchedResources = [];
    }
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl, false);
}

function handleSortChange() {
    const sortValue = sortBySelect.value;
    if (sortValue === 'distance') {
        if (currentUserLatitude !== null && currentUserLongitude !== null) {
            // Location already known, apply filters
            applyFilters();
        } else if (!isFetchingLocation) {
            // Location not known, try to get it
            isFetchingLocation = true;
            // Show some loading state to user
            if (resultsCounter) resultsCounter.textContent = "Getting your location for distance sorting...";
            if (resourceListDiv) resourceListDiv.innerHTML = '<div class="alert alert-info">Fetching your location...</div>';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentUserLatitude = position.coords.latitude;
                    currentUserLongitude = position.coords.longitude;
                    console.log('User location obtained via navigator.geolocation:', currentUserLatitude, currentUserLongitude);
                    isFetchingLocation = false;
                    applyFilters(); // Now apply filters with location
                },
                (error) => {
                    console.error("Error getting user location:", error.message);
                    isFetchingLocation = false;
                    alert("Could not get your location. Please ensure location services are enabled and try again. Sorting by distance is unavailable.");
                    // Revert to a default sort or clear sort
                    sortBySelect.value = ""; // Or a default sort value like "Location Name"
                    if (resultsCounter) resultsCounter.textContent = ""; // Clear loading message
                    applyFilters(); // Re-fetch with default/no sort
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            console.log("Already fetching location, please wait.");
        }
    } else {
        // For other sort types (alphabetical, county), just apply filters
        applyFilters();
    }
}

function handleFilterChangeDelegated(event) {
  if (!event.target.matches('input[type="checkbox"]')) return;

  handleFilterChange(event);

  // This ensures categories update on Resource Type change
  if (event.target.classList.contains('resource-type-filter')) {
    renderCategoryFilters();
  }
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

        applyFilters();

        if (filterType === FILTER_TYPES.RESOURCE_TYPES) {
            // If resource types change, re-render category filters
            // Also, if all resource types are deselected, clear category filters
            if (activeFilters[FILTER_TYPES.RESOURCE_TYPES].length === 0) {
                 activeFilters[FILTER_TYPES.CATEGORIES].forEach(catVal => removeFilterChipFromUI(FILTER_TYPES.CATEGORIES, catVal));
                 activeFilters[FILTER_TYPES.CATEGORIES] = [];
            }
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

    // Special label for counties: add "County" unless it's Philadelphia
    let displayValue = filterValue;
    if (filterType === FILTER_TYPES.COUNTIES && filterValue !== 'Philadelphia') {
        displayValue = `${filterValue} County`;
    }

    const chipId = getChipId(filterType, filterValue);
    if (document.getElementById(chipId)) return;

    const chip = document.createElement('span');
    chip.classList.add('chip', 'badge', 'bg-secondary', 'text-white', 'me-1', 'mb-1');
    chip.id = chipId;
    chip.textContent = displayValue;

    const closeButton = document.createElement('i');
    closeButton.classList.add('bi', 'bi-x-circle-fill', 'close-chip', 'ms-2');
    closeButton.style.cursor = 'pointer';
    closeButton.setAttribute('aria-label', `Remove ${displayValue} filter`);
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
        const checkboxClassName = filterType === FILTER_TYPES.COUNTIES ? 'county-filter' :
                                filterType === FILTER_TYPES.POPULATIONS ? 'population-filter' :
                                filterType === FILTER_TYPES.RESOURCE_TYPES ? 'resource-type-filter' :
                                filterType === FILTER_TYPES.CATEGORIES ? 'category-filter' : '';
        if (checkboxClassName) {
            const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }
    }

    removeFilterChipFromUI(filterType, filterValue);
    applyFilters();

    if (filterType === FILTER_TYPES.RESOURCE_TYPES || filterType === FILTER_TYPES.CATEGORIES) {
        renderCategoryFilters(); // Re-render if resource type or category removed
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
        searchButton.addEventListener('click', handleSearchWithLoader);
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchWithLoader();
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
        sortBySelect.addEventListener('change', handleSortChange); // Changed to new handler
    }

    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            const apiUrl = constructApiUrl();
            fetchResources(apiUrl, true);
        });
    }

    if (countyFiltersDiv) countyFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (populationFiltersDiv) populationFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (resourceTypeFiltersDiv) resourceTypeFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
    if (categoryFiltersDiv) categoryFiltersDiv.addEventListener('change', handleFilterChangeDelegated);

    if (resourceListDiv) {
        resourceListDiv.addEventListener('click', handleResourceBadgeClickDelegated);
        resourceListDiv.addEventListener('click', handleMapViewLinkClickDelegated);
    }
}

// Show loader, then show results section after 4 seconds and trigger search.
function handleSearchWithLoader() {
    if (!searchInput) return;

    // Show loader, hide results
    if (loaderContainer) loaderContainer.style.display = "flex";
    if (resultsSection) resultsSection.style.display = "none";

    // After 4 seconds, hide loader and show results
    setTimeout(() => {
        if (loaderContainer) loaderContainer.style.display = "none";
        if (resultsSection) resultsSection.style.display = "block";
        // Now trigger the actual search/filtering logic
        handleSearch();
    }, 4000);
}

function handleSearch() {
    if (!searchInput) return;
    const searchTerm = searchInput.value.trim();

    if (activeFilters[FILTER_TYPES.SEARCH] && activeFilters[FILTER_TYPES.SEARCH] !== searchTerm) {
        removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
    }

    activeFilters[FILTER_TYPES.SEARCH] = searchTerm;
    if (searchTerm) {
        addFilterChip(FILTER_TYPES.SEARCH, searchTerm);
    } else {
        // Ensure chip is removed if search term is cleared
        removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH] || '');
    }
    applyFilters();
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
            // Check if the filter is already active by looking at the corresponding checkbox
            const checkboxClassName = filterType === FILTER_TYPES.COUNTIES ? 'county-filter' :
                                    filterType === FILTER_TYPES.POPULATIONS ? 'population-filter' :
                                    filterType === FILTER_TYPES.RESOURCE_TYPES ? 'resource-type-filter' :
                                    filterType === FILTER_TYPES.CATEGORIES ? 'category-filter' : '';
            if (!checkboxClassName) return;

            const correspondingCheckbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);

            if (correspondingCheckbox && !correspondingCheckbox.checked) {
                correspondingCheckbox.checked = true;
                // Dispatch a change event to trigger the standard filter handling logic
                const changeEvent = new Event('change', { bubbles: true });
                correspondingCheckbox.dispatchEvent(changeEvent);
            } else if (!correspondingCheckbox && Array.isArray(activeFilters[filterType]) && !activeFilters[filterType].includes(filterValue)) {
                // Fallback for cases where a direct checkbox might not exist (less common now)
                // or if the badge represents a filter that isn't tied to a visible checkbox set
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

function handleMapViewLinkClickDelegated(event) {
    const mapLink = event.target.closest('a.map-view-link');
    if (mapLink && map) {
        event.preventDefault();
        const lat = parseFloat(mapLink.dataset.latitude);
        const lon = parseFloat(mapLink.dataset.longitude);
        const resourceId = mapLink.dataset.resourceId;

        if (!isNaN(lat) && !isNaN(lon)) {
            map.flyTo({
                center: [lon, lat],
                zoom: 17, // Zoom in closer
                speed: 1.2
            });

            const targetMarker = mapMarkers.find(m => m._resourceId === resourceId);
            if (targetMarker) {
                mapMarkers.forEach(m => {
                    if (m.getPopup().isOpen()) {
                        m.togglePopup();
                    }
                });
                // Timeout to allow map to fly before opening popup, can make UX smoother
                setTimeout(() => {
                    if (targetMarker.getPopup()) { // Check if popup exists
                        targetMarker.togglePopup();
                    }
                }, 600); // Adjust timing as needed
            }
        } else {
            console.warn("Invalid coordinates for map link:", mapLink.dataset);
        }
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // ---- Existing Setup (No Changes Here) ----
    const urlParams = new URLSearchParams(window.location.search);

    // Check URL for search parameter and pre-fill search input
    const initialSearchTerm = urlParams.get('search');
    if (searchInput && initialSearchTerm) {
        searchInput.value = initialSearchTerm;
        activeFilters[FILTER_TYPES.SEARCH] = initialSearchTerm;
    }

    if (!searchInput || !searchButton || !chipsArea || !countyFiltersDiv || !populationFiltersDiv ||
        !resourceTypeFiltersDiv || !categoryFiltersDiv || !resourceListDiv || !resultsCounter ||
        !loadMoreButton || !loadMoreDiv || !sortBySelect || !mapDiv) {
        console.error("One or more essential DOM elements are missing. Script will not run correctly.");
        if (document.body) {
             const errorMsgDiv = document.createElement('div');
             errorMsgDiv.className = 'alert alert-danger m-3';
             errorMsgDiv.textContent = 'Error: Critical page elements are missing. The application may not function correctly.';
             document.body.prepend(errorMsgDiv);
        }
        return;
    }

    initializeMap();
    initializeEventListeners();
    renderCategoryFilters();
    syncCheckboxesWithFilters();
    syncChipsWithFilters();

    // ---- NEW LOGIC STARTS HERE ----

    // Check if any filter parameters exist in the URL
    if (urlParams.size > 0) {
        // Hide the default landing page sections
        document.getElementById('countySearch')?.style.setProperty('display', 'none');
        document.getElementById('resource-types')?.style.setProperty('display', 'none');

        // Show the loader while we fetch results
        if (loaderContainer) loaderContainer.style.display = "flex";
        if (resultsSection) resultsSection.style.display = "none";

        // Apply the filters that were loaded from the URL
        applyFilters(true);

        // Wait for the results to load, then display them
        const checkInterval = setInterval(() => {
            const resultsLoaded = resourceListDiv && (resourceListDiv.querySelector('.resourceCard') || resourceListDiv.querySelector('.alert-info'));
            if (resultsLoaded) {
                if (loaderContainer) loaderContainer.style.display = 'none';
                if (resultsSection) resultsSection.style.display = 'block';
                clearInterval(checkInterval);
            }
        }, 200);

    } else {
        // Original behavior: If no URL filters, hide results and loader
        if (resultsSection) resultsSection.style.display = "none";
        if (loaderContainer) loaderContainer.style.display = "none";
    }
});
// Handle county card clicks to filter results
document.querySelectorAll('.county-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const county = card.getAttribute('data-county');
        if (!county) return;

        activeFilters[FILTER_TYPES.COUNTIES] = [county];
        activeFilters[FILTER_TYPES.SEARCH] = '';
        activeFilters[FILTER_TYPES.POPULATIONS] = [];
        activeFilters[FILTER_TYPES.RESOURCE_TYPES] = [];
        activeFilters[FILTER_TYPES.CATEGORIES] = [];

        if (chipsArea) chipsArea.innerHTML = '';
        renderCategoryFilters();
        syncCheckboxesWithFilters();
        syncChipsWithFilters();

        loaderContainer?.style.setProperty('display', 'flex');

        const countySearchSection = document.getElementById('countySearch');
        if (countySearchSection) countySearchSection.classList.remove('show'); // Bootstrap collapse

        applyFilters(true);

        const checkInterval = setInterval(() => {
            if (resourceListDiv && resourceListDiv.querySelector('.resourceCard')) {
                loaderContainer.style.display = 'none';
                resultsSection.style.display = 'block';
                clearInterval(checkInterval);
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 200);
    });
});
// Handle resource type card clicks to filter results
document.querySelectorAll('.resource-type-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        const resourceType = card.getAttribute('data-resource-type');
        if (!resourceType) return;

        // Reset all other filters
        activeFilters[FILTER_TYPES.RESOURCE_TYPES] = [resourceType];
        activeFilters[FILTER_TYPES.COUNTIES] = [];
        activeFilters[FILTER_TYPES.SEARCH] = '';
        activeFilters[FILTER_TYPES.POPULATIONS] = [];
        activeFilters[FILTER_TYPES.CATEGORIES] = [];

        // Update the filter UI (chips, checkboxes)
        if (chipsArea) chipsArea.innerHTML = '';
        renderCategoryFilters();
        syncCheckboxesWithFilters();
        syncChipsWithFilters();

        // Show loader and hide the initial search content
        loaderContainer?.style.setProperty('display', 'flex');
        document.getElementById('countySearch')?.style.setProperty('display', 'none');
        document.getElementById('resource-types')?.style.setProperty('display', 'none');

        // Apply the filter and fetch results
        applyFilters(true);

        // Wait for results to load, then show the results section
        const checkInterval = setInterval(() => {
            // Check if results are loaded or if a "no results" message is shown
            const resultsLoaded = resourceListDiv && (resourceListDiv.querySelector('.resourceCard') || resourceListDiv.querySelector('.alert-info'));
            if (resultsLoaded) {
                loaderContainer.style.display = 'none';
                resultsSection.style.display = 'block';
                clearInterval(checkInterval);
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 200);
    });
});