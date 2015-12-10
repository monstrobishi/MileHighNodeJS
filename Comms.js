var Vector2D = require('./LGVector').Vector2D;
var fs = require('fs');
var http = require('http');
var Logger = require('./Logger');

exports.putGlobalData = function(planes, players)
{
	fs.writeFile("./Vis/Sam/data.json", planes);
	fs.writeFile("./Vis/Sam/players.json", players);
}
