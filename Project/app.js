const express = require('express');
const session = require('express-session');
const fs = require('fs');
const { generateCarId } = require('./utils');
const Sensor = require('./sensor');

const app = express();
const sensor = new Sensor();
const port = 3000;

// Configure session middleware
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: true }));

// Middleware to check if the user is logged in
function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); // User is logged in, proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // User is not logged in, redirect to login page
    }
}

// Function to handle the 'fuel-empty' event
function handleFuelEmpty(carId,station) {
    console.log(`Fuel low for car ${carId} ; Nearest fuel station is at Latitude : ${station.latitude} and Longitude : ${station.longitude}`)
}

// Function to handle the 'proximity' event
function handleProximity(carId1, carId2, distance) {
    console.log(`Car ${carId1} is in close proximity to car ${carId2} at a distance: ${distance} meters.`);
}

// Register event listeners
sensor.addListener('fuel-empty', handleFuelEmpty);
sensor.on('proximity', handleProximity);

// Read user details from the JSON file
function readUserDetails() {
    try {
        const userDetails = fs.readFileSync('userDetails.json', 'utf8');
        return JSON.parse(userDetails);
    } catch (err) {
        console.error('Error reading user details:', err);
        return [];
    }
}

// Write user details to the JSON file
function writeUserDetails(userDetails) {
    try {
        fs.writeFileSync('userDetails.json', JSON.stringify(userDetails, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing user details:', err);
    }
}

// Login route
app.get('/login', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form action="/login" method="POST">
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Login</button>
        </form>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const userDetails = readUserDetails();

    const user = userDetails.find((user) => user.name === username && user.password === password);

    if (user) {
        req.session.userId = user.id;
        req.session.carId = user.carId;
        res.redirect('/simulateSensorData');
    } else {
        res.send('Invalid credentials!');
    }
});

// Registration route
app.get('/register', (req, res) => {
    res.send(`
        <h1>Registration</h1>
        <form action="/register" method="POST">
        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Register</button>
        </form>
    `);
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const userDetails = readUserDetails();

    const userExists = userDetails.some((user) => user.name === username);

    if (userExists) {
        res.send('Username already exists!');
    } else {
        const carId = generateCarId();
        const newUser = {
        id: userDetails.length + 1,
        name: username,
        password: password,
        carId: carId,
        };
        userDetails.push(newUser);
        writeUserDetails(userDetails);
        res.redirect('/login');
    }
});

// Simulate sensor data route
app.get('/simulateSensorData', requireLogin, (req, res) => {
    setInterval(() => {
        sensor.simulateSensor(req.session.carId); // Use the user's unique car ID
    }, 5000);
    res.send(`Simulating sensor data every 5000ms for user ${req.session.userId} and car ${req.session.carId}`);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
