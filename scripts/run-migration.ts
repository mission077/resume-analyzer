import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const migrationPath = path.join(
      process.cwd(),
      "migrations",
      "003_create_resume_analyses.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("🚀 Running migration: 003_create_resume_analyses.sql");
    console.log("📡 Using database:", process.env.DATABASE_URL?.split("@")[1]); // Show host without password

    await pool.query(sql);

    console.log("✅ Migration completed successfully!");

    await pool.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
