const API_BASE_URL = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
const resultsContainer = document.getElementById('results');
const counterDisplay = document.getElementById('counter');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const countyFilterContainer = document.getElementById('county-filter');
const populationFilterContainer = document.getElementById('population-filter');
const resourceTypeFilterContainer = document.getElementById('resource-type-filter');
const categoryFilterContainer = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const loadMoreButton = document.getElementById('load-more-button');
const filterChipsContainer = document.getElementById('filter-chips');
const filtersToggle = document.getElementById('filters-toggle');
const filterSection = document.getElementById('filter-section');

let currentPage = 1;
const resultsPerPage = 25;
let currentFilters = {};
let currentSearchTerm = '';
let currentSort = '';
let allResources = []; // Store all fetched resources
let displayedResourcesCount = 0;
let isFilterSectionVisible = false;

// Define filter options (from your description)
const countyOptions = ['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill'];
const populationOptions = ['Men', 'Women', 'Children', 'Adolescents'];
const resourceTypeOptions = ['Recovery Support', 'Family Support', 'Housing', 'Transportation'];
const categoryOptions = {
    'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS'],
    'Family Support': ['Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources'],
    'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance'],
    'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance'],
    'All': ['Government', 'Other'] // Added 'All' for the common categories
};

// Function to fetch data from the API
async function fetchData(page = 1, limit = resultsPerPage, sort = '', search = '', filters = {}) {
    let url = `${API_BASE_URL}?page=${page}&limit=${limit}`;
    if (sort) {
        url += `&sort=${sort}`;
    }
    if (search) {
        url += `&search=${search}`;
    }
    for (const key in filters) {
        if (filters[key]) {
            url += `&${key}=${encodeURIComponent(filters[key])}`;
        }
    }

    try {
        const response = await fetch(url);
        if (!response.ok) { // Check for HTTP errors
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        resultsContainer.innerHTML = `<div class="alert alert-danger">Error loading resources: ${error.message}</div>`;
        loadMoreButton.style.display = 'none';
        return { data: [], totalRows: 0 }; // Return empty data to avoid errors
    }
}

// Function to display resources as cards
function displayResources(resources, append = false) {
    if (!append) {
        resultsContainer.innerHTML = ''; // Clear previous results
        displayedResourcesCount = 0;
    }

    if (!resources || resources.length === 0) {
        if (displayedResourcesCount === 0) {
            resultsContainer.innerHTML = '<div class="alert alert-info">No resources found.</div>';
            loadMoreButton.style.display = 'none';
            counterDisplay.textContent = `Results 0 of 0`;
        }
        return; // Exit if no resources to display
    }

    resources.forEach(resource => {
        const card = document.createElement('div');
        card.className = 'resource-card card shadow-lg text-bg-white';
        let website_url = resource["Website"]
        let phone_url = resource["Phone"]
        let address_url = `https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(resource["Address"] + " " + resource["City"] + " " + resource["State"] + " " + resource["ZIP Code"])}`
        card.innerHTML = `
            <div class="row no-gutters p-0">
                <div class="card-sidenav bg-secondary col-2 d-flex flex-column justify-content-between align-items-center p-0">
                    <a href="${website_url}" target="_blank" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" title="Website">
                        <i class="bi bi-globe"></i>
                    </a>
                    <a href="tel:${phone_url}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"  title="Phone">
                        <i class="bi bi-telephone-fill"></i>
                    </a>
                    <a href="${address_url}" target="_blank" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" title="Directions">
                        <i class="bi bi-geo-alt-fill"></i>
                    </a>
                </div>
                <div class="card-body col-10 p-4">
                    <h3 class="card-title text-secondary">${resource["Location Name"]}</h3>
                    <h5 class="card-subtitle mb-2">${resource["Organization"]}</h5>
                    <div class="mb-2">
                        ${generateBadges(resource["Resource Type"], 'Resource Type')}
                        ${generateBadges(resource["Category"], 'Category')}
                    </div>
                    <h6 class="card-text">Phone: ${resource["Phone"]}</h6>
                    <p class="card-text">
                        <span>${resource["Address"]}</span><br>
                        <span>${resource["City"]}, ${resource["State"]}, ${resource["ZIP Code"]}</span>
                    </p>
                    <h6 class="card-text">Populations Served:</h6>
                    <div class="mb-2">
                        ${generateBadges(resource["Populations Served"], 'Populations')}
                    </div>
                    <h6 class="card-text">County:</h6>
                    <div>
                        ${generateBadges(resource["County"], 'County')}
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
        displayedResourcesCount++;
    });
    updateCounter(allResources.length);
    if (displayedResourcesCount < allResources.length) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

// Function to generate Bootstrap badges for facet values, make them clickable
function generateBadges(values, filterType) {
    if (!values) return ''; // Handle null or undefined
    if (!Array.isArray(values)) {
        values = [values]; // Ensure it's an array
    }
    return values.map(value => {
        return `<span class="badge bg-primary me-1 rounded-pill" data-filter-type="${filterType}" data-filter-value="${value}" style="cursor: pointer;">${value}</span>`;
    }).join('');
}

// Function to update the counter
function updateCounter(total) {
    counterDisplay.querySelector('h4').textContent = `Results ${displayedResourcesCount > 0 ? 1 : 0}-${Math.min(displayedResourcesCount, total)} of ${total}`;
}

// Function to add filter chips
function addFilterChip(filterType, filterValue) {
    const chip = document.createElement('span');
    chip.className = 'chip badge rounded-pill';
    chip.textContent = `${filterType}: ${filterValue}`;
    chip.dataset.filterType = filterType;
    chip.dataset.filterValue = filterValue;
    chip.addEventListener('click', removeFilterChip); // Add event listener to remove
    filterChipsContainer.appendChild(chip);
}

// Function to remove filter chips
function removeFilterChip(event) {
    const chip = event.target;
    const filterType = chip.dataset.filterType;
    const filterValue = chip.dataset.filterValue;

    // Remove the chip from the UI
    chip.remove();

    // Update the currentFilters object
    if (currentFilters[filterType] === filterValue) {
        delete currentFilters[filterType]; // Remove single filter
    } else if (Array.isArray(currentFilters[filterType])) {
        currentFilters[filterType] = currentFilters[filterType].filter(v => v !== filterValue); // Remove from array
        if(currentFilters[filterType].length === 0){
            delete currentFilters[filterType]
        }
    } else {
        delete currentFilters[filterType];
    }

    if (filterType === 'search') {
        currentSearchTerm = '';
        searchInput.value = '';
    }

    // Clear the filter dropdown
    if (filterType === 'County') {
        countyFilterContainer.value = '';
    } else if (filterType === 'Populations') {
        populationFilterContainer.value = '';
    } else if (filterType === 'ResourceType'){
        resourceTypeFilterContainer.value = '';
        // Reset categories when resource type changes
        categoryFilterContainer.innerHTML = '';
        const allCategories = categoryOptions['All'];
        allCategories.forEach(category => {
            const checkbox = createCheckbox(category, 'Category');
            categoryFilterContainer.appendChild(checkbox);
        });
    } else if (filterType === 'Category') {
        categoryFilterContainer.value = '';
    }

    currentPage = 1; // Reset to first page after filter change
    fetchResourcesAndDisplay(); // Re-fetch and display
}

// Function to handle fetching and displaying resources
async function fetchResourcesAndDisplay() {
    const data = await fetchData(currentPage, resultsPerPage, currentSort, currentSearchTerm, currentFilters);
    allResources = data.data; // Store the fetched resources
    displayResources(allResources);
}

// Function to create a checkbox input
function createCheckbox(label, filterType) {
    const containerDiv = document.createElement('div');
    containerDiv.className = 'form-check';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'form-check-input';
    input.id = `${filterType}-${label.replace(/\s+/g, '-')}`; // Sanitize ID
    input.value = label; // Store the filter value

    const labelElement = document.createElement('label');
    labelElement.className = 'form-check-label';
    labelElement.setAttribute('for', input.id);
    labelElement.textContent = label;

    containerDiv.appendChild(input);
    containerDiv.appendChild(labelElement);

     // Event listener for checkbox change
    input.addEventListener('change', (event) => {
        if (event.target.checked) {
            if (currentFilters[filterType]) {
                if (!Array.isArray(currentFilters[filterType])) {
                    currentFilters[filterType] = [currentFilters[filterType]];
                }
                currentFilters[filterType].push(label);
                addFilterChip(filterType, label);
            } else {
                currentFilters[filterType] = label;
                addFilterChip(filterType, label);
            }
        } else {
             // Remove the filter when unchecked
             if (Array.isArray(currentFilters[filterType])) {
                currentFilters[filterType] = currentFilters[filterType].filter(value => value !== label);
                if (currentFilters[filterType].length === 0) {
                    delete currentFilters[filterType];
                }
            } else {
                delete currentFilters[filterType];
            }
            // Remove corresponding chip
            const chipToRemove = filterChipsContainer.querySelector(`[data-filter-type="${filterType}"][data-filter-value="${label}"]`);
            if (chipToRemove) {
                chipToRemove.remove();
            }
        }
        currentPage = 1; // Go back to first page on filter change
        fetchResourcesAndDisplay();
    });
    return containerDiv;
}

// Function to populate filter dropdowns
function populateFilters() {
    countyOptions.forEach(county => {
        const checkbox = createCheckbox(county, 'County');
        countyFilterContainer.appendChild(checkbox);
    });
    populationOptions.forEach(population => {
        const checkbox = createCheckbox(population, 'Populations');
        populationFilterContainer.appendChild(checkbox);
    });
    resourceTypeOptions.forEach(resourceType => {
        const checkbox = createCheckbox(resourceType, 'ResourceType');
        resourceTypeFilterContainer.appendChild(checkbox);
    });

    // Initial categories.  "Other" and "Government" are always shown.
    const initialCategories = categoryOptions['All'];
    initialCategories.forEach(category => {
        const checkbox = createCheckbox(category, 'Category');
        categoryFilterContainer.appendChild(checkbox);
    });
}

// Event listener for Resource Type filter change to update categories
resourceTypeFilterContainer.addEventListener('change', (event) => {
    const selectedResourceType = Array.from(resourceTypeFilterContainer.querySelectorAll('input:checked'))
        .map(checkbox => checkbox.value);

    categoryFilterContainer.innerHTML = ''; // Clear previous categories
    let displayedCategories = new Set();

     // Add "Government" and "Other"
    const allCategories = categoryOptions['All'];
    allCategories.forEach(category => {
        displayedCategories.add(category);
    })

    selectedResourceType.forEach(type => {
        const categoriesForType = categoryOptions[type] || []; // Get categories for selected type
        categoriesForType.forEach(category => {
            displayedCategories.add(category);
        });
    });

    // Convert the Set to an array and create checkboxes
    Array.from(displayedCategories).forEach(category => {
        const checkbox = createCheckbox(category, 'Category');
        categoryFilterContainer.appendChild(checkbox);
    });
});

// Event listener for search button
searchButton.addEventListener('click', () => {
    currentSearchTerm = searchInput.value;
    currentPage = 1;
    fetchResourcesAndDisplay();
    addFilterChip('search', currentSearchTerm);
});

// Event listener for sort dropdown
sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    fetchResourcesAndDisplay();
});

// Event listener for load more button
loadMoreButton.addEventListener('click', async () => {
    currentPage++;
    const newData = await fetchData(currentPage, resultsPerPage, currentSort, currentSearchTerm, currentFilters);
    const newResources = newData.data;
    allResources = allResources.concat(newResources);
    displayResources(newResources, true); // Append new resources
});

// Event listener for clicking on a filter badge (chip)
filterChipsContainer.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('badge')) {
        removeFilterChip(event); // Call the function to remove the chip and filter
    }
});

// Event listener for the filters toggle button
filtersToggle.addEventListener('click', () => {
    isFilterSectionVisible = !isFilterSectionVisible;
    filterSection.classList.toggle('show', isFilterSectionVisible);
    // You might also want to change the button text, e.g.,
    filtersToggle.textContent = isFilterSectionVisible ? 'Hide Filters' : 'Show Filters';
});

// Initialize the page: fetch and display resources, populate filters
populateFilters();
fetchResourcesAndDisplay();