import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool(config.db);

export async function initDatabase() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS readings (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      ts BIGINT NOT NULL,
      humidity FLOAT NOT NULL,
      temperature FLOAT NOT NULL,
      relay TINYINT(1) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_readings_ts (ts)
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS control (
      id TINYINT PRIMARY KEY,
      mode VARCHAR(8) NOT NULL,
      threshold FLOAT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(
    `INSERT IGNORE INTO control (id, mode, threshold) VALUES (?, ?, ?)`,
    [1, 'auto', 80]
  );
}

