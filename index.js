const express = require('express')
var request = require('request')
const fs = require('fs')
const app = express()
const baseURL = 'http://localhost:3000'

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
	return res
}

function fileExists(file) {
	return true
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
	const logFolder = './public/data'

	fs.readdir(logFolder, (err, files) => {
		res.json({files:files})
	})
})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})
