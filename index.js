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

console.log(url)

function setQuotes (text) {
    return "'" + text + "'";
}

page.goto(url)
    .wait(100)
    .evaluate(hudScraper.scrape, function(listings) {
        var tableName = 'homes';
        mysql.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + mysql.threadId);

            _.each(listings, function(listing, uid) {
                var queryFindListing = [
                    'SELECT *',
                    'FROM',
                    tableName,
                    'WHERE property_case=' + uid,
                ].join(' ');

                mysql.query(queryFindListing, function(err, results) {
                    if (err) {
                        console.log('listing err')
                        console.log(err)
                        mysql.end();
                        return;
                    }
                    var date = moment(listing.bidDate, 'MM/DD/YYYY').format('YYYY-MM-DD');

                    var valuesList = [
                        setQuotes(uid),
                        setQuotes(listing.address),
                        setQuotes(options.state),
                        setQuotes(options.county),
                        setQuotes(listing.city),
                        setQuotes(listing.price),
                        123,
                        123,
                        123,
                        setQuotes(date),
                        setQuotes(listing.link),
                    ].join(', ');

                    var queryInsertListing = [
                        'INSERT',
                        'INTO',
                        tableName,
                        '(',
                        [
                            '`property_case`',
                            '`street_addr`',
                            '`state`',
                            '`county`',
                            '`city`',
                            '`price`',
                            '`bed`',
                            '`bath`',
                            '`listing_period`',
                            '`bid_open_date`',
                            '`permalink`',
                        ].join(', '),
                        ')',
                        'VALUES',
                        '(',
                        valuesList,
                        ')'
                    ].join(' ');

                    if (results[0] === undefined) {
                        mysql.query(queryInsertListing, function(err, foo) {
                            if (err) {
                                console.log(err)
                                // mysql.end();
                                return;
                            }
                            console.log('success!')
                            console.log(foo)
                        });
                    } else {
                        console.log('already exists')
                        console.log(results)
                    }
                });
            });
        });
    })
    .run();