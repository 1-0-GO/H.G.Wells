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
    let params = {color: color, emissive: emissive};
    let noLightMaterial;
    if(displacementParameters) {
        params = {...params, ...displacementParameters};
        noLightMaterial = shaderMaterial;
    } else {
        noLightMaterial = new THREE.MeshBasicMaterial({color: color});
    }
    mesh.userData.materials = {
        'lambert': new THREE.MeshLambertMaterial(params),
        'phong': new THREE.MeshPhongMaterial(params),
        'toon': new THREE.MeshToonMaterial(params),
        'basic': noLightMaterial
    };
    
    mesh.material = mesh.userData.materials['phong'];
    console.log(mesh.material.displacementScale)
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


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040b28);
    moon = createMoon(4);
    moon.position.set(-30, 20, -5);
    ufo = createUFO(3, 0.15, 12);
    house = createHouse(10, 2.5, 2.5);
    createSkyDome();
    ufo.position.set(0, 16, 0);
    directionalLight = createDirectionalLight(8, 8, 8);
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
    cameras['1'] = createPerspectiveCamera(20 , 20, 20); 
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
    const cylinderGeometry = new THREE.CylinderGeometry(radius/3, radius/3, radius/6, segments);
    const cylinderMesh = new THREE.Mesh(cylinderGeometry);
    addMaterials(cylinderMesh, 0xAAAA55, 0xFF0000, null, null);

    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, -12, 0);

    const spotlight = new THREE.SpotLight(orangeLight, 1, 0, Math.PI / 4, 0);;
    cylinderMesh.add(spotlight);

    spotlight.target = spotLightTarget;
    obj.add(spotLightTarget);
    obj.userData.lights.spotlight = spotlight;
    

    cylinderMesh.position.y = -radius/3; 
    obj.add(cylinderMesh);
}

function createSmallSpheres(obj, radius, smallSphereRadius, numSmallSpheres, segments) {
    const smallSphereGeometry = new THREE.SphereGeometry(smallSphereRadius, segments, segments);

    for (let i = 0; i < numSmallSpheres; i++) {
        const smallSphereMesh = new THREE.Mesh(smallSphereGeometry);
        addMaterials(smallSphereMesh, 0xAAAA55, 0xFF0000, null, null);
        const angle = (i / numSmallSpheres) * Math.PI * 2;
        const radiusOffset = radius * 0.7; // Offset from the center of the body
        smallSphereMesh.position.set(Math.cos(angle) * radiusOffset, -radius/3, Math.sin(angle) * radiusOffset);
        obj.add(smallSphereMesh);

        const pointLight = new THREE.PointLight(orangeLight, 1, 4);
        pointLight.position.copy(smallSphereMesh.position);
        smallSphereMesh.add(pointLight);
        obj.userData.lights.pointLights.push(pointLight);
    }
}

function createCockpit(obj, radius, segments) {
    const cockpitGeometry = new THREE.SphereGeometry(radius, segments, segments, 0, Math.PI*2, 0, Math.PI/2);
    const cockpitMesh = new THREE.Mesh(cockpitGeometry);
    addMaterials(cockpitMesh, 0xFFFFFF, 0x000000, null, null);
    cockpitMesh.position.y = radius;
    obj.add(cockpitMesh);
}

function createMainBody(radius, segments) {
    const bodyGeometry = new THREE.SphereGeometry(radius, segments, segments);
    bodyGeometry.scale(1, 1/3, 1);
    const bodyMesh = new THREE.Mesh(bodyGeometry);
    addMaterials(bodyMesh, 0x3355AA, 0x000000, null, null);
    return bodyMesh;
}

