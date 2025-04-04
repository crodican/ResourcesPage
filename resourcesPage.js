document.addEventListener('DOMContentLoaded', function () {
    // Function to display resources as Bootstrap cards
    function displayResources(resources, page = 1) {
        const resultsArea = document.getElementById('results-area');
        const paginationControls = document.getElementById('pagination-controls');
        resultsArea.innerHTML = ''; // Clear previous results
        paginationControls.innerHTML = '';

        const resourcesPerPage = 25;
        const startIndex = (page - 1) * resourcesPerPage;
        const endIndex = startIndex + resourcesPerPage;
        const pageResources = resources.slice(startIndex, endIndex);

        pageResources.forEach(resource => {
            const card = document.createElement('div');
            card.classList.add('col-12');
            card.innerHTML = `
                <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="${resource.Website}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-globe"></i> </a>
                            <a href="${resource["Phone URL"]}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="${resource["Google Maps URL"]}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-geo-alt-fill"></i> </a>
                        </div>
                        <div class="card-body col-10 p-4">
                            <h3 class="text-secondary" style="font-weight:400;margin-bottom:0;line-height:1.2em;font-size:36px">${resource["Location Name"]}</h3>
                            <h5 style="font-weight:100;margin-top:0;font-size:18px">${resource.Organization}</h5>
                            <div class="row">
                                <div class="col">
                                    <nav aria-label="breadcrumb">
                                        <ol class="breadcrumb">
                                            <li class="cardbreadcrumb-item">
                                                ${resource["Service Area"].split('; ').map(area => `<span class="badge text-black bg-pink py-2 my-1"> ${area.trim()} </span>`).join('')}
                                            </li>
                                            <li class="cardbreadcrumb-item">
                                                ${resource.Category.split('; ').map(cat => `<span class="badge text-black bg-pink py-2 my-1"> ${cat.trim()} </span>`).join('')}
                                            </li>
                                        </ol>
                                    </nav>
                                    <p><strong>Phone:</strong> ${resource.Phone}</p>
                                    <p>${resource.Address} <br />${resource.City}, ${resource.State} ${resource["Zip Code"]}</p>
                                </div>
                                <div class="col d-flex justify-content-end align-items-end"> <img class="cardImage" src="${resource.Image}" alt="Logo"> </div>
                            </div>
                            <p><strong>Populations Served:</strong> ${resource["Populations Served"].split('; ').map(pop => `<span class="badge text-black bg-pink py-2 my-1"> ${pop.trim()} </span>`).join('')}</p>
                            <p><strong>Counties Served:</strong> ${resource.County.split('; ').map(county => `<span class="badge text-black bg-pink py-2 my-1">${county.trim()}</span>`).join('')}</p>
                        </div>
                    </div>
                </div>
            `;
            resultsArea.appendChild(card);
        });

        // Pagination controls
        const totalPages = Math.ceil(resources.length / resourcesPerPage);
        if (totalPages > 1) {
            paginationControls.appendChild(createPaginationButton('Previous', page > 1 ? page - 1 : 1, page === 1));
            for (let i = 1; i <= totalPages; i++) {
                paginationControls.appendChild(createPaginationButton(i, i, i === page));
            }
            paginationControls.appendChild(createPaginationButton('Next', page < totalPages ? page + 1 : totalPages, page === totalPages));
        }
    }
    // Fuse.js options for search
    const options = {
        keys: ['Location Name', 'Organization', 'County', 'Service Area', 'Category', 'Populations Served', 'Address', 'City', 'State', 'Zip Code'],
        threshold: 0.3 // Adjust threshold as needed for fuzzy search accuracy
    };
    // Initialize Fuse.js with the loaded JSON data
    const fuse = new Fuse(jsonData, options);
    // Initial display of all resources
    displayResources(jsonData);
    // Get the search input element
    const searchInput = document.getElementById('search-input');
    // Get the chip container
    const chipContainer = document.getElementById('chip-container');
    // Get the filter area
    const filterArea = document.getElementById('filter-area');
    // Focus search input on Ctrl+K (or Cmd+K)
    document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault(); // Prevent browser's default behavior
            searchInput.focus();
        }
    });
    // Add event listener to the search input for live search
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value;
        filterResources();
        updateSearchChip(searchTerm);
    });
    // Function to populate filter checkboxes
    function populateFilters() {
        const counties = ['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill'];
        const populations = ['Men', 'Women', 'Children', 'Adolescents'];
        const serviceAreas = ['Recovery Support', 'Family Support', 'Housing', 'Transportation'];
        const categories = ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Counseling', 'Peer Support', 'Assistance Program', 'Recovery House', 'Halfway House', 'Housing Assistance', 'Other', 'Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Other'];

        const countiesFilter = document.getElementById('counties-filter');
        counties.forEach(county => countiesFilter.appendChild(createCheckbox(county, 'county')));

        const populationsFilter = document.getElementById('populations-filter');
        populations.forEach(pop => populationsFilter.appendChild(createCheckbox(pop, 'population')));

        const serviceAreasFilter = document.getElementById('service-areas-filter');
        serviceAreas.forEach(area => serviceAreasFilter.appendChild(createCheckbox(area, 'serviceArea')));

        const categoriesFilter = document.getElementById('categories-filter');
        categories.forEach(cat => categoriesFilter.appendChild(createCheckbox(cat, 'category')));
    }
    // Function to create a checkbox element
    function createCheckbox(value, category) {
        const label = document.createElement('label');
        label.innerHTML = `<input class="form-check-input" type="checkbox" value="${value}" data-category="${category}"> ${value} `;
        return label;
    }
    // Populate the filter checkboxes
    populateFilters();
    // Function to filter resources based on checkbox selections
    function filterResources() {
        const selectedCounties = getSelectedFilters('county');
        const selectedPopulations = getSelectedFilters('population');
        const selectedServiceAreas = getSelectedFilters('serviceArea');
        const selectedCategories = getSelectedFilters('category');
        let filteredData = jsonData;
        if (selectedCounties.length > 0) {
            filteredData = filteredData.filter(item => selectedCounties.includes(item.County));
        }
        if (selectedPopulations.length > 0) {
            filteredData = filteredData.filter(item => item["Populations Served"].split('; ').some(pop => selectedPopulations.includes(pop)));
        }
        if (selectedServiceAreas.length > 0) {
            filteredData = filteredData.filter(item => item["Service Area"].split('; ').some(area => selectedServiceAreas.includes(area)));
        }
        if (selectedCategories.length > 0) {
            filteredData = filteredData.filter(item => item.Category.split('; ').some(cat => selectedCategories.includes(cat)));
        }
        const searchTerm = document.getElementById('search-input').value;
        let results;
        if (searchTerm) {
            results = fuse.search(searchTerm).map(result => result.item);
            results = results.filter(item => filteredData.includes(item));
        } else {
            results = filteredData;
        }

        // Sorting logic
        const sortBy = sortDropdown.value;
        if (sortBy) {
            results.sort((a, b) => {
                let aVal, bVal;
                if (sortBy === 'county') {
                    aVal = a.County;
                    bVal = b.County;
                } else if (sortBy === 'populations') {
                    aVal = a["Populations Served"];
                    bVal = b["Populations Served"];
                } else if (sortBy === 'serviceArea') {
                    aVal = a["Service Area"];
                    bVal = b["Service Area"];
                }
                return aVal.localeCompare(bVal);
            });
        } else {
          //if no sort is selected, return to original order.
          results = results.sort((a,b) => jsonData.indexOf(a) - jsonData.indexOf(b));
        }

        displayResources(results, currentPage);

        // Update resource count
        document.getElementById('resource-count').textContent = `Showing ${results.length} resources`;
    }
    // Function to get selected filter values
    function getSelectedFilters(category) {
        const checkboxes = document.querySelectorAll(`#filter-area input[data-category="${category}"]:checked`);
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }
    filterArea.addEventListener('change', function () {
        filterResources();
        updateFilterChips();
    });
    function updateSearchChip(searchTerm) {
        // Clear existing search chip
        const existingSearchChip = chipContainer.querySelector('.search-chip');
        if (existingSearchChip) {
            existingSearchChip.remove();
        }
        if (searchTerm) {
            const chip = createChip(searchTerm, 'search');
            chip.classList.add('search-chip');
            chipContainer.appendChild(chip);
        }
    }
    function updateFilterChips() {
        // Clear existing filter chips
        const filterChips = chipContainer.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => chip.remove());
        // Add new filter chips
        const selectedCounties = getSelectedFilters('county');
        const selectedPopulations = getSelectedFilters('population');
        const selectedServiceAreas = getSelectedFilters('serviceArea');
        const selectedCategories = getSelectedFilters('category');
        selectedCounties.forEach(county => chipContainer.appendChild(createChip(county, 'county')));
        selectedPopulations.forEach(pop => chipContainer.appendChild(createChip(pop, 'population')));
        selectedServiceAreas.forEach(area => chipContainer.appendChild(createChip(area, 'serviceArea')));
        selectedCategories.forEach(cat => chipContainer.appendChild(createChip(cat, 'category')));
    }
    function createChip(text, category) {
        const chip = document.createElement('div');
        chip.classList.add('chip', 'filter-chip'); // Add your chip styling classes
        chip.textContent = text;
        chip.dataset.category = category;
        const closeButton = document.createElement('span');
        closeButton.innerHTML = "&times;";
        closeButton.classList.add('close-chip');
        chip.appendChild(closeButton);
        closeButton.addEventListener('click', function () {
            if (category === 'search') {
                searchInput.value = '';
            } else {
                const checkbox = document.querySelector(`#filter-area input[data-category="${category}"][value="${text}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
            }
            filterResources();
            chip.remove();
        });
        return chip;
    }
    // Add event listener to the filter area for checkbox changes
    filterArea.addEventListener('change', filterResources);
// Get the controls area
    const controlsArea = document.getElementById('controls-area');

    // Add clear all filters button
    const clearFiltersButton = document.createElement('button');
    clearFiltersButton.textContent = 'Clear All Filters';
    clearFiltersButton.classList.add('btn', 'btn-secondary', 'me-2');
    clearFiltersButton.addEventListener('click', function () {
        searchInput.value = '';
        document.querySelectorAll('#filter-area input:checked').forEach(checkbox => checkbox.checked = false);
        sortDropdown.value = ""; // Reset sorting dropdown
        currentPage = 1; // Reset current page
        filterResources();
    });
    controlsArea.appendChild(clearFiltersButton);

    // Add sorting dropdown
    const sortDropdown = document.createElement('select');
    sortDropdown.classList.add('form-select', 'me-2');
    sortDropdown.innerHTML = `
        <option value="">Sort By</option>
        <option value="county">County</option>
        <option value="populations">Populations Served</option>
        <option value="serviceArea">Service Area</option>
    `;
    sortDropdown.addEventListener('change', function () {
        currentPage = 1; // Reset current page
        filterResources();
    });
    controlsArea.appendChild(sortDropdown);

    // Create the resource count element outside filterResources
    const countElement = document.createElement('div');
    countElement.id = 'resource-count';
    countElement.classList.add('ms-2');
    controlsArea.appendChild(countElement);

    // Function to create pagination buttons
    function createPaginationButton(text, page, isDisabled) {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('btn', 'btn-outline-secondary', 'mx-1');
        button.disabled = isDisabled;
        button.addEventListener('click', () => {
            currentPage = page;
            filterResources();
        });
        return button;
    }

    let currentPage = 1;
    const resourcesPerPage = 25;

    // Initial resource count and display
    filterResources();
});