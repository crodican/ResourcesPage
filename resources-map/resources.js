document.addEventListener('DOMContentLoaded', () => {
    const filters = document.querySelectorAll('.filter');
    const itemsContainer = document.getElementById('items-container');
    const resetButton = document.getElementById('reset');
    const searchBox = document.getElementById('search-box');

    const createCard = (item) => {
        return `
            <div class="card">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img src="${item.Image}" class="img img-fluid rounded-start" alt="${item['Location Name']}">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${item['Location Name']}</h5>
                            <p class="card-text">${item.Domain} - ${item.County}</p>
                            <p class="card-text">Populations Served: ${item['Populations Served']}</p>
                            <a href="${item.Website}" class="btn btn-primary">More Info</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderItems = (filteredData) => {
        itemsContainer.innerHTML = filteredData.map(createCard).join('');
    };

    const filterItems = () => {
        const selectedFilters = Array.from(filters)
            .filter(f => f.checked)
            .map(f => f.value);

        const domainFilters = selectedFilters.filter(filter => filter.includes("Support") || filter.includes("Housing") || filter.includes("Transportation"));
        const countyFilters = selectedFilters.filter(filter => ["Berks", "Bucks", "Chester", "Delaware", "Lancaster", "Montgomery", "Schuylkill", "Philadelphia"].includes(filter));
        const populationFilters = selectedFilters.filter(filter => ["Men", "Women", "Children"].includes(filter));

        const items = data.filter(item => {
            const itemCategories = item.Domain.split(';').map(cat => cat.trim());
            const itemCounties = item.County.split(';').map(county => county.trim());
            const itemPopulations = item['Populations Served'].split(';').map(pop => pop.trim());

            const matchesDomain = domainFilters.length === 0 || domainFilters.some(filter => itemCategories.includes(filter));
            const matchesCounty = countyFilters.length === 0 || countyFilters.some(filter => itemCounties.includes(filter));
            const matchesPopulation = populationFilters.length === 0 || populationFilters.some(filter => itemPopulations.includes(filter));

            return matchesDomain && matchesCounty && matchesPopulation;
        });

        renderItems(items);
    };

    const searchItems = () => {
        const searchTerm = searchBox.value.toLowerCase();
        const filteredData = data.filter(item => {
            return item['Location Name'].toLowerCase().includes(searchTerm) ||
                   item['Domain'].toLowerCase().includes(searchTerm) ||
                   item['County'].toLowerCase().includes(searchTerm) ||
                   item['Populations Served'].toLowerCase().includes(searchTerm);
        });
        renderItems(filteredData);
    };

    filters.forEach(filter => {
        filter.addEventListener('change', () => {
            filterItems();
            searchItems(); // Reapply search after filtering
        });
    });

    searchBox.addEventListener('input', searchItems); // Update results on input

    resetButton.addEventListener('click', () => {
        filters.forEach(filter => filter.checked = false);
        searchBox.value = ''; // Clear search box
        renderItems(data); // Reset to show all items
    });

    renderItems(data); // Initial render
    filterItems(); // Initial call to show all items
});
