function Vector2D( dx, dy ) {

	//check that the 'new' keyword is being used...
	if ( !(this instanceof arguments.callee) ) throw new Error("Vector2D constructor called as a function");

	this.x = dx || 0;
	this.y = dy || 0;
	
}	
	
Vector2D.prototype.set = function( xn, yn ) {
	this.x = xn;
	this.y = yn;
};
	
Vector2D.prototype.reset = function() {
	this.x = 0;
	this.y = 0;
};

Vector2D.prototype.addVector = function(v2) {
	this.x += v2.x;
	this.y += v2.y;
};
		
Vector2D.prototype.subtractVector = function(v2) {
	this.x -= v2.x;
	this.y -= v2.y;
};

Vector2D.prototype.multiply = function( n ) {
	this.x *= n;
	this.y *= n;
};

Vector2D.prototype.multiplyVector = function(v2) {
	this.x *= v2.x;
	this.y *= v2.y;
};

Vector2D.prototype.divide = function(n) {
	this.x /= n;
	this.y /= n;
};

//give() gives the x,y values of this instance to another
Vector2D.prototype.give = function(v2) {
	v2.x = this.x;
	v2.y = this.y;
};
	
//copy() copies the x,y values of another instance to this
Vector2D.prototype.copy = function(v2) {
	this.x = v2.x;
	this.y = v2.y;
};
		
Vector2D.prototype.setRotation = function(n) {
	var length = this.getLength();
	this.x = Math.cos(n)*length;
	this.y = Math.sin(n)*length;
};
	
Vector2D.prototype.setRotationDeg = function(n) {
	var length = this.getLength();
	n = n * 57.2957;
	this.x = Math.cos(n)*length;
	this.y = Math.sin(n)*length;
};
	
Vector2D.prototype.rotateBy = function(n) {
	var angle = this.getAngle();
	var length = this.getLength();
	this.x = Math.cos(n+angle)*length;
	this.y = Math.sin(n+angle)*length;
};
	
Vector2D.prototype.rotateByDeg = function(n) {
	n *= 0.0174532925;
	this.rotateBy(n);
};

Vector2D.prototype.normalize = function(n ) {
	n ? null : n = 1 ;
	var length = Math.sqrt(this.x*this.x+this.y*this.y);
	this.x = (this.x/length) * n;
	this.y = (this.y/length) * n;
};
	
Vector2D.prototype.normalise = function(n ) {
	n ? null : n = 1 ;
	var length = Math.sqrt(this.x*this.x+this.y*this.y);
	this.x = (this.x/length) * n;
	this.y = (this.y/length) * n;
};
	
Vector2D.prototype.getLength = function() {
	return (Math.sqrt(this.x*this.x+this.y*this.y));
};
	
Vector2D.prototype.setLength = function(newlength) {
	this.normalize(1);
	this.x *= newlength;
	this.y *= newlength;
};
	
Vector2D.prototype.getAngle = function() {
	return ( Math.atan2( this.y,this.x) );
};
	
Vector2D.prototype.getAngleDeg = function() {
	return (Math.atan2(this.y,this.x) * 57.2957 );
};
	
//provides the angle of vector relative to another. Returns a positive or negative number ( ie includes the *direction* )
Vector2D.prototype.getAngleToVector = function( v2 ) {
	return ( Math.atan2(v2.y, v2.x) - Math.atan2(this.y, this.x) );	
};

Vector2D.prototype.getAngleToVectorDeg = function( v2 ) {
	return ( Math.atan2(v2.y, v2.x) - Math.atan2(this.y, this.x) ) * 57.2957795;	
};

//provides the angle of vector relative to another. Same as getAngleToVector but does *NOT* return a positive or negative number ( no direction information )
Vector2D.prototype.getAngleWithVector = function( v2 ) {
	//acos(v1.•v2)
	return Math.acos( this.dot( v2 ) );
};
	
//dot product
Vector2D.prototype.dot = function(v2) {
	return (this.x*v2.x+this.y*v2.y);
};
	
Vector2D.prototype.cloneVector = function() {
	return new Vector2D(this.x, this.y);
};
	
//returns string of contents
Vector2D.prototype.inspect = function() {
	return 'x:' + this.x + 'y:' + this.y;
};

exports.Vector2D = Vector2D;