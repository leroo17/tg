const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
host: '85.119.149.127',
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_TABLE
}).promise();;

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Ошибка при подключении к базе:', err);
    } else {
        console.log('Успешное подключение к базе! ID соединения: ' + connection.threadId);
        connection.release();
    }
});

pool.on('error', function(err) {
    console.error('Ошибка соединения с базой:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Соединение потеряно, нужно перезапустить пул...');
    } else {
        throw err;
    }
});

module.exports = pool;