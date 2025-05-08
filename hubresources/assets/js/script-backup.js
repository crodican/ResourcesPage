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
let totalResourceCount = 0; // To store the total number of resources

const categoryOptions = {
    'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Government', 'Other'],
    'Family Support': ['Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources', 'Government', 'Other'],
    'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance', 'Government', 'Other'],
    'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other']
};

// Function to convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Function to calculate the distance between two coordinates using the Haversine formula
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

// Function to construct the API URL with filters and pagination
function constructApiUrl(page = currentPage, limit = resourcesPerPage, sort = sortBySelect.value, search = activeFilters.search, counties = activeFilters.counties, populations = activeFilters.populations, resourceTypes = activeFilters.resourceTypes, categories = activeFilters.categories) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (sort && sort !== 'relevance') params.append('sort', sort === 'alphabetical' ? 'Location Name' : ''); // Adjust sort parameters as needed
    if (search) params.append('search', search);
    counties.forEach(county => params.append('County', county));
    populations.forEach(population => params.append('Populations', population));
    resourceTypes.forEach(type => params.append('Resource Type', type));
    categories.forEach(category => params.append('Category', category));
    return `${apiBaseUrl}?${params.toString()}`;
}

// Function to fetch resources from the API
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
        totalResourceCount = pageInfo.totalRows || totalResourceCount; // Update total count

        if (shouldAppend) {
            renderResources(newResources, true); // Append new resources
        } else {
            allResources = newResources; // Reset all resources on initial load or filter
            renderResources(allResources); // Render the initial set
        }
        updateResultsCounter();
        updateLoadMoreVisibility();
    } catch (error) {
        console.error('Error fetching resources:', error);
        resourceListDiv.innerHTML = '<div class="alert alert-danger">Failed to load resources.</div>';
    }
}

// Function to render the category filters based on selected resource types
function renderCategoryFilters() {
    categoryFiltersDiv.innerHTML = '';
    const selectedResourceTypes = Array.from(resourceTypeFiltersDiv.querySelectorAll('input:checked'))
        .map(checkbox => checkbox.value);
    const visibleCategories = new Set(['Government', 'Other']); // Always show these

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

    // Add event listeners to dynamically created category checkboxes
    const categoryCheckboxes = document.querySelectorAll('.category-filter');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
}

// Function to apply filters and fetch the first page of results
function applyFilters(shouldResetPage = true) {
    if (shouldResetPage) {
        currentPage = 1;
    }
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl); // Do not append when applying new filters
}

// Function to display the current page of resources
function renderResources(resources, shouldAppend = false) {
    if (!shouldAppend) {
        resourceListDiv.innerHTML = ''; // Clear existing content only on initial load or filter
    }
    if (resources && resources.length > 0) {
        resources.forEach(resource => {
            const card = `
                <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${resource.Website || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" target="_blank"> <i class="bi bi-globe"></i> </a>
                            <a href="${resource['Phone URL'] || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="#" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 h-100 text-white py-1 map-focus-button" data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}"> <i class="bi bi-geo-alt-fill"></i> </a>                        </div>
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
        });

        // Add event listeners to the badges for filtering
        document.querySelectorAll('.resourceCard .filter-badge').forEach(badge => {
            badge.addEventListener('click', function() {
                const filterType = this.dataset.filter;
                const filterValue = this.dataset.value;
                if (filterType && filterValue) {
                    // Simulate a change event on the corresponding checkbox
                    const checkbox = document.querySelector(`.${filterType.slice(0, -1)}-filter[value="${filterValue}"]`);
                    if (checkbox) {
                        checkbox.checked = true; // Check the checkbox!
                        // Manually trigger the handleFilterChange function
                        const event = { target: checkbox };
                        handleFilterChange(event);
                    } else {
                        // If no checkbox is found (e.g., for dynamically added categories),
                        // directly update the activeFilters and apply the filters.
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
    } else if (!shouldAppend) {
        resourceListDiv.innerHTML = '<div class="alert alert-info">No resources found with the current filters.</div>';
    }
}

function updateResultsCounter() {
    const currentlyDisplayed = resourceListDiv.querySelectorAll('.resourceCard').length;
    resultsCounter.textContent = `Results ${currentlyDisplayed > 0 ? 1 : 0}-${currentlyDisplayed} of ${totalResourceCount}`;
}

// Function to update the visibility of the "Load More" button
function updateLoadMoreVisibility() {
    if (currentPage * resourcesPerPage < totalResourceCount) {
        loadMoreDiv.classList.remove('d-none');
    } else {
        loadMoreDiv.classList.add('d-none');
    }
}

// Event listener for the "Load More" button
loadMoreButton.addEventListener('click', () => {
    currentPage++;
    const apiUrl = constructApiUrl();
    fetchResources(apiUrl, true); // Append data when loading more
});

// Function to handle changes in filter checkboxes
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

// Add event listeners to the initial filter checkboxes
document.querySelectorAll('.county-filter').forEach(checkbox => checkbox.addEventListener('change', handleFilterChange));
document.querySelectorAll('.population-filter').forEach(checkbox => checkbox.addEventListener('change', handleFilterChange));
document.querySelectorAll('.resource-type-filter').forEach(checkbox => {
    checkbox.addEventListener('change', (event) => {
        handleFilterChange(event);
        renderCategoryFilters();
    });
});

// Event listeners for search input
searchInput.addEventListener('input', () => {
    activeFilters.search = searchInput.value.trim();
    applyFilters();
});

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (searchInput.value.trim()) {
            addFilterChip('search', searchInput.value.trim());
            searchInput.value = '';
            activeFilters.search = '';
            applyFilters();
        }
    }
});

searchButton.addEventListener('click', () => {
    if (searchInput.value.trim()) {
        addFilterChip('search', searchInput.value.trim());
        searchInput.value = '';
        activeFilters.search = '';
        applyFilters();
    }
});

// Function to add a filter chip
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

// Function to remove a filter
function removeFilter(filterType, filterValue) {
    activeFilters[filterType] = activeFilters[filterType].filter(item => item !== filterValue);

    const chipToRemove = document.getElementById(`chip-${filterType}-${filterValue.replace(/ /g, '-')}`);
    if (chipToRemove) {
        chipsArea.removeChild(chipToRemove);
    }

    const checkbox = document.querySelector(`.${filterType.slice(0, -1)}-filter[value="${filterValue}"]`);
    if (checkbox) {
        checkbox.checked = false;
    }

    applyFilters();
    if (filterType === 'resourceTypes') {
        renderCategoryFilters();
    }
}

// Function to remove a filter chip from the UI
function removeFilterChip(filterType, filterValue) {
    const chipToRemove = document.getElementById(`chip-${filterType}-${filterValue.replace(/ /g, '-')}`);
    if (chipToRemove) {
        chipsArea.removeChild(chipToRemove);
    }
}

// Event listener for CTRL+K to focus search
document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.focus();
    }
});

// Event listener for sort by change
sortBySelect.addEventListener('change', () => {
    applyFilters(); // Re-fetch and re-render with the new sort order
});

// Initial fetch and category filter rendering
// Fetch the initial set of resources with the first page and default filters
const initialApiUrl = constructApiUrl();
fetchResources(initialApiUrl);
renderCategoryFilters();