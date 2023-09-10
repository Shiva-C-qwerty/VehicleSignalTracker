const express = require('express');
const session = require('express-session');
const fs = require('fs');
const { generateCarId } = require('../utils');
const {Sensor,findNearestFuelStation} = require('./sensor_async');
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
async function requireLogin(req, res, next) {
    if (req.session.userId) {
        next(); // User is logged in, proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // User is not logged in, redirect to the login page
    }
}

function handleFuelEmpty(carId, station) {
    return `Fuel level critical for car ${carId}; Fuel station is at Latitude: ${station.latitude}, Longitude: ${station.longitude}`;
}

function handleProximity(carId1, carId2, distance) {
    return `Car ${carId1} is in close proximity to car ${carId2} at a distance: ${distance} meters.`;
}

// Read user details from the JSON file
async function readUserDetails() {
    try {
        const userDetails = await fs.promises.readFile('../userDetails.json', 'utf8');
        return JSON.parse(userDetails);
    } catch (err) {
        console.error('Error reading user details:', err);
        return [];
    }
}

// Write user details to the JSON file
async function writeUserDetails(userDetails) {
    try {
        await fs.promises.writeFile('userDetails.json', JSON.stringify(userDetails, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing user details:', err);
    }
}

// Initialize the server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Initialize the socket.io server
const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

sensor.on('proximity', (carId1, carId2, distance) => {
    io.emit('data', handleProximity(carId1, carId2, distance));
});

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

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDetails = await readUserDetails();

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

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const userDetails = await readUserDetails();

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
        await writeUserDetails(userDetails);
        res.redirect('/login');
    }
});

// Simulate sensor data route
app.get('/simulateSensorData', requireLogin, (req, res) => {
    const intervalId = setInterval(() => {
        sensor.simulateSensor(req.session.carId); // Use the user's unique car ID
    }, 5000);

    // Event listener for 'fuel-empty' event
    sensor.once('fuel-empty', (carId, station) => {
        clearInterval(intervalId); // Stop the loop once fuel is empty

        const data = handleFuelEmpty(carId,station);
        io.emit('data', data);

        res.sendFile(__dirname + '/index.html');
    });

    res.sendFile(__dirname + '/index.html');
});