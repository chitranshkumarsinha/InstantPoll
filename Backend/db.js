import dotenv from 'dotenv';
import postgres from 'postgres'
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false
  }
});

export default sql;