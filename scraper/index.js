var Nightmare = require('nightmare');
var Mysql = require('mysql');
var _ = require('lodash');
var moment = require('moment');

var hudScraper = require('./hudScraper.js');

var mysql = Mysql.createConnection({
    host    : 'localhost',
    database: 'hud',
    user    : 'huduser',
    password: 'fACviAxbd9fme7u'
});

var page = new Nightmare();

var options = {};
options.city = '';
options.zip = ''
options.state = 'AL';
options.county = 'madison';
options.pageSize = 1000

var url = [
    'https://www.hudhomestore.com/Listing/PropertySearchResult.aspx?pageId=1&',
    'zipCode=',
    options.zip,
    '&',
    'city=',
    options.city,
    '&',
    'county=',
    options.county,
    '&s',
    'State=',
    options.state,
    '&fromPrice=0&toPrice=0&fCaseNumber=&bed=0&bath=0&street=&buyerType=0&specialProgram=&Status=0&OrderbyName=SLISTINGPERIOD&OrderbyValue=ASC&s',
    'PageSize=',
    options.pageSize,
    '&sLanguage=ENGLISH#'
].join('');

console.log('Scraping ' + url)

function encase (casing, text) {
    return casing + text + casing;
}

function encaseInQuotes (text) {
    return encase('"', text);
}

function encaseInTicks (text) {
    return encase('`', text);
}

page.goto(url)
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
        mysql.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + mysql.threadId);

            var SQLFindListing = [
                'SELECT *',
                'FROM',
                tableName,
                'WHERE',
                'property_case',
                'IN',
                '(', uidList, ')'
            ].join(' ');

            var query = mysql.query(SQLFindListing);

            query.on('end', function(foo) {
                mysql.end();
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

                    mysql.query(SQLInsertListing, function(err, foo) {
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
        });
    })
    .run();