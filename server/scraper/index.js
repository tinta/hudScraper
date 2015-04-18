// Libs
var Nightmare = require('nightmare');
var _ = require('lodash');
var moment = require('moment');

// Instantiations
var db = require('./../db-connect.js');
var page = new Nightmare();

var options = {};
options.state = 'AL';
options.county = 'madison';
var hudScraper = require('./hudScraper.js')(options);

console.log('Scraping ' + hudScraper.url)

function encase (casing, text) {
    return casing + text + casing;
}

function encaseInQuotes (text) {
    return encase('"', text);
}

page.goto(hudScraper.url)
    .wait(100)
    .evaluate(hudScraper.scrape, function(listings) {
        var uidList = [];

        _.each(listings, function(listing, uid) {
            uidList.push(
                encaseInQuotes(uid)
            );
        });

        uidList.join(', ');

        var tableName = 'homes';
        db.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + db.threadId);
        });

        var SQLFindListing = [
            'SELECT *',
            'FROM',
            tableName,
            'WHERE',
            'property_case',
            'IN',
            '(', uidList, ')'
        ].join(' ');

        var query = db.query(SQLFindListing);

        query.on('end', function() {
            db.end();
        });

        query.on('result', function(result) {
            var date, insertKeysList, insertValuesList, SQLInsertListing;

            if (result === undefined) {
                date = moment(listing.bidDate, 'MM/DD/YYYY').format('YYYY-MM-DD');

                insertKeysList = [
                    encaseInTicks('property_case'),
                    encaseInTicks('street_addr'),
                    encaseInTicks('state'),
                    encaseInTicks('county'),
                    encaseInTicks('city'),
                    encaseInTicks('price'),
                    encaseInTicks('bed'),
                    encaseInTicks('bath'),
                    encaseInTicks('listing_period'),
                    encaseInTicks('bid_open_date'),
                    encaseInTicks('permalink')
                ].join(', ')

                insertValuesList = [
                    encaseInQuotes(uid),
                    encaseInQuotes(listing.address),
                    encaseInQuotes(options.state),
                    encaseInQuotes(options.county),
                    encaseInQuotes(listing.city),
                    encaseInQuotes(listing.price),
                    123,
                    123,
                    123,
                    encaseInQuotes(date),
                    encaseInQuotes(listing.link)
                ].join(', ');

                SQLInsertListing = [
                    'INSERT',
                    'INTO',
                    tableName,
                    '(', insertKeysList, ')',
                    'VALUES',
                    '(', insertValuesList, ')'
                ].join(' ');

                db.query(SQLInsertListing, function(err, foo) {
                    if (err) {
                        console.log(err)
                        return;
                    }
                    console.log('success!')
                    console.log(foo)
                });
            } else {
                console.log('already exists')
                console.log(result)
            }
        });
    })
    .run();