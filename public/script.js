var app = angular.module('app', [])

function toDate(dateString) {
	return new Date(dateString.split(',')[0])
}

function sendNotification(title, body) {
	Notification.requestPermission(function(status) {
		var n = new Notification(title, {body: body, icon: 'img/log.png'})
	})
}

app.factory('socket', function ($rootScope) {
	var socket = io.connect()
	return {
		on: function (eventName, callback) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args)
				})
			})
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args)
					}
				})
			})
		}
	}
})

app.controller('logCtrl', function($scope,$http,socket) {
	$scope.logMap = {}
	$scope.logList = []
	$scope.logfiles = []
	$scope.badgeMap = {}
	$scope.selectedLog = 'application.log'
	
	socket.on('file_change', function (data) {
		var diffLogs = data.logs.length - $scope.logMap[data.file].length
		$scope.badgeMap[data.file] = diffLogs > 0 ? diffLogs : 'new'
		sendNotification('file change', data.file+' changed: '+$scope.badgeMap[data.file]+' logs added.')
	})
	
	socket.on('file_create', function (data) {
		$scope.badgeMap[data.file] = 'new'
		$scope.getFiles()
		sendNotification('file created', data.file+' was added.')
	})
	
	socket.on('file_delete', function (data) {
		delete $scope.badgeMap[data.file]
		$scope.getFiles()
		sendNotification('file deleted', data.file+' was deleted.')
	})
	
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
			delete $scope.badgeMap[$scope.selectedLog]
		}, function(response) {
			// error
		})
	}
	$scope.getFiles = function() {
		$http.get('/logfiles').then(function(response) {
			if (response) {
				$scope.logfiles = response.data.files
				// fill in map
				$scope.logfiles.forEach(function(logfile) {
					$http.get('/logs?file='+logfile).then(function(_response) {
						if (_response && !($scope.logMap[logfile] || $scope.logMap[logfile] == [])) {
							$scope.logMap[logfile] = _response.data.list
							try {
								sessionStorage.logMap = JSON.stringify($scope.logMap)
							} catch (e) {
								console.error(e)
							}
						}
					}, function(_response) {
						// error
					})
				})
			}
		}, function(response) {
			// error
		})
	}
	$scope.selectLog = function(logfile) {
		$scope.selectedLog = logfile
		sessionStorage.selectedLog = logfile
		delete $scope.badgeMap[logfile]
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
				const MAX_NOTIFS = 3
				notifications.forEach(function(notif,index) {
					if (notifications.length<=MAX_NOTIFS || index>=notifications.length-MAX_NOTIFS) {
						sendNotification(notif.title,notif.body)
					}
				})
				$scope.logMap[$scope.selectedLog] = newLog
				try {
					sessionStorage.logMap = JSON.stringify($scope.logMap)
				} catch (e) {
					console.error(e)
				}
			}
		}
	}
	$scope.resetDiff = function() {
		$scope.logMap = {}
		sessionStorage.logMap = JSON.stringify($scope.logMap)
		$scope.getFiles()
		sendNotification('Reset', 'Log diff has been reset.')
	}
	if (sessionStorage.selectedLog) $scope.selectedLog = sessionStorage.selectedLog
	if (sessionStorage.logMap) $scope.logMap = JSON.parse(sessionStorage.logMap)
	$scope.getFiles()
	$scope.refresh()
})
