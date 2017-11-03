var http = require('http');
var express = require("express");
var app = express();
var formidable = require('formidable')
var fs = require('fs');
var ax = require('./aidax');

app.use(express.static(__dirname + '/views'));

app.post('/fileupload', function(req, res){
	/* The file will be uploaded to this path. */
	
	//Reference to the uploaded form:
	var form = new formidable.IncomingForm();
 
    form.parse(req, function(err, fields, files) {
		var successful = 0, 				//number of successful imports.
			failed = 0,						//number of failed imports
			requestCount = 0,				//number of request made to the AIDAX server
			requestDone = 0,				//number of finished request
			lastRequest = 0,				//the last time a request was made
			speed = parseInt(fields.speed),	//the time we should wait between requests
			delimiter = fields.delimiter,	//delimiter char.
			properties;						//the name of the properties of the user.
	
		
		//We are going to read line by line:
		var lineReader = require('readline').createInterface({
			input: fs.createReadStream(files.csvFile.path)
		});

		console.log("Server-side importing");
		var firstLine = true;
		//For every line:
		lineReader.on('line', function (line) {
			//We check if the line is empty, if it is we skip this:
			if (line.trim() === '') { return; }
			
			//This is the content of the line:
			var content = line.split(delimiter);
			if (firstLine){
				//If this is the first line we must get the properties name or set a new name to be used.
				firstLine = false;
				if (fields.header){
					//The first line is the header, so we just use it as the properties' names:
					properties = content;
					return;
				} else {
					//We are going to create new names to the properties:
					for (var i = 0; i < content.length; i++){
						properties.push("property_"+i);
					}
				}
			} 
			
			//Now we are going to create the object to hold the user data:
			var attr = { };
			for (var i = 1; i < content.length; i++){
				if (content[i] !== '') 
					attr[properties[i]] = content[i];
			}
			
			//We are going to send the data to AIDAX now:
			requestCount++;
			lastRequest += speed;
			setTimeout(function(){
				ax.user('7a2dd668-3293-4282-9378-30b337a3c5f3', { 
					id : content[0], 
					properties: attr
				}, 
				function(wasItSuccessful){
					//This function is called after the request is done and informs if it was successful or not.
					if (wasItSuccessful) successful++;
					else failed++;
					requestDone++;
					
					//Reporting the status on the log:
					process.stdout.write("Progress: "  +(requestDone/requestCount * 100) + "%");
					
					//We can tell if this is the last request if this is the response to the last request.
					if (requestDone == requestCount){
						//if it is we just inform the client:
						console.log("Done.");
						res.writeHead(200, {'Content-Type': 'application/json'});
						res.end(JSON.stringify({ result: true, success:successful, fail:failed }));
					}
				});
			}, lastRequest);
			
		});		 
    });
});

app.get('/',function(req,res){
	res.sendFile("index.html");
});

console.log("Starting server.");
app.listen(8080, function (){
	console.log("Server is running on http://localhost:8080");
}).on('error', function(err) { console.log("Oops, something went wrong, the server is not up."); });
