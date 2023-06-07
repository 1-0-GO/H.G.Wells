//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
// cameras
let activeCamera; 
const cameras = {};
//lights
let directionalLight;
let ambientLight;
// 3D objects
let moon;
let ufo;
let house;
let skyDome;
let floor;
const axis = new THREE.AxesHelper(20);
const updatables = [];
const sceneObjects = [];
//colors 
const orangeLight = 0xcdaf55;
// other 
const clock = new THREE.Clock();
let scene, renderer;
const arrowKeysState = {
    'ArrowUp': false,
    'ArrowDown': false,
    'ArrowLeft': false,
    'ArrowRight': false,
  };

////////////////////////
/* AUXILARY FUNCTIONS */
////////////////////////

function addMaterials(mesh, color, emissive, displacementParameters, shaderMaterial) {
    let params = { color: color, emissive: emissive };
    let noLightMaterial;

    if (displacementParameters) {
        params = { ...params, ...displacementParameters };
        noLightMaterial = shaderMaterial;
    } else {
        noLightMaterial = new THREE.MeshBasicMaterial({ color: color });
    }

    mesh.userData.materials = {
        'lambert': new THREE.MeshLambertMaterial({ ...params, combine: THREE.MultiplyOperation }),
        'phong': new THREE.MeshPhongMaterial({ ...params, combine: THREE.MultiplyOperation }),
        'toon': new THREE.MeshToonMaterial(params),
        'basic': noLightMaterial
    };

    mesh.material = mesh.userData.materials['phong'];
    sceneObjects.push(mesh);
}


function changeMaterials(materialName) {
    for(mesh of sceneObjects) {
        mesh.material = mesh.userData.materials[materialName];
    }
}

function selectVertices(allVertices, indices) {
    const selectedVertices = indices.flatMap(index => allVertices.slice(index * 3, index * 3 + 3));
    return new Float32Array(selectedVertices);
}

function sampleFromInterval(min, max) {
    return Math.random() * (max - min) + min;
}


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040b28);

    moon = createMoon(7);
    moon.position.set(-75, 30, -25);
    ufo = createUFO(4, 0.15, 12);
    ufo.position.set(0, 20, 0);
    createCorkOakForest();
    house = createHouse(15, 3.5, 3.5);
    skyDome = createSkyDome();
    
    directionalLight = createDirectionalLight(32, 8, 16);
    ambientLight = createAmbientLight();
    axis.visible = true;
    scene.add(axis);  

    floor = createFloor();
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createPerspectiveCamera(x,y,z) {
    'use strict';
    let camera = new THREE.PerspectiveCamera( 80,
                                         window.innerWidth / window.innerHeight,
                                         1,
                                         1000 );
    camera.position.set(x,y,z)
    camera.lookAt(scene.position);
    return camera;
}

function createCameras() {
    // frontal
    cameras['1'] = createPerspectiveCamera(25, 20, 25); 
    activeCamera = cameras['1'];
 }

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createDirectionalLight(x, y, z) {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
    return directionalLight;
}

function createAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0x777777, 0.3);
    scene.add(ambientLight);
    return ambientLight;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMoon(radius) {
    const moonGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const moon = new THREE.Mesh(moonGeometry);
    addMaterials(moon, 0xFFFFBB, 0xFFFF44, null, null);
    scene.add(moon);
    return moon;
}

function createCylinderSpotlight(obj, radius) {
    const cylinderGeometry = new THREE.CylinderGeometry(radius/4, radius/4, radius/8, segments);
    const cylinderMesh = new THREE.Mesh(cylinderGeometry);
    addMaterials(cylinderMesh, 0xAAAA55, 0xFF0000, null, null);

    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, -12, 0);

    const spotlight = new THREE.SpotLight(orangeLight, 1, 0, Math.PI / 4, 0);;
    cylinderMesh.add(spotlight);

    spotlight.target = spotLightTarget;
    obj.add(spotLightTarget);
    obj.userData.lights.spotlight = spotlight;
    

    cylinderMesh.position.y = -radius/4; 
    obj.add(cylinderMesh);
}

