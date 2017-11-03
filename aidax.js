var request = require("request");

/**
 * Adds a user to AIDAX.
 *
 * key: the server key.
 * userObj: the java object of the user.
 */
module.exports.user = function (key, userObj, callback){
	//We will just ignore this request if the user provide undefined as a param:
	if (key === undefined) { callback(false); return; }
	if (userObj === undefined) { callback(false); return; }
	
	var requestData = {
		url: "https://api.aidax.com.br/user?key="+key+"&uid="+userObj.id+"&p="+JSON.stringify(userObj.properties),
		strictSSL: false,
		method:'GET',
	};
	
	request(requestData, function(error, response, body) {
		console.log(body);
		if (error != null){
			callback(false);
		} else if (response.statusCode == 200){
			callback(true);
		} else {
			callback(false);
		}
	});
};