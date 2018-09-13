//the OpenGL context
var gl = null;

var root = null;

//camera
var cameraPosition = [2,2,-8];
var cameraUp = [0, 1, 0];
var cameraGaze = [0, -0.1, 0.5];

//transformation nodes for the moving objects
var fishTransformationNode = null;
var shipTransformationNode = null;
var hookTransformationNode = null;

//enable interaction for manual camera
document.onclick = lockPointer;
document.onkeydown = calculateCameraPosition;
document.addEventListener("wheel", calculateCameraPosition);
document.addEventListener("mousemove", calculateCameraPosition);

//flags for triggering movement during manual camera mode
var manualCamera = false;
var moveShip = false;
var moveFish = false;
var moveHook = false;
//time offsets for moving objects during manugal camera mode
var offset = 0;
var shipOffset = 0;
var hookOffset = 0;
var fishOffset = 0;

/**
 * initializes OpenGL context, compile shader, and load buffers
 */
function init(resources) {
  //create a GL context
  gl = createContext(document.body.clientWidth, document.documentElement.clientHeight - 20);
  //initialize textures for the environment
  initCubeMap(resources);
  //enable depth test to let objects in front occluse objects further away
  gl.enable(gl.DEPTH_TEST);
  //enable alpha blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  //create scene graph
  root = createSceneGraph(gl, resources);
}
/**
* render one frame
*/
function render(timeInMilliseconds) {
  //set the background color to light grey
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  //clear the buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //create context
  const context = createSGContext(gl);
  context.timeInMilliseconds = timeInMilliseconds;
  //calculate the projection matrix
  context.projectionMatrix = mat4.perspective(mat4.create(), glm.deg2rad(30), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.01, 100);
  //calculate the view matrix and its inverse
  context.viewMatrix = calculateViewMatrix(timeInMilliseconds);
  context.invViewMatrix = mat4.invert(mat4.create(), context.viewMatrix);
  //calculate the transformation matrices for various objects, for animation
  //dependent upon if in manual camera mode or not
  if(manualCamera){//if in manual camera mode or not
    //ship
    if(!moveShip && (vec3.distance(cameraPosition, [3, 1, -3]) < 2)){ //if movement has not been triggered yet and trigger point is hit
      moveShip = true; //set the flag so movement occurs
      shipOffset = timeInMilliseconds || 0; //record the time offset
    }
    if(moveShip){//if movement was triggered
      shipTransformationNode.matrix = calculateShipTransformationMatrix(timeInMilliseconds - shipOffset);//animate based on time offset from when triggered
    }
    //hook
    if(!moveHook && (vec3.distance(cameraPosition, [0,0,-2]) < 1) && moveShip){ //if movement has not been triggered yet (and ship is moving) and trigger point is hit
      moveHook = true;//set the flag so movement occurs
      hookOffset = timeInMilliseconds|| 0 ;//record the time offset
    }
    if(moveHook){//if movement was triggered
      hookTransformationNode.matrix = calculateHookTransformationMatrix(timeInMilliseconds-hookOffset);//animate based on time offset from when triggered
    }
    //fish
    if(!moveFish && (vec3.distance(cameraPosition, [1,0,-2]) < 1)){//if movement has not been triggered yet and trigger point is hit
      moveFish = true;//set the flag so movement occurs
      fishOffset = timeInMilliseconds || 0;//record the time offset
    }
    if(moveFish){//if movement was triggered
      fishTransformationNode.matrix = calculateFishTransformationMatrix(timeInMilliseconds - fishOffset);//animate based on time offset from when triggered
    }
  }
  else{ //in automatic camera mode
    //animate normally (without pausing for switching to manual camera mode)
    fishTransformationNode.matrix = calculateFishTransformationMatrix(timeInMilliseconds);
    hookTransformationNode.matrix = calculateHookTransformationMatrix(timeInMilliseconds);
    shipTransformationNode.matrix = calculateShipTransformationMatrix(timeInMilliseconds);
  }

  //display effects
  displayText("basic: manual complex object, material objects, textured objects, multiple light sources (one moving),transparent object, camera movement\nspecial: terrain from heightmap, animated water surface");

  root.render(context);

  requestAnimationFrame(render);
}

/**
*create a circular orb of lights
*@param vs_single the vector shader program we want to use
*@param fs_single the fragment shader program we want to use
*/
function createLightSphere(vs_single, fs_single) {
  return new ShaderSGNode(createProgram(gl, vs_single, fs_single), [
    new RenderSGNode(makeSphere(.2, 20, 20))
  ]);
}

