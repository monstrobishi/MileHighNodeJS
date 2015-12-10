var Vector2D = require("./LGVector").Vector2D;

var Rect2D = function(size)
{
	if(!size)
		size = 0;

	this.min = new Vector2D(0,0);
	this.max = new Vector2D(size,size);
	
	this.isPointInside = function(point)
	{
		return 	point.x >= this.min.x && point.y >= this.min.y &&
				point.x <= this.max.x && point.y <= this.max.y;
	}

	this.addRect = function(other)
	{
		this.min.x = Math.min(this.min.x, other.min.x);
		this.min.y = Math.min(this.min.y, other.min.y);

		this.max.x = Math.max(this.max.x, other.max.x);
		this.max.y = Math.max(this.max.y, other.max.y);
	}

	this.getWidth = function()
	{
		return this.max.x - this.min.x;
	}

	this.getHeight = function()
	{
		return this.max.y - this.min.y;
	}
}

exports.Rect2D = Rect2D;