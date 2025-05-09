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

    const categoryOptions = {
        'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Government', 'Other'],
        'Family Support': ['Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources', 'Government', 'Other'],
        'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance', 'Government', 'Other'],
        'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other']
    };

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
        // ... (rest of your renderResources function) ...

            document.querySelectorAll('.resourceCard .map-focus-link').forEach(link => {
                link.addEventListener('click', function(event) {
                    event.preventDefault();
                    const longitude = this.dataset.longitude;
                    const latitude = this.dataset.latitude;
                    const resourceIndex = parseInt(this.dataset.resourceIndex);
                    const resourceName = this.dataset.resourceName;

                    console.log('--- Map Focus Link Clicked ---');
                    console.log('Resource Name (from link):', resourceName);
                    console.log('Longitude (from link):', longitude);
                    console.log('Latitude (from link):', latitude);
                    console.log('Index (from link):', resourceIndex);
                    console.log('allResources at this index:', allResources[resourceIndex]);

                    focusMapOnResourceAndOpenPopup(longitude, latitude, resourceIndex);
                });
            });

        // ... (rest of your renderResources function) ...
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