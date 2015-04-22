// Libs
var Nightmare = require('nightmare');
var _ = require('lodash');
var moment = require('moment');

// Instantiations
var db = require('./../db-connect.js')();
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

function encaseInTicks (text) {
    return encase('`', text);
}

page.goto(hudScraper.url)
    .wait(100)
    .evaluate(hudScraper.scrape, function(scrapedListings) {
        db.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + db.threadId);
        });

        var tableName = 'homes';

        var uids = {};
        uids.scraped = _.keys(scrapedListings);
        uids.present = [];
        uids.absent = [];
        uids.sql = uids.scraped.join(', ');
        console.log(uids.scraped);
        console.log(scrapedListings)

        var SQLFindListing = [
            'SELECT *',
            'FROM',
            tableName,
            'WHERE',
            'property_case',
            'IN',
            '(', uids.sql, ')'
        ].join(' ');

        var query = db.query(SQLFindListing);

        query.on('end', function() {
            var insertedRows = 0;
            console.log('end')
            uids.absent = _.difference(uids.scraped, uids.present);

            if (uids.absent.length > 0) {
                _.each(uids.absent, function(absentUid) {
                    var absentListing = scrapedListings[absentUid];
                    console.log(absentListing)
                    var date, insertKeysList, insertValuesList, SQLInsertListing;
                    date = moment(absentListing.bidDate, 'MM/DD/YYYY').format('YYYY-MM-DD');

                    insertKeysList = [
                        encaseInTicks('property_case'),
                        encaseInTicks('street_addr'),
                        encaseInTicks('state'),
                        encaseInTicks('county'),
                        encaseInTicks('city'),
                        encaseInTicks('zip'),
                        encaseInTicks('price'),
                        encaseInTicks('bed'),
                        encaseInTicks('bath'),
                        encaseInTicks('listing_period'),
                        encaseInTicks('bid_open_date'),
                        encaseInTicks('permalink')
                    ].join(', ')

                    insertValuesList = [
                        encaseInQuotes(absentListing.propertyCase),
                        encaseInQuotes(absentListing.address),
                        encaseInQuotes(options.state),
                        encaseInQuotes(options.county),
                        encaseInQuotes(absentListing.city),
                        absentListing.zip,
                        absentListing.price,
                        absentListing.bed,
                        absentListing.bath,
                        encaseInQuotes(absentListing.listingPeriod),
                        encaseInQuotes(date),
                        encaseInQuotes(absentListing.link)
                    ].join(', ');

                    console.log(insertValuesList)

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

                        insertedRows++;

                        console.log('success!')
                        console.log(foo)

                        if (uids.absent.length === insertedRows) {
                            db.end();
                        }
                    });
                });
            }
        });

        query.on('result', function(result) {
            uids.present.push(result.propertyCase);

            console.log('already exists')
            console.log(result)
        });
    })
    .run();