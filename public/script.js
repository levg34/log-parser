var app = angular.module('app', [])

function toDate(dateString) {
	return new Date(dateString.split(',')[0])
}
function sendNotification(title, body) {
	Notification.requestPermission(function(status) {
		console.log(status)
		var n = new Notification(title, {body: body, icon: 'img/log.png'})
	})
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
	$scope.refresh = function(skipDiff) {
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
			if (!skipDiff) {
				$scope.diffLog(oldList,$scope.logList)
			}
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
		$scope.refresh(true)
	}
	$scope.diffLog = function(oldLog,newLog) {
		if (oldLog.length==0) {
			// app launch
		} else {
			var lastDate = oldLog[oldLog.length-1].date
			newLog.forEach(function(log) {
				if (log.date>lastDate) {
					log.new = 'new'
					sendNotification('New log at '+log.date,log.log)
				}
			})
		}
	}
	$scope.getFiles()
	$scope.refresh()
})
