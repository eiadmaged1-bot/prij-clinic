const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
  });

  try {
    await client.connect();
    // Drop it if it exists so we have a clean slate
    await client.query('DROP DATABASE IF EXISTS prij_clinic_test_cfdf4c0');
    await client.query('CREATE DATABASE prij_clinic_test_cfdf4c0');
    console.log('Test database created successfully.');
  } catch (err) {
    console.error('Error creating database:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDb();
