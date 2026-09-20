// db.js
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env file');
}

const sql = postgres(connectionString, {
  ssl: 'require',
  idle_timeout: 20,        // keep connections warm between requests
  connect_timeout: 30,
  max: 5,                  // allow a few concurrent queries
});

export default sql;