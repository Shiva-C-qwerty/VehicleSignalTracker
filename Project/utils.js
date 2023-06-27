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
    const xDiff = point2.latitude - point1.latitude;
    const yDiff = point2.longitude - point1.longitude;
    const distance = Math.sqrt(xDiff ** 2 + yDiff ** 2);
    return distance;
}

module.exports = {
    generateCarId,
    calculateEuclideanDistance
};