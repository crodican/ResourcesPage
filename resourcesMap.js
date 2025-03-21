document.addEventListener('DOMContentLoaded', function () {
    // This event listener ensures that the code inside this function
    // runs after the HTML document has been fully loaded and parsed.

    // Get the map container element from the DOM using its ID.
    // If the map container is not found, this will return null.
    const mapContainer = document.getElementById('map');

    // Check if the mapContainer element exists.
    // This check is essential to prevent errors if the map is not
    // intended to be displayed on the current page.
    if (mapContainer) {
        // If the mapContainer exists, initialize the map
        // by calling the initMap function and passing the jsonData.
        // jsonData is assumed to be defined globally (e.g., loaded from
        // an external script).
        initMap(jsonData);
    }
});

/**
 * Initializes a MapLibre GL JS map and adds markers for resources.
 *
 * @param {Array} resources - An array of resource objects, each containing
 * latitude, longitude, and other resource details.
 */
function initMap(resources) {
    // Create a new MapLibre GL JS map instance.
    // The map is initialized with a container, style, center, and zoom level.
    const map = new maplibregl.Map({
        container: 'map', // The ID of the container element.
        style: 'https://demotiles.maplibre.org/style.json', // The map style URL.
        center: [-75.1299, 40.3101], // Initial center coordinates (longitude, latitude).
        zoom: 8 // Initial zoom level.
    });

    // Filter the resources array to include only resources with valid
    // latitude and longitude values.
    const validResources = resources.filter(resource =>
        // Check if Latitude and Longitude properties exist and are not null.
        resource.Latitude && resource.Longitude &&
        // Check if Latitude and Longitude can be parsed as valid numbers.
        !isNaN(parseFloat(resource.Latitude)) && !isNaN(parseFloat(resource.Longitude))
    );

    // Iterate through the valid resources and create markers for each.
    validResources.forEach(resource => {
        // Create a new MapLibre GL JS marker instance.
        const marker = new maplibregl.Marker()
            // Set the longitude and latitude of the marker using the resource's
            // Longitude and Latitude values, parsed as floats.
            .setLngLat([parseFloat(resource.Longitude), parseFloat(resource.Latitude)])
            // Add the marker to the map.
            .addTo(map);

        // Optional: Add a popup to the marker that displays resource information.
        marker.setPopup(new maplibregl.Popup().setHTML(
            `<h3>${resource["Location Name"]}</h3>
            <p>${resource.Organization}</p>
            <p>${resource.Address}, ${resource.City}, ${resource.State} ${resource["Zip Code"]}</p>
            <p>Phone: ${resource.Phone}</p>`
        ));
    });

    // Adjust the map's bounds to fit all markers.
    if (validResources.length > 0) {
        // Create a new LngLatBounds instance to hold the bounds of the markers.
        const bounds = new maplibregl.LngLatBounds();

        // Iterate through the valid resources and extend the bounds to include
        // each marker's coordinates.
        validResources.forEach(resource => {
            bounds.extend([parseFloat(resource.Longitude), parseFloat(resource.Latitude)]);
        });

        // Fit the map's viewport to the calculated bounds with a padding of 50 pixels.
        map.fitBounds(bounds, { padding: 50 });
    }
}