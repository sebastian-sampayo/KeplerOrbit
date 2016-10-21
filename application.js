"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
/*****************************************************************************\
  Engineering Faculty, University of Buenos Aires (FIUBA)
  Electronic Engineering
  An illustrative description of terminology for the thesis defense
  2016
 
  Sampayo, Sebastián Lucas
  Padrón: 93793
  e-mail: sebisampayo@gmail.com
          ssampayo@fi.uba.ar
 
  File: Javascript - WebGL application. Using THREE.js library.
\*****************************************************************************/
/*global THREE, Coordinates, $, document, window, dat*/

// TODO:
// - Add body axes
// - Satellite model
// - arc-angles for orbit elements argPer, i, raan
// - Sun
// - Earth orbit around the Sun
// - Epoch/date. Example: 19° April
// - Emprolijar los ifs de render()


// Global variables
var camera, scene, renderer;
var cameraControls, guiController;
var clock = new THREE.Clock();
var t = 0; // time
var play = true; // Play or stop animation
var perspective_camera = false; // false => Orthographic
// Grid, axes
var ground = false;
var grid_size = 500;
var grid_step = 100;
// Background
// var background_color = 0xFFFFFF; // White
var background_color = 0x000000; // Black
var background = true; // true = Black,  false = White
var create_stars = true;
// Orbit elements
var semimajor = 300;
var eccentricity = 0.5;
var raan = 10;
var argumentOfPerigee = 70;
var inclination = -45;
var meanAnomaly = 0;

var trueAnom = 0;
var eccAnom = 0;
var orbit_period = 10; // seconds
var earth_period = 40; // seconds
// Objects
var axes, RPYaxes, ecefAxes, perifocalAxes;
var gridXY, gridXZ, gridYZ;
var orbit, earth, satellite;
var equator, greenwich, lineOfApsides, lineOfNodes;
var equatorialPlane, ecliptic, celestial_sphere;
var earthMaterial; // Earth material
var earthRadius = 100; // Earth radius
var hour_angle = 0; // Hour angle: Angle between ECI and ECEF.
// Orbit transform matrix
var orbitMatrixRTS; // Rotation * Translation * Scale
var orbitMatrixRT; // Rotation * Translation
var orbitMatrixR; // Rotation

// Efficient. If true construct geometries and materials only at initialization. Then update transformations.
var efficient = true;

function deg2rad(deg) {
  return deg*Math.PI/180.0;
}
function rad2deg(rad) {
  return rad*180.0/Math.PI;
}

function init() {
	// var canvasWidth = 846;
	// var canvasHeight = 494;
	// For grading the window is fixed in size; here's general code:
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	// renderer.setClearColorHex( 0xAAAAAA, 1.0 ); // Gris
  // renderer.setClearColorHex( 0x000000, 1.0 ); // Negro
  // renderer.setClearColorHex( 0xFFFFFF, 1.0 ); // Blanco r56
  background_color = (background) ? 0x000000 : 0xFFFFFF;
  renderer.setClearColor( background_color, 1.0 ); 

	// CAMERA
  if (perspective_camera) {
    camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 40000 );
  } else {
  camera = new THREE.OrthographicCamera( - canvasWidth / 2, canvasWidth/2, canvasHeight/2, - canvasHeight / 2, 1, 40000 );
  }
  // Using three.js r80 we can change up vector:
  camera.up.set(0, 0, 1);
  camera.position.set( 680, 500, 300 );
	// CONTROLS
  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

  

  cameraControls.target.set(0, 0, 0);  

	fillScene();
}


// Coordinates (Grid, axes, ground)
function createGrid() {
  gridXY = new THREE.GridHelper(grid_size, grid_step);
  gridXY.rotateX( Math.PI/2 );
  gridXZ = new THREE.GridHelper(grid_size, grid_step);
  gridYZ = new THREE.GridHelper(grid_size, grid_step);
  gridYZ.rotateZ( Math.PI/2 );
  
  gridXY.visible = false;
  gridXZ.visible = false;
  gridYZ.visible = false;
  
  scene.add( gridXY );
  scene.add( gridXZ );
  scene.add( gridYZ );
}


