$(document).ready(function () {
    const container = $(".uk-grid-small");
    jsonData.forEach((item) => {
        // Function to format the phone number
        function formatPhoneNumber(phone) {
            return '+1' + phone.replace(/-/g, '');
        }

        // Format the phone number and create the phoneLink item
        const formattedPhoneNumber = formatPhoneNumber(item.Phone);
        item.phoneLink = `tel:${formattedPhoneNumber}`;

        const populations = item["Populations Served"].split(";").map((pop) => `<span class="badge bg-danger-subtle text-danger-emphasis py-2">${pop.trim()}</span>`).join(" ");
        const counties = item["County"].split(";").map((county) => `<span class="badge bg-primary-subtle text-primary-emphasis py-2">${county.trim()} County</span>`).join(" ");
        const card = `
            <div class="js-filter-item" data-county="${item.County}" data-domain="${item.Domain}">
                <div class="card shadow text-bg-light p-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col">
                                <span class="badge text-bg-info py-2">
                                ${item.Domain}
                                </span>     
                                <span class="badge text-bg-purple py-2">
                                ${item.Category}
                                </span>                                
                            <div class="col text-end">
                                ${counties} 
                            </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title" style="font-weight:400">${item["Location Name"]}</h3>
                        <h5 style="font-weight:400">${item.Organization}</h5>
                        ${item.Image ? ` <img src = "${item.Image}"
        alt = "Logo"
        style = "max-width:100px; max-height:100px; float:left; margin-right:10px;" > ` : ""}
                        <p><strong>Phone:</strong> ${item.Phone}</p>
                        <br /><p>${item.Address}<br />
                        ${item.City}, ${item.State} ${item["Zip Code"]}</p>
                        <br />
                        <p><strong>Populations Served:</strong> ${populations}</p>
                        <br />
                        <div class="btn-group btn-group-lg px-2" role="group" aria-label="Basic outlined example" style="transform:scale(1.25, 1.5)">
                          <a href="${item.Website}" class="btn customButton--purple py-2"><span class="bi bi-globe"></i></a>
                          <a href="${item.phoneLink}" class="btn customButton--cyan py-2"><span class="bi bi-telephone-fill"></i></a>
                          <a href="${item.Website}" class="btn customButton--teal py-2"><span class="bi bi-geo-alt-fill"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(card);
    });

    // Search functionality
    $("#search-box").on("keyup", function () {
        const searchTerm = $(this).val().toLowerCase();
        $(".js-filter-item").each(function () {
            const text = $(this).text().toLowerCase();
            $(this).toggle(text.includes(searchTerm));
        });
    });

    // Filter functionality
    const filters = {
        county: 'all',
        domain: 'all'
    };

    const updateBreadcrumbs = () => {
        const county = filters.county === 'all' ? 'All Counties' : `${filters.county} County`;
        const domain = filters.domain === 'all' ? 'All Domains' : filters.domain;
        $('#breadcrumbs').text(`${county} → ${domain}`);
    };

    $('.filter-btn').on('click', function() {
        const filterType = $(this).data('filter');
        const filterValue = $(this).data('value');

        // Update the filter value based on the clicked button
        filters[filterType] = filterValue;

        // Apply filters
        $('.js-filter-item').hide().filter(function() {
            const countyMatch = filters.county === 'all' || $(this).data('county').includes(filters.county);
            const domainMatch = filters.domain === 'all' || $(this).data('domain') === filters.domain;
            return countyMatch && domainMatch;
        }).show();

        // Update breadcrumbs
        updateBreadcrumbs();
    });

    // Initialize breadcrumbs
    updateBreadcrumbs();
});