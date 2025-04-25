const mysql = require('mysql2');

const pool = mysql.createPool({
host: '85.119.149.127',
user: 'wfileru_foxy',
password: 'wM0pN3aA8k',
database: 'wfileru_tg'
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