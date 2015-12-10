var degToRad = Math.PI / 180.0;
var resourcePrefix = "static/resources";
var simulationResourcePrefix = "static/resources/teams/" + token;
var defaultResourcePrefix = "static/resources/teams/default";

var columnCount = 2;
var territorySize = 1000.0;
var territoryPadding = 200.0;
var lastGraphicsUpdate = new Date("2000-01-01");

var groundMeshes = [];
var runwayGeometry = new THREE.PlaneGeometry(territorySize * 0.05, territorySize * 0.3);
var planes = {};

// Sound stuff...
buzz.defaults.preload = 'true';
buzz.defaults.loop = 'false';
buzz.defaults.formats = ['mp3'];

var soundEnabled = true;

function playSound (soundType, plane) {
	//if(!soundEnabled)
	return;

	var i = Math.floor(Math.random() * 2) + 1;
	var sound = new buzz.sound(simulationResourcePrefix + "/" + plane.player_path + "/" + soundType + i);

	console.log("Playing sound: " + simulationResourcePrefix + "/" + plane.player_path + "/" + soundType + i);
	sound.play().unloop();
	buzz.sounds = [];
}

var container = document.getElementById('container');

var aspect = window.innerWidth / window.innerHeight;
var topCamera = new THREE.PerspectiveCamera( 60, aspect, 100, 5000 );
topCamera.position = new THREE.Vector3(0, 1000, 50);
topCamera.lookAt(new THREE.Vector3(0, 0, 0));

// Increase the FOV for this one ;)
var eventCamera = new THREE.PerspectiveCamera( 80, aspect, 0.5, 2000 );

var latestEventLocation = null;

var scene = new THREE.Scene();

var currentCam = topCamera;

var expEmitters = [];

// Add a light.
var light = new THREE.PointLight( 0xffffff, 1, 10000 );
light.position.set( -200, 1500, -1000);
scene.add( light );

light = new THREE.AmbientLight( 0x111111 ); // soft white light
scene.add( light );

// Create water.
var waterGeometry = new THREE.PlaneGeometry(10000, 10000);
var shoreMap = THREE.ImageUtils.loadTexture(resourcePrefix + "/shore.png");
var normalMap = THREE.ImageUtils.loadTexture(resourcePrefix + "/water.jpg");
normalMap.wrapS = THREE.RepeatWrapping;
normalMap.wrapT = THREE.RepeatWrapping;

var waterMaterial = null;

if(!canvasRenderer)
{
	var vertexShaderText = $('#vertexshader').text();
	var fragmentShaderText = $('#fragmentshader').text();
	waterMaterial = new THREE.ShaderMaterial({
		vertexShader: vertexShaderText,
		fragmentShader: fragmentShaderText,
		side: THREE.DoubleSide
	});

	waterMaterial.uniforms["shoreMap"] = {type: "t", value: shoreMap};
	waterMaterial.uniforms["normalMap"] = {type: "t", value: normalMap};
	waterMaterial.uniforms["ticker"] = {type: "f", value: 0};
	waterMaterial.uniforms["viewPos"] = {type: "v3", value: new THREE.Vector3()};

	var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
	waterMesh.rotation.x = Math.PI / 2.0;
	waterMesh.position.y = -1;
	waterMesh.position.x += 1000;
	scene.add(waterMesh);

	var lightBox = new THREE.Mesh(new THREE.CubeGeometry(50, 50, 50), new THREE.MeshBasicMaterial({color: 0xff0000}));
	lightBox.position = new THREE.Vector3(500, 100, 100);
	scene.add(lightBox);
}

// Lay down some clouds.
var cloudTexture	= THREE.ImageUtils.loadTexture(resourcePrefix + "/cloud.png");
cloudTexture.magFilter	= THREE.LinearFilter;
cloudTexture.minFilter	= THREE.LinearMipMapLinearFilter;
var cloudEmitter	= null;
var expTexture	= THREE.ImageUtils.loadTexture(resourcePrefix + "/explosion.png");
expTexture.magFilter	= THREE.LinearFilter;
expTexture.minFilter	= THREE.LinearMipMapLinearFilter;

// Create the renderer.
var renderer = canvasRenderer ? new THREE.CanvasRenderer() : new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color(0x0f4a84), 1.0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.sortObjects = false;

container.appendChild(renderer.domElement);

var offsetCounter = 0.0;
function render() 
{
	offsetCounter += 0.0005;
	normalMap.offset.set(offsetCounter, offsetCounter);

	renderer.render(scene, currentCam);
}

function animate() 
{
	requestAnimationFrame(animate);
	render();
}

function getImageData( image ) {

    var canvas = document.createElement( 'canvas' );
    canvas.width = image.width;
    canvas.height = image.height;

    var context = canvas.getContext( '2d' );
    context.drawImage( image, 0, 0 );

    return context.getImageData( 0, 0, image.width, image.height );

}

function getPixel( imagedata, x, y ) {

    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
    return { r: data[ position ], g: data[ position + 1 ], b: data[ position + 2 ], a: data[ position + 3 ] };

}

// var imagedata = getImageData( imgTexture.image );
// var color = getPixel( imagedata, 10, 10 );

