var Vector2D = require('./LGVector').Vector2D;
var Logger = require('./Logger');

var degMulti = 57.2957795;

var Plane = function(initialType, simulation)
{
	this.simulation = simulation;
	this.position = new Vector2D();
	this.rotation = 1.0;
	this.id = simulation.planeIdCounter++;
	this.type = "plane";
	this.fuel = 100;

	this.waypoint = null;

	// Always do this at the end so we can pass in a saved initialType for saving/loading purposes.
	for(k in initialType)
		this[k] = initialType[k];
};

Plane.prototype.getDirection = function(amplitude)
{
	if(amplitude == undefined)
		amplitude = 1.0;

	var dir = new Vector2D(0.0, amplitude);
	dir.rotateByDeg(this.rotation);
	return dir;
}

function fmod(a, b)
{
	//return a % b; // Does this actually work??
	while(a < b) a += b;
	while(a > b) a -= b;

	return a;
}

Plane.prototype.update = function()
{
	var realSpeed = this.speed / this.simulation.config.ticksPerSecond;

	// Check again.	
	if(this.waypoint && !this.landing && !this.crashing)
	{		
		var waypoint = this.waypoint;

		var wVec = new Vector2D(waypoint.x, waypoint.y);
		wVec.subtractVector(this.position);

		//realSpeed = Math.min(this.speed, wVec.getLength());
		wVec.normalize();

		var angleToVec = wVec.getAngleToVector(this.getDirection()) * degMulti;

		if(Math.abs(angleToVec) > 0.0001)
		{
			angleToVec = -180 + fmod(angleToVec + 180, 360.0);

			var realTurnSpeed = Math.max(Math.min(angleToVec, this.turn_speed), -this.turn_speed);

			this.rotation -= realTurnSpeed;

			// Get this within [-180,180] range
			this.rotation = fmod(this.rotation + 180, 360.0) - 180;
		}
	}

	this.position.addVector(this.getDirection(realSpeed));

	this.position.x = fmod(this.position.x, this.simulation.totalBoundary.getWidth());
	this.position.y = fmod(this.position.y, this.simulation.totalBoundary.getHeight());

	if(this.simulation.config.fuelEnabled)
		this.fuel -= this.simulation.config.fuelConsumptionRate;
}

exports.Plane = Plane;
