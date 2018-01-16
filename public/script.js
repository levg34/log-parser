var app = angular.module('app', [])

function toDate(dateString) {
	return new Date(dateString.split(',')[0])
}

app.controller('logCtrl', function($scope,$http) {
	$scope.logList = []
	$scope.logfiles = []
	$scope.selectedLog = 'application.log'
	$scope.showLog = function(log) {
		return (toDate(log.date) >= $scope.startDate && toDate(log.date) <= $scope.endDate) &&
				!($scope.searchText && log.log.indexOf($scope.searchText) == -1)
	}
	$scope.refresh = function() {
		$http.get('/logs?file='+$scope.selectedLog).then(function(response) {
			if (response) {
				$scope.logList = response.data.list
				if ($scope.logList.length >= 2) {
					$scope.startDate = toDate($scope.logList[0].date)
					$scope.endDate = toDate($scope.logList[$scope.logList.length-1].date)
				}
			}
			$scope.searchText = ''
		}, function(response) {
			// error
		})
	}
	$scope.getFiles = function() {
		$http.get('/logfiles').then(function(response) {
			if (response) {
				$scope.logfiles = response.data.files
			}
		}, function(response) {
			// error
		})
	}
	$scope.selectLog = function(logfile) {
		$scope.selectedLog = logfile
		$scope.refresh()
	}
	$scope.getFiles()
	$scope.refresh()
})
