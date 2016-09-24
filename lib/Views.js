/*****************************************************************************\
  Engineering Faculty, University of Buenos Aires (FIUBA)
  Electronic Engineering
  Thesis
  2016
 
  Sampayo, Sebastián Lucas
  Padrón: 93793
  e-mail: sebisampayo@gmail.com
          ssampayo@fi.uba.ar
 
  File: functions for visualization modes
\*****************************************************************************/
/*
 * These functions configures the scene for different visualization modes
 */


function earthDraw() {
  earthMaterial.bumpScale = 0;
  // earthMaterial
  var texloader = new THREE.TextureLoader();
  var texture = texloader.load('textures/earthdraw.jpg');
  earthMaterial.map = texture;
  earthMaterial.opacity = 0.7;
  earthMaterial.transparent = true;
}
// Function that configures the scene for eci view
function eci_view() {
  guiController.newEcefAxes = false;
  ecefAxes.visible = false;
  RPYaxes.visible = false;
  perifocalAxes.visible = false;
  satellite.visible = false;
  orbit.visible = false;
  lineOfApsides.visible = false;
  lineOfNodes.visible = false;
  greenwich.visible = false;
  play = false;
  earthDraw();
  hour_angle = 1.8;
} 

// Function that configures the scene for eci-ecef comparison.
function ecef_view() {
  RPYaxes.visible = false;
  perifocalAxes.visible = false;
  satellite.visible = false;
  orbit.visible = false;
  lineOfApsides.visible = false;
  lineOfNodes.visible = false;
  play = false;
  earthDraw();
  hour_angle = 0.5;
  
  // Arc - Hour angle
  // var material = new THREE.MeshLambertMaterial( {color: 0x40f040 } ); // l green
  // var material = new THREE.MeshLambertMaterial( {color: 0x3438bd } ); // l blue
  var material = new THREE.MeshLambertMaterial( {color: 0x7328b6 } ); // l purple
  var radialSegments = 8;
  var tubularSegments = 32;
  var tube = 1; 
  var geometry = new THREE.TorusGeometry( 2*earthRadius, tube, radialSegments, tubularSegments, hour_angle);
  var arc = new THREE.Mesh( geometry, material );
  scene.add( arc );
}

// Function that configures the scene for eci-perifocal comparison.
function perifocal_view() {
  guiController.newEcefAxes = false;
  ecefAxes.visible = false;
  guiController.newRPYaxes = false;
  RPYaxes.visible = false;
  greenwich.visible = false;
  lineOfNodes.visible = false;
  play = false;
  earthDraw();
  
  // Angles:
  guiController.newRaan = 20;
  guiController.newInclination = 40;
  guiController.newArgumentOfPerigee = 20;
  // raan = 20;
  // inclination = 40;
  // argumentOfPerigee = 20;
  t = 1;
  // updateSatellite();
  
}

// Configures the scene for orbit angles view.
function orbit_view() {
  guiController.newEcefAxes = false;
  ecefAxes.visible = false;
  guiController.newRPYaxes = false;
  RPYaxes.visible = false;
  greenwich.visible = false;
  play = false;
  earthDraw();
  
  // Angles:
  guiController.newRaan = 20;
  guiController.newInclination = 40;
  guiController.newArgumentOfPerigee = 20;
  // raan = 20;
  // inclination = 40;
  // argumentOfPerigee = 20;
  t = 1;
  
  // Arcs: raan, inclination, argumentOfPerigee
  // var material = new THREE.MeshLambertMaterial( {color: 0x7328b6 } ); // l purple
  // var radialSegments = 8;
  // var tubularSegments = 32;
  // var tube = 1; 
  // var geometry = new THREE.TorusGeometry( 2*earthRadius, tube, radialSegments, tubularSegments, deg2rad(raan));
  // var raan_arc = new THREE.Mesh( geometry, material );
  // scene.add( raan_arc );
}

// RPY frame view
function RPY_view() {
  guiController.newEcefAxes = false;
  ecefAxes.visible = false;
  greenwich.visible = false;
  lineOfNodes.visible = false;
  lineOfApsides.visible = false;
  play = false;
  earthDraw();
  
  // Angles:
  guiController.newRaan = 20;
  guiController.newInclination = 40;
  guiController.newArgumentOfPerigee = 20;
  // raan = 20;
  // inclination = 40;
  // argumentOfPerigee = 20;
  t = 1;
}

// Celestial sphere view
function celestial_view() {
  guiController.newEcefAxes = false;
  ecefAxes.visible = false;
  RPYaxes.visible = false;
  perifocalAxes.visible = false;
  satellite.visible = false;
  orbit.visible = false;
  lineOfApsides.visible = false;
  lineOfNodes.visible = false;
  play = false;
  earthDraw();
  hour_angle = -0.3;
  ecliptic.visible = true;
  celestial_sphere.visible = true;
}