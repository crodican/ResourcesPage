const apiBaseUrl = 'https://resourcesdatabaseproxy.crodican.workers.dev/';
const resourceListDiv = document.getElementById('resourceList');

async function fetchAndDisplayResources() {
    try {
        const response = await fetch(apiBaseUrl);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            resourceListDiv.innerHTML = '<div class="alert alert-danger">Failed to load resources.</div>';
            return;
        }
        const data = await response.json();
        displayResources(data.list); // Assuming your API returns a 'list' array
    } catch (error) {
        console.error('Error fetching resources:', error);
        resourceListDiv.innerHTML = '<div class="alert alert-danger">Failed to load resources.</div>';
    }
}

function displayResources(resources) {
    resourceListDiv.innerHTML = '';
    if (resources && resources.length > 0) {
        resources.forEach(resource => {
            const card = `
                <div class="card">
                    <h5 class="card-title">${resource['Location Name'] || 'No Name'}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${resource.Organization || 'No Organization'}</h6>
                    <p class="card-text">
                        <strong>County:</strong> ${resource.County || 'N/A'}<br>
                        <strong>Type:</strong> ${resource['Resource Type'] || 'N/A'}<br>
                        <strong>Category:</strong> ${resource.Category || 'N/A'}
                    </p>
                    ${resource.Website ? `<a href="${resource.Website}" class="btn btn-primary btn-sm" target="_blank">Website</a>` : ''}
                    ${resource['Phone URL'] ? `<a href="${resource['Phone URL']}" class="btn btn-info btn-sm ms-2">Call</a>` : (resource.Phone ? `<a href="tel:${resource.Phone}" class="btn btn-info btn-sm ms-2">Call ${resource.Phone}</a>` : '')}
                </div>
            `;
            resourceListDiv.innerHTML += card;
        });
    } else {
        resourceListDiv.innerHTML = '<div class="alert alert-info">No resources found.</div>';
    }
}

// Call the function to fetch and display resources when the page loads
window.onload = fetchAndDisplayResources;