// Earth
function createEarth() {
//  var color = 0xF07020;
//  var color = 0x000000;
//	var material = new THREE.MeshLambertMaterial( { color: color } );

  var texloader = new THREE.TextureLoader();
  texloader.crossOrigin = '';
  var texture = texloader.load('textures/earthmap2.jpg');
  // var texture = texloader.load('textures/earthdraw.jpg');
  var bump = texloader.load('textures/earthbump2.jpg');  
  var specular = texloader.load('textures/earthspec2.jpg');    
  var specColor = new THREE.Color('grey');
  
//	var material = new THREE.MeshLambertMaterial( {
	// var material = new THREE.MeshPhongMaterial( {	
	earthMaterial = new THREE.MeshPhongMaterial( {	
	  map: texture,
	  bumpMap: bump,
	  bumpScale: 8,
	  specularMap: specular,
//	  specular: specColor,
	  shininess: 7
	} );	
  var radius = earthRadius;
  var widthSegments = 64;
  var heightSegments = 64;
  var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
	// var mesh = new THREE.Mesh( geometry, material );
	var mesh = new THREE.Mesh( geometry, earthMaterial );
	mesh.rotation.x = Math.PI/2;
	mesh.rotation.y = 1.2; //
	mesh.rotation.y = 0; // Greenwich
	earth = new THREE.Object3D();
	
//	var clouds = new THREE.Mesh(
//    new THREE.SphereGeometry(101, 32, 32),
//    new THREE.MeshPhongMaterial({
//      map: texloader.load('textures/earth_fair_clouds_4k.png'),
//      transparent: true
//    })
//  );
	
	earth.add( mesh );
//	earth.add( clouds );
	earth.add( ecefAxes );
	scene.add( earth );

}

function updateEarth() {
  // if (play) {
    hour_angle = 2*Math.PI / earth_period * t;
  // }
  earth.rotation.z = hour_angle;
}

// Equatorial Plane
function createEquatorialPlane() {
  var width = 5*semimajor;
  var height = 5*semimajor;
  var widthSegments = 2;
  var heightSegments = 2;
  var geometry = new THREE.PlaneGeometry( width, height, widthSegments, heightSegments );
  var material = new THREE.MeshBasicMaterial( {color: 0x156289, side: THREE.DoubleSide} );
  material.opacity = 0.8;
  material.transparent = true;
  equatorialPlane = new THREE.Mesh( geometry, material );
  scene.add( equatorialPlane );
  equatorialPlane.visible = false;
}


// Equator
function createEquator() {
  // var material = new THREE.MeshLambertMaterial( {color: 0xA0A8F1 } ); // some blue
  // var material = new THREE.MeshLambertMaterial( {color: 0x8080F0 } ); // some other blue
  var material = new THREE.MeshLambertMaterial( {color: 0x101010 } ); // grey
  var radialSegments = 8;
  var tubularSegments = 32;
  var tube = 1; 
  var geometry = new THREE.TorusGeometry( 1*earthRadius, tube, radialSegments, tubularSegments, 2*Math.PI);
  equator = new THREE.Mesh( geometry, material );
  earth.add( equator );
}

// Ecliptic
function createEcliptic() {
  // var material = new THREE.MeshLambertMaterial( {color: 0x101010 } ); // grey
  var material = new THREE.MeshLambertMaterial( {color: 0xfdb813 } ); // yellow
  var radius = 4*earthRadius;
  var radialSegments = 8;
  var tubularSegments = 32;
  var tube = 1; 
  var geometry = new THREE.TorusGeometry( radius, tube, radialSegments, tubularSegments, 2*Math.PI);
  ecliptic = new THREE.Mesh( geometry, material );
  ecliptic.rotation.x = 23.5 * Math.PI/180;
  scene.add( ecliptic );
  ecliptic.visible = false;
}

// Celestial sphere
function createCelestialSphere() {
//	var material = new THREE.MeshLambertMaterial( {
	var material = new THREE.MeshPhongMaterial( {color: 0x156289 } );	
  material.opacity = 0.5;
  material.transparent = true;
  var radius = 4*earthRadius;
  var widthSegments = 64;
  var heightSegments = 64;
  var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
	celestial_sphere = new THREE.Mesh( geometry, material );
	scene.add( celestial_sphere );
  celestial_sphere.visible = false;

}


