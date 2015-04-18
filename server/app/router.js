var Express = require('express');
var db = require('./../db-connect.js');

var app = Express();
app.set('views', './server/app/views');
app.set('view engine', 'jade');

app.listen(3000);

app.get('/', function (req, res) {
    var SQLGetListings = [
        'SELECT *',
        'FROM homes'
    ].join(' ');


    db.connect();
    db.query(SQLGetListings, function(err, listings) {
        if (err) db.end();
        console.log(listings)
        var scope = {};
        scope.listings = listings;
        res.render('index', scope);
        db.end();
    });
});