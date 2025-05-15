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

// --- API and Configuration ---
const API_BASE_URL = 'https://resourcesdatabaseproxy.crodican.workers.dev/'; // Your worker URL
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
    COUNTY: 'County', // These should match NocoDB actual column names if used directly as query params
    POPULATIONS: 'Populations',
    RESOURCE_TYPE: 'ResourceType', // Assuming NocoDB might prefer this for query params if not using 'Resource Type'
    CATEGORY: 'Category',
    USER_LAT: 'userLat',
    USER_LON: 'userLon',
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
let allFetchedResources = [];
let currentUserLatitude = null;
let currentUserLongitude = null;
let isFetchingLocation = false;

// --- Map Variables ---
let map;
let mapMarkers = [];

// --- Utility Functions ---
function deg2rad(deg) {
    return deg * (Math.PI / 180);
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
            center: [-77.0369, 38.9072],
            zoom: 7,
        });

        map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        });
        map.addControl(geolocateControl, 'bottom-left');

        geolocateControl.on('geolocate', (e) => {
            currentUserLatitude = e.coords.latitude;
            currentUserLongitude = e.coords.longitude;
            console.log('User location obtained via map control:', currentUserLatitude, currentUserLongitude);
            if (sortBySelect && sortBySelect.value === 'distance' && !isFetchingLocation) {
                applyFilters();
            }
        });
        geolocateControl.on('error', (e) => {
            console.warn('Error getting location via map control:', e.message);
            if (sortBySelect && sortBySelect.value === 'distance') {
                alert('Could not get your location via map control for distance sorting. Please ensure location services are enabled or try the sort again.');
            }
        });
    } catch (error) {
        console.error("Error initializing map:", error);
        if (mapDiv) mapDiv.innerHTML = "<div class='alert alert-danger'>Could not load the map.</div>";
    }
}

