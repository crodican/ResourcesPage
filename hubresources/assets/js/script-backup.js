const apiBaseUrl = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
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
const mapContainer = document.getElementById('map');

let map;
let allResources = [];
let filteredResources = [];
let activeFilters = {
    search: '',
    counties: [],
    populations: [],
    resourceTypes: [],
    categories: []
};
let currentPage = 1;
const resourcesPerPage = 25;
let totalResourceCount = 0;
const markers = [];

//  Add a variable to store the SVG URL.  Make it configurable.
const markerSvgUrl = 'assets/geo-alt-fill.svg';  //  <--  Replace this with your actual SVG URL

const categoryOptions = {
    'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Government', 'Other'],
    'Family Support': ['Family Counseling', 'Family Peer Support', Family Assistance Program', Family Education Program', 'Family Resources', 'Government', 'Other'],
    'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance', 'Government', 'Other'],
    'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other']
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function constructApiUrl(page = currentPage, limit = resourcesPerPage, sort = sortBySelect.value, search = activeFilters.search, counties = activeFilters.counties, populations = activeFilters.populations, resourceTypes = activeFilters.resourceTypes, categories = activeFilters.categories) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (sort && sort !== 'relevance') params.append('sort', sort === 'alphabetical' ? 'Location Name' : '');
    if (search) params.append('search', search);
    counties.forEach(county => params.append('County', county));
    populations.forEach(population => params.append('Populations', population));
    resourceTypes.forEach(type => params.append('Resource Type', type));
    categories.forEach(category => params.append('Category', category));
    return `${apiBaseUrl}?${params.toString()}`;
}

function initializeMap() {
    if (!mapContainer) return;

    map = new maplibregl.Map({
        style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=1nPjVtGASMJJCaJkeKXQ',
        center: [-75.347468, 40.104172],
        zoom: 50.0,
        pitch: 45,                                        //  <---  Add this line to set the initial pitch (angle)
        container: 'map',
        attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({
        customAttribution: '©2025 PRO-ACT, Ambassadors for Recovery'
    }), 'bottom-right');

    // Add zoom controls
    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    // Add geolocation control
    map.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }),
        'bottom-left'
    );


}

function addMapMarker(resource) {
    if (map && resource.Longitude && resource.Latitude) {
        const popupContent = `
                    <div style="transform:scale(0.8);transform:translate(-15px,0)" class="map-popup text-bg-white br-5-5-5-5 mb-5" style="max-width: 300px">
                        <div class="row no-gutters py-0 px-1">
                            <div class="card-body col-10 px-4 pt-4 pb-0">
                                <h3 class="text-secondary fw-bold lh-1 py-0">${resource['Location Name'] || 'N/A'}</h3>
                                <h5 class="text-dark fw-light lh-1 py-0">${resource.Organization || 'N/A'}</h5>
                                <p class="text-body-tertiary lh-1 py-0">${resource.Address || 'N/A'}
                                    <br /> ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}</p>
                                    <p><a class="text-primary fw-bold pt-3" href="${resource['Google Maps URL'] || '#'}" class="text-secondary" target="_blank"><i class="bi bi-geo-alt-fill"></i>  Directions</a>
                                    <br /><a class="text-primary" href="${resource.Website || '#'}" target="_blank"><i class="bi bi-globe"></i>  Website</a>
                                    <br /><a class="text-primary text-decoration-none fw-bold" href="${resource['Phone URL'] || '#'}"><i class="bi bi-telephone-fill text-primary"></i> ${resource.Phone || 'N/A'}</a></p>
                            </div>
                        </div>
                    </div>
                `;

        const popup = new maplibregl.Popup({ offset: 25 })
            .setHTML(popupContent);

        popup.on('open', () => {
            map.flyTo({
                center: [parseFloat(resource.Longitude), parseFloat(resource.Latitude)],
                offset: [0, -180], // Adjust vertical offset as needed
                zoom: 14,             // Set your desired zoom level here
                essential: true
            });
        });

        const markerElement = document.createElement('div');
        markerElement.className = 'custom-marker';
        markerElement.innerHTML = `<img src="${markerSvgUrl}" alt="Marker">`;
        markerElement.style.width = '30px';
        markerElement.style.height = '30px';

        const marker = new maplibregl.Marker(markerElement)
            .setLngLat([parseFloat(resource.Longitude), parseFloat(resource.Latitude)])
            .setPopup(popup)
            .addTo(map);

        markers.push({ marker: marker, id: resource.Id });
    }
}

function flyToResource(longitude, latitude) {
    if (map) {
        map.flyTo({
            center: [parseFloat(longitude), parseFloat(latitude)],
            zoom: 13,
            essential: true
        });
    }
}

