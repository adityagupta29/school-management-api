# school-management-api-project

This project is a Node.js REST API built with the Express.js framework and a PostgreSQL database. It uses express for server routing, pg for database connections, cors for cross-origin sharing, and dotenv for security.

The API provides two endpoints: POST /addSchool to store school details and GET /listSchools to retrieve schools sorted by proximity. The sorting logic uses the Haversine formula to calculate the distance between the user's location and each school. The code is fully asynchronous and handles errors gracefully.
