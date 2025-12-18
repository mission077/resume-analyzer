import { Pool } from "pg";

// Support both DATABASE_URL (Railway, Vercel, etc.) and individual connection params
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : new Pool({
      user: process.env.DB_USER as string,
      host: process.env.DB_HOST as string,
      database: process.env.DB_NAME as string,
      password: process.env.DB_PASSWORD as string,
      port: parseInt(process.env.DB_PORT as string, 10),
    });

export default pool;