// Greenwich meridian
function createGreenwich() {
  // var material = new THREE.MeshLambertMaterial( {color: 0xA0A8F1 } ); // some blue
  // var material = new THREE.MeshLambertMaterial( {color: 0x8080F0 } ); // some other blue
  var material = new THREE.MeshLambertMaterial( {color: 0x101010 } ); // grey
  var radialSegments = 8;
  var tubularSegments = 32;
  var tube = 1; 
  var geometry = new THREE.TorusGeometry( 1*earthRadius, tube, radialSegments, tubularSegments, Math.PI);
  greenwich = new THREE.Mesh( geometry, material );
  // greenwich.rotateZ( -Math.PI/2 );
  // greenwich.rotateX( Math.PI/2 );
  greenwich.rotation.x = Math.PI/2;
  greenwich.rotation.z = -Math.PI/2;
  earth.add( greenwich );
}

// Orbit
function createOrbit() {

  var material = new THREE.MeshLambertMaterial( {color: 0xF00020 } );
  // var orbit;
  var a = semimajor;
  var e = eccentricity;
  var b = a * Math.sqrt(1 - e*e);
  var radialSegments = 8;
  var tubularSegments = 64;
  var tube = 1; 
  var geometry = new THREE.TorusGeometry( b, tube, radialSegments, tubularSegments, 2*Math.PI);
  
  orbit = new THREE.Mesh( geometry, material );
  
  orbitMatrixRTS = new THREE.Matrix4();
  orbitMatrixRT = new THREE.Matrix4(); 
  orbitMatrixRTS.identity();
  orbitMatrixRT.identity();  

  // TODO: eliminate m1, ... , m5. Use only orbitMatrixRT and orbitMatrixRTS.
  // Scale
  var m1 = new THREE.Matrix4();
  m1.makeScale(a/b, 1, 1);
  // orbit.scale.x = a/b;
  
  // Translate
  var m2 = new THREE.Matrix4();
  m2.makeTranslation(-a*e, 0, 0);
  // orbit.position.set(-a*e, 0, 0);
  
  // Rotate
  // [Perifocal] = Cz(argumentOfPerigee) * Cx(inclination) * Cz(raan) * [ECI]
  // where: Cx(angle): DCM wrt 'x' axis
  // => [ECI] = Cz(-raan) * Cx(-inclination) * Cz(-argumentOfPerigee) * [Perifocal]
  // => [ECI] = Rz(raan) * Rx(inclination) * Rz(argumentOfPerigee) * [Perifocal]
  // where: Rx(angle): Rotation matrix wrt 'x' axis.
  var m3 = new THREE.Matrix4();
  m3.makeRotationZ(deg2rad(argumentOfPerigee));
  var m4 = new THREE.Matrix4();
  m4.makeRotationX(deg2rad(inclination));
  var m5 = new THREE.Matrix4();
  m5.makeRotationZ(deg2rad(raan));
  
  
  // multiply() is post-multiplication.
  // R
  orbitMatrixRT.multiply(m5);
  orbitMatrixRT.multiply(m4);
  orbitMatrixRT.multiply(m3);
  orbitMatrixR = orbitMatrixRT.clone();
  // T
  orbitMatrixRT.multiply(m2);
//  orbitMatrix.multiply(m1);
  // S
  m1.premultiply(orbitMatrixRT);
  orbitMatrixRTS = m1;
  
  // R * T * S
  orbit.applyMatrix( m1 );
  
  scene.add( orbit );
  
}

// Esto no resulta porq hay que crear de nuevo la geometría
// Pra eso es más fácil remover y volver a crear la órbita
// El problema es el escalado!. Sino se puede hacer un objeto orbita que contenga la orbita, el perifocal axes, el satelite, line of apsides, etc
function updateOrbit() {
  var a = semimajor;
  var e = eccentricity;
  var b = a * Math.sqrt(1 - e*e);
  
  // Reset orbit position, orientation and scale.
  var minv = new THREE.Matrix4();
  minv.getInverse( orbitMatrixRTS );
  orbit.applyMatrix( minv );

  // Reset matrices  

}