function createSmallSpheres(obj, radius, smallSphereRadius, numSmallSpheres, segments) {
    const smallSphereGeometry = new THREE.SphereGeometry(smallSphereRadius, segments, segments);

    for (let i = 0; i < numSmallSpheres; i++) {
        const smallSphereMesh = new THREE.Mesh(smallSphereGeometry);
        addMaterials(smallSphereMesh, 0xAAAA55, 0xFF0000, null, null);
        const angle = (i / numSmallSpheres) * Math.PI * 2;
        const radiusOffset = radius * 0.7; // Offset from the center of the body
        smallSphereMesh.position.set(Math.cos(angle) * radiusOffset, -radius/4 + 0.1, Math.sin(angle) * radiusOffset);
        obj.add(smallSphereMesh);

        const pointLight = new THREE.PointLight(orangeLight, 1, 6);
        pointLight.position.copy(smallSphereMesh.position);
        smallSphereMesh.add(pointLight);
        obj.userData.lights.pointLights.push(pointLight);
    }
}

function createCockpit(obj, radius, segments) {
    const cockpitGeometry = new THREE.SphereGeometry(radius, segments, segments, 0, Math.PI*2, 0, Math.PI/2);
    const cockpitMesh = new THREE.Mesh(cockpitGeometry);
    addMaterials(cockpitMesh, 0xBCE3E8, 0x000000, null, null);
    cockpitMesh.position.y = radius;
    obj.add(cockpitMesh);
}

function createMainBody(radius, segments) {
    const bodyGeometry = new THREE.SphereGeometry(radius, segments, segments);
    bodyGeometry.scale(1, 1/4, 1);
    const bodyMesh = new THREE.Mesh(bodyGeometry);
    addMaterials(bodyMesh, 0x3355AA, 0x000000, null, null);
    return bodyMesh;
}

function createUFO(radius, smallSphereRadius, numSmallSpheres) {
    segments = 64;
    const ufo = createMainBody(radius, segments);
    createCockpit(ufo, radius/4, segments);
    ufo.userData.lights = {
        spotlight: undefined,
        pointLights : []
    }
    ufo.userData.speed = 10;
    ufo.userData.rotationSpeed = 3.5;
    createSmallSpheres(ufo, radius, smallSphereRadius, numSmallSpheres, segments);
    createCylinderSpotlight(ufo, radius);

    updatables.push(ufo);
    ufo.userData.tick = (delta) => {
        const direction = new THREE.Vector3();
        // Calculate the trailer's direction based on the pressed keys
        direction.x = Number(arrowKeysState['ArrowRight']) - Number(arrowKeysState['ArrowLeft']);
        direction.z = Number(arrowKeysState['ArrowUp']) - Number(arrowKeysState['ArrowDown'])
        direction.normalize();

        // Update to new position based on the direction, speed and time elapsed
        const dx = direction.x * delta * ufo.userData.speed;
        const dz = direction.z * delta * ufo.userData.speed;
        const newPosition = ufo.position.clone();
        newPosition.x += dx;
        newPosition.z += dz;

        ufo.position.copy(newPosition);
        ufo.rotation.y += ufo.userData.rotationSpeed * delta;
    }    

    scene.add(ufo);
    return ufo;
}

function createCylinderGeometry(radiusTop, radiusBottom, height, radialSegments,
                                 heightSegments, color, rotation) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments);
    const mesh = new THREE.Mesh(geometry);
    mesh.rotation.z = rotation;
    addMaterials(mesh, color, 0x000000, null, null);
    return mesh;
}



function createCorkOakTree() {
    const tree = new THREE.Group();
    const trunkColor = 0xE97451;

    log = createCylinderGeometry(1, 1, 15, 42, 32, trunkColor, 0);
    log.position.set(0, 6, 0);

    branch1 = createCylinderGeometry(0.5, 0.5, 6, 32, 32, trunkColor, -Math.PI / 3);
    branch1.position.set(2, 7.5, 0);
    branch2 = createCylinderGeometry(0.3, 0.3, 2.5, 32, 32, trunkColor, Math.PI / 6);
    branch2.position.set(4.5, 7.0, 0);
    branch3 = createCylinderGeometry(0.5, 0.5, 4, 32, 32, trunkColor, Math.PI / 3);
    branch3.position.set(-2, 5.5, 0);

    const elipsoidGeometry = new THREE.SphereGeometry(3, 32, 32);
    elipsoidGeometry.scale(1.75, 1, 2);
    const canopy = new THREE.Mesh(elipsoidGeometry);
    canopy.position.set(0, 14, 0);
    addMaterials(canopy, 0x006400, 0x000000, null, null);

    tree.add(log);
    tree.add(branch1);
    tree.add(branch2);
    tree.add(branch3);
    tree.add(canopy);

    return tree;
}

