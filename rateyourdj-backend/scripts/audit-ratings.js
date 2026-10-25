// 仅SELECT和只读事务；非零退出表示发现缓存漂移。
const { pool } = require('../src/config/database');
const { RATING_AUDIT_SQL, fields } = require('../src/services/ratingQueries');
(async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SET TRANSACTION READ ONLY');
    await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const [rows] = await connection.query(RATING_AUDIT_SQL);
    const counts = Object.fromEntries(fields.map(f => [f, 0]));
    let mismatched = 0;
    for (const row of rows) {
      let differs = false;
      for (const field of fields) if (Math.abs(Number(row[field]) - Number(row['expected_' + field])) > 0.00001) { counts[field]++; differs = true; }
      if (differs) mismatched++;
    }
    console.log(JSON.stringify({ readonly: true, checked_at: new Date().toISOString(), djs: rows.length, mismatched, counts }));
    if (mismatched) process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { if (connection) { await connection.rollback(); connection.release(); } await pool.end(); }
})();
