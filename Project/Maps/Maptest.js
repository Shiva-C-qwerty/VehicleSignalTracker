// Function to fetch fuel station locations in Chennai
function fetchFuelStations() {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    const request = {
        location: new google.maps.LatLng(13.0827, 80.2707), // Chennai coordinates
        radius: 20000, // Search radius (in meters)
        keyword: 'fuel station', // Search keyword
        type: 'gas_station' // Search type
    };

    // Perform nearby search request
    service.nearbySearch(request, processResults);
}

// Process the results of the nearby search
function processResults(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Create an array to store the fuel station details
        const fuelStations = [];

        // Iterate through the results and extract the latitude and longitude
        for (let i = 0; i < results.length; i++) {
            const place = results[i];
            const latLng = {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
            };
            fuelStations.push(latLng);
        }

        // Convert the fuel station details to JSON
        const json = JSON.stringify(fuelStations);

        // Create a Blob from the JSON data
        const blob = new Blob([json], { type: 'application/json' });

        // Create a temporary URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a link to download the JSON file
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fuel_stations.json';
        link.click();

        // Clean up the temporary URL
        URL.revokeObjectURL(url);
    }
}

// Call the fetchFuelStations function to initiate the search
fetchFuelStations();