// Satellite
function createSatellite() {

	var material = new THREE.MeshLambertMaterial( { color: 0xF07020 } );
  var radius = 10;
  var widthSegments = 64;
  var heightSegments = 64;
  var geometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments );
	var mesh = new THREE.Mesh( geometry, material );
	satellite = new THREE.Object3D();
	satellite.matrixAutoUpdate = false;

  satellite.add( RPYaxes );
  satellite.add( mesh );
  
  updateSatellite();    

//  satellite.add( RPYaxes );
  
	scene.add( satellite );

}

function updateSatellite() {
  // Save distance before reset
  var r = satellite.position.length();
  // console.log(r)
  // Reset position, orientation and scale
  var minv = new THREE.Matrix4();
  minv.getInverse( satellite.matrix );
  satellite.applyMatrix( minv );
  
  // TODO: navigation attitude
  var a = semimajor;
  var e = eccentricity;
  var c = a*e;
  var b = a * Math.sqrt(1 - e*e);
  // var mu = 398600441900000; // Standard gravitational parameter
  // var p = a * (1-e*e);
  // var h = Math.sqrt( mu * p);
  var ra = a*(1 + e);
  var rp = a*(1 - e);
  // Orbit period, around 10 seconds. Proportional to sqrt(a^3). Scale factor: 10/sqrt(300^3)
  // T = sqrt(a^3) / sqrt(300^3) * 10
  // => a = cbrt( ( T/10 * sqrt(300^3) )^2 )
  orbit_period = Math.sqrt(a*a*a) / Math.sqrt(300*300*300) * 10;
  
  
  // n: Mean motion
  var n = 2 * Math.PI / orbit_period;
  // M: Mean anomaly
  // var M = n*t;
  var M = n*t % (2*Math.PI);
  meanAnomaly = rad2deg(M);
  // trueAnom = M + (2*e - e*e*e/4 + 5/96 * Math.pow(e,5)) * Math.sin(M) ;
              // + (5/4 * e*e - 11/24 * Math.pow(e,4) + 17/192*Math.pow(e,6)) * Math.sin(2*M) ;
              // + 13/12 * e*e*e * Math.sin(3*M);
  
  eccAnom = M + (e - e*e*e/8 + Math.pow(e,5)/192) * Math.sin(M);
  
  // Other tries:
  // var w = 2*Math.PI / orbit_period; // Eccentric speed
  // var w_const =  2*Math.PI / orbit_period;
  // var r_approx = rp + (ra-rp)/2 -(ra-rp)/2*Math.cos(w_const*t);
  // var w = w_const * rp*rp / (r_approx*r_approx);
  // eccAnom = w * t;
  // trueAnom = t + 0.1*orbit_period*Math.sin(w_const * t);

  
  // eccAnom to trueAnom
  var cost = (Math.cos(eccAnom)-e) / (1 - e*Math.cos(eccAnom));
  var sint = (Math.sin(eccAnom)*Math.sqrt(1 - e*e)) / (1 - e*Math.cos(eccAnom));
  trueAnom = Math.acos( cost ) * Math.sign( sint );
  
  
  // trueAnom to eccAnom 
  // eccAnom = 2 * Math.atan( Math.sqrt( (1-e)/(1+e) ) * Math.tan(trueAnom/2) );
  // // var cosE = (e + Math.cos(trueAnom))/(1 + e*Math.cos(trueAnom));
  // // var sinE = Math.sin(trueAnom)* Math.sqrt(1 - e*e) / (1 + e*Math.cos(trueAnom));
  // // eccAnom = Math.acos( cosE ) * Math.sign( sinE );
  
  // Rotate (attitude)
  var m0 = new THREE.Matrix4();
  m0.makeRotationZ(trueAnom); // but here it is true anomaly // Rotates RPYaxes  
  // Translate
  var m1 = new THREE.Matrix4();
  // check: i think it's eccentric anomaly, not true.
  var x = a*Math.cos(eccAnom);
  var y = b*Math.sin(eccAnom);	
  m1.makeTranslation(x, y, 0);

  // Orbit transform (RT)
  m0.premultiply(m1); // m1 * m0
  m0.premultiply(orbitMatrixRT); // orbitRT * m1 * m0
  
  
  satellite.applyMatrix(m0);
}

