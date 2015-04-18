var Mysql = require('mysql');

var mysql = Mysql.createConnection({
    host    : 'localhost',
    database: 'hud',
    user    : 'huduser',
    password: 'fACviAxbd9fme7u'
});

module.exports = mysql;