function updateMapMarkers(resources) {
    if (!map) {
        console.warn("Map not initialized, cannot update markers.");
        return;
    }
    mapMarkers.forEach(marker => marker.remove());
    mapMarkers = [];
    if (!resources || resources.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    let validMarkersExist = false;
    const markerColor = '#55298a';

    resources.forEach(resource => {
        // Use the exact field names as returned by your NocoDB via the worker
        const lat = parseFloat(resource.Latitude);
        const lon = parseFloat(resource.Longitude);
        const locationName = resource['Location Name'] || resource.LocationName || 'N/A';
        const organization = resource.Organization || 'N/A';
        const address = resource.Address || 'N/A';
        const city = resource.City || 'N/A';
        const state = resource.State || 'N/A';
        const zipCode = resource['Zip Code'] || resource.ZipCode || 'N/A';
        const googleMapsUrl = resource['Google Maps URL'] || resource.GoogleMapsURL;
        const website = resource.Website;
        const phone = resource.Phone;
        const phoneUrl = resource['Phone URL'] || resource.PhoneURL;


        if (!isNaN(lat) && !isNaN(lon)) {
            validMarkersExist = true;
            let distanceText = '';
            if (resource.distanceInMiles != null && resource.distanceInMiles !== Infinity) {
                let label = "Distance";
                if (resource.distanceSource === 'geoapify_driving_time' || resource.distanceSource === 'geoapify_driving_time_estimated_dist' && resource.drivingTimeSeconds != null) {
                    const timeMinutes = Math.round(resource.drivingTimeSeconds / 60);
                    label = `Approx. ${timeMinutes} min drive`;
                    distanceText = `<p class="text-info lh-1 py-0 mb-1">${label} (${resource.distanceInMiles.toFixed(1)} mi)</p>`;
                } else if (resource.distanceSource === 'geoapify_driving_distance') {
                     distanceText = `<p class="text-info lh-1 py-0 mb-1">Distance: ${resource.distanceInMiles.toFixed(1)} miles (driving)</p>`;
                } else { // great_circle or other
                     distanceText = `<p class="text-info lh-1 py-0 mb-1">Distance: ${resource.distanceInMiles.toFixed(1)} miles (${resource.distanceSource === 'great_circle' ? 'as crow flies' : 'estimated'})</p>`;
                }
            }

            const popupContent = `
                <div class="map-popup-container" style="max-width: 300px;">
                    <div class="row no-gutters py-0 px-1">
                        <div class="card-body col-12 p-3">
                            <h3 class="text-secondary fw-bold lh-1 py-0">${locationName}</h3>
                            <h5 class="text-dark fw-light lh-1 py-0">${organization}</h5>
                            ${distanceText}
                            <p class="text-body-tertiary lh-1 py-0 mb-1">${address}<br />
                                ${city}, ${state}, ${zipCode}
                            </p>
                            <p class="mb-0">
                                ${googleMapsUrl ? `<a class="text-primary fw-bold d-block mb-1" href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt-fill"></i> Directions</a>` : ''}
                                ${website ? `<a class="text-primary d-block mb-1" href="${website}" target="_blank" rel="noopener noreferrer"><i class="bi bi-globe"></i> Website</a>` : ''}
                                ${phone ? `<a class="text-primary text-decoration-none fw-bold d-block" href="${phoneUrl || '#'}"><i class="bi bi-telephone-fill text-primary"></i> ${phone}</a>` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>`;

            const popup = new maplibregl.Popup({ offset: 25, maxWidth: '320px' }).setHTML(popupContent);
            const marker = new maplibregl.Marker({ color: markerColor })
                .setLngLat([lon, lat])
                .setPopup(popup)
                .addTo(map);
            marker._resourceId = resource.ID || locationName;
            mapMarkers.push(marker);
            bounds.extend([lon, lat]);
        }
    });

    if (validMarkersExist && !bounds.isEmpty()) {
        if (resources.length <= RESOURCES_PER_PAGE * 2 || currentPage === 1) {
            map.fitBounds(bounds, { padding: 70, maxZoom: 15 });
        }
    } else if (currentPage === 1 && allFetchedResources.length === 0) {
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

    // IMPORTANT: Verify these field names against your NocoDB API documentation for the table.
    // NocoDB might use the exact column name (e.g., "Location Name") or a transformed version (e.g., "LocationName").
    // If NocoDB uses names with spaces, they need to be URL encoded correctly by URLSearchParams.
    // Using PascalCase as a common API convention, but this needs verification.
    const fieldsToFetch = [
        'ID', 'Location Name', 'Organization', 'Address', 'City', 'State', 'Zip Code', // Prefer exact names if NocoDB supports them with spaces
        'Latitude', 'Longitude', 'Phone', 'Phone URL', 'Website', 'Google Maps URL',
        'Resource Type', 'Category', 'Populations Served', 'County', 'Description', 'Image'
        // If NocoDB uses names like 'LocationName', 'ZipCode', use those instead:
        // 'ID', 'LocationName', 'Organization', 'Address', 'City', 'State', 'ZipCode',
        // 'Latitude', 'Longitude', 'Phone', 'PhoneURL', 'Website', 'GoogleMapsURL',
        // 'ResourceType', 'Category', 'PopulationsServed', 'County', 'Description', 'Image'
    ];
    params.append(API_PARAMS.FIELDS, fieldsToFetch.join(','));

    const sortValue = sortBySelect.value;
    if (sortValue) {
        params.append(API_PARAMS.SORT, sortValue); // Worker handles 'distance' separately. Other sorts are passed to NocoDB.
        if (sortValue === 'distance' && currentUserLatitude !== null && currentUserLongitude !== null) {
            params.append(API_PARAMS.USER_LAT, currentUserLatitude);
            params.append(API_PARAMS.USER_LON, currentUserLongitude);
        } else if (sortValue === 'distance') {
            console.warn("Attempting to sort by distance, but user location is not available. Removing distance sort.");
            params.delete(API_PARAMS.SORT);
        }
    }

    if (activeFilters[FILTER_TYPES.SEARCH]) {
        params.append(API_PARAMS.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
    }
    // For filter parameters like 'County', 'Populations Served', 'Resource Type', 'Category',
    // the worker expects these exact names as query parameters.
    activeFilters[FILTER_TYPES.COUNTIES].forEach(county => params.append('County', county));
    activeFilters[FILTER_TYPES.POPULATIONS].forEach(population => params.append('Populations', population)); // 'Populations' in worker
    activeFilters[FILTER_TYPES.RESOURCE_TYPES].forEach(type => params.append('Resource Type', type)); // 'Resource Type' in worker
    activeFilters[FILTER_TYPES.CATEGORIES].forEach(category => params.append('Category', category));

    return `${API_BASE_URL}?${params.toString()}`;
}

async function fetchResources(url, shouldAppend = false) {
    console.log("Fetching resources from URL:", url);
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            let errorMsg = `Failed to load resources. Server returned status ${response.status}.`;
            if (data && data.error) {
                errorMsg = `Error: ${data.error.message || 'Unknown server error.'} (ID: ${data.error.id || 'N/A'})`;
                console.error(`HTTP error! status: ${response.status}, URL: ${url}, Error:`, data.error);
            } else {
                // If data.error is not available, try to get text for more clues
                const errorText = await response.text(); // Re-fetch text if data wasn't useful JSON
                console.error(`HTTP error! status: ${response.status}, URL: ${url}, Response Text: ${errorText}`);
                errorMsg = `Failed to load resources. Server returned status ${response.status}. Response: ${errorText.substring(0,100)}`;

            }
            resourceListDiv.innerHTML = `<div class="alert alert-danger">${errorMsg} Please try again later.</div>`;
            updateLoadMoreVisibility(true);
            if (!shouldAppend) allFetchedResources = [];
            updateMapMarkers(allFetchedResources);
            return;
        }

        const newResources = data.list || [];
        const pageInfo = data.pageInfo || {};

        if (!shouldAppend) {
            totalResourceCount = pageInfo.totalRows || 0;
            allFetchedResources = newResources;
        } else {
            totalResourceCount = pageInfo.totalRows || totalResourceCount;
            allFetchedResources = allFetchedResources.concat(newResources);
        }

        renderResources(newResources, shouldAppend);
        updateResultsCounter();
        updateLoadMoreVisibility();
        updateMapMarkers(allFetchedResources);

    } catch (error) {
        console.error('Error fetching or processing resources:', error);
        resourceListDiv.innerHTML = `<div class="alert alert-danger">An error occurred: ${error.message}. Please check your connection and try again.</div>`;
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
    const visibleCategories = new Set(['Government', 'Other']);

    selectedResourceTypes.forEach(type => {
        if (CATEGORY_OPTIONS[type]) {
            CATEGORY_OPTIONS[type].forEach(cat => visibleCategories.add(cat));
        }
    });
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

function renderResources(resourcesToRender, shouldAppend = false) {
    if (!resourceListDiv) return;
    if (!shouldAppend) {
        resourceListDiv.innerHTML = '';
    }

    if (resourcesToRender && resourcesToRender.length > 0) {
        const fragment = document.createDocumentFragment();
        resourcesToRender.forEach(resource => {
            const cardElement = document.createElement('div');
            // Use the exact field names as returned by your NocoDB via the worker
            const locationName = resource['Location Name'] || resource.LocationName || 'N/A';
            const organization = resource.Organization || 'N/A';
            const resourceType = resource['Resource Type'] || resource.ResourceType || '';
            const category = resource.Category || '';
            const phone = resource.Phone || 'N/A';
            const address = resource.Address || 'N/A';
            const city = resource.City || 'N/A';
            const state = resource.State || 'N/A';
            const zipCode = resource['Zip Code'] || resource.ZipCode || 'N/A';
            const googleMapsUrl = resource['Google Maps URL'] || resource.GoogleMapsURL;
            const populationsServed = resource['Populations Served'] || resource.PopulationsServed || '';
            const county = resource.County || '';
            const description = resource.Description || '';
            const image = resource.Image || '';
            const website = resource.Website;
            const phoneUrl = resource['Phone URL'] || resource.PhoneURL;
            const longitude = resource.Longitude;
            const latitude = resource.Latitude;

            const resourceIdentifier = resource.ID || locationName;


            let distanceDisplay = '';
            if (resource.distanceInMiles != null && resource.distanceInMiles !== Infinity) {
                let label = "Distance";
                 if (resource.distanceSource === 'geoapify_driving_time' || resource.distanceSource === 'geoapify_driving_time_estimated_dist' && resource.drivingTimeSeconds != null) {
                    const timeMinutes = Math.round(resource.drivingTimeSeconds / 60);
                     label = `Approx. ${timeMinutes < 1 ? "<1" : timeMinutes} min drive`;
                    distanceDisplay = `<h6 class="text-info">${label} (${resource.distanceInMiles.toFixed(1)} mi)</h6>`;
                } else if (resource.distanceSource === 'geoapify_driving_distance') {
                     distanceDisplay = `<h6 class="text-info">Distance: ${resource.distanceInMiles.toFixed(1)} miles (driving)</h6>`;
                }else {
                     distanceDisplay = `<h6 class="text-info">Distance: ${resource.distanceInMiles.toFixed(1)} miles (${resource.distanceSource === 'great_circle' ? 'as crow flies' : 'estimated'})</h6>`;
                }
            }

            cardElement.innerHTML = `
                <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${website || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" target="_blank" rel="noopener noreferrer" aria-label="Visit website for ${locationName}"> <i class="bi bi-globe"></i> </a>
                            <a href="${phoneUrl || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" aria-label="Call ${locationName}"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="#" class="map-view-link d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" data-longitude="${longitude}" data-latitude="${latitude}" data-resource-id="${resourceIdentifier}"> <i class="bi bi-geo-alt-fill"></i> </a>
                        </div>
                        <div class="card-body col-10 p-4">
                            <h3 class="text-secondary">${locationName}</h3>
                            <h5 class="text-dark">${organization}</h5>
                            ${distanceDisplay}
                            <div class="mb-2">
                                ${resourceType ? `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.RESOURCE_TYPES}" data-value="${resourceType}">${resourceType}</span>` : ''}
                                ${category ? `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.CATEGORIES}" data-value="${category}">${category}</span>` : ''}
                            </div>
                            <h6>Phone: ${phone}</h6>
                            <p>${address} <br>
                                ${city}, ${state}, ${zipCode}<br />
                                ${googleMapsUrl ? `<strong><a href="${googleMapsUrl}" class="text-secondary" target="_blank" rel="noopener noreferrer">Directions</a></strong>` : ''}
                            </p>
                            ${(populationsServed && populationsServed.trim() !== '') ? `<h6>Populations Served:</h6><div>
                                ${(populationsServed).split(',').map(pop => pop.trim()).filter(pop => pop).map(pop => `<span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.POPULATIONS}" data-value="${pop}">${pop}</span>`).join('')}
                            </div>` : ''}
                            ${county ? `<h6>County:</h6><div>
                                <span class="badge bg-pink text-black py-2 my-1" data-filter="${FILTER_TYPES.COUNTIES}" data-value="${county}">${county}</span>
                            </div>` : ''}
                            ${description ? `<details><summary>Description</summary><p class="mt-2">${description}</p></details>` : ''}
                            <div class="row d-flex justify-content-end position-relative">
                                ${image ? `<div class="col-md-auto d-flex justify-content-end align-items-end p-2" style="position:relative"><img class="cardImage" src="${image}" alt="${organization || locationName || 'Resource logo'}" ></div>` : ''}
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
            applyFilters();
        } else if (!isFetchingLocation) {
            isFetchingLocation = true;
            if (resultsCounter) resultsCounter.textContent = "Getting your location for distance sorting...";
            if (resourceListDiv) resourceListDiv.innerHTML = '<div class="alert alert-info">Fetching your location... This may take a moment.</div>';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentUserLatitude = position.coords.latitude;
                    currentUserLongitude = position.coords.longitude;
                    console.log('User location obtained via navigator.geolocation:', currentUserLatitude, currentUserLongitude);
                    isFetchingLocation = false;
                    applyFilters();
                },
                (error) => {
                    console.error("Error getting user location:", error.message);
                    isFetchingLocation = false;
                    alert("Could not get your location. Please ensure location services are enabled and try again. Sorting by distance is unavailable.");
                    sortBySelect.value = "";
                    if (resultsCounter) resultsCounter.textContent = "";
                    applyFilters();
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } else {
            console.log("Already fetching location, please wait.");
        }
    } else {
        applyFilters();
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
    const chipId = getChipId(filterType, filterValue);
    if (document.getElementById(chipId)) return;

    const chip = document.createElement('span');
    chip.classList.add('chip', 'badge', 'bg-secondary', 'text-white', 'me-1', 'mb-1');
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
        const checkboxClassName = filterType === FILTER_TYPES.COUNTIES ? 'county-filter' :
            filterType === FILTER_TYPES.POPULATIONS ? 'population-filter' :
            filterType === FILTER_TYPES.RESOURCE_TYPES ? 'resource-type-filter' :
            filterType === FILTER_TYPES.CATEGORIES ? 'category-filter' : '';
        if (checkboxClassName) {
            const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);
            if (checkbox) checkbox.checked = false;
        }
    }
    removeFilterChipFromUI(filterType, filterValue);
    applyFilters();
    if (filterType === FILTER_TYPES.RESOURCE_TYPES || filterType === FILTER_TYPES.CATEGORIES) {
        renderCategoryFilters();
    }
}

function removeFilterChipFromUI(filterType, filterValue) {
    if (!chipsArea) return;
    const chipId = getChipId(filterType, filterValue);
    const chipToRemove = document.getElementById(chipId);
    if (chipToRemove) chipsArea.removeChild(chipToRemove);
}

// --- Event Listeners Setup ---
function initializeEventListeners() {
    if (searchButton) searchButton.addEventListener('click', handleSearch);
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
    if (sortBySelect) sortBySelect.addEventListener('change', handleSortChange);
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
        removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH] || '');
    }
    applyFilters();
}

function handleFilterChangeDelegated(event) {
    if (event.target.matches('input[type="checkbox"].county-filter, input[type="checkbox"].population-filter, input[type="checkbox"].resource-type-filter, input[type="checkbox"].category-filter')) {
        handleFilterChange(event);
    }
}

function handleResourceBadgeClickDelegated(event) {
    const badge = event.target.closest('.badge[data-filter][data-value]');
    if (badge) {
        const filterType = badge.dataset.filter;
        const filterValue = badge.dataset.value;
        if (filterType && filterValue && activeFilters[filterType] !== undefined) {
            const checkboxClassName = filterType === FILTER_TYPES.COUNTIES ? 'county-filter' :
                filterType === FILTER_TYPES.POPULATIONS ? 'population-filter' :
                filterType === FILTER_TYPES.RESOURCE_TYPES ? 'resource-type-filter' :
                filterType === FILTER_TYPES.CATEGORIES ? 'category-filter' : '';
            if (!checkboxClassName) return;
            const correspondingCheckbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${checkboxClassName}`);
            if (correspondingCheckbox && !correspondingCheckbox.checked) {
                correspondingCheckbox.checked = true;
                const changeEvent = new Event('change', { bubbles: true });
                correspondingCheckbox.dispatchEvent(changeEvent);
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
            map.flyTo({ center: [lon, lat], zoom: 17, speed: 1.2 });
            const targetMarker = mapMarkers.find(m => m._resourceId === resourceId);
            if (targetMarker) {
                mapMarkers.forEach(m => { if (m.getPopup().isOpen()) m.togglePopup(); });
                setTimeout(() => { if (targetMarker.getPopup()) targetMarker.togglePopup(); }, 600);
            }
        } else {
            console.warn("Invalid coordinates for map link:", mapLink.dataset);
        }
    }
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    const essentialElements = [
        searchInput, searchButton, chipsArea, countyFiltersDiv, populationFiltersDiv,
        resourceTypeFiltersDiv, categoryFiltersDiv, resourceListDiv, resultsCounter,
        loadMoreButton, loadMoreDiv, sortBySelect, mapDiv
    ];
    if (essentialElements.some(el => el === null)) {
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
    const initialApiUrl = constructApiUrl();
    fetchResources(initialApiUrl);
});