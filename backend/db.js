// db.js
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const sql = postgres(connectionString, {
  ssl: 'require',
  idle_timeout: 0.1,      // Key fix: forces quick connection recycling
  connect_timeout: 30,    // Extended timeout
  max: 1,                 // Limit to a single connection for testing
});

export default sql;