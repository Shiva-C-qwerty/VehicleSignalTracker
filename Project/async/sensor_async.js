const fs = require('fs');
const { calculateEuclideanDistance } = require('../utils');
const EventEmitter = require('events');

// Function to generate a random floating-point number within a given range
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

const chennaiBoundingBox = {
    minLatitude: 13.0500,
    maxLatitude: 13.3000,
    minLongitude: 80.1500,
    maxLongitude: 80.2700
};

function findNearestFuelStation(carLocation) {
    const fuelStations = JSON.parse(fs.readFileSync('../fuelStationLocations.json', 'utf8'));

    let nearestFuelStation = null;
    let minDistance = Infinity;

    for (const station of fuelStations) {
        const distance = calculateEuclideanDistance(carLocation, station);

        if (distance < minDistance) {
        minDistance = distance;
        nearestFuelStation = station;
        }
    }

    return nearestFuelStation;
}

// Function to simulate the sensor reading and saving data
class Sensor extends EventEmitter {
    async simulateSensor(carId) {
        try {
        // Read the existing car data from the JSON file
        const fileData = await fs.promises.readFile('../carData.json', 'utf8');
        let jsonData = [];

        try {
            jsonData = JSON.parse(fileData);
        } catch (parseError) {
            console.error('Error parsing carData.json:', parseError);
            return;
        }
        
        // Find the car data in the JSON array by car ID
        const carData = jsonData.find((car) => car.carId === carId);

        if (!carData) {
            const lat = getRandomFloat(chennaiBoundingBox.minLatitude, chennaiBoundingBox.maxLatitude);
            const longi = getRandomFloat(chennaiBoundingBox.minLongitude, chennaiBoundingBox.maxLongitude);
            // If the car data does not exist, create new data with initial fuel level
            const location = {
            latitude: lat,
            longitude: longi
            };
            const fuelLevel = 100; // Initial fuel level

            jsonData.push({
            carId,
            location,
            fuelLevel
            });
        } else {

            const x = Math.floor(Math.random() * 10);
            // Reduce the fuel level by a fixed amount in each iteration
            carData.fuelLevel -= x; // Adjust the fuel consumption rate as needed

            // Check if the fuel level has reached or gone below 0
            if (carData.fuelLevel <= 0) {
            const nearestFuelStation = findNearestFuelStation(carData.location);
            this.emit('fuel-empty', carData.carId, nearestFuelStation);
            return;
            }

            const lat = getRandomFloat(chennaiBoundingBox.minLatitude, chennaiBoundingBox.maxLatitude);
            const longi = getRandomFloat(chennaiBoundingBox.minLongitude, chennaiBoundingBox.maxLongitude);

            carData.location.latitude = lat;
            carData.location.longitude = longi;
            const loci = {
            latitude: lat,
            longitude: longi
            };

            for (let i = 0; i < jsonData.length; i++) {
            const car1 = jsonData[i];

            if (car1.carId !== carId) {
                // Compare car IDs to ensure they are different
                // Calculate distance between car1 and car2 using latitude and longitude
                const distance = parseFloat(calculateEuclideanDistance(car1.location, loci).toFixed(4));

                if (distance < 20000) {
                // Customize the proximity threshold as per your requirement
                this.emit('proximity', carId, car1.carId, distance);
                // Report the proximity or take any desired action
                }
            }
            }
        }

        await fs.promises.writeFile('../carData.json', JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`Fuel level for car ${carId} updated.`);
        } catch (error) {
        console.error('Error:', error);
        }
    }
}

module.exports = {Sensor,findNearestFuelStation};