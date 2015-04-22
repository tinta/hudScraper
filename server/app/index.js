var Express = require('express');

console.log(process.cwd())

var app = Express();
app.set('views', './server/app/views');
app.set('view engine', 'jade');
app.use("/resources", Express.static(process.cwd() + '/resources'));
app.use("/angular", Express.static(process.cwd() + '/node_modules/angular'));
app.use("/ng-table", Express.static(process.cwd() + '/node_modules/ng-table'));
app.locals.pretty = true;

app.listen(3000);

var db = require('./../db-connect.js')();

app.get('/', function (req, res) {

    var SQLGetListings = [
        'SELECT *',
        'FROM homes'
    ].join(' ');

    // db.connect();
    db.query(SQLGetListings, function(err, listings) {
        // if (err) db.end();
        // db.end();
        console.log(err)
        console.log(listings)
        listings = listings || {};
        var scope = {};
        scope.listings = JSON.stringify(listings);
        res.render('index', scope);
    });
});