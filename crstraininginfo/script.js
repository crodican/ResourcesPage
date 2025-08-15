        // Global variables
        let filteredData = [...emailData];
        let currentSort = { field: null, direction: 'asc' };

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            updateStatistics();
            renderTable();
            setupEventListeners();
        });

        // Update statistics based on current filtered data
        function updateStatistics() {
            const total = filteredData.length;
            const inquiries = filteredData.filter(email => email.isInquiry).length;
            const staffResponses = filteredData.filter(email => email.isStaffResponse).length;
            const counties = new Set(filteredData.map(email => email.county).filter(county => county !== 'Unknown')).size;

            document.getElementById('totalEmails').textContent = total;
            document.getElementById('trainingInquiries').textContent = inquiries;
            document.getElementById('staffResponses').textContent = staffResponses;
            document.getElementById('uniqueCounties').textContent = counties;
            document.getElementById('resultCount').textContent = `Showing ${total} of ${emailData.length} emails`;
        }

        // Render the table with current filtered data
        function renderTable() {
            const tbody = document.getElementById('emailTableBody');
            const noResultsCard = document.getElementById('noResultsCard');

            if (filteredData.length === 0) {
                tbody.innerHTML = '';
                noResultsCard.classList.remove('d-none');
                return;
            }

            noResultsCard.classList.add('d-none');

            tbody.innerHTML = filteredData.map((email, index) => `
                <tr class="email-row" data-email-index="${index}" onclick="toggleEmailBody(${index})">
                    <td class="fw-semibold">
                        <i class="bi bi-chevron-right expand-icon" id="icon-${index}"></i>
                        ${escapeHtml(email.name || 'Unknown')}
                    </td>
                    <td class="small">${escapeHtml(email.email || 'No email')}</td>
                    <td class="text-nowrap">${email.date}</td>
                    <td class="text-nowrap">${email.time}</td>
                    <td><span class="badge county-${(email.county || 'other').toLowerCase()} text-white">${email.county || 'Other'}</span></td>
                    <td class="fw-medium">${escapeHtml(email.subject)}</td>
                    <td class="small">${escapeHtml(email.summary)}</td>
                </tr>
                <tr class="email-body-row d-none" id="body-${index}">
                    <td colspan="7">
                        <div class="email-body-content">
                            <strong>Email Body:</strong><br><br>
                            ${escapeHtml(email.body || 'No email body available.')}
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Toggle email body display
        function toggleEmailBody(index) {
            const bodyRow = document.getElementById(`body-${index}`);
            const icon = document.getElementById(`icon-${index}`);
            const emailRow = document.querySelector(`[data-email-index="${index}"]`);

            if (bodyRow.classList.contains('d-none')) {
                // Expand
                bodyRow.classList.remove('d-none');
                icon.classList.add('expanded');
                emailRow.classList.add('expanded-row');

                // Scroll to the expanded content
                setTimeout(() => {
                    bodyRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            } else {
                // Collapse
                bodyRow.classList.add('d-none');
                icon.classList.remove('expanded');
                emailRow.classList.remove('expanded-row');
            }
        }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Setup event listeners
        function setupEventListeners() {
            // Search functionality
            const searchInput = document.getElementById('searchInput');
            const clearSearch = document.getElementById('clearSearch');

            searchInput.addEventListener('input', handleSearch);
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                handleSearch();
            });

            // County filter checkboxes
            document.querySelectorAll('.county-filter').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        selectedCounties.add(e.target.value);
                    } else {
                        selectedCounties.delete(e.target.value);
                    }
                    handleCountyFilter();
                });
            });
        }

        // Handle search functionality
        function handleSearch() {
            handleCountyFilter(); // This now handles both search and county filtering
        }

        // Handle sorting functionality
        function handleSort(field) {
            // Determine sort direction
            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            
            applySorting(field, currentSort.direction);
            updateSortIcons(field, currentSort.direction);
            renderTable();
        }

        // Apply sorting to filtered data
        function applySorting(field, direction) {
            filteredData.sort((a, b) => {
                let aVal = a[field];
                let bVal = b[field];
                
                // Special handling for date sorting
                if (field === 'date') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                // Special handling for time sorting
                else if (field === 'time') {
                    aVal = convertTo24Hour(aVal);
                    bVal = convertTo24Hour(bVal);
                }
                // String comparison for other fields
                else {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                }
                
                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Convert 12-hour time to 24-hour for sorting
        function convertTo24Hour(time12h) {
            const [time, modifier] = time12h.split(' ');
            let [hours, minutes] = time.split(':');
            if (hours === '12') {
                hours = '00';
            }
            if (modifier === 'PM') {
                hours = parseInt(hours, 10) + 12;
            }
            return `${hours}:${minutes}`;
        }

        // Update sort icons in table headers
        function updateSortIcons(activeField, direction) {
            // Reset all icons
            document.querySelectorAll('.sort-icon').forEach(icon => {
                icon.className = 'bi bi-arrow-up-down sort-icon';
            });
            
            // Set active icon
            const activeHeader = document.querySelector(`[data-sort="${activeField}"] .sort-icon`);
            if (activeHeader) {
                activeHeader.className = direction === 'asc' 
                    ? 'bi bi-arrow-up sort-icon sort-active'
                    : 'bi bi-arrow-down sort-icon sort-active';
            }
        }

        // Global variable for county filters
        let selectedCounties = new Set(['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill', 'Other']);

        // Sort column function
        function sortColumn(field, direction) {
            currentSort = { field, direction };
            applySorting(field, direction);
            renderTable();
        }

        // County filter functions
        function selectAllCounties() {
            selectedCounties = new Set(['Philadelphia', 'Berks', 'Bucks', 'Chester', 'Delaware', 'Lancaster', 'Montgomery', 'Schuylkill', 'Other']);
            document.querySelectorAll('.county-filter').forEach(checkbox => checkbox.checked = true);
            handleCountyFilter();
        }

        function deselectAllCounties() {
            selectedCounties = new Set();
            document.querySelectorAll('.county-filter').forEach(checkbox => checkbox.checked = false);
            handleCountyFilter();
        }

        function handleCountyFilter() {
            // Get current search term
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

            // Start with all data or search-filtered data
            let dataToFilter = searchTerm ? 
                emailData.filter(email => 
                    (email.name || '').toLowerCase().includes(searchTerm) ||
                    (email.email || '').toLowerCase().includes(searchTerm) ||
                    email.subject.toLowerCase().includes(searchTerm) ||
                    email.summary.toLowerCase().includes(searchTerm) ||
                    email.county.toLowerCase().includes(searchTerm)
                ) : [...emailData];

            // Apply county filter
            filteredData = dataToFilter.filter(email => {
                const county = email.county || 'Other';
                return selectedCounties.has(county) || selectedCounties.has('Other') && county === 'Unknown';
            });

            // Reapply current sort if any
            if (currentSort.field) {
                applySorting(currentSort.field, currentSort.direction);
            }

            updateStatistics();
            renderTable();
        }

        // Download CSV functionality
        function downloadCSV() {
            let csv = 'NAME,EMAIL,DATE,TIME,COUNTY,SUBJECT,AI SUMMARY OF EMAIL\n';

            filteredData.forEach(email => {
                const row = [
                    `"${(email.name || 'Unknown').replace(/"/g, '""')}"`,
                    `"${(email.email || 'No email').replace(/"/g, '""')}"`,
                    email.date,
                    email.time,
                    email.county || 'Other',
                    `"${email.subject.replace(/"/g, '""')}"`,
                    `"${email.summary.replace(/"/g, '""')}"`
                ];
                csv += row.join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'crs_training_emails_filtered.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }