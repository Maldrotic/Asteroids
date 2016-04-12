
var MOVEMENT_SPEED = 10;
var SHOT_MOVEMENT_SPEED = 8;
var SHOT_PERCENT = 0.90;

var cannonShots = [];

var date = new Date();

var timeText = document.getElementById("time");
var time;

var fieldOfView = 75,
    aspectRatio = window.innerWidth / window.innerHeight,
    nearClippingPane = 0.1,
    farClippingPane = 1000;

var GAME_STATE = {
  start : 0,
  running : 1,
  over: 2
}
var gameState = GAME_STATE.start;


var moveState = {
  forward: 0,
  left: 0,
  right: 0,
  back: 0
}
var moveVector = new THREE.Vector3(0,0,0);


var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var clock = new THREE.Clock();

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio, nearClippingPane, farClippingPane );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.set( 0, 0, 25)
camera.lookAt(scene.position)



var icoGeometry = new THREE.IcosahedronGeometry( 1, 0 );
var icoMaterial = new THREE.MeshBasicMaterial( { color: 0x00000 } );
var icoMesh = new THREE.Mesh( icoGeometry, icoMaterial );
var icoEdges = new THREE.EdgesHelper( icoMesh, 0xFFFFFF );

scene.add( icoMesh );
scene.add( icoEdges );



var shipGeometry = new THREE.CylinderGeometry( 0.5, 0, 1, 3);
var shipMaterial = new THREE.MeshBasicMaterial( { color : 0x000000 } );
var shipMesh = new THREE.Mesh( shipGeometry, shipMaterial );
var shipEdges = new THREE.EdgesHelper( shipMesh, 0xFFFFFF );

shipMesh.translateY(-15);
shipMesh.rotation.set(0,0,Math.PI);

scene.add( shipMesh );
scene.add( shipEdges );

window.addEventListener( 'mousemove', onMouseMove, false);
window.addEventListener('keydown', keydown, false);
window.addEventListener('keyup', keyup, false);


function render() {
  requestAnimationFrame( render );

  var delta = clock.getDelta();

  icoMesh.rotation.x += 0.4 * delta;
  icoMesh.rotation.y += 0.4 * delta;

  if (gameState == GAME_STATE.start) {
    time = 0.0;
    shipMesh.position.set(0,-15,0);
    shipMesh.rotation.set(0,0,Math.PI);
  } else if (gameState == GAME_STATE.running) {

    console.log(SHOT_PERCENT)
    if (time > 30) {
      SHOT_PERCENT = 0.0;
    } else if (time > 20) {
      SHOT_PERCENT = 0.1;
    } else if (time > 15) {
      SHOT_PERCENT = 0.25;
    } else if (time > 11.0) {
      SHOT_PERCENT = 0.4;
    } else if (time > 6.0) {
      SHOT_PERCENT = 0.6;
    } else if (time > 3.0) {
      SHOT_PERCENT = 0.75;
    } else {
      SHOT_PERCENT = 0.95;
    }

    time += delta;
    timeText.innerHTML = "Time: " + time;

    updateShipPosition(delta);

    if (Math.random() > SHOT_PERCENT) {
      addShot();
    }

    moveShots(delta);

    for (var i = 0; i < cannonShots.length; i++) {

      var cannonShotMesh = cannonShots[i].cannonMesh;

      if (cannonShotMesh.visible) {
        var originPoint = cannonShotMesh.position.clone();
        for (var v = 0; v < cannonShotMesh.geometry.vertices.length; v++) {
          var localVertex = cannonShotMesh.geometry.vertices[v].clone();
          var globalVertex = localVertex.applyMatrix4(cannonShotMesh.matrix);
          var directionVector = globalVertex.sub(cannonShotMesh.position);

          var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
          var collisionArray = [];
          collisionArray.push(shipMesh);
          var collisionResults = ray.intersectObjects(collisionArray);

          if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            console.log(" HIT ");
            gameState = GAME_STATE.over;
          }
        }
      }
    }

  } else if (gameState == GAME_STATE.over) {
    gameState = GAME_STATE.start;
    // removeShots();
  }

  

  // shipMesh.rotation.y += 0.4 * delta;


  

  renderer.render( scene, camera );
}
render();

function addShot() {
  var vector = new THREE.Vector3();
  var cannonGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5);
  var cannonMaterial = new THREE.MeshBasicMaterial( {color: 0x000000 } );
  var cannonMesh = new THREE.Mesh( cannonGeometry, cannonMaterial );
  var cannonEdges = new THREE.EdgesHelper( cannonMesh, 0xFFFFFF)

  var shot = {};
  shot.cannonMesh = cannonMesh;
  shot.vector = new THREE.Vector3((Math.random()*2)-1, (Math.random()*2)-1, 0).normalize();

  scene.add( cannonMesh );
  scene.add( cannonEdges );
  cannonShots.push(shot);
}

function moveShots(delta) {
  var moveMult = delta * SHOT_MOVEMENT_SPEED;
  for (var i = 0; i < cannonShots.length; i++) {
    var cannonShotMesh = cannonShots[i].cannonMesh;
    cannonShotMesh.applyMatrix(new THREE.Matrix4().makeTranslation(cannonShots[i].vector.x*moveMult, cannonShots[i].vector.y*moveMult, 0));
    cannonShotMesh.rotation.x += 0.3*moveMult;
    cannonShotMesh.rotation.y += 0.3*moveMult;
    cannonShotMesh.rotation.z += 0.3*moveMult;    
  }
}

function removeShots() {
  for (var i = 0; i < cannonShots.length; i++) {
    scene.remove(cannonShots[i].cannonShotMesh);
  }
  render();
  cannonShots = [];
}

function updateShipPosition(delta) {
  var moveMult = delta * MOVEMENT_SPEED;

  // shipMesh.translateOnAxis(shipMesh.localToWorld(new THREE.Vector3(1,0,0)).normalize(), );
  // shipMesh.translateOnAxis(shipMesh.localToWorld(new THREE.Vector3(0,1,0)).normalize(), );

  shipMesh.applyMatrix(new THREE.Matrix4().makeTranslation(moveVector.x*moveMult, -moveVector.y*moveMult, 0) );

  var mouseVec = new THREE.Vector3();
  mouseVec.set(mouse.x, mouse.y, 0);
  mouseVec.unproject(camera);

  var dir = mouseVec.sub(camera.position).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));

  var vec = new THREE.Vector2(mouseVec.x-shipMesh.position.x, mouseVec.y-shipMesh.position.y);
  var yAxis = new THREE.Vector2(0,1);

  var angleInRads = Math.atan2(yAxis.y, yAxis.x) - Math.atan2(vec.y, vec.x);

  shipMesh.rotation.z = -angleInRads-Math.PI; 
}

function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function keydown(e) {
  var key = e.keyCode ? e.keyCode : e.which;

  switch (key) {
    case 32: // Space
      if (gameState == GAME_STATE.start) {
        gameState = GAME_STATE.running;
        time = 0.0;
      }
      break;
    case 87: // W
      moveState.forward = 1;
      break;
    case 83: // S
      moveState.back = 1;
      break;
    case 65: // A
      moveState.left = 1;
      break;
    case 68:
      moveState.right = 1;
      break;
  }
  updateMovementVector();
}

function keyup(e) {
  var key = e.keyCode ? e.keyCode : e.which;

  switch (key) {
    case 87: // W
      moveState.forward = 0;
      break;
    case 83: // S
      moveState.back = 0;
      break;
    case 65: // A
      moveState.left = 0;
      break;
    case 68:
      moveState.right = 0;
      break;
  }
  updateMovementVector();
}

function updateMovementVector() {
  moveVector.x = (-moveState.left + moveState.right);
  moveVector.y = (-moveState.forward + moveState.back);
}