function createStars() {
  // --- Galaxy texture ---
  // // create the geometry sphere
  // var geometry  = new THREE.SphereGeometry(500, 64, 64)

  // var texloader = new THREE.TextureLoader();
  // texloader.crossOrigin = '';
  // var texture = texloader.load('textures/galaxy_starfield3.png');  
  // // create the material, using a texture of startfield
  // var material  = new THREE.MeshBasicMaterial( {
    // map: texture,
    // side: THREE.BackSide
  // } )
  // // create the mesh based on geometry and material
  // var mesh  = new THREE.Mesh(geometry, material)
  // scene.add( mesh );
  
  // --- Lots of dots ---
  var N = 4000;
  var d = 1500;
  var x, y, z, sel;
  
  for (var i=0; i < N; i++){
    var geometry = new THREE.SphereGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF } );
    var mesh = new THREE.Mesh( geometry, material );
    // -- Random position: --
    // Fixed distance: d
    x = Math.random()*d*2 - d;
    y = Math.random()*d*2 - d;
    z = Math.random()*d*2 - d;
    
    sel = Math.random();
    if (sel < 1/3){
      x = Math.sqrt(d*d - y*y - z*z) * Math.sign(Math.random()-.5);
    } else if (sel > 2/3){
      y = Math.sqrt(d*d - x*x - z*z) * Math.sign(Math.random()-.5);
    } else {
      z = Math.sqrt(d*d - x*x - y*y) * Math.sign(Math.random()-.5);
    }
    // ----------------------
    mesh.position.set(x, y, z);
    
    scene.add( mesh );
  }
  
}

function createAxes() {
  axes = new THREE.Object3D();
  createAxis(axes, {axisLength:300,axisRadius:2,axisTess:50});
//  scene.add(axes);
  RPYaxes = new THREE.Object3D();
  createAxis(RPYaxes, {axisLength:50,axisRadius:1,axisTess:10});  
  RPYaxes.rotation.order = "ZYX";
  RPYaxes.rotation.z = Math.PI/2;
  RPYaxes.rotation.x = -Math.PI/2;  
//  scene.add(RPYaxes);
  ecefAxes = new THREE.Object3D();
  createAxis(ecefAxes, {axisLength:200,axisRadius:1.7,axisTess:30});  
  perifocalAxes = new THREE.Object3D();
  createAxis(perifocalAxes, {axisLength:200,axisRadius:1.5,axisTess:30}); 
}

// It's not possible to add the perifocal axes to the orbit because of the scale transform a/b
function updatePerifocalAxes() {
  // Reset position, orientation and scale
  var minv = new THREE.Matrix4();
  minv.getInverse( perifocalAxes.matrix );
  perifocalAxes.applyMatrix( minv );
  perifocalAxes.applyMatrix( orbitMatrixR );
}

// Line of apsides
function createLineOfApsides() {
  var radius = 1.3;
  var length = 1;
  var tesselation = 32;
  // var material = new THREE.MeshLambertMaterial({ color: 0xF04040 }); // red
  var material = new THREE.MeshLambertMaterial({ color: 0xF08080 }); // l red
  var geometry = new THREE.CylinderGeometry(radius, radius, length, tesselation); // Along Y axis
  lineOfApsides = new THREE.Mesh( geometry, material );
  scene.add( lineOfApsides );
  updateLineOfApsides();
}

function updateLineOfApsides() {
  // Reset position, orientation and scale
  var minv = new THREE.Matrix4();
  minv.getInverse( lineOfApsides.matrix );
  lineOfApsides.applyMatrix( minv );
  // Scale lenght
  var m1 = new THREE.Matrix4();
  m1.identity();
  m1.makeScale( 1, 2.5*semimajor, 1 );
  // Rotate to align with perigiee-apogee in the XY plane (default cylinder is along Y axis)
  var m2 = new THREE.Matrix4();
  m2.identity();
  m2.makeRotationZ( Math.PI/2 );
  
  m1.premultiply( m2 ); // m2 * m1
  m1.premultiply( orbitMatrixRT ); // orbitMatrix * m2 * m1
  lineOfApsides.applyMatrix( m1 );
}

