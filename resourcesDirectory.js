document.addEventListener('DOMContentLoaded', function () {
    // Function to display resources as Bootstrap cards
    function displayResources(resources, page = 1) {
        // Get the results area element from the DOM
        const resultsArea = document.getElementById('results-area');
        // Get the pagination controls element from the DOM
        const paginationControls = document.getElementById('pagination-controls');

        // Clear previous results and pagination controls
        resultsArea.innerHTML = '';
        paginationControls.innerHTML = '';

        // Define the number of resources to display per page
        const resourcesPerPage = 25;
        // Calculate the starting index for the current page
        const startIndex = (page - 1) * resourcesPerPage;
        // Calculate the ending index for the current page
        const endIndex = startIndex + resourcesPerPage;
        // Slice the resources array to get the resources for the current page
        const pageResources = resources.slice(startIndex, endIndex);

        // Iterate through the resources for the current page and create Bootstrap cards
        pageResources.forEach(resource => {
            const card = document.createElement('div');
            card.classList.add('col-12'); // Add Bootstrap column class

            // Construct the HTML for the resource card
            card.innerHTML = `
                <div class="resourceCard shadow-lg text-bg-white br-5-5-5-5 mb-5">
                    <div class="row no-gutters p-0">
                        <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                            <a href="<span class="math-inline">\{resource\.Website\}" class\="d\-flex align\-items\-center justify\-content\-center flex\-grow\-1 w\-100 text\-white"\> <i class\="bi bi\-globe"\></i\> </a\>
<a href\="</span>{resource["Phone URL"]}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 text-white"> <i class="bi bi-telephone-fill"></i> </a>
                            <a href="<span class="math-inline">\{resource\["Google Maps URL"\]\}" class\="d\-flex align\-items\-center justify\-content\-center flex\-grow\-1 w\-100 text\-white"\> <i class\="bi bi\-geo\-alt\-fill"\></i\> </a\>
</div\>
<div class\="card\-body col\-10 p\-4"\>
<h3 class\="text\-secondary" style\="font\-weight\:400;margin\-bottom\:0;line\-height\:1\.2em;font\-size\:36px"\></span>{resource["Location Name"]}</h3>
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
                                    <p><strong>Phone:</strong> <span class="math-inline">\{resource\.Phone\}</p\>
<p\></span>{resource.Address} <br />${resource.City}, ${resource.State} <span class="math-inline">\{resource\["Zip Code"\]\}</p\>
</div\>
<div class\="col d\-flex justify\-content\-end align\-items\-end"\> <img class\="cardImage" src\="</span>{resource.Image}" alt="Logo"> </div>
                            </div>
                            <p><strong>Populations Served:</strong> ${resource["Populations Served"].split('; ').map(pop => `<span class="badge text-black bg-pink py-2 my-1"> ${pop.trim()} </span>`).join('')}</p>
                            <p><strong>Counties Served:</strong> ${resource.County.split('; ').map(county => `<span class="badge text-black bg-pink py-2 my-1">${county.trim()}</span>`).join('')}</p>
                        </div>
                    </div>
                </div>
            `;
            resultsArea.appendChild(card); // Append the card to the results area
        });

        // Create pagination controls if there are more than one page
        const totalPages = Math.ceil(resources.length / resourcesPerPage);
        if (totalPages > 1) {
            // Create and append the "Previous" button
            paginationControls.appendChild(createPaginationButton('Previous', page > 1 ? page - 1 : 1, page === 1));

            // Create and append numbered page buttons
            for (let i = 1; i <= totalPages; i++) {
                paginationControls.appendChild(createPaginationButton(i, i, i === page));
            }

            // Create and append the "Next" button
            paginationControls.appendChild(createPaginationButton('Next', page < totalPages ? page + 1 : totalPages, page === totalPages));
        }
    }

    // Fuse.js options for fuzzy search
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
    // Get the chip container element
    const chipContainer = document.getElementById('chip-container');
    // Get the filter area element
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
        filterResources(); // Filter resources based on search term
        updateSearchChip(searchTerm); // Update the search chip
    });

    // Function to populate filter checkboxes
    function populateFilters() {
        // Define filter options
        const counties = ['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill'];
        const populations = ['Men', 'Women', 'Children', 'Adolescents'];
        const serviceAreas = ['Recovery Support', 'Family Support', 'Housing', 'Transportation'];
        const categories = ['Single County Authority', 'Center of Excellence', 'Regional Recovery Hub', 'Recovery Community Organization', 'Warm Handoff', 'Treatment with RSS', 'Counseling', 'Peer Support', 'Assistance Program', 'Recovery House', 'Halfway House', 'Housing Assistance', 'Other', 'Affordable Public Transportation', 'Carpool Service', 'Medical Assistance Transportation', 'Recovery Transportation Services', 'Vehicle Purchase Assistance', 'Other'];

        // Populate county filter checkboxes
        const countiesFilter = document.getElementById('counties-filter');
        counties.forEach(county => countiesFilter.appendChild(createCheckbox(county, 'county')));

        // Populate populations filter checkboxes
        const populationsFilter = document.getElementById('populations-filter');
        populations.forEach(pop => populationsFilter.appendChild(createCheckbox(pop, 'population')));

        // Populate service areas filter checkboxes
        const serviceAreasFilter = document.getElementById('service-areas-filter');
        serviceAreas.forEach(area => serviceAreasFilter.appendChild(createCheckbox(area, 'serviceArea')));

        // Populate categories filter checkboxes
        const categoriesFilter = document.getElementById('categories-filter');
        categories.forEach(cat => categoriesFilter.appendChild(createCheckbox(cat, 'category')));
    }

    // Function to create a checkbox element
    function createCheckbox(value, category) {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="<span class="math-inline">\{value\}" data\-category\="</span>{category}"> ${value} `;
        return label;
    }

    // Populate the filter checkboxes
    populateFilters();

    // Function to filter resources based on checkbox selections and search term
    function filterResources() {
        const selectedCounties = getSelectedFilters('county');
        const selectedPopulations = getSelectedFilters('population');
        const selectedServiceAreas = getSelectedFilters('serviceArea');