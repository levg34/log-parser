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
	$scope.logMap = {}
	$scope.logList = []
	$scope.logfiles = []
	$scope.selectedLog = 'application.log'
	$scope.showLog = function(log) {
		return (toDate(log.date) >= $scope.startDate && toDate(log.date) <= $scope.endDate) &&
				!($scope.searchText && !$scope.searchText.startsWith('!') && log.log.toLowerCase().indexOf($scope.searchText.toLowerCase()) == -1) && 
				!($scope.searchText && $scope.searchText.startsWith('!') && log.log.toLowerCase().indexOf($scope.searchText.toLowerCase().substring(1)) != -1)
	}
	$scope.refresh = function() {
		var oldList = $scope.logMap[$scope.selectedLog]
		$http.get('/logs?file='+$scope.selectedLog).then(function(response) {
			if (response) {
				$scope.logList = response.data.list
				if ($scope.logList.length >= 2) {
					$scope.startDate = toDate($scope.logList[0].date)
					$scope.endDate = toDate($scope.logList[$scope.logList.length-1].date)
				}
			}
			$scope.searchText = ''
			if (oldList) {
				$scope.diffLog(oldList,$scope.logList)
			}
		}, function(response) {
			// error
		})
	}
	$scope.getFiles = function(resetDiff) {
		$http.get('/logfiles').then(function(response) {
			if (response) {
				$scope.logfiles = response.data.files
				// fill in map
				if (resetDiff) {
					$scope.logfiles.forEach(function(logfile) {
						$http.get('/logs?file='+logfile).then(function(_response) {
							if (_response) {//if (_response && (!$scope.logMap[logfile] || $scope.logMap[logfile] == [])) {
								$scope.logMap[logfile] = _response.data.list
							}
						}, function(_response) {
							// error
						})
					})
				}
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
			var hasNewLog = false
			var notifications = []
			newLog.forEach(function(log) {
				if (log.date>lastDate) {
					hasNewLog = true
					log.new = 'new'
					notifications.push({title:'New log at '+log.date,body:log.log})
				}
			})
			if (!hasNewLog) {
				sendNotification('No new log','No new log since '+lastDate)
			} else {
				const MAX_NOTIFS = 10
				notifications.forEach(function(notif,index) {
					if (notifications.length<=MAX_NOTIFS || index>=notifications.length-MAX_NOTIFS) {
						sendNotification(notif.title,notif.body)
					}
				})
			}
		}
	}
	$scope.getFiles(true)
	$scope.refresh()
})