// Line of nodes
function createLineOfNodes() {
  var radius = 1.5;
  var length = 1;
  var tesselation = 32;
  // var material = new THREE.MeshLambertMaterial({ color: 0x40F040 }); // l green
  var material = new THREE.MeshLambertMaterial({ color: 0x101010 }); // grey
  var geometry = new THREE.CylinderGeometry(radius, radius, length, tesselation); // Along Y axis
  lineOfNodes = new THREE.Mesh( geometry, material );
  scene.add( lineOfNodes );
  updateLineOfNodes();  
}

function updateLineOfNodes() {
  // Reset position, orientation and scale
  var minv = new THREE.Matrix4();
  minv.getInverse( lineOfNodes.matrix );
  lineOfNodes.applyMatrix( minv );
  // Z ECI axis
  var iz = new THREE.Vector3( 0, 0, 1 );
  // Angular momentum axis
  var h = new THREE.Vector3();
  h.fromArray( orbitMatrixR.applyToVector3Array([0, 0, 1]) );
  // Ascending Node vector:
  var n = new THREE.Vector3();
  n.crossVectors( iz, h );
  n.normalize();
  // Angle between Node vector and Y ECI axis:
  var iy = new THREE.Vector3( 0, 1, 0 );
  var angle = Math.acos( iy.dot(n) ) * Math.sign(-n.x);

  // Finally, rotate lineOfNodes by angle, around Z ECI axis:
  // First scale,
  var m1 = new THREE.Matrix4();
  m1.identity();
  m1.makeScale( 1, 2.5*semimajor, 1 );
  // Then translate,
  var m12 = new THREE.Matrix4();
  m12.identity();
  var a = semimajor;
  var e = eccentricity;
  var c = a*e;
  var i = inclination;
  var w = argumentOfPerigee;
  var y = (c/10 + c*Math.cos(deg2rad(w)) ) * Math.sign( -i );
  m12.makeTranslation(0, y, 0);
  m1.premultiply(m12); // m1 = m12 * m1
  // Then, rotate
  var m2 = new THREE.Matrix4();
  m2.identity();
  m2.makeRotationZ( angle );
  
  m2.multiply( m1 ); // m2 * m1
  lineOfNodes.applyMatrix( m2 );
  
  // console.log(h)
  // console.log(n)
  // console.log(angle)
}


// Create all models
function createApplication() {
	// MODELS
  createGrid();
  createAxes();
	createEarth();
  createEquator();
  createGreenwich();
  createOrbit();
  updatePerifocalAxes();
  createSatellite();
  if (create_stars) {
    createStars();
  }
  createLineOfApsides();
  createLineOfNodes();
  createEquatorialPlane();
  createEcliptic();
  createCelestialSphere()
}

function fillScene() {
	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 3000, 6000 );
	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -400, 200, -300 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);


  // Application
	createApplication();
  // --- This is for r56 ---
  // Rotate de scene to get the view I want. (can't modify camera.up property, this is a workaround)
  // scene.matrixAutoUpdate = false;
  // scene.up.set(1, 0 , 0);
  // scene.rotation.y = 
  // scene.rotation.x = -Math.PI/2;
  // scene.rotation.z = -Math.PI/2;
  // scene.position.y = -40;
  // ---------------------------
  scene.updateMatrix();
}

// Just for efficient mode.
function updateScene() {
  updateSatellite();
  updateEarth();
}

//
function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