function createCorkOakForest() {
  const numTrees = 12; 
  let xmin = -80;
  const xmax = 40;
  const minSpacing = 9;
  const xside = (xmax - xmin) / numTrees - minSpacing;
  const zmin = -55;
  const zmax = -5;
  const zmed = (zmin + zmax) / 2;
  const zs = [zmin, zmed - minSpacing, zmed + minSpacing, zmax];

  for (let i = 0; i < numTrees; i++, xmin += minSpacing + xside) {
    const height = sampleFromInterval(10, 15);
    let positionX = sampleFromInterval(xmin, xmin + xside); 
    const base = i % 2 ? 0 : 2;
    let positionZ = sampleFromInterval(zs[base], zs[base + 1]);
    const rotationY = sampleFromInterval(0, 2 * Math.PI);

    const tree = createCorkOakTree();

    tree.scale.set(height / 15, height / 15, height / 15);  
    tree.position.set(positionX, 0, positionZ); 
    tree.rotation.set(0, rotationY, 0); 

    scene.add(tree); 
    console.log(positionX, positionZ);
  }
}


function createFrontWall(obj, vertices, color) { 
    const indices = [
        9, 8, 2,
        2, 3, 9,
        9, 14, 17,
        0, 14, 9,
        0, 15, 14,
        15, 0, 10,
        10, 13, 15,
        13, 16, 15,
        12, 18, 21,
        11, 18, 12,
        11, 19, 18,
        11, 1, 19,
        1, 8, 19,
        19, 8, 20,
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh; 
}

function createBackWall(obj, vertices, color) {
    const indices = [
        1, 3, 2,
        3, 1, 0
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh;
}

function createLeftWall(obj, vertices, color) {
    const indices = [
         0, 3, 1,
         3, 2, 1,
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh;
}

function createRightWall(obj, vertices, color) {
    const indices = [
         0, 1, 2,
         2, 3, 0,
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh;
}

function createRectangle(obj, vertices, color) {
    const indices = [
        0, 1, 2,
        2, 3, 0
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh;
}

function createTriangle(obj, vertices, color) {
    const indices = [
        0, 1, 2
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, color, 0x000000, null, null);
    obj.add(mesh);
    return mesh;
}

function createHouse(length, height, width) {
    const house = new THREE.Group();
    const vertices = [
        // Front face
        -length, -height, width,  // Vertex 0
        length, -height, width,   // Vertex 1
        length, height, width,    // Vertex 2
        -length, height, width,   // Vertex 3
      
        // Back face
        -length, -height, -width,   // Vertex 4
        length, -height, -width,   // Vertex 5
        length, height, -width,   // Vertex 6
        -length, height, -width,  // Vertex 7

        // Pyramid top
        -0.8 * length, 2.0 * height, 0, // Vertex 8
        0.8 * length, 2.0 * height, 0,  // Vertex 9

        // Skirt
        -length, -0.6 * height, width,  // Vertex 10
        length, -0.6 * height, width,   // Vertex 11

        // Auxilary
        length, 0.6 * height, width,  // Vertex 12
        -length, 0.6 * height, width,   // Vertex 13

        // Door
        -0.1 * length, -0.6 * height, width,  // Vertex 14
        0.1 * length, -0.6 * height, width,   // Vertex 15
        0.1 * length, 0.6 * height, width,  // Vertex 16
        -0.1 * length, 0.6 * height, width,   // Vertex 17

        // Left Window
        -0.7 * length, 0, width,  // Vertex 18
        -0.5 * length, 0, width,   // Vertex 19
        -0.5 * length, 0.6 * height, width,  // Vertex 20
        -0.7 * length, 0.6 * height, width,   // Vertex 21

        // Right Window
        0.5 * length, 0, width,  // Vertex 22
        0.7 * length, 0, width,   // Vertex 23
        0.7 * length, 0.6 * height, width,  // Vertex 24
        0.5 * length, 0.6 * height, width,   // Vertex 25

        // More Skirt
        length, -0.6 * height, -width,  // Vertex 26
        -length, -0.6 * height, -width,   // Vertex 27       
      ];

    const frontWallVertices = selectVertices(vertices, [10, 11, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
    const frontWall = createFrontWall(house, frontWallVertices, 0xF5F5DC);

    const backWallVertices = selectVertices(vertices, [27, 26, 6, 7]);
    const backWall = createBackWall(house, backWallVertices, 0xF5F5DC);

    const leftWallVertices = selectVertices(vertices, [10, 27, 7, 3]);
    const leftWall = createLeftWall(house, leftWallVertices, 0xF5F5DC);
    
    const rightWallVertices = selectVertices(vertices, [11, 26, 6, 2]);
    const rightWall = createRightWall(house, rightWallVertices, 0xF5F5DC);
    
    const roofFrontVertices = selectVertices(vertices, [3, 2, 9, 8]);
    const frontRoof = createRectangle(house, roofFrontVertices, 0xFF8C40);

    const roofBackVertices = selectVertices(vertices, [6, 7, 8, 9]);
    const backRoof = createRectangle(house, roofBackVertices, 0xFF8C40);

    const roofRightVertices = selectVertices(vertices, [2, 6, 9]);
    const rightRoof = createTriangle(house, roofRightVertices, 0xFF8C40);

    const roofLeftVertices = selectVertices(vertices, [3, 8, 7]);
    const leftRoof = createTriangle(house, roofLeftVertices, 0xFF8C40);

    const frontSkirtVertices = selectVertices(vertices, [0, 1, 11, 10]);
    const frontSkirt = createRectangle(house, frontSkirtVertices, 0x0000FF);
    
    const backSkirtVertices = selectVertices(vertices, [4, 27, 26, 5]);
    const backSkirt = createRectangle(house, backSkirtVertices, 0x0000FF);
    
    const rightSkirtVertices = selectVertices(vertices, [1, 5, 26, 11]);
    const rightSkirt = createRectangle(house, rightSkirtVertices, 0x0000FF);
    
    const leftSkirtVertices = selectVertices(vertices, [0, 10, 27, 4]);
    const leftSkirt = createRectangle(house, leftSkirtVertices, 0x0000FF);

    const doorVertices = selectVertices(vertices, [14, 15, 16, 17]);
    const door = createRectangle(house, doorVertices, 0x0000FF);

    const leftWindowVertices = selectVertices(vertices, [18, 19, 20, 21]);
    const leftWindow = createRectangle(house, leftWindowVertices, 0x0000FF);

    const rightWindowVertices = selectVertices(vertices, [22, 23, 24, 25]);
    const rightWindow = createRectangle(house, rightWindowVertices, 0x0000FF);

    house.position.set(0, 0.5 * height + 0.7, 5);
    house.rotation.y = 0.15;
    scene.add(house);
    return house;
}

function createSkyDome() {
    let geometry = new THREE.SphereGeometry(500, 32, 32, 0, Math.PI*2, 0, Math.PI/2); 
    const skyDome = new THREE.Mesh(geometry);
    addMaterials(skyDome, 0xFFFFFF, 0x000000, null, null);
    for(const key in skyDome.userData.materials) {
        const material = skyDome.userData.materials[key];
        material.side = THREE.BackSide;
    }
    skyDome.position.y = -70;
    scene.add(skyDome); 
    return skyDome;
}

function createFlowerTexture(textureSize) {

    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d');
    context.fillStyle = "#7FE27F";
    context.fillRect(0, 0, textureSize, textureSize);

    const flowerColors = ['#FFFFFF', '#FFFF00', '#CBB1D1', '#87CEEB'];
    const flowerSize = textureSize / 256;
    const flowerCount = 2048;
    const margin = flowerSize * 2;

    for (let i = 0; i < flowerCount; i++) {
       const x = sampleFromInterval(margin, textureSize - margin); 
       const y = sampleFromInterval(margin, textureSize - margin); 

        const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        context.fillStyle = flowerColor;
        context.beginPath();
        context.arc(x + flowerSize, y + flowerSize, flowerSize, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }

    const flowerTexture =  new THREE.CanvasTexture(canvas)

    return flowerTexture;
}

function createSkyTexture(textureSize) {
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d');

    const gradient = context.createLinearGradient(0, 0, 0, textureSize);
    gradient.addColorStop(0, '#040BA8'); 
    gradient.addColorStop(1, '#0A0532'); 

    context.fillStyle = gradient;
    context.fillRect(0, 0, textureSize, textureSize);

    const starColor = "#FFFFFF";
    const starSize = textureSize / 2048;
    const starCount = 1024;
    const margin = 2 * starSize;

    for (let i = 0; i < starCount; i++) {
        const x = sampleFromInterval(margin, textureSize - margin); 
        const y = sampleFromInterval(margin, textureSize - margin); 

        context.fillStyle = starColor;
        context.beginPath();
        context.arc(x + starSize, y + starSize, starSize, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }

    const skyTexture =  new THREE.CanvasTexture(canvas)
    skyTexture.wrapS = THREE.RepeatWrapping;
    skyTexture.wrapT = THREE.RepeatWrapping;
    skyTexture.repeat.set(4, 4);

    return skyTexture;
}

function createFloor() {
    var width = 256; 
    var height = 256; 
    var segmentsX = 64;
    var segmentsY = 64;
    var maxHeight = 25;
    var heightOffset = -8;
    
    var geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const texture = new THREE.TextureLoader().load('https://web.tecnico.ulisboa.pt/~ist199068/recursos/heightmap.png');

    let shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;

            uniform sampler2D displacementMap;
            uniform float displacementScale;
            uniform float displacementBias;

            void main() {
            vUv = uv;
            vPosition = position;
            vec4 displacement = texture2D(displacementMap, uv);
            vec3 displacedPosition = position + normal * (displacement.r * displacementScale + displacementBias);
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;

            uniform vec3 color;
            uniform sampler2D map;

            void main() {
            vec4 diffuseColor = texture2D(map, vUv);
            gl_FragColor = vec4(color * diffuseColor.rgb, 1.0);
        }`,
        uniforms: {
            color: { value: new THREE.Color(0xFFFFFF) },
            map: { value: null },
            displacementMap: { value: texture },
            displacementScale: { value: maxHeight },
            displacementBias: { value: heightOffset },
        }
    });

    let floor = new THREE.Mesh(geometry);
    const displacementParameters = {
        map: null,
        displacementMap: texture,
        displacementScale: maxHeight,
        displacementBias: heightOffset,
    };
    addMaterials(floor, 0xFFFFFF, 0x000000, displacementParameters, shaderMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    sceneObjects.push(floor);

    return floor;
}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';
    const delta = clock.getDelta();
    for(const object of updatables) {
        object.userData.tick(delta);
    }
}

/////////////
/* DISPLAY */
/////////////
function display() {
    'use strict';
    renderer.render(scene, activeCamera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    document.body.appendChild( VRButton.createButton( renderer ) );
    renderer.xr.enabled = true;
    renderer.setAnimationLoop( function () {
        update();
        display();
    } );

    
    createScene();  
    createCameras();

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
}


////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize() { 
    'use strict';
    
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        const aspect = window.innerWidth / window.innerHeight;
        for (const key in cameras) {
            const camera = cameras[key];
            if(key === '1') {
                camera.aspect = aspect;
            }
            camera.updateProjectionMatrix(); 
        }
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';
    let key = e.key;
    switch(key) {
        case 'ArrowUp': 
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            arrowKeysState[key] = true;
            break;   
        default:
            // Do nothing for other keys
            return; 
    }
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
    let key = e.key;
    switch (key) {
        case '1':
            const flowerTexture = createFlowerTexture(1024);
            for(const key in floor.userData.materials) {
                const material = floor.userData.materials[key];
                if(key === 'basic') {
                    material.uniforms.map = {value: flowerTexture};
                } else {
                    material.map = flowerTexture;
                }
                material.needsUpdate = true;
            }
            break;
        case '2':
            const skyTexture = createSkyTexture(512);
            for(const key in skyDome.userData.materials) {
                const material = skyDome.userData.materials[key];
                material.map = skyTexture;
                material.needsUpdate = true;
            }
            break;
        case 'd':
        case 'D':
            directionalLight.visible = !directionalLight.visible;
            break;
        case 'q':
        case 'Q':
            changeMaterials('lambert');
            break;
        case 'w':
        case 'W':
            changeMaterials('phong');
            break;
        case 'e':
        case 'E':
            changeMaterials('toon');
            break;
        case 'r':
        case 'R':
            changeMaterials('basic');
            break; 
        case 's':
        case 'S':
            let visibility = ufo.userData.lights.spotlight.visible;
            ufo.userData.lights.spotlight.visible = !visibility;
            break;  
        case 'p':
        case 'P':
            for(const pointLight of ufo.userData.lights.pointLights) {
                pointLight.visible = !pointLight.visible;
            }
            break;    
        case 'ArrowUp': 
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
            arrowKeysState[key] = false;
            break;   
        default:
            // Do nothing for other keys
            return;                
    }        

}