/**
* creates a scene graph
*/
function createSceneGraph(gl, resources) {
  //root: a shader program with an environment and lighting
  const root = new ShaderSGNode(createProgram(gl, resources.vs, resources.fs),
      new EnvironmentSGNode(envcubetexture,4,true,
      new LightSGNode([0.0, 10, 0.0],
        createLightSphere(resources.vs_single, resources.fs_single)
      )));

  {//skybox: the render node for the environment
    var skybox = new EnvironmentSGNode(envcubetexture,4,false,
                    new RenderSGNode(makeSphere(50)));
    root.append(skybox);
  }

  //terrain: the transformation and textures of the ground
  root.append(new TransformationSGNode(glm.transform({ translate: [0,0.5,0], rotateX: -90, scale: 1}),
    new TerrainSGNode(resources.grass, resources.sand, resources.rock, resources.terrain_heightmap)));

  //fish: the transformation node with the render node as its child
  //transformation matrix initialized for start of animation
  fishTransformationNode = new TransformationSGNode(calculateFishTransformationMatrix(0),
      new FishSGNode(resources.scale));

  root.append(fishTransformationNode);

  //ship: transformation with render node as its child
  //transformation matrix initialized for start of animation
  shipTransformationNode = new TransformationSGNode(calculateShipTransformationMatrix(0),
    new ShipSGNode(resources, resources.wood));

  root.append(shipTransformationNode);

  //hook: transformation with render node as its child
  //transformation matrix initialized for start of animation
  hookTransformationNode = new TransformationSGNode(calculateHookTransformationMatrix(0),
    new HookSGNode(resources.iron));
  //hook travels with the ship
  shipTransformationNode.append(hookTransformationNode);

  //water: transformation and rendering of the water
  root.append(new TransformationSGNode(glm.transform({ translate: [0,0.5,0], rotateX: -90, scale: 1}),
    new WaterSGNode(resources.water, resources.water_heightmap)));

  return root;
}

/**
*calculates the movement of the fish
*/
function calculateFishTransformationMatrix(timeInMilliseconds) {
  var fishRotationMatrix;
  var fishTranslationMatrix; //moves in a circle

  if (timeInMilliseconds < 25000) {//still in the water
    //turns and moves in a circle
    //circle radius and angle of rotation
    var r = 1.2;
    var angvel = 2 * Math.PI / 5000;

    var deltatt = 50;

    t = -timeInMilliseconds - 1200;

    var x1 = r * Math.cos((-timeInMilliseconds - 1200) * angvel);
    var z1 = r * Math.sin(t * angvel);
    var x2 = r * Math.cos((t - deltatt) * angvel);
    var z2 = r * Math.sin((t - deltatt) * angvel);

    var angle = Math.atan2(x2 - x1, z2 - z1) * 180 / Math.PI + 90;
    //turn in circle
    fishRotationMatrix = glm.rotateY(angle);
    //move in circle
    fishTranslationMatrix = glm.translate(x1, -0.3, z1);
  } else if (timeInMilliseconds < 30000) {//caught by hook
    var t = timeInMilliseconds - 25000;
    //travel with hook
    fishTranslationMatrix = glm.translate(0, t/2800-0.3, -1.2);
    fishRotationMatrix = glm.rotateZ(-90);
  } else {//end of 30sec animation
    //lay in boat
    fishTranslationMatrix = glm.translate(0, 0.5, -1.2);
    fishRotationMatrix = glm.rotateX(0);
  }

  var fishScalematrix = glm.scale(.1,.1,.1);
  return mat4.multiply(mat4.create(), mat4.multiply(mat4.create(), fishTranslationMatrix, fishScalematrix), fishRotationMatrix);
}

/**
*calculate the movement of the ship
*/
function calculateShipTransformationMatrix(timeInMilliseconds) {
  timeInMilliseconds = timeInMilliseconds || 0;
  var t = (timeInMilliseconds > 20000) ? 0 : (20000 - timeInMilliseconds); //stop moving forward at 20000ms
  return mat4.multiply(mat4.create(), glm.translate(t/5000, //move toward the fish
    Math.sin(timeInMilliseconds/700) / 15 + 0.6, //oscillate up and down
    -1.2),
    glm.scale(.4,.4,.4));
}

/**
*calculates the movement for the hook
*/
function calculateHookTransformationMatrix(timeInMilliseconds){
  timeInMilliseconds = timeInMilliseconds || 0;
  var t;
  if(timeInMilliseconds < 20000 || timeInMilliseconds > 30000){
    //at the beginning and end of the animation, the hook is in the boat and does not move
    t = 0;
  }
  else if (timeInMilliseconds < 25000) {
    //in the middle of the film, the hook moves down
    t = 20000 - timeInMilliseconds;
  }
  else{
    //after that, it moves up
    t = timeInMilliseconds - 30000;
  }

  var hookTransformationMatrix = glm.translate(0, t/2800, 0);
  hookTransformationMatrix = mat4.multiply(mat4.create(), hookTransformationMatrix, glm.scale(.1,.1,.1));

  return hookTransformationMatrix;
}

/**
*calculates the position of the camera
*@param e any event that occurs on the canvas
*/
function calculateCameraPosition(e) {
    var increment = 0.07;
    var incrementVector = [0, 0, 0];

    //event
    e = e || window.event;

    //if 'c' key pressed, manual camera mode enabled
    //if 'c' key pressed again, manual camera mode disabled
    if(e.keyCode == '67'){
        manualCamera = !manualCamera;
    }

    if(manualCamera){//if in manual camera mode
      //if 'up arrow' or 'w' key pressed
      if (e.keyCode == '38' || e.keyCode == '87') {
        //move the camera gaze up
        vec3.scaleAndAdd(incrementVector, incrementVector, vec3.normalize(vec3.create(), cameraUp), increment);
      }
      //if the 'down arrow' or 's' key pressed
      if (e.keyCode == '40' || e.keyCode == '83') {
        //move the camera gaze down
        vec3.scaleAndAdd(incrementVector, incrementVector, vec3.normalize(vec3.create(), cameraUp), -increment);
      }
      //if 'left arrow' or 'a' key pressed
      if (e.keyCode == '37' || e.keyCode == '65' ) {
        //move the camera gaze left
        vec3.scaleAndAdd(incrementVector, incrementVector, vec3.normalize(vec3.create(), vec3.cross(vec3.create(), cameraGaze, cameraUp)), -increment);
      }
      //if 'right arrow' or 'd' key pressed
      if (e.keyCode == '39' || e.keyCode == '68') {
        //move the camera gaze right
        vec3.scaleAndAdd(incrementVector, incrementVector, vec3.normalize(vec3.create(), vec3.cross(vec3.create(), cameraGaze, cameraUp)), increment);
      }
      //if mouse is scrolling
      if (e.deltaY) {
        //zoom in or out the camera gaze
        vec3.scaleAndAdd(incrementVector, incrementVector, vec3.normalize(vec3.create(), cameraGaze), -increment * e.deltaY);
      }
      //change the camera position to match any change in the camera gaze
      vec3.add(cameraPosition, cameraPosition, incrementVector);

      //if the user clicks on the canvas, their mouse will be locked
      //point camera gaze to follow the movement of the mouse
      pointerLocked = document.pointerLockElement;
      if (pointerLocked) {
        //move the camera gaze left or right based on the angle of the mouse position change in relation to the position of the pointer
        theta = convertDegreeToRadians(e.movementX * increment);
        vec3.add(cameraGaze, vec3.scale(vec3.create(), cameraGaze, Math.cos(theta)), vec3.scale(vec3.create(), vec3.cross(vec3.create(), vec3.normalize(vec3.create(), cameraUp), cameraGaze), Math.sin(theta)));
      }

      if (pointerLocked) {
        //move the camera gaze up or down based on the angle of the mouse position change in relation to the position of the pointer
        //cameraUp is also adjusted
        theta = convertDegreeToRadians(e.movementY * increment);
        axis = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), cameraGaze, cameraUp));
        vec3.add(cameraGaze, vec3.scale(vec3.create(), cameraGaze, Math.cos(theta)), vec3.scale(vec3.create(), vec3.cross(vec3.create(), axis, cameraGaze), Math.sin(theta)));
        vec3.add(cameraUp, vec3.scale(vec3.create(), cameraUp, Math.cos(theta)), vec3.scale(vec3.create(), vec3.cross(vec3.create(), axis, cameraUp), Math.sin(theta)));
      }
    }
}

/**
*locks the pointer when it clicks on the canvas
*this is create a constant pointer position so that the angle of any change in cameraGaze can be computed
*/
function lockPointer() {
  if (document.pointerLockElement) {//if the pointer is already locked
    document.exitPointerLock();//unlock it
  } else {
    gl.canvas.requestPointerLock();//lock the pointer to a constant position on the canvas
  }
}

/**
*converts degrees to radians
*@param degree the degree that will be converted
*/
function convertDegreeToRadians(degree) {
  return degree * Math.PI / 180
}

