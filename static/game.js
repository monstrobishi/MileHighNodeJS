var objects = {};
var canvas;
var stage;
var ENV_WIDTH = 3300;
var ENV_HEIGHT = 2200;
var SCALAR = 80;
var height;
var width;
var ticker;
var zones = [];
var bg;
var planeContainer;
var explosionSpriteSheet = [];
var bang;
var planeSprite;
var resetCount = 0;
var scores = [];

var resources_prefix = "static/resources/";

function init () {
	height = $(document).height();
	width = $('body').height()*1.5;
	$('<canvas id="game" width="'+width+'" height="'+height+'"></canvas>').appendTo($('#container'));
	canvas = document.getElementById("game")
	stage = new createjs.Stage(canvas);

	ticker = createjs.Ticker;
	ticker.setFPS(5);
	ticker.addListener(stage);
	ticker.addListener(this); // listen for ticks, like a bosssss

	bg = new createjs.Shape();
	stage.addChild(bg);

	initialiseSpriteSheets();

	buzz.defaults.preload = 'true';
	buzz.defaults.loop = 'false';
	buzz.defaults.formats = ['mp3'];

	drawZones();
	scoreDisplaySetup();
	drawRunway();

	planeContainer = new createjs.Container();
	stage.addChild(planeContainer);

	stage.update();
}

function tick() {
	getPlanes();
	stage.update();
	updateScores();
}

function getPlanes () {
	$.getJSON('global-data?token=' + token, function(data) {
		if( data != null) {

			var planes = data.planes;
			for(var i = 0;i < planes.length;i++)
			{
				var plane = planes[i];

				if(!objects[plane.id])
				{
					objects[plane.id] = {
						position : {}
					};

					objects[plane.id].sprite = new createjs.Bitmap(resources_prefix + "plane.png");//plane.graphic );
					objects[plane.id].sprite.image.src = resources_prefix + "plane.png";
					objects[plane.id].sprite.scaleX = plane.collision_radius/SCALAR;
					objects[plane.id].sprite.scaleY = plane.collision_radius/SCALAR;
					objects[plane.id].sprite.regX = 50;
					objects[plane.id].sprite.regY = 50;
					objects[plane.id].graphic = plane.graphic;
					stage.addChild(objects[plane.id].sprite);
				}

				resetCount++;

				objects[plane.id].keepAlive = true;
				objects[plane.id].position.x = plane.position.x;
				objects[plane.id].sprite.x = toX(plane.position.x);
				objects[plane.id].position.y = plane.position.y;
				objects[plane.id].sprite.y = toY(plane.position.y);
				objects[plane.id].sprite.rotation = (plane.rotation + 180);

				
				if(plane.crashing && !objects[plane.id].boom)
				{
					stage.removeChild(objects[plane.id].sprite);
					if (bang) {explode(objects[plane.id].position.x,objects[plane.id].position.y); bang=!bang;}
					objects[plane.id].boom = true;
				}
			}

			for(key in objects)
			{
				if(!objects[key].keepAlive)
				{
					delete objects[key];
				} else {
					objects[key].keepAlive = false;
				}
			}

		}

	});
	bang = true;
}

$(document).ready(function() {
	init();
});

//explosions! boom bang fucking bang!

function explode (x, y) {
	
	

	x = toX(x);
	y = toY(y);

	var i = Math.floor(Math.random()*3);

	var bm = new createjs.BitmapAnimation(explosionSpriteSheet[0]);
	//center that shit yo!
	y -= bm.spriteSheet._frameHeight/2;
	x -= bm.spriteSheet._frameWidth/2;

	bm.x = x;
	bm.y = y;

	bm.onAnimationEnd = function() {
		stage.removeChild(this);
	};
	stage.addChild(bm);
	bm.gotoAndPlay("explode");
	//playSound("explosion");
}

