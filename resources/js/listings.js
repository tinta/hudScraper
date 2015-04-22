angular.module('ControllerListings', [
// Dependencies
    'ngTable'
], function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
})
.controller('ControllerListings', function(
// Dependency Injections
    $scope,
    $http,
    $timeout,
    $window,
    ngTableParams
){
    $scope.listings = $window.listings;

    $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 20           // count per page
    }, {
        total: $scope.listings.length, // length of data
        getData: function($defer, params) {
            var data = $scope.listings.slice(
                (params.page() - 1) * params.count(),
                params.page() * params.count()
            );

            $defer.resolve(data);
        }
    });

    // Dev
    $window.logScope = function () {
        $window.$scope = $scope;
        console.log($scope);
    };
});