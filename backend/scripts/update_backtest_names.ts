
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [],
  synchronize: false,
});

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    // Use the record's ID as the name for those that are missing names
    // Casting id to text if needed, though typically UUIDs auto-cast to string in concatenation/assignment
    const result = await AppDataSource.query(
      `UPDATE backtest SET name = id::text WHERE name IS NULL OR name = ''`
    );
    
    console.log('Update result:', result);
    console.log('Successfully updated backtest names with UUIDs.');

  } catch (err) {
    console.error('Error during Data Source initialization or query execution:', err);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
