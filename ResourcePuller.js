var fs = require('fs');
var http = require('http');

var updateInterval = 1000;//60000

var ResourcePuller = function()
{
	var that = this;

	this.init = function()
	{
		this.players = Config.players;
	}

	this.update = function()
	{
		for(var i = 0;i < this.players.length;i++)
		{
			var player = this.players[i];

			if(!player.ip)
				continue;

			console.log("lol");
			http.get(
			{
				host : player.ip,
				port: 80,
				path: "/resources/plane.png"
			},
				function(res) 
				{
					res.setEncoding('binary');
					res.on('data', 
						function(data) 
						{
							console.log("got data");
							fs.writeFile("./resources/Player" + (i + 1) + "/plane.png", data);
						});
				});
		}
	}

	this.triggerRunLoop = function()
	{
		setInterval(function() {that.update();}, updateInterval);
	}
};

var resourcePuller = new ResourcePuller();
resourcePuller.init();
resourcePuller.triggerRunLoop();