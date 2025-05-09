    // --- DOM Elements ---
    const searchInput = document.getElementById('search-input');
    const searchButton = document.querySelector('.searchButton'); // Assuming it's a class; use #id if it's an ID
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

    // --- API and Configuration ---
    const API_BASE_URL = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
    const RESOURCES_PER_PAGE = 25;

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

    // --- Utility Functions ---
    // calculateDistance and deg2rad are currently unused for API calls.
    // If they are for a future client-side sort feature, they can be kept.
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


    // --- API Interaction ---
    /**
     * Constructs the API URL with filters and pagination.
     * @returns {string} The constructed API URL.
     */
    function constructApiUrl() {
        const params = new URLSearchParams();
        params.append(API_PARAMS.PAGE, currentPage);
        params.append(API_PARAMS.LIMIT, RESOURCES_PER_PAGE);

        const sortValue = sortBySelect.value;
        // Recommended HTML:
        // <select id="sort-by">
        //   <option value="relevance">Relevance</option>
        //   <option value="alphabetical">Alphabetical (A-Z)</option>
        //   // </select>
        if (sortValue === 'alphabetical') {
            params.append(API_PARAMS.SORT, 'Location Name'); // Assuming 'Location Name' is the API param for alphabetical sort
        } else if (sortValue === 'distance') {
            // Placeholder: API sorting by distance would need specific lat/lon parameters
            // or be handled client-side after fetching all relevant data.
            console.warn('API sorting by distance not yet implemented in constructApiUrl.');
        }
        // If sortValue is 'relevance' or any other unhandled value, no sort parameter is added,
        // assuming the API defaults to relevance-based sorting.

        if (activeFilters[FILTER_TYPES.SEARCH]) {
            params.append(API_PARAMS.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
        }
        activeFilters[FILTER_TYPES.COUNTIES].forEach(county => params.append(API_PARAMS.COUNTY, county));
        activeFilters[FILTER_TYPES.POPULATIONS].forEach(population => params.append(API_PARAMS.POPULATIONS, population));
        activeFilters[FILTER_TYPES.RESOURCE_TYPES].forEach(type => params.append(API_PARAMS.RESOURCE_TYPE, type));
        activeFilters[FILTER_TYPES.CATEGORIES].forEach(category => params.append(API_PARAMS.CATEGORY, category));

        return `${API_BASE_URL}?${params.toString()}`;
    }

    /**
     * Fetches resources from the API.
     * @param {string} url - The API URL to fetch from.
     * @param {boolean} [shouldAppend=false] - Whether to append results or replace them.
     */
    async function fetchResources(url, shouldAppend = false) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}, URL: ${url}`);
                resourceListDiv.innerHTML = `<div class="alert alert-danger">Failed to load resources. Server returned status ${response.status}. Please try again later.</div>`;
                updateLoadMoreVisibility(true); // Force hide load more on error
                return;
            }
            const data = await response.json();
            const newResources = data.list || [];
            const pageInfo = data.pageInfo || {};

            if (!shouldAppend) {
                totalResourceCount = pageInfo.totalRows || 0;
            } else {
                // When appending, the API might still send the total count for the overall query.
                // It's generally safer to rely on the totalRows from the initial load or filter application.
                // However, if the API guarantees `totalRows` is always the grand total, this is fine.
                totalResourceCount = pageInfo.totalRows || totalResourceCount;
            }


            if (shouldAppend) {
                renderResources(newResources, true);
            } else {
                renderResources(newResources, false);
            }
            updateResultsCounter();
            updateLoadMoreVisibility();
        } catch (error) {
            console.error('Error fetching resources:', error);
            resourceListDiv.innerHTML = '<div class="alert alert-danger">An error occurred while fetching resources. Please check your connection and try again.</div>';
            updateLoadMoreVisibility(true); // Force hide load more on error
        }
    }

    // --- UI Rendering ---

    /**
     * Renders the category filters based on selected resource types.
     * Uses DocumentFragment for efficient DOM updates.
     */
    function renderCategoryFilters() {
        categoryFiltersDiv.innerHTML = ''; // Clear existing filters
        const fragment = document.createDocumentFragment();

        const selectedResourceTypes = activeFilters[FILTER_TYPES.RESOURCE_TYPES];
        const visibleCategories = new Set(['Government', 'Other']); // Always show these

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


    /**
     * Displays resources in the list.
     * Uses DocumentFragment for efficient DOM updates.
     * @param {Array<Object>} resourcesToRender - Array of resource objects.
     * @param {boolean} [shouldAppend=false] - Whether to append or replace.
     */
    function renderResources(resourcesToRender, shouldAppend = false) {
        if (!shouldAppend) {
            resourceListDiv.innerHTML = ''; // Clear existing content
        }

        if (resourcesToRender && resourcesToRender.length > 0) {
            const fragment = document.createDocumentFragment();
            resourcesToRender.forEach(resource => {
                const cardElement = document.createElement('div');
                // Using .cardImage class for the image to match provided HTML's CSS.
                cardElement.innerHTML = `
                    <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                        <div class="row no-gutters p-0">
                            <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                                <a href="${resource.Website || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" target="_blank" rel="noopener noreferrer" aria-label="Visit website for ${resource['Location Name'] || 'resource'}"> <i class="bi bi-globe"></i> </a>
                                <a href="${resource['Phone URL'] || '#'}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white" aria-label="Call ${resource['Location Name'] || 'resource'}"> <i class="bi bi-telephone-fill"></i> </a>
                                <a href="#" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"  data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}"> <i class="bi bi-geo-alt-fill"></i> </a>   
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

    /**
     * Updates the results counter text.
     */
    function updateResultsCounter() {
        const currentlyDisplayedCount = resourceListDiv.querySelectorAll('.resourceCard').length;
        resultsCounter.textContent = `Showing ${currentlyDisplayedCount} of ${totalResourceCount} results`;
    }

    /**
     * Updates the visibility of the "Load More" button.
     * @param {boolean} [forceHide=false] - Force hide the button, e.g., on error.
     */
    function updateLoadMoreVisibility(forceHide = false) {
        const displayedCount = resourceListDiv.querySelectorAll('.resourceCard').length;
        if (forceHide || displayedCount >= totalResourceCount || totalResourceCount === 0) {
            loadMoreDiv.classList.add('d-none');
        } else {
            loadMoreDiv.classList.remove('d-none');
        }
    }

    // --- Filter Logic ---

    /**
     * Applies current filters and fetches the first page of results.
     * @param {boolean} [shouldResetPage=true] - Whether to reset to page 1.
     */
    function applyFilters(shouldResetPage = true) {
        if (shouldResetPage) {
            currentPage = 1;
        }
        const apiUrl = constructApiUrl();
        fetchResources(apiUrl, false);
    }

    /**
     * Handles changes in filter checkboxes (called by delegated listener).
     * @param {Event} event - The change event object.
     */
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
                renderCategoryFilters();
            }
        }
    }

    // --- Chip Management ---
    /**
     * Generates a unique ID for a chip.
     * @param {string} filterType - The type of filter.
     * @param {string} filterValue - The value of the filter.
     * @returns {string}
     */
    function getChipId(filterType, filterValue) {
        const safeValue = String(filterValue).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return `chip-${filterType}-${safeValue}`;
    }

    /**
     * Adds a filter chip to the UI.
     * @param {string} filterType - The type of the filter.
     * @param {string} filterValue - The value of the filter.
     */
    function addFilterChip(filterType, filterValue) {
        const chipId = getChipId(filterType, filterValue);
        if (document.getElementById(chipId)) return;

        const chip = document.createElement('span');
        // Note: Your custom CSS for .chip might be overridden by these Bootstrap classes.
        // Adjust as needed for desired chip appearance.
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

    /**
     * Removes a filter (triggered by chip close or programmatically).
     * @param {string} filterType - The type of the filter.
     * @param {string} filterValue - The value of the filter.
     */
    function removeFilter(filterType, filterValue) {
        if (filterType === FILTER_TYPES.SEARCH) {
            activeFilters[FILTER_TYPES.SEARCH] = '';
            searchInput.value = '';
        } else {
            activeFilters[filterType] = activeFilters[filterType].filter(item => item !== filterValue);
            const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${filterType.slice(0, -1)}-filter`);
            if (checkbox) {
                checkbox.checked = false;
            }
        }

        removeFilterChipFromUI(filterType, filterValue);
        applyFilters();

        if (filterType === FILTER_TYPES.RESOURCE_TYPES) {
            renderCategoryFilters();
        }
    }

    /**
     * Removes only the filter chip from the UI.
     * @param {string} filterType - The type of the filter.
     * @param {string} filterValue - The value of the filter.
     */
    function removeFilterChipFromUI(filterType, filterValue) {
        const chipId = getChipId(filterType, filterValue);
        const chipToRemove = document.getElementById(chipId);
        if (chipToRemove) {
            chipsArea.removeChild(chipToRemove);
        }
    }


    // --- Event Listeners Setup ---

    /**
     * Initializes all event listeners.
     */
    function initializeEventListeners() {
        if(searchButton) {
            searchButton.addEventListener('click', handleSearch);
        }
        if(searchInput) {
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
                if(searchInput) searchInput.focus();
            }
        });

        if(sortBySelect) {
            sortBySelect.addEventListener('change', () => {
                applyFilters();
            });
        }

        if(loadMoreButton) {
            loadMoreButton.addEventListener('click', () => {
                currentPage++;
                const apiUrl = constructApiUrl();
                fetchResources(apiUrl, true);
            });
        }

        // Event Delegation for Filter Checkboxes
        if(countyFiltersDiv) countyFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
        if(populationFiltersDiv) populationFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
        if(resourceTypeFiltersDiv) resourceTypeFiltersDiv.addEventListener('change', handleFilterChangeDelegated);
        if(categoryFiltersDiv) categoryFiltersDiv.addEventListener('change', handleFilterChangeDelegated);

        // Event Delegation for Badges within Resource Cards
        if(resourceListDiv) resourceListDiv.addEventListener('click', handleResourceBadgeClickDelegated);
    }

    /**
     * Handler for search action.
     */
    function handleSearch() {
        if(!searchInput) return;
        const searchTerm = searchInput.value.trim();
        if (activeFilters[FILTER_TYPES.SEARCH] && activeFilters[FILTER_TYPES.SEARCH] !== searchTerm) {
            removeFilterChipFromUI(FILTER_TYPES.SEARCH, activeFilters[FILTER_TYPES.SEARCH]);
        }

        activeFilters[FILTER_TYPES.SEARCH] = searchTerm;
        if (searchTerm) {
            addFilterChip(FILTER_TYPES.SEARCH, searchTerm);
        } else { // If search term is empty, remove the chip
            removeFilterChipFromUI(FILTER_TYPES.SEARCH, ''); // Attempt to remove any previous search chip
        }
        applyFilters();
    }


    /**
     * Delegated event handler for filter checkboxes.
     * @param {Event} event
     */
    function handleFilterChangeDelegated(event) {
        if (event.target.matches('input[type="checkbox"]')) {
            handleFilterChange(event); // Call the original handler logic
        }
    }

    /**
     * Delegated event handler for clickable badges within resource cards.
     * @param {Event} event
     */
    function handleResourceBadgeClickDelegated(event) {
        const badge = event.target.closest('.badge[data-filter][data-value]');
        if (badge) {
            const filterType = badge.dataset.filter;
            const filterValue = badge.dataset.value;

            if (filterType && filterValue && activeFilters[filterType] !== undefined) {
                // Prevent adding if already active
                if ((Array.isArray(activeFilters[filterType]) && activeFilters[filterType].includes(filterValue)) || activeFilters[filterType] === filterValue) {
                    return;
                }

                if (Array.isArray(activeFilters[filterType])) {
                    const checkbox = document.querySelector(`input[type="checkbox"][value="${filterValue}"].${filterType.slice(0, -1)}-filter`);
                    if (checkbox && !checkbox.checked) {
                        checkbox.checked = true; // This will trigger its own 'change' event, handled by handleFilterChangeDelegated
                                             // which then calls handleFilterChange, updating activeFilters and chips.
                                             // So, we might not need to manually update activeFilters/chips here.
                                             // Let's rely on the change event for consistency.
                        // Manually dispatch a change event if needed, or call handleFilterChange directly
                        // For simplicity and to ensure flow, let's call handleFilterChange directly after setting checkbox.
                        handleFilterChange({ target: checkbox });


                    } else if (!checkbox) { // If no corresponding checkbox (e.g. a generic tag)
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


    // --- Initial Load ---
    document.addEventListener('DOMContentLoaded', () => {
        // Check if all essential DOM elements are present before proceeding
        if (!searchInput || !searchButton || !chipsArea || !countyFiltersDiv || !populationFiltersDiv ||
            !resourceTypeFiltersDiv || !categoryFiltersDiv || !resourceListDiv || !resultsCounter ||
            !loadMoreButton || !loadMoreDiv || !sortBySelect) {
            console.error("One or more essential DOM elements are missing. Script will not run correctly.");
            // Optionally, display a user-friendly message on the page
            // document.body.innerHTML = "<p>Error: Page elements missing. Please contact support.</p>";
            return;
        }

        initializeEventListeners();
        const initialApiUrl = constructApiUrl();
        fetchResources(initialApiUrl);
        renderCategoryFilters();
    });