async function fetchResources(url, shouldAppend = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            resourceListDiv.innerHTML = '<div class="alert alert-danger">Failed to load resources.</div>';
            return;
        }
        const data = await response.json();
        const newResources = data.list || [];
        const pageInfo = data.pageInfo || {};
        totalResourceCount = pageInfo.totalRows || totalResourceCount;

        if (shouldAppend) {
            renderResources(newResources, true);
        } else {
            allResources = newResources;
            renderResources(allResources);
            if (mapContainer && !map) {
                initializeMap();
                allResources.forEach(addMapMarker);
                if (allResources.length > 0) {
                    const bounds = new maplibregl.LngLatBounds();
                    allResources.forEach(resource => bounds.extend([parseFloat(resource.Longitude), parseFloat(resource.Latitude)]));
                    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
                }
            }
        }
        updateResultsCounter();
        updateLoadMoreVisibility();
    } catch (error) {
        console.error('Error fetching resources:', error);
        resourceListDiv.innerHTML = '<div class="alert alert-danger">Failed to load resources.</div>';
    }
}

function renderCategoryFilters() {
    categoryFiltersDiv.innerHTML = '';
    const selectedResourceTypes = Array.from(resourceTypeFiltersDiv.querySelectorAll('input:checked'))
        .map(checkbox => checkbox.value);
    const visibleCategories = new Set(['Government', 'Other']);

    selectedResourceTypes.forEach(type => {
        if (categoryOptions[type]) {
            categoryOptions[type].forEach(cat => visibleCategories.add(cat));
        }
    });

    Array.from(visibleCategories).sort().forEach(category => {
        const id = `category-${category.toLowerCase().replace(/ /g, '-')}`;
        const isChecked = activeFilters.categories.includes(category);
        const div = document.createElement('div');
        div.classList.add('form-check');
        div.innerHTML = `
                    <input class="form-check-input category-filter" type="checkbox" value="${category}" id="${id}" ${isChecked ? 'checked' : ''}>
                    <label class="form-check-label" for="${id}">${category}</label>
                `;
        categoryFiltersDiv.appendChild(div);
    });

    const categoryCheckboxes = document.querySelectorAll('.category-filter');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
}

function applyFilters(shouldResetPage = true) {
    if (shouldResetPage) {
        currentPage = 1;
    }
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl);
}

