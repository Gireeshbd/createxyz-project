import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create a sql-like interface that mimics neon's behavior
const sql = async (strings, ...values) => {
  const client = await pool.connect();
  try {
    // Convert template literal to parameterized query
    let query = strings[0];
    const params = [];
    
    for (let i = 0; i < values.length; i++) {
      query += `$${i + 1}${strings[i + 1]}`;
      params.push(values[i]);
    }
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

// For direct queries without template literals
sql.query = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export default sql;