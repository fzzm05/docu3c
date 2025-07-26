import pg from "pg";
import env from "dotenv";

env.config();

// Create a connection pool
const pool = new pg.Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
    ssl: { rejectUnauthorized: false },
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle pool client:', err.message);
});

// Log when pool is connected
pool.on('connect', () => {
    console.log('✅ Database pool connected successfully');
});

process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('Database pool closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing database pool:', err);
        process.exit(1);
    }
});

export default pool;
