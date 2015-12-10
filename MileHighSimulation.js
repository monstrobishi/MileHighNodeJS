var Territory = require('./Territory').Territory;
var Vector2D = require("./LGVector").Vector2D;
var Rect2D = require('./Rect2D').Rect2D;
var Plane = require('./Plane').Plane;
var Logger = require('./Logger');
var http = require('http');
var url = require('url');
var Util = require('./Util');

var DIR_UP = 0;
var DIR_RIGHT = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 3;
var DIR_COUNT = 4;

var MileHighSimulation = function(config, id)
{
	this.players = [];
	this.planes = [];
	this.deadSpace = [];
	this.tickCounter = 0;
	this.ticksTillNextPlane = 0;
	this.totalBoundary = new Rect2D();
	this.config = JSON.parse(JSON.stringify(config)); // Copy object
	this.id = id;
	this.graphics_updated = new Date();
	this.planeIdCounter = 1000;
	//this.windDirection = new Vector2D();

	var _this = this;

	this.log = function(msg)
	{
		Logger.log("Simulation " + id + ": " + msg);
	}

	this.generateRandomPlane = function(boundary)
	{
		var dir = ~~(Math.random() * DIR_COUNT);
		var randomLocation;

		var angleVariation = 135.0;

		var planeType = Math.floor(Math.random() * _this.config.planeTypes.length);
		var plane = new Plane(_this.config.planeTypes[planeType], _this);
		plane.rotation = (Math.random() * angleVariation * 0.5) - angleVariation * 0.5;
		var padding = 100;

		if(_this.config.fuelEnabled)
		{
			if(Math.random() < 0.1)
				plane.fuel = 20;
		}

		switch(dir)
		{
			case DIR_UP:
				randomLocation = new Vector2D(boundary.min.x + padding + (boundary.getWidth() - padding) * Math.random(), boundary.min.y);
			break;
			case DIR_DOWN:
				randomLocation = new Vector2D(boundary.min.x + padding + (boundary.getWidth() - padding) * Math.random(), boundary.max.y);
				plane.rotation += 180.0;
			break;
			case DIR_LEFT:
				randomLocation = new Vector2D(boundary.min.x, boundary.min.y + padding + (boundary.getHeight() - padding) * Math.random());
				plane.rotation -= 90.0;
			break;
			case DIR_RIGHT:
				randomLocation = new Vector2D(boundary.max.x, boundary.min.y + padding + (boundary.getHeight() - padding) * Math.random());
				plane.rotation += 90.0;
			break;
		}

		//_this.log("New plane generated at " + JSON.stringify(randomLocation));
		plane.position = randomLocation;
		_this.planes.push(plane);
	}
	
	this.init = function()
	{
		var offset = new Vector2D(_this.config.territoryPadding / 2.0, _this.config.territoryPadding / 2.0);

		for(var i = 0;i < _this.config.players.length;i++)
		{
			var player = _this.config.players[i];

			player.score = 0;
			player.territory = new Territory(offset.cloneVector(), player);
			
			_this.log("Adding player " + player.name + " at offset " + offset.x + ", " + offset.y);
			
			this.totalBoundary.addRect(player.territory.boundary);

			this.players.push(player);

			offset.x += _this.config.territorySize;
			offset.x += _this.config.territoryPadding;

			if(i == (_this.config.columnCount - 1))
			{
				offset.x = _this.config.territoryPadding / 2.0;
				offset.y += _this.config.territorySize + _this.config.territoryPadding;
			}
		}

		// Add a bit of padding at the end.
		this.totalBoundary.max.x += _this.config.territoryPadding / 2.0;
		this.totalBoundary.max.y += _this.config.territoryPadding / 2.0;

		_this.log("Total territory is " + JSON.stringify(this.totalBoundary));

		if(_this.config.timeLimit)
			_this.stopTime = new Date().getTime() + _this.config.timeLimit * 60000;
	}

	this.updatePlaneOwnership = function()
	{
		this.deadSpace = [];

		for(var j = 0; j < this.players.length; j++)
			this.players[j].territory.objects = [];

		for(var i = this.planes.length - 1; i >= 0; i--) 
		{
			var plane = this.planes[i];
			var placedInTerritory = false;

			for(var j = 0; j < this.players.length; j++)
			{
				var territory = this.players[j].territory;
				if(territory.isPlaneInside(plane))
				{
					territory.objects.push(plane);
					plane.taggedToPlayer = this.players[j];
					plane.graphic_full_path = "player" + (j + 1) + "/" + plane.graphic;
					plane.player_path = "player" + (j + 1);
					placedInTerritory = true;
				}
			}

			if(!placedInTerritory)
				this.deadSpace.push(plane);
		}
	}

	this.checkLandingConditions = function()
	{
		for(var i = 0;i < this.planes.length;i++)
		{
			var plane = this.planes[i];

			if(plane.crashing || plane.landing)
				continue;

			if(plane.taggedToPlayer)
			{
				var runwayPos = new Vector2D();
				runwayPos.copy(plane.taggedToPlayer.territory.runway);

				if(	Util.equalsEpsilon(plane.position.x, runwayPos.x, _this.config.goalProximity) &&
					Util.equalsEpsilon(plane.position.y, runwayPos.y, _this.config.goalProximity) &&
					Util.equalsEpsilon(plane.rotation, 0.0, _this.config.landingLenience))
				{
					_this.landPlane(plane);
				}
			}
		}
	}

	this.removePlane = function(plane)
	{
		var i = _this.planes.indexOf(plane);
		if(i != -1)
			_this.planes.splice(i, 1);
	}

	this.crashPlane = function(plane)
	{
		plane.crashing = true;

		if(plane.taggedToPlayer)
			plane.taggedToPlayer.score -= plane.penalty;
	
		setTimeout(function(plane) {return function(){_this.removePlane(plane);}}(plane), _this.config.crashDuration);
	}

	this.landPlane = function(plane)
	{
		plane.landing = true;
		plane.taggedToPlayer.score += plane.points;
		setTimeout(function(plane) {return function(){_this.removePlane(plane);}}(plane), _this.config.crashDuration);
	}

	this.checkPlaneIntersections = function()
	{
		for(var i = 0;i < _this.planes.length;i++)
		{
			var plane = _this.planes[i];

			if(plane.crashing || plane.landing)
				continue;

			if(plane.taggedToPlayer)
			{
				// Hits another plane.
				for(var j = 0;j < _this.planes.length;j++)
				{
					var otherPlane = _this.planes[j];
					if(plane == otherPlane || otherPlane.crashing || otherPlane.landing)
						continue;

					var distVec = new Vector2D();
					distVec.copy(otherPlane.position);
					distVec.subtractVector(plane.position);

					if(distVec.getLength() < (plane.collision_radius + otherPlane.collision_radius))
					{
						_this.crashPlane(plane);
						_this.crashPlane(otherPlane);
					}
				}

				// Or if it's out of fuel.
				if(_this.config.fuelEnabled)
					if(plane.fuel < 0.0)
						_this.crashPlane(plane);
			}
		}
	}

	this.getGenerationInterval = function()
	{
		return _this.config.minGenerationInterval + (_this.config.maxGenerationInterval - _this.config.minGenerationInterval) * Math.random();
	}

	this.setPlayerDirections = function(index, data)
	{
		_this.players[index].territory.directions = data;
	}

	this.getPlayerData = function(index)
	{
		return Util.stringifyTerritory(_this.players[index].territory);
	}

	this.getGlobalDataString = function() {
		// Output stuff for the vis
		var globalData = {
			planes: _this.planes,
			players: _this.players,
			graphics_updated: _this.graphics_updated,
			token: _this.id,
			end_time: _this.stopTime
		};

		var globalDataString = JSON.stringify(globalData, 
			function(key, value) {
				if (key == "simulation")
					return;

			    if (key == "taggedToPlayer")
			    	return;

			    if (key == "territory")
			    	return;

			    return value;
			}, "\t"
		);

		return globalDataString;
	}

	this.update = function() {
		try {
			_this.tickCounter++;
			_this.ticksTillNextPlane--;

			if(_this.ticksTillNextPlane <= 0)
			{
				for(var i = 0; i < _this.players.length; i++)
					_this.generateRandomPlane(_this.players[i].territory.boundary);
				_this.ticksTillNextPlane = _this.getGenerationInterval();
			}

			for(var i = 0; i < _this.players.length; i++)
			{
				var player = _this.players[i];

				try {
					player.territory.updateInteractions();
				}
				catch(e) {
					_this.log(e.stack);
				}
			}

			// Update all deadspace objects.
			for(var i = _this.deadSpace.length - 1; i >= 0; i--)
				_this.deadSpace[i].update();

			// Calculate which player is responsible for each plane.
			_this.updatePlaneOwnership();

			// Check landing conditions after all that.
			_this.checkLandingConditions();

			// Collisions! BOOM!
			_this.checkPlaneIntersections();
		}
		catch(e)
		{
			_this.log("Simulation tick failed. Reason: " + e + " Stack: " + e.stack);
		}
	}
};

exports.MileHighSimulation = MileHighSimulation;