function createGroundMeshes(data)
{
	var offset = new THREE.Vector3(territoryPadding / 2.0, 0.0, territoryPadding / 2.0);

	for(var i = 0;i < data.players.length;i++)
	{
		var player = data.players[i];

		var groundGeometry = new THREE.PlaneGeometry(territorySize, territorySize, 255, 255);

		for ( var i = 0, l = groundGeometry.vertices.length; i < l; i ++ )
			groundGeometry.vertices[ i ].z = groundGeometry.vertices[ i ].x * groundGeometry.vertices[ i ].x * 0.001;

		groundGeometry.computeFaceNormals();
		
		var mesh = new THREE.Mesh(groundGeometry, new THREE.MeshLambertMaterial({side: THREE.DoubleSide, transparent: true, depthWrite: false}));
		mesh.rotation = new THREE.Vector3(-Math.PI / 2, 0, 0);
		mesh.position = offset.clone();
		mesh.position.x += territorySize / 2.0;
		mesh.position.z += territorySize / 2.0;

		mesh.visible = false;
		scene.add(mesh);
		groundMeshes.push(mesh);

		// Create runway
		var runway = new THREE.Mesh(runwayGeometry, new THREE.MeshBasicMaterial({side: THREE.DoubleSide, color: 0x606060}));
		runway.rotation = new THREE.Vector3(Math.PI / 2, 0, 0);
		runway.position = offset.clone();
		runway.position.x += territorySize * 0.5;
		runway.position.y += 1.0;
		runway.position.z += territorySize * 0.65;
		scene.add(runway);

		offset.x += territorySize;
		offset.x += territoryPadding;

		if(i == (columnCount - 1))
		{
			offset.x = territoryPadding / 2.0;
			offset.z += territorySize + territoryPadding;
		}
	}

	var effectiveTerritorySize = data.players.length > 1 ? territorySize : territorySize / 2;

	var unitSize = effectiveTerritorySize * 2 + territoryPadding * 2;

	var offset = 1000;

	topCamera.position = new THREE.Vector3(effectiveTerritorySize, unitSize * 0.75, effectiveTerritorySize + offset * 0.7);

	if(data.players.length > 1)
		topCamera.lookAt(new THREE.Vector3(effectiveTerritorySize, 0, effectiveTerritorySize + offset * 0.28));
	else
		topCamera.lookAt(new THREE.Vector3(effectiveTerritorySize, 0, effectiveTerritorySize + offset * 0.2));


	waterMaterial.uniforms["viewPos"].value = topCamera.position;

	var boxOffset = territoryPadding * 2;

	if(!canvasRenderer)
	{
		// cloudEmitter = Fireworks.createEmitter({nParticles : data.players.length > 1 ? 300 : 100})
		// .effectsStackBuilder()
		// 	.spawnerOneShot()
		// 	.spawnerSteadyRate(5)
		// 	.randomVelocityDrift(Fireworks.createVector(-0.5,-0.5,0))
		// 	.lifeTime(20, 100)
		// 	.velocity(Fireworks.createShapeSphere(-2, 0, -2, 0.1))
		// 	.position(Fireworks.createShapeBox(effectiveTerritorySize + boxOffset, 100, effectiveTerritorySize + boxOffset, 
		// 		effectiveTerritorySize * 2 + boxOffset, 150, effectiveTerritorySize * 2 + boxOffset))
		// 	.renderToThreejsObject3D({
		// 		container	: scene,
		// 		create		: function(){
		// 			var object3d	= new THREE.Sprite(new THREE.SpriteMaterial({
		// 				map			: cloudTexture,
		// 				useScreenCoordinates : false,
		// 				opacity : 0.75 * Math.random()
		// 			}));
		// 			object3d.rotation	= Math.random() * 2*Math.PI;
		// 			object3d.scale.multiplyScalar(50 * (Math.random() * 0.4 + 0.8))
		// 			return object3d;		
		// 		}
		// 	})
		// 	.back()
		// .start();
	}
}

function updateGroundGraphics(data)
{
	for(var i = 0;i < data.players.length;i++)
	{
		var mesh = groundMeshes[i];

		if(canvasRenderer)
		{
			mesh.material.map = THREE.ImageUtils.loadTexture(simulationResourcePrefix + "/player" + (i + 1) + "/land.png");
		}
		else
		{
			mesh.material.opacity = 0;
			mesh.material.map = THREE.ImageUtils.loadTexture(simulationResourcePrefix + "/player" + (i + 1) + "/land.png", null, function(mat){return function() {
	            mat.opacity = 1;
	        }}(mesh.material));
		}
	}
}

var allowCameraSwitch = false;
function updateCamera()
{
	if(!allowCameraSwitch)
		return;

	currentCam = eventCamera;
	eventCamera.position = latestEventLocation.clone();
	eventCamera.position.add(new THREE.Vector3(-50, 200, 50));

	eventCamera.lookAt(latestEventLocation.clone());

	latestEventLocation = null;
	allowCameraSwitch = false;
	
	setTimeout(function()
	{
		currentCam = topCamera;

		setTimeout(function(){
			allowCameraSwitch = true;
		}, 8000);
	}, 2000);
}

