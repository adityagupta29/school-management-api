const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Neon PostgreSQL Connection (MySQL free server is not available so I am using PostgreSQL instead)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL
    );
`;

pool.query(createTableQuery)
    .then(() => console.log('Table created or already exists'))
    .catch(err => console.error('Error creating table:', err));

// Haversine distance formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => x * Math.PI / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Add School API
app.post('/addSchool', async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validation
    if (!name || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, address, latitude, longitude) are required.'
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, address, parseFloat(latitude), parseFloat(longitude)]
        );

        res.status(201).json({
            success: true,
            message: 'School added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error',
            error: error.message
        });
    }
});

// List Schools API
app.get('/listSchools', async (req, res) => {
    const userLat = parseFloat(req.query.latitude);
    const userLon = parseFloat(req.query.longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
        return res.status(400).json({
            success: false,
            message: 'Valid latitude and longitude query parameters are required.'
        });
    }

    try {
        const result = await pool.query('SELECT * FROM schools');
        
        const sortedSchools = result.rows.map(school => {
            const distance = calculateDistance(userLat, userLon, school.latitude, school.longitude);
            return { ...school, distance: parseFloat(distance.toFixed(2)) };
        }).sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            success: true,
            count: sortedSchools.length,
            data: sortedSchools
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error',
            error: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.send('School Management API is running with PostgreSQL/Neon');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connected to Neon PostgreSQL`);
});