function animate() {
  requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
  // Update time
  if (play) {
    t = t + delta;
    guiController.newMeanAnomaly = meanAnomaly;
  }
  if (guiController.newMeanAnomaly !== meanAnomaly){
    meanAnomaly = guiController.newMeanAnomaly;
    var n = 2 * Math.PI / orbit_period;
    t = deg2rad(meanAnomaly)/n;
  }
	if (guiController.newBackground !== background) {
	  background = guiController.newBackground;
	  background_color = (background) ? 0x000000 : 0xFFFFFF;
    renderer.setClearColor( background_color, 1.0 ); 	  
	}
	if ( guiController.newGridXY !== gridXY.visible || guiController.newGridYZ !== gridYZ.visible || guiController.newGridXZ !== gridXZ.visible || guiController.newGround !== ground || guiController.newAxes !== axes.visible || guiController.newEcefAxes !== ecefAxes.visible || guiController.newRPYaxes !== RPYaxes.visible || guiController.newPerifocalAxes !== perifocalAxes.visible)
  {
    // Update variables with gui-controller values
    gridXY.visible = guiController.newGridXY;
		gridYZ.visible = guiController.newGridYZ;
		gridXZ.visible = guiController.newGridXZ;
		ground = guiController.newGround;
		axes.visible = guiController.newAxes;
		ecefAxes.visible = guiController.newEcefAxes;		
		RPYaxes.visible = guiController.newRPYaxes;
    perifocalAxes.visible = guiController.newPerifocalAxes;
  }
  if (guiController.newPlayStop !== play) 
  {
    play = guiController.newPlayStop;
  }
  if (guiController.newGreenwich !== greenwich.visible) 
  {
    greenwich.visible = guiController.newGreenwich;
  }
  if (guiController.newCelestialSphere !== celestial_sphere.visible) 
  {
    celestial_sphere.visible = guiController.newCelestialSphere;
  }
  if (guiController.newEquator !== equator.visible) 
  {
    equator.visible = guiController.newEquator;
  }
  if (guiController.newLineOfApsides !== lineOfApsides.visible) 
  {
    lineOfApsides.visible = guiController.newLineOfApsides;
  }
  if (guiController.newLineOfNodes !== lineOfNodes.visible) 
  {
    lineOfNodes.visible = guiController.newLineOfNodes;
  }
  if (guiController.newEcliptic !== ecliptic.visible) 
  {
    ecliptic.visible = guiController.newEcliptic;
  }
  if ( guiController.newEccentricity !== eccentricity || guiController.newInclination !== inclination || guiController.newRaan !== raan || guiController.newArgumentOfPerigee !== argumentOfPerigee || guiController.newSemimajor !== semimajor)
	{
    // Update variables with gui-controller values
    semimajor = guiController.newSemimajor;
    eccentricity = guiController.newEccentricity;
    inclination = guiController.newInclination;
    raan = guiController.newRaan;
    argumentOfPerigee = guiController.newArgumentOfPerigee;

    if (efficient)
    {
      // Update orbit
      // It's easier to destroy and re-create the orbit, using the known tranformation matrix, 
      // instead of computing the relative transform. 
      // updateOrbit();
      scene.remove(orbit);
      createOrbit();
      updatePerifocalAxes();
      updateLineOfApsides();
      updateLineOfNodes();
    } else 
    {
      // Create everything again
      fillScene();
    }
	}
  // Update everything else
  updateScene();	
  
	renderer.render(scene, camera);
}

