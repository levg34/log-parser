const express = require('express')
var request = require('request')
const fs = require('fs')
const app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
io.on('connection', function(socket){
	console.log('refresh')
})
const baseURL = 'http://localhost:3000'
const logFolder = './public/data'

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/view/index.html')
})

function parseLog(body) {
	var res = []
	var bodyLines = body.split(/[\n\r]/)
	var log = ''
	bodyLines.forEach(line => {
		const dateLength = 10
		if (line.length >= dateLength && new Date(line.substring(0, dateLength))!='Invalid Date') {
			if (log) res.push({log:log,date:log.split('ERROR')[0].trim()})
			log = ''
		}
		log += line + '\n'
	})
	if (log) res.push({log:log,date:log.split('ERROR')[0].trim()})
	return res
}

function fileExists(file) {
	return true
}

function watch() {
	fs.watch(logFolder, (eventType, filename) => {
		if (filename) {
			if (filename.endsWith('.log')) {
				if (eventType==='rename') {
					// TODO: detect deleted or created
					fs.access(logFolder+'/'+filename, (err) => {
						if (err) {
							io.emit('file_delete', {file: filename})
							console.log('deleted: '+filename)
						} else {
							io.emit('file_create', {file: filename})
							console.log('created: '+filename)
						}
					})
					
				} else if (eventType==='change') {
					fs.readFile(logFolder+'/'+filename, 'utf8', function(err, data) {  
						if (err) throw err
						io.emit('file_change', {file: filename, logs: parseLog(data)})
					})
				} else {
					//io.emit('file_x', {event: eventType, file: filename})
				}
			}
		} else {
			console.log('filename not provided')
		}
	})
}

app.get('/logs', function (req, res) {
	var logFile = 'application.log'
	if (req.query.file&&fileExists(req.query.file)) {
		logFile = req.query.file
	}
	const url = baseURL+'/data/' + logFile
	var resJSON = {}

	request(url, function (error, response, body) {
		if (error) {
			resJSON.error = error
		} else if (response.statusCode===200) {
			var parsedList = parseLog(body)
			resJSON.list = parsedList
		} else {
			resJSON.response = response
		}
		res.json(resJSON)
	})
})

app.get('/logfiles', function (req, res) {
	fs.readdir(logFolder, (err, files) => {
		res.json({files:files.filter(file => file.endsWith('.log'))})
	})
})

http.listen(3000, function () {
	console.log('LogParser listening on port 3000!')
})

watch()