function applyPlaneTexture(plane, material)
{
	if(canvasRenderer)
	{
		material.map = THREE.ImageUtils.loadTexture(plane.graphic_full_path == undefined ? (defaultResourcePrefix + "/" + plane.graphic)
			: (simulationResourcePrefix + "/" + plane.graphic_full_path));
	}
	else
	{
		material.opacity = 0;
		material.map = THREE.ImageUtils.loadTexture(plane.graphic_full_path == undefined ? (defaultResourcePrefix + "/" + plane.graphic)
			: (simulationResourcePrefix + "/" + plane.graphic_full_path), null, function() {
	            material.opacity = 1;
	        });
	}
}

var startDate = new Date();

function update()
{

	if(!canvasRenderer)
	{
		if(cloudEmitter)
			cloudEmitter.update(0.5).render();

		for(var i = 0;i < expEmitters.length;i++) {
			expEmitters[i].update(0.1).render();
			if(expEmitters[i] && expEmitters[i].liveParticles().length == 0)
				expEmitters.splice(i--, 1);
		}

		waterMaterial.uniforms["ticker"].value = (new Date().getTime() - startDate.getTime()) / 50000.0;
	}

	$.getJSON('global-data?token=' + token, function(data) {
		if(!groundMeshes.length)
			createGroundMeshes(data);

		var updateGraphics = new Date(data.graphics_updated) > lastGraphicsUpdate;
		lastGraphicsUpdate = new Date(data.graphics_updated);

		if(updateGraphics)
			updateGroundGraphics(data);

		var planeCount = 0;

		for(var id in planes)
		{
			planeCount++;

			if(!planes[id].triggered)
			{
				scene.remove(planes[id]);
				delete planes[id];
			}
			else
			{
				planes[id].triggered = false;
			}
		}

		for(var i = 0;i < data.planes.length;i++)
		{
			var plane = data.planes[i];
			var planeSize = plane.collision_radius * 2.0;

			if(!planes[plane.id])
			{
				// Create plane.
				var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide,  transparent: true, depthWrite: false});
				applyPlaneTexture(plane, material);				
				var planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
				var mesh = new THREE.Mesh(planeGeometry, material);
				mesh.position.y = 50.0 + Math.random();
				mesh.rotation.x = Math.PI / 2;
				scene.add(mesh);

				planes[plane.id] = mesh;
				planes[plane.id].oldGraphicPath = plane.graphic_full_path;
			}

			var planeMesh = planes[plane.id];
			planeMesh.rotation.z = plane.rotation * degToRad;
			planeMesh.position.x = plane.position.x;
			planeMesh.position.z = plane.position.y;

			if(updateGraphics || planeMesh.oldGraphicPath != plane.graphic_full_path)
			{
				applyPlaneTexture(plane, planeMesh.material);
				planeMesh.oldGraphicPath = plane.graphic_full_path;
			}

			planeMesh.triggered = true;

			if(plane.fuel < 20)
				planeMesh.visible = ~~((new Date()).getTime() / 200) % 2 == 0;

			if(plane.landing)
			{
				if(!planes[plane.id].landingSoundPlayed)
					playSound("landing", plane);
				planes[plane.id].landingSoundPlayed = true;

				planeMesh.position.y -= 5.0;
				latestEventLocation = new THREE.Vector3(plane.position.x, 0, plane.position.y);

				// Instaswitch
				updateCamera();
			}
			else if(plane.crashing && Math.random() > 0.1) // Don't view every crash...
			{
				if(!planes[plane.id].crashSoundPlayed)
				{
					playSound("explode", plane);

					if(!canvasRenderer)
					{
						var expEmitter	= Fireworks.createEmitter({nParticles : 80})
							.effectsStackBuilder()
								.spawnerOneShot(50)
								.position(Fireworks.createShapeSphere(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z, 1))
								.velocity(Fireworks.createShapeSphere(0, 0, 0, 50))
								.lifeTime(0.7, 1)
								.renderToThreejsObject3D({
									container	: scene,
									create		: function(){
										var object3d	= new THREE.Sprite(new THREE.SpriteMaterial({
											map			: expTexture,
											useScreenCoordinates : false,
											opacity : 0.75 * Math.random()
										}));
										object3d.rotation	= Math.random() * 2*Math.PI;
										object3d.scale.multiplyScalar(50 * (Math.random() * 0.4 + 0.8))
										return object3d;		
									}
								})
								.back()
							.start();
						expEmitters.push(expEmitter);
					}
				}
				planes[plane.id].crashSoundPlayed = true;

				planeMesh.rotation.y += 0.5;
				latestEventLocation = new THREE.Vector3(plane.position.x, 0, plane.position.y);

				// Instaswitch
				updateCamera();
			}
		}
	});
}

// Update every 100 milliseconds
setInterval(update, 100);

// Allow a switch from the top cam after a short delay...
setTimeout(function(){
			allowCameraSwitch = true;
		}, 2000);

animate();

$(document).keydown(function(e){
if (e.keyCode==77)
    soundEnabled = !soundEnabled;
});
