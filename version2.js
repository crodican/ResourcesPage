document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const chipArea = document.getElementById('chip-area');
    const filterToggleButton = document.getElementById('filter-toggle-button');
    const filterOptions = document.getElementById('filter-options');
    const resourceTypeFilter = document.getElementById('resource-type-filter');
    const categoriesFilter = document.getElementById('categories-filter');
    const countiesFilter = document.getElementById('counties-filter');
    const populationsFilter = document.getElementById('populations-filter');
    const resultsContainer = document.getElementById('results-container');
    const resultsCounter = document.getElementById('results-counter');
    const loadMoreButton = document.getElementById('load-more-button');
    const sortBySelect = document.getElementById('sort-by');

    let allResources = [];
    let filteredResources = [];
    let displayedResources = [];
    const resourcesPerPage = 25;
    let currentPage = 1;
    let fuse;
    const searchKeys = ['NAME', 'ORGANIZATION', 'COUNTY', 'RESOURCE', 'TYPE', 'CATEGORY', 'POPULATIONS SERVED', 'MORE INFO', 'ADDRESS', 'CITY', 'STATE'];
    const activeFilters = {
        searchTerms: [],
        counties: [],
        populations: [],
        resourceTypes: [],
        categories: [],
    };

    const categoryOptions = {
        'Recovery Support': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Government', 'Other'],
        'Family Support': ['Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources', 'Government', 'Other'],
        'Housing': ['Recovery House', 'Halfway House', 'Housing Assistance', 'Government', 'Other'],
        'Transportation': ['Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other'],
        'All': ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Family Counseling', 'Family Peer Support', 'Family Assistance Program', 'Family Education Program', 'Family Resources', 'Recovery House', 'Halfway House', 'Housing Assistance', 'Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Government', 'Other']
    };

    // Function to fetch and process CSV data
    async function loadResources() {
        try {
            const response = await fetch('your-data.csv'); // Replace with the actual path to your CSV file
            const csvData = await response.text();
            allResources = parseCSV(csvData);
            filteredResources = [...allResources];
            initializeFuse();
            renderResults();
            updateResultsCounter();
        } catch (error) {
            console.error('Error loading CSV data:', error);
            resultsContainer.innerHTML = '<p class="text-danger">Failed to load resources.</p>';
        }
    }

    // Function to parse CSV data
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const header = lines.shift().split(',');
        return lines.map(line => {
            const values = line.split(',');
            return header.reduce((obj, key, index) => {
                obj[key.trim()] = values[index] ? values[index].trim() : '';
                return obj;
            }, {});
        });
    }

    // Initialize Fuse.js for searching
    function initializeFuse() {
        fuse = new Fuse(allResources, {
            keys: searchKeys,
            threshold: 0.3 // Adjust for more/less strict matching
        });
    }

    // Function to render resource cards
    function renderCard(resource) {
        return `
            <div class="col-12">
                <div class="card shadow-lg text-bg-white br-5-5-5-5 resource-card">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${resource['WEBSITE']}" target="_blank" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-globe"></i> </a>
                            <a href="${resource['PHONE URL']}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="${resource['GOOGLE MAPS URL']}" target="_blank" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-geo-alt-fill"></i> </a>
                        </div>
                        <div class="card-body col-10 p-4">
                            <h3 class="text-secondary" style="font-weight:400;margin-bottom:0;line-height:1.2em;font-size:36px">${resource['NAME']}</h3>
                            <h5 style="font-weight:100;margin-top:0;font-size:18px">${resource['ORGANIZATION']}</h5>
                            <div class="row">
                                <div class="col">
                                    <nav aria-label="breadcrumb">
                                        <ol class="breadcrumb">
                                            <li class="cardbreadcrumb-item"> <span class="badge text-black bg-pink py-2 my-1">${resource['COUNTY']}</span> </li>
                                            <li class="cardbreadcrumb-item"> <span class="badge text-black bg-pink py-2 my-1">${resource['CATEGORY']}</span> </li>
                                        </ol>
                                    </nav>
                                    <p><strong>Phone:</strong> ${resource['PHONE']}</p>
                                    <p>${resource['ADDRESS']}
                                        <br />${resource['CITY']}, ${resource['STATE']} ${resource['ZIP CODE']}</p>
                                </div>
                                <div class="col d-flex justify-content-end align-items-end"> <img class="cardImage" src="${resource['IMAGE']}" alt="Logo"> </div>
                            </div>
                            <p><strong>Populations Served:</strong> ${resource['POPULATIONS SERVED'].split(';').map(pop => `<span class="badge text-black bg-pink py-2 my-1">${pop.trim()}</span>`).join(' ')}</p>
                            <p><strong>Resource Type:</strong> <span class="badge text-black bg-pink py-2 my-1">${resource['TYPE']}</span></p>
                            ${resource['MORE INFO'] ? `<p><strong>More Info:</strong> ${resource['MORE INFO']}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Function to render the current page of results
    function renderResults() {
        const startIndex = (currentPage - 1) * resourcesPerPage;
        const endIndex = startIndex + resourcesPerPage;
        displayedResources = filteredResources.slice(startIndex, endIndex);
        resultsContainer.innerHTML = displayedResources.map(renderCard).join('');

        if (endIndex < filteredResources.length) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    }

    // Function to update the results counter
    function updateResultsCounter() {
        resultsCounter.textContent = `Results ${filteredResources.length > 0 ? (currentPage - 1) * resourcesPerPage + 1 : 0}-${Math.min(currentPage * resourcesPerPage, filteredResources.length)} of ${filteredResources.length}`;
    }

    // Function to handle search input
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        filterResources({ searchTerm: searchTerm });
    });

    // Function to handle search button click or Enter key
    function handleSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm && !activeFilters.searchTerms.includes(searchTerm)) {
            activeFilters.searchTerms.push(searchTerm);
            renderChips();
        }
        searchInput.value = '';
        filterResources();
    }

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    // Function to create and append chips
    function renderChips() {
        chipArea.innerHTML = '';
        activeFilters.searchTerms.forEach(term => {
            const chip = document.createElement('span');
            chip.classList.add('chip');
            chip.textContent = term;
            const closeIcon = document.createElement('i');
            closeIcon.classList.add('bi', 'bi-x-circle-fill');
            closeIcon.style.marginLeft = '5px';
            closeIcon.style.cursor = 'pointer';
            closeIcon.addEventListener('click', () => {
                activeFilters.searchTerms = activeFilters.searchTerms.filter(t => t !== term);
                renderChips();
                filterResources();
            });
            chip.appendChild(closeIcon);
            chipArea.appendChild(chip);
        });

        for (const filterType in activeFilters) {
            if (filterType !== 'searchTerms') {
                activeFilters[filterType].forEach(value => {
                    const chip = document.createElement('span');
                    chip.classList.add('chip');
                    chip.textContent = `${filterType.charAt(0).toUpperCase() + filterType.slice(1)}: ${value}`;
                    const closeIcon = document.createElement('i');
                    closeIcon.classList.add('bi', 'bi-x-circle-fill');
                    closeIcon.style.marginLeft = '5px';
                    closeIcon.style.cursor = 'pointer';
                    closeIcon.addEventListener('click', () => {
                        activeFilters[filterType] = activeFilters[filterType].filter(v => v !== value);
                        renderChips();
                        filterResources();
                        // Uncheck the corresponding checkbox
                        const checkbox = document.querySelector(`#${value.toLowerCase().replace(/ /g, '-')}-${filterType.slice(0, -1).toLowerCase()}`);
                        if (checkbox) {
                            checkbox.checked = false;
                        }
                        if (filterType === 'resourceTypes') {
                            updateCategoryOptions(''); // Reset categories if resource type changes
                        }
                    });
                    chip.appendChild(closeIcon);
                    chipArea.appendChild(chip);
                });
            }
        }
    }

    // Function to filter resources based on active filters
    function filterResources(searchOptions = {}) {
        currentPage = 1;
        filteredResources = [...allResources];

        const { searchTerm } = searchOptions;

        if (searchTerm && fuse) {
            const searchResults = fuse.search(searchTerm).map(result => result.item);
            filteredResources = searchResults;
        } else if (activeFilters.searchTerms.length > 0 && fuse && !searchTerm) {
            let tempResults = [...allResources];
            activeFilters.searchTerms.forEach(term => {
                const searchResults = fuse.search(term).map(result => result.item);
                tempResults = tempResults.filter(item => searchResults.includes(item));
            });
            filteredResources = tempResults;
        }

        for (const county of activeFilters.counties) {
            filteredResources = filteredResources.filter(resource => resource['COUNTY'].includes(county));
        }

        for (const population of activeFilters.populations) {
            filteredResources = filteredResources.filter(resource => resource['POPULATIONS SERVED'].includes(population));
        }

        for (const resourceType of activeFilters.resourceTypes) {
            filteredResources = filteredResources.filter(resource => resource['TYPE'] === resourceType);
        }

        for (const category of activeFilters.categories) {
            filteredResources = filteredResources.filter(resource => resource['CATEGORY'] === category);
        }

        renderResults();
        updateResultsCounter();
    }

    // Filter toggle functionality
    filterToggleButton.addEventListener('click', () => {
        const isHidden = filterOptions.style.display === 'none';
        filterOptions.style.display = isHidden ? 'block' : 'none';
        filterToggleButton.textContent = isHidden ? '-' : '+';
    });

    // Event listeners for county filters
    if (countiesFilter) {
        countiesFilter.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const value = event.target.value;
                if (event.target.checked) {
                    if (!activeFilters.counties.includes(value)) {
                        activeFilters.counties.push(value);
                    }
                } else {
                    activeFilters.counties = activeFilters.counties.filter(item => item !== value);
                }
                renderChips();
                filterResources();
            });
        });
    }

    // Event listeners for populations filters
    const populations = ['Men', 'Women', 'Children', 'Adolescents'];
    const populationsFilterDiv = document.getElementById('populations-filter');
    if (populationsFilterDiv) {
        populations.forEach(population => {
            const div = document.createElement('div');
            div.classList.add('form-check');
            const input = document.createElement('input');
            input.classList.add('form-check-input');
            input.type = 'checkbox';
            input.value = population;
            input.id = `${population.toLowerCase().replace(/ /g, '-')}-population`;
            const label = document.createElement('label');
            label.classList.add('form-check-label');
            label.setAttribute('for', input.id);
            label.textContent = population;
            div.appendChild(input);
            div.appendChild(label);
            populationsFilterDiv.appendChild(div);

            input.addEventListener('change', (event) => {
                const value = event.target.value;
                if (event.target.checked) {
                    if (!activeFilters.populations.includes(value)) {
                        activeFilters.populations.push(value);
                    }
                } else {
                    activeFilters.populations = activeFilters.populations.filter(item => item !== value);
                }
                renderChips();
                filterResources();
            });
        });
    }

    // Event listener for resource type filter
    const resourceTypes = ['Recovery Support', 'Family Support', 'Housing', 'Transportation'];
    const resourceTypeFilterDiv = document.getElementById('resource-type-filter');
    if (resourceTypeFilterDiv) {
        resourceTypes.forEach(type => {
            const div = document.createElement('div');
            div.classList.add('form-check');
            const input = document.createElement('input');
            input.classList.add('form-check-input');
            input.type = 'radio';
            input.name = 'resource-type';
            input.value = type;
            input.id = `${type.toLowerCase().replace(/ /g, '-')}-resource-type`;
            const label = document.createElement('label');
            label.classList.add('form-check-label');
            label.setAttribute('for', input.id);
            label.textContent = type;
            resourceTypeFilterDiv.appendChild(div);
            div.appendChild(input);
            div.appendChild(label);

            input.addEventListener('change', (event) => {
                activeFilters.resourceTypes = event.target.checked ? [event.target.value] : [];
                activeFilters.categories = []; // Reset categories when resource type changes
                renderChips();
                updateCategoryOptions(event.target.value);
                filterResources();
            });
        });
        // Add 'All' option
        const allDiv = document.createElement('div');
        allDiv.classList.add('form-check');
        const allInput = document.createElement('input');
        allInput.classList.add('form-check-input');
        allInput.type = 'radio';
        allInput.name = 'resource-type';
        allInput.value = 'All';
        allInput.id = 'all-resource-type';
        allInput.checked = true; // Default to All
        const allLabel = document.createElement('label');
        allLabel.classList.add('form-check-label');
        allLabel.setAttribute('for', allInput.id);
        allLabel.textContent = 'All';
        resourceTypeFilterDiv.appendChild(allDiv);
        allDiv.appendChild(allInput);
        allDiv.appendChild(allLabel);
        allInput.addEventListener('change', (event) => {
            activeFilters.resourceTypes = [];
            activeFilters.categories = [];
            renderChips();
            updateCategoryOptions('');
            filterResources();
        });
    }

    // Function to update category options based on selected resource type
    function updateCategoryOptions(selectedType) {
        categoriesFilter.innerHTML = '';
        const optionsToShow = selectedType ? categoryOptions[selectedType] : categoryOptions['All'];
        optionsToShow.forEach(category => {
            const div = document.createElement('div');
            div.classList.add('form-check');
            const input = document.createElement('input');
            input.classList.add('form-check-input');
            input.type = 'checkbox';
            input.value = category;
            input.id = `${category.toLowerCase().replace(/ /g, '-')}-category`;
            const label = document.createElement('label');
            label.classList.add('form-check-label');
            label.setAttribute('for', input.id);
            label.textContent = category;
            div.appendChild(input);
            div.appendChild(label);
            categoriesFilter.appendChild(div);

            input.addEventListener('change', (event) => {
                const value = event.target.value;
                if (event.target.checked) {
                    if (!activeFilters.categories.includes(value)) {
                        activeFilters.categories.push(value);
                    }
                } else {
                    activeFilters.categories = activeFilters.categories.filter(item => item !== value);
                }
                renderChips();
                filterResources();
            });
        });
    }

    // Event listener for load more button
    loadMoreButton.addEventListener('click', () => {
        currentPage++;
        renderResults();
        updateResultsCounter();
    });

    // Event listener for sort by dropdown
    sortBySelect.addEventListener('change', () => {
        const sortValue = sortBySelect.value;
        if (sortValue === 'alphabetical') {
            filteredResources.sort((a, b) => a['NAME'].localeCompare(b['NAME']));
        } else { // 'relevance' or default
            // Reset to the original order, or apply a relevance sort if you have a metric
            filteredResources = [...allResources]; // Simplest way to reset
            if (activeFilters.searchTerms.length > 0 && fuse)
            {
                 // In a real scenario, you would sort by the score given by Fuse.js
                 let tempResources = [];
                 activeFilters.searchTerms.forEach(term=>{
                    const results = fuse.search(term);
                    results.forEach(result=>{
                        if (!tempResources.includes(result.item))
                        {
                            tempResources.push(result.item);
                        }
                    })
                 })
                 filteredResources = tempResources;
            }
        }
        currentPage = 1;
        renderResults();
        updateResultsCounter();
    });

    // Event listener for CTRL+K
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault(); // Prevent browser's default behavior
            searchInput.focus();
        }
    });

    // Initialize the page
    loadResources();
    updateCategoryOptions(''); // Show all categories initially

});
