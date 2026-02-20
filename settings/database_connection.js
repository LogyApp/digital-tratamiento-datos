import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
    host: process.env.HOST || '127.0.0.1',
    database: process.env.DATABASE,
    port: process.env.DB_PORT || 3307,
    user: process.env.USER,
    password: process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Conexión establecida con la base de datos.');
        conn.release();
    } catch (e) {
        console.error('Fallo al establecer conexión con la base de datos:', error.message);
    }
})();

export default pool;