function renderResources(resources, shouldAppend = false) {
    if (!shouldAppend) {
        resourceListDiv.innerHTML = '';
        markers.forEach(m => m.marker.remove());
        markers.length = 0;
    }
    if (resources && resources.length > 0) {
        resources.forEach(resource => {
            const card = `
                    <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${resource.Website || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-globe"></i> </a>
                            <a href="${resource['Phone URL'] || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="#" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white map-focus-button" data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}"> <i class="bi bi-geo-alt-fill"></i> </a>                                    </div>
                        <div class="card-body col-10 p-4">
                            <h3 class="text-secondary">${resource['Location Name'] || 'N/A'}</h3>
                            <h5 class="text-dark">${resource.Organization || 'N/A'}</h5>
                            <div class="mb-2">
                                <span class="badge text-black bg-pink py-2 my-1 filter-badge" data-filter="resourceTypes" data-value="${resource['Resource Type']}" style="background-color: #f5ebf3; color: #000;">${resource['Resource Type'] || 'N/A'}</span>
                                <span class="badge text-black bg-pink py-2 my-1 filter-badge" data-filter="categories" data-value="${resource.Category}" style="background-color: #f5ebf3; color: #000;">${resource.Category || 'N/A'}</span>
                            </div>
                            <h6>Phone: ${resource.Phone || 'N/A'}</h6>
                            <p>${resource.Address || 'N/A'} <br>
                                ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}<br />
                                <strong><a href="${resource['Google Maps URL'] || '#'}" class="text-secondary" target="_blank">Directions</a></strong></p>
                            <h6>Populations Served:</h6>
                            <div>
                                ${(resource['Populations Served'] || '').split(',').map(pop => pop.trim()).filter(pop => pop).map(pop => `<span class="badge text-black bg-pink py-2 my-1 filter-badge" data-filter="populations" data-value="${pop}" style="background-color: #f5ebf3; color: #000;">${pop}</span>`).join('')}
                            </div>
                            <h6>County:</h6>
                            <div>
                                <span class="badge text-black bg-pink py-2 my-1 filter-badge" data-filter="counties" data-value="${resource.County}" style="background-color: #f5ebf3; color: #000;">${resource.County || 'N/A'}</span>
                            </div>
                        <div class="row d-flex justify-content-end position-relative">
                            ${resource.Image ? `<div class="col-md-auto d-flex justify-content-end align-items-end p-2" style="position:relative"><img class="cardImage" src="${resource.Image}" alt="Logo" style="position:absolute;height:200px"></div>` : ''}
                        </div>
                        </div>
                    </div>
                </div>
                    `;
            resourceListDiv.innerHTML += card;
            addMapMarker(resource);
        });

        document.querySelectorAll('.resourceCard .filter-badge').forEach(badge => {
            badge.addEventListener('click', function() {
                const filterType = this.dataset.filter;
                const filterValue = this.dataset.value;
                if (filterType && filterValue) {
                    const checkbox = document.querySelector(`.${filterType.slice(0, -1)}-filter[value="${filterValue}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        const event = { target: checkbox };
                        handleFilterChange(event);
                    } else {
                        if (!activeFilters[filterType].includes(filterValue)) {
                            activeFilters[filterType] = [...activeFilters[filterType], filterValue];
                            addFilterChip(filterType, filterValue);
                            applyFilters();
                            if (filterType === 'resourceTypes') {
                                renderCategoryFilters();
                            }
                        }
                    }
                }
            });
        });

        document.querySelectorAll('.resourceCard .map-focus-button').forEach(button => {
            button.addEventListener('click', function() {
                const longitude = this.dataset.longitude;
                const latitude = this.dataset.latitude;
                flyToResource(longitude, latitude);
                const resourceId = this.closest('.resourceCard').querySelector('h3')?.textContent?.trim();
                if (resourceId) {
                    const foundMarker = markers.find(m => m.id === allResources.find(r => r['Location Name']?.trim() === resourceId)?.Id);
                    foundMarker?.marker?.togglePopup();
                }
            });
        });

    } else if (!shouldAppend) {
        resourceListDiv.innerHTML = '<div class="alert alert-info">No resources found with the current filters.</div>';
        markers.forEach(m => m.marker.remove());
        markers.length = 0;
         if (map) {
            map.flyTo({
                center: [-75.347468, 40.104172],
                zoom: 9.5,
                essential: true
            });
        }
    }
}

function updateResultsCounter() {
    const currentlyDisplayed = resourceListDiv.querySelectorAll('.resourceCard').length;
    resultsCounter.textContent = `Results ${currentlyDisplayed > 0 ? 1 : 0}-${currentlyDisplayed} of ${totalResourceCount}`;
}

function updateLoadMoreVisibility() {
    if (currentPage * resourcesPerPage < totalResourceCount) {
        loadMoreDiv.classList.remove('d-none');
    } else {
        loadMoreDiv.classList.add('d-none');
    }
}

loadMoreButton.addEventListener('click', () => {
    currentPage++;
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl, true);
});

function handleFilterChange(event) {
    const filterType = event.target.classList.contains('county-filter') ? 'counties' :
        event.target.classList.contains('population-filter') ? 'populations' :
        event.target.classList.contains('resource-type-filter') ? 'resourceTypes' :
        event.target.classList.contains('category-filter') ? 'categories' : null;

    if (filterType) {
        const value = event.target.value;
        if (event.target.checked) {
            activeFilters[filterType] = [...activeFilters[filterType], value];
            addFilterChip(filterType, value);
        } else {
            activeFilters[filterType] = activeFilters[filterType].filter(item => item !== value);
            removeFilterChip(filterType, value);
        }
        applyFilters();
        if (filterType === 'resourceTypes') {
            renderCategoryFilters();
        }
    }
}

document.querySelectorAll('.county-filter').forEach(checkbox => checkbox.addEventListener('change', handleFilterChange));
document.querySelectorAll('.population-filter').forEach(checkbox => checkbox.addEventListener('change', handleFilterChange));
document.querySelectorAll('.resource-type-filter').forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
        handleFilterChange(event);
        renderCategoryFilters();
    });
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        activeFilters.search = searchInput.value.trim();
        addFilterChip('search', activeFilters.search); // Add chip for search term
        applyFilters();
    }
});

searchButton.addEventListener('click', () => {
    activeFilters.search = searchInput.value.trim();
    addFilterChip('search', activeFilters.search); // Add chip for search term
    applyFilters();
});

function addFilterChip(filterType, filterValue) {
    const existingChip = document.querySelector(`#chip-${filterType}-${filterValue.replace(/ /g, '-')}`);
    if (!existingChip) {
        const chip = document.createElement('span');
        chip.classList.add('chip', 'badge');
        chip.id = `chip-${filterType}-${filterValue.replace(/ /g, '-')}`;
        chip.textContent = filterValue;
        const closeButton = document.createElement('i');
        closeButton.classList.add('bi', 'bi-x-circle-fill', 'close-chip');
        closeButton.addEventListener('click', () => {
            removeFilter(filterType, filterValue);
        });
        chip.appendChild(closeButton);
        chipsArea.appendChild(chip);
    }
}

function removeFilter(filterType, filterValue) {
    activeFilters[filterType] = activeFilters[filterType].filter(item => item !== filterValue);
     if (filterType === 'search') {
        activeFilters.search = '';
        searchInput.value = '';
    }

    const chipToRemove = document.getElementById(`chip-${filterType}-${filterValue.replace(/ /g, '-')}`);
    if (chipToRemove) {
        chipsArea.removeChild(chipToRemove);
    }

    const checkbox = document.querySelector(`.${filterType.slice(0, -1)}-filter[value="${filterValue}"]`);
    if (checkbox && filterType !== 'search') {
        checkbox.checked = false;
    }

    applyFilters();
    if (filterType === 'resourceTypes') {
        renderCategoryFilters();
    }
}

function removeFilterChip(filterType, filterValue) {
    const chipToRemove = document.getElementById(`chip-${filterType}-${filterValue.replace(/ /g, '-')}`);
    if (chipToRemove) {
        chipsArea.removeChild(chipToRemove);
    }
}

document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.focus();
    }
});

sortBySelect.addEventListener('change', () => {
    applyFilters();
});

const initialApiUrl = constructApiUrl();
fetchResources(initialApiUrl);
renderCategoryFilters();