function playSound (soundType) {
	if (soundType == 'explosion') {
		var i = (Math.floor(Math.random()*2)+1);
		var sound = new buzz.sound('static/assets/explode' + i);
		sound.play().unloop();
	}

	buzz.sounds = [];
}

function initialiseSpriteSheets () {
	explosionSpriteSheet[0] = new createjs.SpriteSheet({
		images: ["static/assets/explosion1.png"],
		frames: {x: 0, y:0,width:103, height:97, count:50},
		animations: {explode:[0,50]}
	});
}

//helper functions

function toX (x) {
	//converts x value of plane to x value of canvas
	x*=width;
	return Math.floor(x/ENV_WIDTH);	
}

function toY (y) {
	//converts y value of plane to y value of canvas
	y*=height;
	return Math.floor(y/ENV_HEIGHT);	
}

function updateScores () {
	$.getJSON('global-data?token=' + token,function(data) {
		var players = data.players;
		if( players != null) {
			for(var i = 0;i < players.length;i++) {
				scores[i].text = players[i].score;
			}
		}
	});
}


//setuo functions

function drawRunway () {
	var x, y;
	var w = 30;
	var h = 350;

	//500,400
	for (var i=1; i<=6; i++) {
		if(i<4) {
			y = 450;
		} else {
			y = 1550;
		}

		if (i==1 || i == 4) {
			x = 50 + 500 - w/2;
		} else if (i==2 || i ==5) {
			x = 1150 + 500 - w/2; 
		} else {
			x = 2250 + 500 - w/2;
		}

		var sh = new createjs.Shape(new createjs.Graphics().beginFill('#aaa').drawRect(0, 0, toX(w), toY(h)));
		sh.x = toX(x);
		sh.y = toY(y);
		stage.addChild(sh);
		stage.update();
	}


}

function scoreDisplaySetup () {

	var x,y;

	for (var i=1; i<=6; i++) {
		if(i<4) {
			y = 900;
		} else {
			y = 2000;
		}

		if (i==1 || i == 4) {
			x = 100;
		} else if (i==2 || i ==5) {
			x = 1250; 
		} else {
			x = 2350;
		}

		//var sh = new createjs.Shape(new createjs.Graphics().beginBitmapFill.drawRect(0, 0, toX(1000), toY(1000)));
		var sh = new createjs.Text('0', "bold 30px Arial", i == 1 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)");

		sh.x = toX(x);
		sh.y = toY(y);
		stage.addChild(sh);

		scores.push(sh);
		stage.update();
	}
}

function drawZones () {
	var x, y;

	for (var i=1; i<=6; i++) {
		if(i<4) {
			y = 50;
		} else {
			y = 1150;
		}

		if (i==1 || i == 4) {
			x = 50;
		} else if (i==2 || i ==5) {
			x = 1150; 
		} else {
			x = 2250;
		}

		//var sh = new createjs.Shape(new createjs.Graphics().beginBitmapFill.drawRect(0, 0, toX(1000), toY(1000)));
		var sh = new createjs.Bitmap(resources_prefix + 'land/player' + i + '.png' );
		var ratio = toX(1000)/800;

		sh.scaleY = ratio;
		sh.scaleX = ratio;

		sh.x = toX(x);
		sh.y = toY(y);
		stage.addChild(sh);

		zones.push(sh);

		stage.update();
	}
}

function drawOutlineCircle(x, y, radius, shape) {
	var g = new createjs.Graphics();
	g.beginStroke('#333',.5).drawCircle(0,0, toX(radius));

	shape = new createjs.Shape(g);
	shape.x = toX(x);
	shape.y = toY(y);

	return shape
}


function drawTitle (message) {
	var label = new createjs.Text(message, "bold 30px Arial", "rgba(0,0,0,0.3)");
	label.textAlign = "center";
	label.x = width/2;
	label.y = 20;
	stage.addChild(label);
}

function randomHexColor () {
	return '#'+Math.floor(Math.random()*16777215).toString(16);
}
