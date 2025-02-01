$(document).ready(function () {
    const container = $(".uk-grid-small");
    jsonData.forEach((item) => {
        const populations = item["Populations Served"].split(";").map((pop) => `<span class="badge rounded-pill bg-danger-subtle text-danger-emphasis">${pop.trim()}</span>`).join(" ");
        const counties = item["County"].split(";").map((county) => `<span class="badge rounded-pill bg-primary-subtle text-primary-emphasis">${county.trim()} County</span>`).join(" ");
        const card = `
            <div class="js-filter-item data-county="${item.County}" data-domain="${item.Domain}">
                <div class="card shadow text-secondary">
                    <div class="card-body">
                        <div class="row">
                            <div class="col">
                                <span class="badge rounded-pill bg-info-subtle text-info-emphasis">
                                ${item.Domain}
                                </span>     
                                <span class="badge rounded-pill bg-success-subtle text-success-emphasis">
                                ${item.Category}
                                </span>                                
                            </div>
                            <div class="col text-end">
                                ${counties} 
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
                        <div class="block__buttons">
                        <a class="button button--secondary" href="${item.Website}" target="_blank">Website</a>                        
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
    $(".filter-btn").on("click", function () {
        const filterType = $(this).data("filter");
        const filterValue = $(this).data("value");
        if (filterValue === "all") {
            $(".js-filter-item").show();
        }
        else {
            $(".js-filter-item").hide().filter(function () {
                return $(this).data(filterType) === filterValue;
            }).show();
        }
    });
});