function createUFO(radius, smallSphereRadius, numSmallSpheres) {
    segments = 64;
    const ufo = createMainBody(radius, segments);
    createCockpit(ufo, radius/3, segments);
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
        0.5 * length, 0.6 * height, width   // Vertex 25
      ];

    const frontWallVertices = selectVertices(vertices, [10, 11, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
    const frontWall = createFrontWall(house, frontWallVertices, 0xF5F5DC);

    const backWallVertices = selectVertices(vertices, [4, 5, 6, 7]);
    const backWall = createBackWall(house, backWallVertices, 0xF5F5DC);

    const leftWallVertices = selectVertices(vertices, [0, 4, 7, 3]);
    const leftWall = createLeftWall(house, leftWallVertices, 0xF5F5DC);
    
    const rightWallVertices = selectVertices(vertices, [1, 5, 6, 2]);
    const rightWall = createRightWall(house, rightWallVertices, 0xF5F5DC);
    
    const roofFrontVertices = selectVertices(vertices, [3, 2, 9, 8]);
    const frontRoof = createRectangle(house, roofFrontVertices, 0xFF8C40);

    const roofBackVertices = selectVertices(vertices, [6, 7, 8, 9]);
    const backRoof = createRectangle(house, roofBackVertices, 0xFF8C40);

    const roofRightVertices = selectVertices(vertices, [2, 6, 9]);
    const rightRoof = createTriangle(house, roofRightVertices, 0xFF8C40);

    const roofLeftVertices = selectVertices(vertices, [3, 8, 7]);
    const leftRoof = createTriangle(house, roofLeftVertices, 0xFF8C40);

    const skirtVertices = selectVertices(vertices, [0, 1, 11, 10]);
    const skirt = createRectangle(house, skirtVertices, 0x0000FF);

    const doorVertices = selectVertices(vertices, [14, 15, 16, 17]);
    const door = createRectangle(house, doorVertices, 0x0000FF);

    const leftWindowVertices = selectVertices(vertices, [18, 19, 20, 21]);
    const leftWindow = createRectangle(house, leftWindowVertices, 0x0000FF);

    const rightWindowVertices = selectVertices(vertices, [22, 23, 24, 25]);
    const rightWindow = createRectangle(house, rightWindowVertices, 0x0000FF);

    house.position.set(5, 0.5 * height + 0.7, 5);
    house.rotation.y = 0.2;
    scene.add(house);
    return house;
}

function createSkyDome() {
    let geometry = new THREE.SphereGeometry(50, 32, 32, 0, Math.PI*2, 0, Math.PI/2); 
    let material = new THREE.MeshBasicMaterial({ side: THREE.BackSide }); 

    let textureLoader = new THREE.TextureLoader();
    textureLoader.load('https://web.tecnico.ulisboa.pt/~ist199068/recursos/ceu_estrelado.jpeg', function(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 1);
        material.map = texture;
        material.needsUpdate = true;
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere); 
}

function generateFlowerTexture(textureSize) {

    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d');
    context.fillStyle = "#7FE27F";
    context.fillRect(0, 0, textureSize, textureSize);

    const flowerColors = ['#FFFFFF', '#FFFF00', '#CBB1D1', '#87CEEB'];
    const flowerSize = textureSize / 256;
    const groundCoverage = 0.90;

    for (let y = 0; y < textureSize; y += flowerSize) {
        for (let x = 0; x < textureSize; x += flowerSize) {
            let isGround = Math.random() < groundCoverage;
            if (isGround) continue;

            const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            context.fillStyle = flowerColor;
            context.beginPath();
            context.arc(x + flowerSize, y + flowerSize, flowerSize, 0, Math.PI * 2);
            context.closePath();
            context.fill();
        }
    }

    const flowerTexture =  new THREE.CanvasTexture(canvas)
    flowerTexture.wrapS = THREE.RepeatWrapping;
    flowerTexture.wrapT = THREE.RepeatWrapping;
    flowerTexture.repeat.set(1, 1);

    return flowerTexture;
}

function createFloor() {
    var width = 128; 
    var height = 128; 
    var segmentsX = 64;
    var segmentsY = 64;
    var maxHeight = 20;
    var heightOffset = -6;
    
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
    // house.rotation.y += 0.01;
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

    createScene();  
    createCameras();

    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';
    update();
    display();

    requestAnimationFrame(animate);
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
            const flowerTexture = generateFlowerTexture(1024);
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