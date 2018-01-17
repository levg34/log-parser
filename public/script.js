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
				!($scope.searchText && !$scope.searchText.startsWith('!') && log.log.toLowerCase().indexOf($scope.searchText.toLowerCase()) == -1) && 
				!($scope.searchText && $scope.searchText.startsWith('!') && log.log.toLowerCase().indexOf($scope.searchText.toLowerCase().substring(1)) != -1)
	}
	$scope.refresh = function() {
		var oldList = $scope.logList
		$http.get('/logs?file='+$scope.selectedLog).then(function(response) {
			if (response) {
				$scope.logList = response.data.list
				if ($scope.logList.length >= 2) {
					$scope.startDate = toDate($scope.logList[0].date)
					$scope.endDate = toDate($scope.logList[$scope.logList.length-1].date)
				}
			}
			$scope.searchText = ''
			$scope.diffLog(oldList,$scope.logList)
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
	$scope.diffLog = function(oldLog,newLog) {
		if (oldLog.length==0) {
			// app launch
		} else {
			var lastDate = oldLog[oldLog.length-1].date
			newLog.forEach(function(log) {
				if (log.date>lastDate) {
					log.new = 'new'
					console.log(log)
				}
			})
		}
	}
	$scope.getFiles()
	$scope.refresh()
})
