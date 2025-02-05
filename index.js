const htmlContent = `
<!doctype html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recovery Resource Table</title>
    <!-- Fonts CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;1,600&amp;display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400;700&amp;display=swap" rel="stylesheet" />
    <!-- UIkit CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.6.22/css/uikit.min.css" />
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
    <!-- UIkit JS -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.6.22/js/uikit.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/uikit/3.6.22/js/uikit-icons.min.js"></script>
    <!-- SB Admin CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/startbootstrap-sb-admin-2/4.1.4/css/sb-admin-2.min.css" integrity="sha512-Mk4n0eeNdGiUHlWvZRybiowkcu+Fo2t4XwsJyyDghASMeFGH6yUXcdDI3CKq12an5J8fq4EFzRVRdbjerO3RmQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css" integrity="sha512-dPXYcDub/aeb08c63jRq/k6GaKccl256JQy/AnOq7CAnEZ9FzSL9wSbcZkMp4R26vBsMLFYH4kQ67/bbV8XaCQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Bootstrap 5 CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <!-- Elevation CSS -->
    <!-- <link rel="stylesheet" href="elevation-bootstrap.css" /> -->
    <script src="data.js"></script>
    <script src="script2.js"></script>
    <script>
        function displayWindowSize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            document.getElementById("window-size").innerText = \`Width: \${width}px, Height: \${height}px\`;
        }
        window.onresize = displayWindowSize;
        window.onload = displayWindowSize;
    </script>
</head>
<body>
    <div class="py-3 mb-4 border-bottom fixedtop shadow-lg">
        <div class="container-fluid align-items-center d-flex">
            <div class="flex-shrink-1"></div>
            <div class="flex-grow-1 d-flex align-items-center">
                <form class="w-100 me-3">
                    <div class="input-group">
                        <input class="bg-gray-200 form-control border-0" type="text" placeholder="Search" id="search-box" />
                        <div class="input-group-append">
                            <button class="btn" type="button" style="background-color: #55298a; color: #fff"> <span class="bi bi-search"></span> </button>
                        </div>
                    </div>
                </form>
                <div class="flex-shrink-0 dropdown"> <a href="#" class="d-block link-dark text-decoration-none dropdown-toggle" id="dropdownUser2" data-bs-toggle="dropdown" aria-expanded="false">MAP</a>
                    <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownUser2" style="">
                        <li><a class="dropdown-item" href="#">Show Map...</a></li>
                        <li><a class="dropdown-item" href="#">County</a></li>
                        <li><a class="dropdown-item" href="#">Domain</a></li>
                        <li><hr class="dropdown-divider" /></li>
                        <li><a class="dropdown-item" href="#">Exit</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    <div class="container-fluid pb-3 flex-grow-1 d-flex flex-column flex-sm-row overflow-auto">
        <div class="row flex-grow-sm-1 flex-grow-0">
            <aside class="col-sm flex-grow-sm-1 flex-shrink-1 flex-grow-0">
                <div class="bg-light px-3 py-4 shadow">
                    <button class="button button--pink filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="all"> All Counties </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Berks"> Berks </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Chester"> Chester </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Bucks"> Bucks </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Delaware"> Delaware </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Lancaster"> Lancaster </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Montgomery"> Montgomery </button>
                    <button class="button button--secondary filter-btn m-2 py-2 px-3 shadow" data-filter="county" data-value="Schuylkill"> Schuylkill </button>
                </div>
            </aside>
            <main class="col overflow-auto h-100">
                <div class="bg-light shadow border-dark p-2">
                    <button class="button button--success filter-btn m-2 py-2 px-3" data-filter="domain" data-value="all"> All Domains </button>
                    <button class="button button--primary filter-btn m-2 py-2 px-3" data-filter="domain" data-value="Recovery Support"> Recovery Support </button>
                    <button class="button button--primary filter-btn m-2 py-2 px-3" data-filter="domain" data-value="Family Support"> Family Support </button>
                    <button class="button button--primary filter-btn m-2 py-2 px-3" data-filter="domain" data-value="Housing"> Housing </button>
                    <button class="button button--primary filter-btn m-2 py-2 px-3" data-filter="domain" data-value="Transportation"> Transportation </button>
                </div>
                <br />
                <div id="breadcrumbs" class="bg-light p-2 mb-3 shadow">All Counties → All Domains</div>
                <div class="container-fluid">
                    <div class="container"></div>
                    <br />
                    <div class="container my-3"></div>
                    <div class="container">
                        <div class="uk-grid-small uk-child-width-1-3@m js-filter" uk-grid>
                            <!-- Cards will be populated here -->
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    <!-- Bootstrap core JavaScript-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.bundle.min.js" integrity="sha512-7Pi/otdlbbCR+LnW+F7PwFcSDJOuUJB3OxtEHbg4vSMvzvJjde4Po1v4BR9Gdc9aXNUNFVUY+SK51wWT8WF0Gg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <!-- Core plugin JavaScript-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.min.js" integrity="sha512-0QbL0ph8Tc8g5bLhfVzSqxe9GERORsKhIn1IrpxDAgUsbBGz/V7iSav2zzW325XGd1OMLdL4UiqRJj702IeqnQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- Custom scripts for all pages-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/startbootstrap-sb-admin-2/4.1.4/js/sb-admin-2.min.js" integrity="sha512-+QnjQxxaOpoJ+AAeNgvVatHiUWEDbvHja9l46BHhmzvP0blLTXC4LsvwDVeNhGgqqGQYBQLFhdKFyjzPX6HGmw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <!-- Page level plugins -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.21/js/jquery.dataTables.min.js" integrity="sha512-BkpSL20WETFylMrcirBahHfSnY++H2O1W+UnEEO4yNIl+jI2+zowyoGJpbtk6bx97fBXf++WJHSSK2MV4ghPcg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.21/js/dataTables.bootstrap4.min.js" integrity="sha512-OQlawZneA7zzfI6B1n1tjUuo3C5mtYuAWpQdg+iI9mkDoo7iFzTqnQHf+K5ThOWNJ9AbXL4+ZDwH7ykySPQc+A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script>
        $(document).ready(function () {
            const container = $(".uk-grid-small");
            jsonData.forEach((item) => {
                const populations = item["Populations Served"].split(";").map((pop) => `<span class="badge rounded-pill bg-danger-subtle text-danger-emphasis">${pop.trim()}</span>`).join(" ");
                const counties = item["County"].split(";").map((county) => `<span class="badge rounded-pill bg-primary-subtle text-primary-emphasis">${county.trim()} County</span>`).join(" ");
                const card = `
                    <div class="js-filter-item" data-county="${item.County}" data-domain="${item.Domain}">
                        <div class="card shadow text-bg-light p-3">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col">
                                        <span class="badge rounded-pill bg-info-subtle text-info-emphasis">
                                        ${item.Domain}
                                        </span>     
                                        <span class="badge rounded-pill bg-success-subtle text-success-emphasis">
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
    </script>
</body>
</html>
`;