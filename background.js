const mysql = require('mysql');

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'dlisystem_staff',
    password: 'PASSWORD',
    database: 'dlisystem_staff'
});



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {


    function authenticateWithMySQL(username, password, callback) {
        // Use the connection pool to acquire a connection
        pool.getConnection(function (err, connection) {
            if (err) {
                console.error('Error acquiring database connection:', err);
                callback(false);
                return;
            }

            // Perform the authentication query
            const selectQuery = 'SELECT COUNT(*) AS count FROM users WHERE username = ? AND password = ?';
            const updateQuery = 'UPDATE users SET success_login = success_login + 1 WHERE username = ?';

            // Start a transaction
            connection.beginTransaction(function (err) {
                if (err) {
                    console.error('Error starting database transaction:', err);
                    callback(false);
                    connection.release();
                    return;
                }

                connection.query(selectQuery, [username, password], function (err, results) {
                    if (err) {
                        console.error('Error executing SELECT query:', err);
                        rollbackAndRelease(connection, callback, false);
                        return;
                    }

                    const count = results[0].count;
                    const authenticated = count === 1;

                    if (authenticated) {
                        connection.query(updateQuery, [username], function (err) {
                            if (err) {
                                console.error('Error executing UPDATE query:', err);
                                rollbackAndRelease(connection, callback, false);
                                return;
                            }

                            // Commit the transaction
                            connection.commit(function (err) {
                                if (err) {
                                    console.error('Error committing database transaction:', err);
                                    rollbackAndRelease(connection, callback, false);
                                    return;
                                }

                                // Release the connection back to the pool
                                connection.release();
                                callback(true);
                            });
                        });
                    } else {
                        // Release the connection back to the pool
                        connection.release();
                        callback(false);
                    }
                });
            });
        });
    }

    function rollbackAndRelease(connection, callback, result) {
        // Rollback the transaction and release the connection back to the pool
        connection.rollback(function () {
            connection.release();
            callback(result);
        });
    }
