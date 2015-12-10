exports.equalsEpsilon = function(val1, val2, epsilon)
{
	if(epsilon == undefined)
		epsilon = 0.001;

	return ((val1 + epsilon) > val2 && (val1 - epsilon) < val2);
}

exports.stringifyTerritory = function(t)
{
	return JSON.stringify(t, 
		function(key, value) 
		{
		    if (key == "taggedToPlayer" || key == "player" || key == "simulation")
		    	return;

		    return value;
		}, "\t"
	);
}

// ref: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

exports.guid = function() {
  return s4() + s4() + s4();
}

var pastGuid = [];

exports.uniqueGuid = function() 
{
	var guid;

	do { guid = exports.guid(); }
	while(pastGuid.indexOf(guid) > -1);

	pastGuid.push(guid);

	return guid;
}