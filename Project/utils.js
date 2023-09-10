const fs = require('fs');

function generateCarId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let carId = '';
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        carId += characters.charAt(randomIndex);
    }
    return carId;
}

function calculateEuclideanDistance(point1, point2) {
    const earthRadiusInKm = 6371; // Earth's radius in kilometers (you can use other units as well)

    const lat1Radians = (point1.latitude * Math.PI) / 180;
    const lon1Radians = (point1.longitude * Math.PI) / 180;
    const lat2Radians = (point2.latitude * Math.PI) / 180;
    const lon2Radians = (point2.longitude * Math.PI) / 180;

    const latDiffRadians = lat2Radians - lat1Radians;
    const lonDiffRadians = lon2Radians - lon1Radians;

    const a = Math.sin(latDiffRadians / 2) * Math.sin(latDiffRadians / 2) +
        Math.cos(lat1Radians) * Math.cos(lat2Radians) *
        Math.sin(lonDiffRadians / 2) * Math.sin(lonDiffRadians / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInKm = earthRadiusInKm * c;
    const distance = distanceInKm * 1000;
    return distance;
}

module.exports = {
    generateCarId,
    calculateEuclideanDistance,
};