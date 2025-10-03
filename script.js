
      // Configuration
      const CONFIG = {
        API_BASE_URL: "https://resourcesdatabaseproxy.crodican.workers.dev/",
        MAPTILER_API_KEY: "1nPjVtGASMJJCaJkeKXQ",
        DEFAULT_PAGE_SIZE: 25,
        DEBOUNCE_DELAY: 300
      };

      // Application State
      const AppState = {
        // Data
        currentData: [],
        totalRows: 0,
        filterOptions: {},

        // UI State
        currentPage: 1,
        recordsPerPage: CONFIG.DEFAULT_PAGE_SIZE,
        currentSort: "",
        sortDirection: "asc",
        isLoading: false,
        currentView: "cards", // 'table' or 'cards'

        // Filters
        activeFilters: {
          search: "",
          County: [],
          "Resource Type": [],
          "Populations Served": [],
          Category: []
        },

        // Map
        map: null
      };

      // API Client
      class APIClient {
        static cache = new Map();
        static cacheTimeout = 2 * 60 * 1000; // 2 minutes cache

        static getCacheKey(endpoint, params) {
          const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
              result[key] = Array.isArray(params[key]) ? params[key].sort() : params[key];
              return result;
            }, {});
          return `${endpoint}?${JSON.stringify(sortedParams)}`;
        }

        static async request(endpoint, params = {}) {
          const cacheKey = this.getCacheKey(endpoint, params);

          // Check cache first
          const cached = this.cache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log("Using cached data for:", cacheKey);
            return cached.data;
          }

          try {
            const url = new URL(endpoint, CONFIG.API_BASE_URL);
            Object.keys(params).forEach((key) => {
              if (Array.isArray(params[key])) {
                params[key].forEach((value) => url.searchParams.append(key, value));
              } else if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
                url.searchParams.append(key, params[key]);
              }
            });

            console.log("API Request:", url.toString());
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
              throw new Error(data.error?.message || "API request failed");
            }

            // Cache the result
            this.cache.set(cacheKey, {
              data: data.data,
              timestamp: Date.now()
            });

            // Clean old cache entries (keep cache size manageable)
            if (this.cache.size > 50) {
              const oldestKey = this.cache.keys().next().value;
              this.cache.delete(oldestKey);
            }

            return data.data;
          } catch (error) {
            console.error("API Error:", error);
            throw error;
          }
        }

        static clearCache() {
          this.cache.clear();
        }

        static async getFilters() {
          return this.request("filters");
        }

        static async getData(params = {}) {
          return this.request("", params);
        }
      }

      // DOM Elements Cache
      const DOM = {
        init() {
          this.searchInput = document.getElementById("search-input");
          this.searchBtn = document.getElementById("search-btn");
          this.perPageSelect = document.getElementById("per-page-select");
          this.clearFiltersBtn = document.getElementById("clear-filters-btn");

          this.loadingSpinner = document.getElementById("loading-spinner");
          this.tableContainer = document.getElementById("table-container");
          this.cardsContainer = document.getElementById("cards-container");
          this.tableBody = document.getElementById("table-body");
          this.resultsInfo = document.getElementById("results-info");
          this.pagination = document.getElementById("pagination");
          this.exportBtn = document.getElementById("export-btn");

          this.activeFiltersDiv = document.getElementById("active-filters");
          this.filterChipsDiv = document.getElementById("filter-chips");

          this.mapContainer = document.getElementById("map");

          this.tableViewBtn = document.getElementById("table-view-btn");
          this.cardViewBtn = document.getElementById("card-view-btn");
        }
      };

      // Results Manager - NEW
      const ResultsManager = {
        showResultsSection() {
          const resultsSection = document.getElementById('results');
          if (resultsSection) {
            resultsSection.classList.add('show');
            
            // Scroll to results with a slight delay to ensure it's visible
            setTimeout(() => {
              resultsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }, 100);
          }
        },

        hideResultsSection() {
          const resultsSection = document.getElementById('results');
          if (resultsSection) {
            resultsSection.classList.remove('show');
          }
        }
      };

      // Utility Functions
      const Utils = {
        debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        },

        escapeHtml(text) {
          const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
          };
          return String(text || "").replace(/[&<>"']/g, (m) => map[m]);
        },

        formatPhoneUrl(phone) {
          return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
        },

        showLoading() {
          AppState.isLoading = true;
          DOM.loadingSpinner.style.display = "flex";
          DOM.tableContainer.style.display = "none";
          DOM.cardsContainer.style.display = "none";
          DOM.exportBtn.disabled = true;
        },

        hideLoading() {
          AppState.isLoading = false;
          DOM.loadingSpinner.style.display = "none";
          ViewManager.showCurrentView();
        }
      };

      // View Management
      const ViewManager = {
        initialize() {
          DOM.tableViewBtn.addEventListener("click", () => this.switchView("table"));
          DOM.cardViewBtn.addEventListener("click", () => this.switchView("cards"));
        },

        switchView(view) {
          AppState.currentView = view;

          // Update toggle buttons
          DOM.tableViewBtn.classList.toggle("active", view === "table");
          DOM.cardViewBtn.classList.toggle("active", view === "cards");

          this.showCurrentView();

          // Re-render the data in the new view format
          this.renderCurrentView();
        },

        showCurrentView() {
          if (AppState.currentView === "table") {
            DOM.tableContainer.style.display = "block";
            DOM.cardsContainer.style.display = "none";
          } else {
            DOM.tableContainer.style.display = "none";
            DOM.cardsContainer.style.display = "block";
          }
        },

        renderCurrentView() {
          if (AppState.currentData && AppState.currentData.length > 0) {
            if (AppState.currentView === "table") {
              TableRenderer.render(AppState.currentData);
            } else {
              CardRenderer.render(AppState.currentData);
            }
          }
        }
      };

      // Filter Management
      const FilterManager = {
        async loadFilterOptions() {
          try {
            AppState.filterOptions = await APIClient.getFilters();
            this.initializeDropdowns();
            this.initializeSearchControlFilters();
          } catch (error) {
            console.error("Failed to load filter options:", error);
            this.initializeDropdowns();
            this.initializeSearchControlFilters();
          }
        },

        initializeDropdowns() {
          const filterTypes = ["County", "Resource Type", "Populations Served"];

          filterTypes.forEach((filterType) => {
            const options = AppState.filterOptions[filterType] || [];
            this.createFilterDropdown(filterType, options);
          });

          this.initializeCategoryDropdown();
          this.setupEventListeners();
        },

        initializeSearchControlFilters() {
          // Initialize Bootstrap dropdown filters in search controls
          this.createSearchControlDropdown("County", AppState.filterOptions.County || []);
          this.createSearchControlDropdown("Resource Type", AppState.filterOptions["Resource Type"] || []);
          this.createSearchControlDropdown("Populations Served", AppState.filterOptions["Populations Served"] || []);
          this.initializeSearchControlCategoryDropdown();
          this.updateFilterCountBadges();
        },

        createSearchControlDropdown(filterType, options) {
          const dropdownId = this.getSearchControlDropdownId(filterType);
          const dropdown = document.getElementById(dropdownId);

          if (!dropdown || !options.length) return;

          dropdown.innerHTML = options
            .map((option) => {
              const safeId = `sc-${filterType}-${option}`.replace(/[^a-zA-Z0-9-_]/g, "-");
              const isChecked = AppState.activeFilters[filterType]?.includes(option) ? "checked" : "";
              return `
                        <li>
                            <div class="dropdown-item-check">
                                <input type="checkbox" id="${safeId}" value="${option}" ${isChecked} onchange="FilterManager.handleSearchControlFilterChange('${filterType}', '${option}', this.checked)">
                                <label for="${safeId}">${option}</label>
                            </div>
                        </li>
                    `;
            })
            .join("");
        },

        initializeSearchControlCategoryDropdown() {
          const categories = AppState.filterOptions.Category || {};
          const allCategories = new Set();
          Object.values(categories).forEach((cats) => cats.forEach((cat) => allCategories.add(cat)));

          this.createSearchControlDropdown("Category", Array.from(allCategories).sort());
        },

        updateSearchControlCategoryDropdown() {
          const selectedResourceTypes = AppState.activeFilters["Resource Type"];
          const categories = AppState.filterOptions.Category || {};

          if (selectedResourceTypes.length === 0) {
            this.initializeSearchControlCategoryDropdown();
            return;
          }

          const availableCategories = new Set();
          selectedResourceTypes.forEach((resourceType) => {
            if (categories[resourceType]) {
              categories[resourceType].forEach((cat) => availableCategories.add(cat));
            }
          });

          this.createSearchControlDropdown("Category", Array.from(availableCategories).sort());

          AppState.activeFilters.Category = AppState.activeFilters.Category.filter((cat) =>
            availableCategories.has(cat)
          );
        },

        getSearchControlDropdownId(filterType) {
          const mapping = {
            County: "county-dropdown-menu",
            "Resource Type": "resource-type-dropdown-menu",
            Category: "category-dropdown-menu",
            "Populations Served": "populations-dropdown-menu"
          };
          return mapping[filterType];
        },

        handleSearchControlFilterChange(filterType, value, checked) {
          if (checked) {
            if (!AppState.activeFilters[filterType].includes(value)) {
              AppState.activeFilters[filterType].push(value);
            }
          } else {
            AppState.activeFilters[filterType] = AppState.activeFilters[filterType].filter((v) => v !== value);
          }

          if (filterType === "Resource Type") {
            this.updateCategoryDropdown();
            this.updateSearchControlCategoryDropdown();
          }

          // Update both dropdown systems
          this.syncDropdowns(filterType);

          // Clear cache when filters change to ensure fresh data
          APIClient.clearCache();

          this.updateUI();
          AppState.currentPage = 1;
          DataManager.loadData();
        },

        syncDropdowns(filterType) {
          // Sync table header dropdowns with search control dropdowns
          const tableDropdownId = this.getDropdownId(filterType);
          const tableDropdown = document.getElementById(tableDropdownId);

          if (tableDropdown) {
            const checkboxes = tableDropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
              const isActive = AppState.activeFilters[filterType]?.includes(checkbox.value);
              checkbox.checked = isActive;
            });
          }

          // Update search control dropdowns
          const searchDropdownId = this.getSearchControlDropdownId(filterType);
          const searchDropdown = document.getElementById(searchDropdownId);

          if (searchDropdown) {
            const checkboxes = searchDropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach((checkbox) => {
              const isActive = AppState.activeFilters[filterType]?.includes(checkbox.value);
              checkbox.checked = isActive;
            });
          }
        },

        updateFilterCountBadges() {
          ["County", "Resource Type", "Category", "Populations Served"].forEach((filterType) => {
            const count = AppState.activeFilters[filterType]?.length || 0;
            const badgeId = this.getCountBadgeId(filterType);
            const badge = document.getElementById(badgeId);

            if (badge) {
              if (count > 0) {
                badge.textContent = count;
                badge.style.display = "flex";
              } else {
                badge.style.display = "none";
              }
            }
          });
        },

        getCountBadgeId(filterType) {
          const mapping = {
            County: "county-count-badge",
            "Resource Type": "resource-type-count-badge",
            Category: "category-count-badge",
            "Populations Served": "populations-count-badge"
          };
          return mapping[filterType];
        },

        createFilterDropdown(filterType, options) {
          const dropdownId = this.getDropdownId(filterType);
          const dropdown = document.getElementById(dropdownId);

          if (!dropdown || !options.length) return;

          dropdown.innerHTML = options
            .map((option) => {
              const safeId = `th-${filterType}-${option}`.replace(/[^a-zA-Z0-9-_]/g, "-");
              const isChecked = AppState.activeFilters[filterType]?.includes(option) ? "checked" : "";
              return `
                        <div class="filter-option">
                            <input type="checkbox" id="${safeId}" value="${option}" ${isChecked}>
                            <label for="${safeId}">${option}</label>
                        </div>
                    `;
            })
            .join("");

          dropdown.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
              this.handleFilterChange(filterType, e.target.value, e.target.checked);
            });
          });
        },

        initializeCategoryDropdown() {
          const categories = AppState.filterOptions.Category || {};
          const allCategories = new Set();
          Object.values(categories).forEach((cats) => cats.forEach((cat) => allCategories.add(cat)));

          this.createFilterDropdown("Category", Array.from(allCategories).sort());
        },

        updateCategoryDropdown() {
          const selectedResourceTypes = AppState.activeFilters["Resource Type"];
          const categories = AppState.filterOptions.Category || {};

          if (selectedResourceTypes.length === 0) {
            this.initializeCategoryDropdown();
            return;
          }

          const availableCategories = new Set();
          selectedResourceTypes.forEach((resourceType) => {
            if (categories[resourceType]) {
              categories[resourceType].forEach((cat) => availableCategories.add(cat));
            }
          });

          this.createFilterDropdown("Category", Array.from(availableCategories).sort());

          AppState.activeFilters.Category = AppState.activeFilters.Category.filter((cat) =>
            availableCategories.has(cat)
          );
        },

        handleFilterChange(filterType, value, checked) {
          if (checked) {
            if (!AppState.activeFilters[filterType].includes(value)) {
              AppState.activeFilters[filterType].push(value);
            }
          } else {
            AppState.activeFilters[filterType] = AppState.activeFilters[filterType].filter((v) => v !== value);
          }

          if (filterType === "Resource Type") {
            this.updateCategoryDropdown();
            this.updateSearchControlCategoryDropdown();
          }

          // Sync both dropdown systems
          this.syncDropdowns(filterType);

          // Clear cache when filters change to ensure fresh data
          APIClient.clearCache();

          this.updateUI();
          AppState.currentPage = 1;
          DataManager.loadData();
        },

        setupEventListeners() {
          document.querySelectorAll(".filter-header").forEach((header) => {
            header.addEventListener("click", (e) => {
              e.stopPropagation();
              const column = header.dataset.column;
              if (this.isFilterColumn(column) && !e.target.closest(".resize-handle")) {
                this.toggleDropdown(column);
              }
            });
          });

          document.addEventListener("click", (e) => {
            if (!e.target.closest(".filter-header")) {
              this.closeAllDropdowns();
            }
          });
        },

        isFilterColumn(column) {
          return ["County", "Resource Type", "Category", "Populations Served"].includes(column);
        },

        toggleDropdown(filterType) {
          const dropdownId = this.getDropdownId(filterType);
          const dropdown = document.getElementById(dropdownId);

          if (!dropdown) return;

          this.closeAllDropdowns();
          dropdown.classList.toggle("show");
        },

        closeAllDropdowns() {
          document.querySelectorAll(".filter-dropdown").forEach((dropdown) => {
            dropdown.classList.remove("show");
          });
        },

        getDropdownId(filterType) {
          const mapping = {
            County: "county-filter-dropdown",
            "Resource Type": "resource-type-filter-dropdown",
            Category: "category-filter-dropdown",
            "Populations Served": "populations-filter-dropdown"
          };
          return mapping[filterType];
        },

        clearAll() {
          AppState.activeFilters = {
            search: "",
            County: [],
            "Resource Type": [],
            "Populations Served": [],
            Category: []
          };

          DOM.searchInput.value = "";

          // Clear table header dropdowns
          document.querySelectorAll('.filter-dropdown input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
          });

          // Clear search control dropdowns
          document.querySelectorAll('[id$="-dropdown-menu"] input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
          });

          this.updateCategoryDropdown();
          this.updateSearchControlCategoryDropdown();
          this.updateUI();
          
          // Show county search section when filters are cleared
          CountyCardManager.showCountySearch();
        },

        updateUI() {
          this.updateIndicators();
          this.updateFilterChips();
          this.updateFilterCountBadges();
        },

        updateIndicators() {
          ["County", "Resource Type", "Category", "Populations Served"].forEach((filterType) => {
            const indicatorId = this.getDropdownId(filterType).replace("-dropdown", "-indicator");
            const indicator = document.getElementById(indicatorId);

            if (indicator) {
              if (AppState.activeFilters[filterType]?.length > 0) {
                indicator.classList.add("active");
              } else {
                indicator.classList.remove("active");
              }
            }
          });
        },

        updateFilterChips() {
          const chips = [];

          if (AppState.activeFilters.search) {
            chips.push({
              type: "search",
              value: AppState.activeFilters.search,
              label: `Search: "${AppState.activeFilters.search}"`
            });
          }

          ["County", "Resource Type", "Category", "Populations Served"].forEach((filterType) => {
            if (AppState.activeFilters[filterType]?.length > 0) {
              AppState.activeFilters[filterType].forEach((value) => {
                chips.push({
                  type: filterType,
                  value: value,
                  label: `${filterType}: ${value}`
                });
              });
            }
          });

          if (chips.length > 0) {
            DOM.activeFiltersDiv.style.display = "block";
            DOM.filterChipsDiv.innerHTML = chips
              .map(
                (chip) =>
                  `<span class="filter-chip">
                            ${chip.label}
                            <button type="button" class="btn-close" onclick="FilterManager.removeFilter('${chip.type}', '${chip.value}')" aria-label="Remove filter"></button>
                        </span>`
              )
              .join("");
          } else {
            DOM.activeFiltersDiv.style.display = "none";
          }
        },

        removeFilter(type, value) {
          if (type === "search") {
            AppState.activeFilters.search = "";
            DOM.searchInput.value = "";
          } else if (AppState.activeFilters[type]) {
            AppState.activeFilters[type] = AppState.activeFilters[type].filter((v) => v !== value);

            // Update both dropdown systems
            this.syncDropdowns(type);
          }

          if (type === "Resource Type") {
            this.updateCategoryDropdown();
            this.updateSearchControlCategoryDropdown();
          }

          AppState.currentPage = 1;
          this.updateUI();
          DataManager.loadData();
        }
      };

      // Data Management
      const DataManager = {
        currentRequest: null, // Track current request to prevent race conditions

        async loadData() {
          // Cancel any existing request
          if (this.currentRequest) {
            console.log("Cancelling previous request");
            return; // Don't start new request if one is pending
          }

          Utils.showLoading();

          try {
            const params = this.buildRequestParams();
            this.currentRequest = APIClient.getData(params);
            const data = await this.currentRequest;

            AppState.currentData = data.list || [];
            AppState.totalRows = data.pageInfo?.totalRows || 0;

            // Render based on current view
            if (AppState.currentView === "table") {
              TableRenderer.render(AppState.currentData);
            } else {
              CardRenderer.render(AppState.currentData);
            }

            PaginationManager.render();
            this.updateResultsInfo();
            MapManager.updateMarkers();

            DOM.exportBtn.disabled = AppState.currentData.length === 0;
          } catch (error) {
            console.error("Error loading data:", error);
            this.showError(error.message);
          } finally {
            this.currentRequest = null;
            Utils.hideLoading();
          }
        },

        buildRequestParams() {
          const params = {
            page: AppState.currentPage,
            limit: AppState.recordsPerPage
          };

          if (AppState.currentSort) {
            const sortParam = AppState.sortDirection === "desc" ? `-${AppState.currentSort}` : AppState.currentSort;
            params.sort = sortParam;
          }

          if (AppState.activeFilters.search) {
            params.search = AppState.activeFilters.search;
          }

          // Add array filters
          ["County", "Resource Type", "Category"].forEach((filterType) => {
            if (AppState.activeFilters[filterType]?.length > 0) {
              params[filterType] = AppState.activeFilters[filterType];
            }
          });

          // Special handling for Populations Served
          if (AppState.activeFilters["Populations Served"]?.length > 0) {
            params.Populations = AppState.activeFilters["Populations Served"];
          }

          return params;
        },

        updateResultsInfo() {
          const start = (AppState.currentPage - 1) * AppState.recordsPerPage + 1;
          const end = Math.min(AppState.currentPage * AppState.recordsPerPage, AppState.totalRows);

          if (AppState.totalRows === 0) {
            DOM.resultsInfo.textContent = "No resources found";
          } else {
            DOM.resultsInfo.textContent = `Showing ${start}-${end} of ${AppState.totalRows} resources`;
          }
        },

        showError(message) {
          if (AppState.currentView === "table") {
            DOM.tableBody.innerHTML = `
                        <tr>
                            <td colspan="12" class="text-center text-danger py-4">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Error: ${Utils.escapeHtml(message)}
                            </td>
                        </tr>
                    `;
          } else {
            DOM.cardsContainer.innerHTML = `
                        <div class="text-center text-danger py-4">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Error: ${Utils.escapeHtml(message)}
                        </div>
                    `;
          }
          DOM.resultsInfo.textContent = "Error loading data";
        }
      };

      // Table Rendering
      const TableRenderer = {
        render(data) {
          if (!data || data.length === 0) {
            DOM.tableBody.innerHTML = `
                        <tr>
                            <td colspan="12" class="text-center text-muted py-4">
                                <i class="bi bi-inbox me-2"></i>
                                No resources found with the current filters.
                            </td>
                        </tr>
                    `;
            return;
          }

          DOM.tableBody.innerHTML = data.map((resource) => this.renderRow(resource)).join("");
        },

renderRow(resource) {
    const resourceIdentifier = resource.ID || resource["Location Name"] || "unknown";
    return `
                <tr class="table-row-clickable"
                    data-resource-id="${resourceIdentifier}"
                    ${
                      resource.Longitude && resource.Latitude
                        ? `data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}"`
                        : ""
                    }>
                    <td class="text-nowrap">
                        <img src="${Utils.escapeHtml(resource.Image)}" alt="${Utils.escapeHtml(resource["Location Name"] || "Location")}" class="location-image" style="min-width:50px" onerror="this.style.display='none'">
                    </td>
                    <td class="text-nowrap">
                        <strong>${Utils.escapeHtml(resource["Location Name"] || "N/A")}</strong>
                    </td>
                    <td class="text-nowrap">${Utils.escapeHtml(resource.Organization || "N/A")}</td>
                    <td class="text-nowrap">
                        ${
                          resource.County
                            ? `<span class="badge badge-county">${Utils.escapeHtml(resource.County)}</span>`
                            : "N/A"
                        }
                    </td>
                    <td class="text-nowrap">
                        ${
                          resource["Resource Type"]
                            ? `<span class="badge badge-resource-type">${Utils.escapeHtml(resource["Resource Type"])}</span>`
                            : "N/A"
                        }
                    </td>
                    <td class="text-nowrap">
                        ${
                          resource.Category
                            ? resource.Category.split(",")
                                .map(
                                  (cat) =>
                                    `<span class="badge badge-category">${Utils.escapeHtml(cat.trim())}</span>`
                                )
                                .join(" ")
                            : "N/A"
                        }
                    </td>
                    <td class="text-nowrap">
                        ${
                          resource["Populations Served"]
                            ? resource["Populations Served"]
                                .split(",")
                                .map(
                                  (pop) =>
                                    `<span class="badge badge-population">${Utils.escapeHtml(pop.trim())}</span>`
                                )
                                .join(" ")
                            : "N/A"
                        }
                    </td>
                    <td class="text-nowrap" onclick="event.stopPropagation()">
                        ${
                          resource.Phone
                            ? `<a href="${Utils.formatPhoneUrl(resource.Phone)}" class="btn-link text-nowrap">
                                <i class="bi bi-telephone me-1"></i>${Utils.escapeHtml(resource.Phone)}
                            </a>`
                            : "N/A"
                        }
                    </td>
                    <td onclick="event.stopPropagation()">
                        ${
                          resource.Website
                            ? `<a href="${Utils.escapeHtml(resource.Website)}" target="_blank" class="btn-link text-nowrap" title="Visit Website">
                                <i class="bi bi-globe"></i> Website
                            </a>`
                            : "N/A"
                        }
                    </td>
                    <td class="text-nowrap">${Utils.escapeHtml(resource.Address || "N/A")}</td>
                    <td>${Utils.escapeHtml(resource.City || "N/A")}</td>
                    <td>${Utils.escapeHtml(resource.State || "N/A")}</td>
                    <td>${Utils.escapeHtml(resource["Zip Code"] || "N/A")}</td>
                </tr>
            `;
  }
      };

      // Card Rendering
      const CardRenderer = {
        render(data) {
          if (!data || data.length === 0) {
            DOM.cardsContainer.innerHTML = `
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-inbox me-2" style="font-size: 2rem;"></i>
                            <h5>No resources found with the current filters.</h5>
                        </div>
                    `;
            return;
          }

          DOM.cardsContainer.innerHTML = data.map((resource) => this.renderCard(resource)).join("");
        },

        renderCard(resource) {
          const resourceIdentifier = resource.ID || resource["Location Name"] || "unknown";
          const phoneUrl = Utils.formatPhoneUrl(resource.Phone) || "#";

          return `
                    <div class="card resourceCard mb-4" data-resource-id="${resourceIdentifier}">
                        <div class="row no-gutters p-0">
                            <div class="card-sidenav col-2 d-flex flex-column justify-content-between align-items-center p-0">
                                <a href="${resource.Website || "#"}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 sidenav-button" target="_blank" rel="noopener noreferrer" aria-label="Visit website for ${resource["Location Name"] || "resource"}">
                                    <i class="bi bi-globe"></i>
                                </a>
                                <a href="${phoneUrl}" class="d-flex align-items-center justify-content-center flex-grow-1 w-100 sidenav-button" aria-label="Call ${resource["Location Name"] || "resource"}">
                                    <i class="bi bi-telephone-fill"></i>
                                </a>
                                <button class="map-fly-btn d-flex align-items-center justify-content-center flex-grow-1 w-100 border-0 sidenav-button" 
                                        ${
                                          resource.Longitude && resource.Latitude
                                            ? `data-longitude="${resource.Longitude}" data-latitude="${resource.Latitude}"`
                                            : "disabled"
                                        } 
                                        data-resource-id="${resourceIdentifier}" 
                                        aria-label="View ${resource["Location Name"] || "resource"} on map"
                                        title="View on map">
                                    <i class="bi bi-geo-alt-fill"></i>
                                </button>
                            </div>
                            <div class="card-body col-10 p-4">
                                <h3 class="card-title">${Utils.escapeHtml(resource["Location Name"] || "N/A")}</h3>
                                <h5 class="text-dark">${Utils.escapeHtml(resource.Organization || "N/A")}</h5>
                                
                                <div class="mb-2">
                                    ${
                                      resource["Resource Type"]
                                        ? `<span class="card-badge">${Utils.escapeHtml(resource["Resource Type"])}</span>`
                                        : ""
                                    }
                                    ${
                                      resource.Category
                                        ? resource.Category.split(",")
                                            .map(
                                              (cat) => `<span class="card-badge">${Utils.escapeHtml(cat.trim())}</span>`
                                            )
                                            .join("")
                                        : ""
                                    }
                                </div>
                                
                                <h6>Phone: ${Utils.escapeHtml(resource.Phone || "N/A")}</h6>
                                <p>
                                    ${Utils.escapeHtml(resource.Address || "N/A")}<br>
                                    ${Utils.escapeHtml(resource.City || "N/A")}, ${Utils.escapeHtml(resource.State || "N/A")}, ${Utils.escapeHtml(resource["Zip Code"] || "N/A")}<br>
                                    ${
                                      resource["Google Maps URL"]
                                        ? `<strong><a href="${Utils.escapeHtml(resource["Google Maps URL"])}" class="text-secondary" target="_blank" rel="noopener noreferrer">Directions</a></strong>`
                                        : ""
                                    }
                                </p>
                                
                                ${
                                  resource["Populations Served"] && resource["Populations Served"].trim() !== ""
                                    ? `<h6>Populations Served:</h6>
                                    <div class="mb-2">
                                        ${(resource["Populations Served"] || "")
                                          .split(",")
                                          .map((pop) => pop.trim())
                                          .filter((pop) => pop)
                                          .map((pop) => `<span class="card-badge">${Utils.escapeHtml(pop)}</span>`)
                                          .join("")}
                                    </div>`
                                    : ""
                                }
                                <div class="row">
                                  <div class="col d-flex flex-column justify-content-start">
                                 ${resource.County
                                    ? `<h6>County:</h6>
                                    <div class="mb-2">
                                        <span class="card-badge">${Utils.escapeHtml(resource.County)}</span>
                                    </div>`
                                    : ""
                                }
                                  </div>
                                  <div class="col d-flex justify-content-end"> 
                                  ${resource.Image
                                  ? `<div class="col-md-auto d-flex justify-content-end align-items-end p-2" style="position:relative">
                                  <img class="cardImage" onerror="this.style.display='none'" src="${Utils.escapeHtml(resource.Image)}" alt="${Utils.escapeHtml(resource.Organization || resource["Location Name"] || "Resource logo")}">
                                  </div>`
                                  : ""
                                  }
                                  </div>
                                
                                </div>

                                
                                <div class="row d-flex justify-content-end position-relative">

                                </div>
                            </div>
                        </div>
                    </div>
                `;
        }
      };

      // Pagination Management
      const PaginationManager = {
        render() {
          const totalPages = Math.ceil(AppState.totalRows / AppState.recordsPerPage);

          if (totalPages <= 1) {
            DOM.pagination.innerHTML = "";
            return;
          }

          const startPage = Math.max(1, AppState.currentPage - 2);
          const endPage = Math.min(totalPages, AppState.currentPage + 2);

          let html = this.createPageButton("prev", AppState.currentPage - 1, AppState.currentPage <= 1);

          if (startPage > 1) {
            html += this.createPageButton("page", 1);
            if (startPage > 2) {
              html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
          }

          for (let i = startPage; i <= endPage; i++) {
            html += this.createPageButton("page", i, false, i === AppState.currentPage);
          }

          if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
              html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            html += this.createPageButton("page", totalPages);
          }

          html += this.createPageButton("next", AppState.currentPage + 1, AppState.currentPage >= totalPages);

          DOM.pagination.innerHTML = html;
        },

        createPageButton(type, page, disabled = false, active = false) {
          const disabledClass = disabled ? "disabled" : "";
          const activeClass = active ? "active" : "";

          if (type === "prev") {
            return `
                        <li class="page-item ${disabledClass}">
                            <a class="page-link" href="#" onclick="PaginationManager.changePage(${page})" aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
                    `;
          } else if (type === "next") {
            return `
                        <li class="page-item ${disabledClass}">
                            <a class="page-link" href="#" onclick="PaginationManager.changePage(${page})" aria-label="Next">
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    `;
          } else {
            return `
                        <li class="page-item ${activeClass}">
                            <a class="page-link" href="#" onclick="PaginationManager.changePage(${page})">${page}</a>
                        </li>
                    `;
          }
        },

        changePage(page) {
          const totalPages = Math.ceil(AppState.totalRows / AppState.recordsPerPage);
          if (page < 1 || page > totalPages) return;

          AppState.currentPage = page;
          DataManager.loadData();
        }
      };

      // Map Interaction Management
      const MapInteraction = {
        flyToLocation(longitude, latitude, resourceId) {
          if (!AppState.map || !longitude || !latitude) {
            console.warn("Cannot fly to location: missing map or coordinates");
            return;
          }

          const lng = parseFloat(longitude);
          const lat = parseFloat(latitude);

          if (isNaN(lng) || isNaN(lat)) {
            console.warn("Invalid coordinates provided");
            return;
          }

          // Show feedback to user
          this.showMapFlyFeedback();

          // Fly to the location
          AppState.map.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 1500, // Animation duration in milliseconds
            essential: true // Animation is considered essential for accessibility
          });

          // Find and open the corresponding marker popup
          setTimeout(() => {
            const marker = MapManager.markerMap.get(resourceId);
            if (marker) {
              marker.togglePopup();
              // Ensure popup is open
              if (!marker.getPopup().isOpen()) {
                marker.togglePopup();
              }
            }
          }, 800); // Delay to allow fly animation to start
        },

        showMapFlyFeedback() {
          // Create temporary notification
          const notification = document.createElement("div");
          notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #55298a;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 6px;
                    z-index: 9999;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    animation: slideIn 0.3s ease-out;
                `;
          notification.innerHTML = `
                    <i class="bi bi-geo-alt-fill me-2"></i>
                    Flying to location on map...
                `;

          // Add slide-in animation
          const style = document.createElement("style");
          style.textContent = `
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
          document.head.appendChild(style);

          document.body.appendChild(notification);

          // Remove notification after 2 seconds
          setTimeout(() => {
            notification.style.animation = "slideIn 0.3s ease-out reverse";
            setTimeout(() => {
              document.body.removeChild(notification);
              document.head.removeChild(style);
            }, 300);
          }, 2000);
        },

        handleTableRowClick(event) {
          // Don't trigger if clicking on links or buttons
          if (event.target.closest("a, button") || event.target.onclick) {
            return;
          }

          const row = event.target.closest("tr.table-row-clickable");
          if (!row) return;

          const longitude = row.dataset.longitude;
          const latitude = row.dataset.latitude;
          const resourceId = row.dataset.resourceId;

          if (longitude && latitude) {
            this.flyToLocation(longitude, latitude, resourceId);
          }
        },

        handleMapFlyButtonClick(event) {
          event.preventDefault();
          event.stopPropagation();

          const button = event.target.closest(".map-fly-btn");
          if (!button || button.disabled) return;

          const longitude = button.dataset.longitude;
          const latitude = button.dataset.latitude;
          const resourceId = button.dataset.resourceId;

          if (longitude && latitude) {
            this.flyToLocation(longitude, latitude, resourceId);
          }
        }
      };

      const MapManager = {
        markerMap: new Map(), // Track markers by ID for reuse

        initialize() {
          AppState.map = new maplibregl.Map({
            container: "map",
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${CONFIG.MAPTILER_API_KEY}`,
            center: [-75.1652, 39.9526], // Philadelphia center
            zoom: 9,
            pitch: 45,
            bearing: -17.6
          });

          
          AppState.map.addControl(new maplibregl.NavigationControl(), "top-right");
        },

        async updateMarkers() {
          try {
            // Use current data from the table instead of separate API call
            const markerData = this.processDataForMap(AppState.currentData);

            if (!markerData || markerData.length === 0) {
              this.clearAllMarkers();
              this.centerOnPhiladelphia();
              return;
            }

            // Get current marker IDs
            const currentMarkerIds = new Set(this.markerMap.keys());
            const newMarkerIds = new Set(markerData.map((d) => d.id).filter(Boolean));

            // Remove markers that are no longer needed
            currentMarkerIds.forEach((id) => {
              if (!newMarkerIds.has(id)) {
                const marker = this.markerMap.get(id);
                marker.remove();
                this.markerMap.delete(id);
              }
            });

            const bounds = new maplibregl.LngLatBounds();
            let hasValidBounds = false;

            // Add or update markers
            markerData.forEach((location) => {
              let marker = this.markerMap.get(location.id);
              const popup = this.createPopup(location);

              if (marker) {
                // Update existing marker position and popup
                marker.setLngLat([location.lng, location.lat]);
                marker.setPopup(popup);
              } else {
                // Create new marker
                marker = new maplibregl.Marker({ color: "#55298a" })
                  .setLngLat([location.lng, location.lat])
                  .setPopup(popup)
                  .addTo(AppState.map);
                this.markerMap.set(location.id, marker);
              }

              bounds.extend([location.lng, location.lat]);
              hasValidBounds = true;
            });

            // Fit map to markers only if we have valid bounds
            if (hasValidBounds) {
              if (markerData.length === 1) {
                AppState.map.flyTo({
                  center: [markerData[0].lng, markerData[0].lat],
                  zoom: 12
                });
              } else {
                AppState.map.fitBounds(bounds, {
                  padding: 50,
                  maxZoom: 15
                });
              }
            }
          } catch (error) {
            console.error("Error updating map markers:", error);
            this.centerOnPhiladelphia();
          }
        },

        clearAllMarkers() {
          this.markerMap.forEach((marker) => marker.remove());
          this.markerMap.clear();
        },

        processDataForMap(data) {
          if (!data || !Array.isArray(data)) return [];

          return data
            .map((record) => {
              const lat = parseFloat(record.Latitude);
              const lon = parseFloat(record.Longitude);

              // Skip records without valid coordinates
              if (isNaN(lat) || isNaN(lon)) {
                return null;
              }

              return {
                id: record.ID || record["Location Name"] || Math.random().toString(36),
                lat: lat,
                lng: lon,
                name: record["Location Name"] || "N/A",
                organization: record.Organization || "N/A",
                address: record.Address || "N/A",
                city: record.City || "N/A",
                state: record.State || "N/A",
                zipCode: record["Zip Code"] || "N/A",
                phone: record.Phone || null,
                website: record.Website || null,
                googleMapsUrl: record["Google Maps URL"] || null
              };
            })
            .filter((marker) => marker !== null);
        },

        createPopup(location) {
          const popupContent = `
                    <div class="map-popup-container" style="max-width: 300px;">
                        <div class="row no-gutters py-0 px-1">
                            <div class="card-body col-12 p-3">
                                <h3 class="text-secondary fw-bold lh-1 py-0">${location.name}</h3>
                                <h5 class="text-dark fw-light lh-1 py-0">${location.organization}</h5>
                                <p class="text-body-tertiary lh-1 py-0 mb-1">${location.address}<br />
                                    ${location.city}, ${location.state}, ${location.zipCode}
                                </p>
                                <p class="mb-0">
                                    ${location.googleMapsUrl ? `<a class="text-primary fw-bold d-block mb-1" href="${location.googleMapsUrl}" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt-fill"></i> Directions</a>` : ""}
                                    ${location.website ? `<a class="text-primary d-block mb-1" href="${location.website}" target="_blank" rel="noopener noreferrer"><i class="bi bi-globe"></i> Website</a>` : ""}
                                    ${location.phone ? `<a class="text-primary text-decoration-none fw-bold d-block" href="tel:${location.phone}"><i class="bi bi-telephone-fill text-primary"></i> ${location.phone}</a>` : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>`;

          return new maplibregl.Popup({ offset: 25, maxWidth: "320px" }).setHTML(popupContent);
        },

        centerOnPhiladelphia() {
          AppState.map.flyTo({
            center: [-75.1652, 39.9526],
            zoom: 9
          });
        }
      };

      // Column Resizing
      const ColumnResizer = {
        initialize() {
          const headers = document.querySelectorAll("thead th");

          headers.forEach((header) => {
            const resizeHandle = document.createElement("div");
            resizeHandle.className = "resize-handle";
            resizeHandle.title = "Drag to resize column";
            header.appendChild(resizeHandle);

            this.setupResizeHandlers(header, resizeHandle);
          });
        },

        setupResizeHandlers(header, resizeHandle) {
          let isResizing = false;
          let startX = 0;
          let startWidth = 0;

          resizeHandle.addEventListener("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();

            isResizing = true;
            startX = e.clientX;
            startWidth = header.offsetWidth;

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
            header.style.borderRight = "2px solid #20cb98";

            document.addEventListener("selectstart", this.preventSelection);
          });

          document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;

            e.preventDefault();
            const diff = e.clientX - startX;
            const newWidth = Math.max(80, startWidth + diff);

            header.style.width = newWidth + "px";
            header.style.minWidth = newWidth + "px";
            header.style.maxWidth = newWidth + "px";
          });

          document.addEventListener("mouseup", () => {
            if (isResizing) {
              isResizing = false;

              document.body.style.cursor = "";
              document.body.style.userSelect = "";
              header.style.borderRight = "1px solid rgba(255, 255, 255, 0.2)";

              document.removeEventListener("selectstart", this.preventSelection);
            }
          });

          resizeHandle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        },

        preventSelection(e) {
          e.preventDefault();
          return false;
        }
      };

      // Sorting
      const SortManager = {
        initialize() {
          document.querySelectorAll("th.sortable").forEach((th) => {
            th.addEventListener("click", (e) => {
              if (!e.target.closest(".filter-dropdown") && !e.target.closest(".resize-handle")) {
                this.handleSort(th.dataset.column);
              }
            });
          });
        },

        handleSort(column) {
          if (AppState.currentSort === column) {
            AppState.sortDirection = AppState.sortDirection === "asc" ? "desc" : "asc";
          } else {
            AppState.currentSort = column;
            AppState.sortDirection = "asc";
          }

          this.updateSortIndicators();
          AppState.currentPage = 1;
          DataManager.loadData();
        },

        updateSortIndicators() {
          document.querySelectorAll("th.sortable").forEach((th) => {
            th.classList.remove("sort-asc", "sort-desc");
          });

          const sortedTh = document.querySelector(`th[data-column="${AppState.currentSort}"]`);
          if (sortedTh) {
            sortedTh.classList.add(AppState.sortDirection === "asc" ? "sort-asc" : "sort-desc");
          }
        },

        clearSort() {
          AppState.currentSort = "";
          AppState.sortDirection = "asc";
          document.querySelectorAll("th.sortable").forEach((th) => {
            th.classList.remove("sort-asc", "sort-desc");
          });
        }
      };

      // Export functionality
      const ExportManager = {
        exportToCSV() {
          if (AppState.currentData.length === 0) return;

          const headers = [
            "Location Name",
            "Organization",
            "County",
            "Resource Type",
            "Category",
            "Populations Served",
            "Phone",
            "Website",
            "Address",
            "City",
            "State",
            "Zip Code"
          ];

          const csvContent = [
            headers.join(","),
            ...AppState.currentData.map((resource) => {
              return headers
                .map((header) => {
                  const value = resource[header] || "";
                  return `"${String(value).replace(/"/g, '""')}"`;
                })
                .join(",");
            })
          ].join("\n");

          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);

          link.setAttribute("href", url);
          link.setAttribute("download", `resources_export_${new Date().toISOString().split("T")[0]}.csv`);
          link.style.visibility = "hidden";

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };

      // County Card Management - UPDATED
      const CountyCardManager = {
        initialize() {
          this.setupEventListeners();
        },

        setupEventListeners() {
          // Add event listeners to county cards
          document.addEventListener('click', (e) => {
            const countyCard = e.target.closest('.county-card');
            if (countyCard) {
              e.preventDefault();
              this.handleCountyCardClick(countyCard);
            }
          });

          // Add event listener for "See all Counties" link
          const allCountiesLink = document.getElementById('allCounties');
          if (allCountiesLink) {
            allCountiesLink.addEventListener('click', (e) => {
              e.preventDefault();
              this.handleSeeAllCountiesClick();
            });
          }
        },

        handleCountyCardClick(card) {
          const county = card.dataset.county;
          if (!county) return;

          // Clear existing county filters and add the selected one
          AppState.activeFilters.County = [county];

          // Reset search
          AppState.activeFilters.search = "";
          DOM.searchInput.value = "";

          // Reset to first page
          AppState.currentPage = 1;

          // Clear cache to ensure fresh data
          APIClient.clearCache();

          // Update all filter UI components
          FilterManager.syncDropdowns('County');
          FilterManager.updateUI();

          // Hide the county search section
          this.hideCountySearch();

          // Show the results section
          ResultsManager.showResultsSection();

          // Load filtered data
          DataManager.loadData();
        },

        handleSeeAllCountiesClick() {
          // Clear all filters
          AppState.activeFilters = {
            search: "",
            County: [],
            "Resource Type": [],
            "Populations Served": [],
            Category: []
          };

          DOM.searchInput.value = "";

          // Reset to first page
          AppState.currentPage = 1;

          // Clear cache
          APIClient.clearCache();

          // Update filter UI
          FilterManager.clearAll();

          // Hide county search section
          this.hideCountySearch();

          // Show results section
          ResultsManager.showResultsSection();

          // Load all data
          DataManager.loadData();
        },

        hideCountySearch() {
          const countySearchSection = document.getElementById('countySearch');
          if (countySearchSection) {
            countySearchSection.style.display = 'none';
          }
        },

        showCountySearch() {
          const countySearchSection = document.getElementById('countySearch');
          if (countySearchSection) {
            countySearchSection.style.display = 'block';
          }
          
          // Hide results section when showing county search
          ResultsManager.hideResultsSection();
        }
      };

      // Event Handlers - UPDATED WITH CATEGORY LINK FUNCTIONALITY
      const EventHandlers = {
        initialize() {
          // Search
          DOM.searchBtn.addEventListener("click", this.handleSearch);
          DOM.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent form submission
              this.handleSearch();
            }
          });

          // Debounced search on input (but only show results on explicit search)
          DOM.searchInput.addEventListener(
            "input",
            Utils.debounce(() => {
              // Only update if results are already visible
              const resultsSection = document.getElementById('results');
              if (resultsSection && resultsSection.classList.contains('show')) {
                this.handleSearch();
              }
            }, CONFIG.DEBOUNCE_DELAY)
          );

          // Other controls
          DOM.perPageSelect.addEventListener("change", this.handlePerPageChange);
          DOM.clearFiltersBtn.addEventListener("click", this.handleClearFilters);
          DOM.exportBtn.addEventListener("click", () => ExportManager.exportToCSV());

          // Map interaction event listeners using event delegation
          document.addEventListener("click", (e) => {
            // Handle table row clicks
            if (e.target.closest("tr.table-row-clickable")) {
              MapInteraction.handleTableRowClick(e);
            }

            // Handle map fly button clicks
            if (e.target.closest(".map-fly-btn")) {
              MapInteraction.handleMapFlyButtonClick(e);
            }

            // Prevent Bootstrap dropdowns from closing when clicking checkboxes
            if (e.target.closest(".dropdown-item-check")) {
              e.stopPropagation();
            }
          });

          // Category link handler - NEW FUNCTIONALITY
          document.addEventListener('click', (e) => {
            const categoryLink = e.target.closest('[data-category]');
            if (categoryLink) {
              e.preventDefault();
              this.handleCategoryLinkClick(categoryLink);
            }
          });

          // Mobile filter toggle
          const mobileFilterToggleBtn = document.getElementById("mobile-filter-toggle-btn");
          const filterControlsContainer = document.getElementById("filter-controls-container");

          if (mobileFilterToggleBtn && filterControlsContainer) {
            mobileFilterToggleBtn.addEventListener("click", () => {
              filterControlsContainer.classList.toggle("show");

              // Update button text and icon
              const isShown = filterControlsContainer.classList.contains("show");

              if (isShown) {
                mobileFilterToggleBtn.innerHTML = '<i class="bi bi-funnel-fill me-1"></i>Hide Filters';
              } else {
                mobileFilterToggleBtn.innerHTML = '<i class="bi bi-funnel me-1"></i>Filters';
              }
            });
          }

          // Initialize county card manager
          CountyCardManager.initialize();
        },

        handleSearch() {
          AppState.activeFilters.search = DOM.searchInput.value.trim();
          AppState.currentPage = 1;

          // Clear cache when search changes
          APIClient.clearCache();

          // Show results section when search is performed
          ResultsManager.showResultsSection();

          // Hide county search section
          CountyCardManager.hideCountySearch();

          FilterManager.updateFilterChips();
          DataManager.loadData();
        },

        handlePerPageChange() {
          AppState.recordsPerPage = parseInt(DOM.perPageSelect.value);
          AppState.currentPage = 1;
          DataManager.loadData();
        },

        handleClearFilters() {
          FilterManager.clearAll();
          SortManager.clearSort();
          AppState.currentPage = 1;
          
          // Show county search section when filters are cleared
          CountyCardManager.showCountySearch();
          
          // Don't automatically load data - let user choose again
        },

        // NEW METHOD FOR CATEGORY LINKS
        handleCategoryLinkClick(element) {
          const category = element.dataset.category;
          if (!category) return;

          // Clear existing filters and set the category filter
          AppState.activeFilters = {
            search: "",
            County: [],
            "Resource Type": [],
            "Populations Served": [],
            Category: [category] // Set the specific category
          };

          // Clear search input
          DOM.searchInput.value = "";

          // Reset to first page
          AppState.currentPage = 1;

          // Clear cache to ensure fresh data
          APIClient.clearCache();

          // Update all filter UI components
          FilterManager.syncDropdowns('Category');
          FilterManager.updateUI();

          // Hide the county search section
          CountyCardManager.hideCountySearch();

          // Show the results section
          ResultsManager.showResultsSection();

          // Load filtered data
          DataManager.loadData();
        }
      };

      // Application Initialization - UPDATED
      async function initializeApp() {
        try {
          // Initialize DOM cache
          DOM.init();

          // Initialize components
          ViewManager.initialize();
          MapManager.initialize();
          ColumnResizer.initialize();
          SortManager.initialize();
          EventHandlers.initialize();

          // Load filter options but DON'T load data automatically
          await FilterManager.loadFilterOptions();
          
          // Don't call DataManager.loadData() here anymore
          console.log("Application initialized. Awaiting user interaction to show results.");
          
        } catch (error) {
          console.error("Failed to initialize application:", error);
          Utils.hideLoading();
          // Don't show error in results since results are hidden
          console.error("Failed to initialize application");
        }
      }

      // Start the application
      document.addEventListener("DOMContentLoaded", initializeApp);

      // Expose necessary functions to global scope for onclick handlers
      window.PaginationManager = PaginationManager;
      window.FilterManager = FilterManager;
      window.CountyCardManager = CountyCardManager;
      window.ResultsManager = ResultsManager;