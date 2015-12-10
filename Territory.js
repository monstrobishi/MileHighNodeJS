var Rect2D = require('./Rect2D').Rect2D;
var Plane = require('./Plane').Plane;
var Logger = require('./Logger');
var Vector2D = require('./LGVector').Vector2D;

var Territory = function(offset, player)
{
	this.player = player;

	this.boundary = new Rect2D(1000);
	this.boundary.min.addVector(offset);
	this.boundary.max.addVector(offset);
	
	this.objects = [];
	this.directions = [];

	this.runway = new Vector2D();
	this.runway.x = this.boundary.min.x + this.boundary.getWidth() * 0.5;
	this.runway.y = this.boundary.min.y + this.boundary.getHeight() * 0.4;

	this.isPlaneInside = function(plane)
	{
		//Logger.log(JSON.stringify(plane.position) + " testing against " + JSON.stringify(this.boundary));
		return this.boundary.isPointInside(plane.position);
	};
	
	this.updateInteractions = function()
	{	
		//Logger.log("Length: " + this.objects.length);
		for (var i = this.objects.length - 1; i >= 0; i--) 
		{
			var obj = this.objects[i];

			for(var j = 0;j < this.directions.length;j++)
			{
				//Logger.log("D ID: " + this.directions[j].plane_id + " P ID: " + obj.id);

				var intId = parseInt(this.directions[j].plane_id);
				if(intId == obj.id)
					obj.waypoint = this.directions[j].waypoint;
			}

			obj.update();
		}
	}
};

exports.Territory = Territory;