/**
*returns the view matrix based on time
*for automatic camera movement
*/
function calculateViewMatrix(timeInMilliseconds) {
  var eye, center, up; //acts as cameraGaze, cameraPosition, and cameraUp
timeInMilliseconds = timeInMilliseconds || 0;

  if (!manualCamera) {//enable automatic camera movement
    if (timeInMilliseconds < 10000) {
      //view the fish
      eye = [0, 0.7 + timeInMilliseconds / 5000, 3 + timeInMilliseconds/5000]
      center = [0, 0, 0.8];
      up = [0, 1, 0];
    } else if (timeInMilliseconds < 20000) {
      //pan and view the ship
      var radius = 7;
      var distance = Math.PI * timeInMilliseconds / 15000;
      center = [0, 0, 0];
      eye = [
        center[0] + radius * Math.cos(distance),
        center[1] + 2,
        center[2] + radius * Math.sin(distance)
      ];
       up = [0, 1, 0];
    } else if (timeInMilliseconds < 30000) {
      //watch the fish get caught on the hook
      var t = Math.abs(timeInMilliseconds - 25000);
      up = [0, 1, 0];
      center = [0, t/6000-0.8, 0];
      eye = [0, 0, -5];
    }
    else{//enter manual camera mode when the automatic camera is done
      eye = cameraPosition;
      center = vec3.add(vec3.create(), cameraPosition, cameraGaze);
      up = cameraUp;
    }
  } else {//enable manual camera mode
    eye = cameraPosition;
    center = vec3.add(vec3.create(), cameraPosition, cameraGaze);
    up = cameraUp;
  }
  return mat4.lookAt(mat4.create(), eye, center, up);
}

/**
*creates the necessary buffers for rendering a plane
*/
function makePlane() {
  var width = 30;
  var height = 30;

  var n = 100; //size of buffers: 100x100
  //create position buffer
  var position = [];
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      position[3 * i * n + 3 * j] = (i / (n - 1)) * width - width / 2;
      position[3 * i * n + 3 * j + 1] = (j / (n - 1)) * height - height / 2;
      position[3 * i * n + 3 * j + 2] = 0;
    }
  }
  //create normal buffer
  var normal = [];
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      normal[3 * i * n + 3 * j] = 0;
      normal[3 * i * n + 3 * j + 1] = 0;
      normal[3 * i * n + 3 * j + 2] = 1;
    }
  }
  //create texture buffer
  var texture = [];
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      texture[2 * i * n + 2 * j] = i / n * 10;
      texture[2 * i * n + 2 * j + 1] = j / n * 10;
    }
  }
  //create index buffer
  var index = [];
  for (var i = 0; i < n - 1; i++) {
    for (var j = 0; j < n - 1; j++) {
      index[6 * i * n + 6 * j] = i * n + j;
      index[6 * i * n + 6 * j + 1] = i * n + j + 1;
      index[6 * i * n + 6 * j + 2] = (i + 1) * n + j + 1;
      index[6 * i * n + 6 * j + 3] = i * n + j;
      index[6 * i * n + 6 * j + 4] = (i + 1) * n + j;
      index[6 * i * n + 6 * j + 5] = (i + 1) * n + j + 1;
    }
  }
  //set buffers for the object
  //allows for wrapping in a modelrenderer later
  var plane = {
    position : position,
    normal : normal,
    texture : texture,
    index : index,
  };

  return plane;
}

/**
* loads the shader resources using a utility function
*/
loadResources({
  vs: 'shader/terrain.vs.glsl',
  fs: 'shader/terrain.fs.glsl',
  vs_single: 'shader/single.vs.glsl',
  fs_single: 'shader/single.fs.glsl',
  grass: 'models/grass.png',
  sand: 'models/sand.jpg',
  rock: 'models/rock.jpg',
  water: 'models/water.jpg',
  scale: 'models/fish.jpg',
  wood: 'models/wood.jpg',
  iron: 'models/iron.jpg',
  terrain_heightmap: 'models/terrain_heightmap.png',
  water_heightmap: 'models/water_heightmap.jpg',
  env_pos_x: 'models/skybox/right.bmp',
  env_neg_x: 'models/skybox/left.bmp',
  env_pos_y: 'models/skybox/top.bmp',
  env_neg_y: 'models/skybox/bottom.bmp',
  env_pos_z: 'models/skybox/front.bmp',
  env_neg_z: 'models/skybox/back.bmp',
}).then(function (resources) /*an object containing our keys with the loaded resources*/{
  init(resources);
  render();
});