// https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.6.0/dat.gui.js
// https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
function setupGui() {

	guiController = {

		newGridXY: gridXY.visible,
		newGridYZ: gridYZ.visible,
		newGridXZ: gridXZ.visible,
		newGround: ground,
		newBackground: background,
		newAxes: axes.visible,
		newEcefAxes: ecefAxes.visible,		
		newRPYaxes: RPYaxes.visible,
    newPerifocalAxes: perifocalAxes.visible,
    
    newSemimajor: semimajor,
    newEccentricity: eccentricity,
    newInclination: inclination,
    newRaan: raan,
    newArgumentOfPerigee: argumentOfPerigee,
    newMeanAnomaly: meanAnomaly,
    
    newPlayStop: play,
    newGreenwich: greenwich.visible,
    newEquator: equator.visible,
    newLineOfApsides: lineOfApsides.visible,
    newLineOfNodes: lineOfNodes.visible,
    newCelestialSphere: celestial_sphere.visible,
    newEcliptic: ecliptic.visible
	};
  
    //Presets
  var guiPresets = {
    "preset": "Default",
    "remembered": {
      "Default": {
        "0": {
          newSemimajor: semimajor, // 300
          newEccentricity: eccentricity,
          newInclination: inclination,
          newRaan: raan,
          newArgumentOfPerigee: argumentOfPerigee,
          newMeanAnomaly: meanAnomaly
        }
      },
      "Circular": {
        "0": {
          newEccentricity: 0
        }
      },
      "Molniya": {
        "0": {
          newSemimajor: Math.cbrt(Math.pow(earth_period/2.0 /10.0 * Math.sqrt(300*300*300),2)), // 480 
          newEccentricity: 0.7,
          newInclination: 63.4,
          newRaan: 60,
          newArgumentOfPerigee: -90,
          newMeanAnomaly: meanAnomaly
        }
      },
      "GEO": {
        "0": {
          newSemimajor: Math.cbrt(Math.pow(earth_period /10 * Math.sqrt(300*300*300),2)), // (755.95)
          newEccentricity: 0,
          newInclination: 0,
          newRaan: 0,
          newArgumentOfPerigee: 0,
          newMeanAnomaly: meanAnomaly
        }
      },
      "SARE": {
        "0": {
          newSemimajor: 110,
          newEccentricity: 0,
          newInclination: -83,
          newRaan: -69,
          newArgumentOfPerigee: 54,
          newMeanAnomaly: meanAnomaly
        }
      },
      "Inyección Tronador": {
        "0": {
          newSemimajor: 110,
          newEccentricity: 0.0074,
          newInclination: -83,
          newRaan: -69,
          newArgumentOfPerigee: 54,
          newMeanAnomaly: meanAnomaly
        }
      }
    },
  };

	var gui = new dat.GUI({load: guiPresets});
  gui.add( guiController, "newPlayStop" ).name("Play/Stop");
  var f1 = gui.addFolder('References');
	f1.add( guiController, "newGridXY").name("Show XY grid");
	f1.add( guiController, "newGridYZ" ).name("Show YZ grid");
	f1.add( guiController, "newGridXZ" ).name("Show XZ grid");
	// f1.add( guiController, "newGround" ).name("Show ground");
	f1.add( guiController, "newBackground" ).name("Black/White background");
	f1.add( guiController, "newGreenwich" ).name("Greenwich meridian");
	f1.add( guiController, "newEquator" ).name("Equator");
	f1.add( guiController, "newLineOfApsides" ).name("Line of apsides"); // Singular: apsis/apse. Plural: apsides
	f1.add( guiController, "newLineOfNodes" ).name("Line of nodes"); 
	f1.add( guiController, "newCelestialSphere" ).name("Celestial sphere");
	f1.add( guiController, "newEcliptic" ).name("Solar ecliptic");
	var f2 = gui.addFolder('Axes');	
	f2.add( guiController, "newAxes" ).name("Show ECI axes");
  f2.add( guiController, "newEcefAxes" ).name("Show ECEF axes");  	
  f2.add( guiController, "newRPYaxes" ).name("Show orbital RPY axes");
  f2.add( guiController, "newPerifocalAxes" ).name("Show perifocal axes");
  var f3 = gui.addFolder('Orbit elements');
  f3.add( guiController, "newSemimajor" ).min(100).max(1000).step(5).name("Semi-major axis");
  f3.add( guiController, "newEccentricity" ).min(0).max(0.99).step(0.001).name("Eccentricity");
  f3.add( guiController, "newRaan" ).min(-180).max(180).step(1).name("Right ascension of the ascending node (RAAN)");
  f3.add( guiController, "newInclination" ).min(-180).max(180).step(1).name("Inclination");
  f3.add( guiController, "newArgumentOfPerigee" ).min(-180).max(180).step(1).name("Argument of perigee");
  // f3.add( guiController, "newMeanAnomaly" ).min(0).max(2*Math.PI).step(.01).name("Mean anomaly");
  // f3.add( guiController, "newMeanAnomaly" ).min(0).max(2*Math.PI).step(.01).name("Mean anomaly").listen();
  f3.add( guiController, "newMeanAnomaly" ).min(0).max(360).step(1).name("Mean anomaly").listen();

  
  f3.open();
  
  gui.remember(guiController);

}

try {
	init();
	setupGui();
	addToDOM();
	animate();
} catch(e) {
	var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
	$('#container').append(errorReport+e);
}
