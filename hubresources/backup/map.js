document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    const loadingMessageMap = document.createElement('div');
    loadingMessageMap.textContent = 'Loading map data...';
    if (mapContainer) {
        mapContainer.appendChild(loadingMessageMap);
    }
    let map;
    const markers = [];
    let locationsData = [];
    let mapInstance; // To hold the map instance
    let mapMarkers = []; // To hold the markers

    map = new maplibregl.Map({
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-75.347468, 40.104172],
        zoom: 9.5,
        container: 'map',
        attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({
        customAttribution: 'Your Custom Attribution Text Here'
    }), 'bottom-right');

    fetch('https://resourcesdatabaseproxy.crodican.workers.dev/?limit=999999')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            loadingMessageMap.style.display = 'none';

            if (data && Array.isArray(data.list)) {
                locationsData = data.list;

                locationsData.forEach((resource, index) => {
                    const popupContent = `
                        <div style="transform:scale(0.8);transform:translate(-15px,0)" class="map-popup text-bg-white br-5-5-5-5 mb-5" style="max-width: 300px">
                            <div class="row no-gutters py-0 px-1">
                                <div class="card-body col-10 px-4 pt-4 pb-0">
                                    <h3 class="text-secondary fw-bold lh-1 py-0">${resource['Location Name'] || 'N/A'}</h3>
                                    <h5 class="text-dark fw-light lh-1 py-0">${resource.Organization || 'N/A'}</h5>
                                    <p class="text-body-tertiary lh-1 py-0">${resource.Address || 'N/A'}
                                        <br /> ${resource.City || 'N/A'}, ${resource.State || 'N/A'}, ${resource['Zip Code'] || 'N/A'}</p>
                                        <p><a class="text-primary fw-bold pt-3" href="${resource['Google Maps URL'] || '#'}" class="text-secondary" target="_blank"><i class="bi bi-geo-alt-fill"></i>  Directions</a>
                                        <br /><a class="text-primary" href="${resource.Website || '#'}" target="_blank"><i class="bi bi-globe"></i>  Website</a>
                                        <br /><a class="text-primary text-decoration-none fw-bold" href="${resource['Phone URL'] || '#'}"><i class="bi bi-telephone-fill text-primary"></i> ${resource.Phone || 'N/A'}</a></p>
                                </div>
                            </div>
                        </div>
                        `;

                    const popup = new maplibregl.Popup({ offset: 25 })
                        .setHTML(popupContent);

                    const markerElement = document.createElement('div');
                    markerElement.className = 'custom-marker';

                    const marker = new maplibregl.Marker(markerElement)
                        .setLngLat([parseFloat(resource.Longitude), parseFloat(resource.Latitude)])
                        .setPopup(popup)
                        .addTo(map);

                    markers.push({ marker: marker, index: index, resourceId: resource.Id });
                });

                if (locationsData.length > 0) {
                    const bounds = new maplibregl.LngLatBounds();
                    locationsData.forEach(resource => bounds.extend([parseFloat(resource.Longitude), parseFloat(resource.Latitude)]));
                    map.fitBounds(bounds, { padding: 50 });
                }
            } else {
                console.error('Error: Fetched data does not contain a valid list of locations:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
            loadingMessageMap.style.display = 'none';
        });

    mapInstance = map;
    mapMarkers = markers;

    function focusMapOnResourceAndOpenPopup(longitude, latitude, resourceIndex) {
        if (mapInstance) {
            mapInstance.flyTo({
                center: [parseFloat(longitude), parseFloat(latitude)],
                zoom: 14,
                essential: true
            });

            // Find the corresponding marker and open its popup
            const foundMarker = mapMarkers.find(markerInfo => markerInfo.resourceId === locationsData[resourceIndex]?.Id);
            if (foundMarker) {
                foundMarker.marker.togglePopup();
            } else {
                console.warn('Marker not found for resource index:', resourceIndex);
            }
        } else {
            console.warn('Map instance not yet initialized.');
        }
    }

    // Add event listeners to the links
    document.querySelectorAll('a[data-longitude][data-latitude]').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const longitude = link.getAttribute('data-longitude');
            const latitude = link.getAttribute('data-latitude');
            const index = link.getAttribute('data-index');
            focusMapOnResourceAndOpenPopup(longitude, latitude, index);
        });
    });

    // Keep the existing marker click behavior
    markers.forEach(item => {
        item.marker.on('click', () => {
            markers.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.marker.getPopup().remove();
                }
            });
        });
    });
});

function focusMapOnResource(longitude, latitude) {
    if (mapInstance) {
        mapInstance.flyTo({
            center: [parseFloat(longitude), parseFloat(latitude)],
            zoom: 14,
            essential: true
        });
    } else {
        console.warn('Map instance not yet initialized.');
    }
}
