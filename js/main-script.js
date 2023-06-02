//////////////////////
/* GLOBAL letIABLES */
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

function addMaterials(mesh, color, emissive) {
    mesh.userData.materials = {
        'lambert': new THREE.MeshLambertMaterial({ color: color, emissive: emissive }),
        'phong': new THREE.MeshPhongMaterial({ color: color, emissive: emissive }),
        'toon': new THREE.MeshToonMaterial({ color: color, emissive: emissive }),
        'basic': new THREE.MeshBasicMaterial({ color: color})
    };
    
    mesh.material = mesh.userData.materials['lambert'];
    sceneObjects.push(mesh);
}

function changeMaterials(materialName) {
    for(mesh of sceneObjects) {
        mesh.material = mesh.userData.materials[materialName];
    }
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
    createHouse(6, 2, 2);
    ufo.position.set(10, 16, -5);
    directionalLight = createDirectionalLight(1, 1, 1);
    ambientLight = createAmbientLight();
    axis.visible = true;
    scene.add(axis);  

    let plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 100, 100));
    addMaterials(plane, 0x669933, 0x000000);
    plane.position.set(0, 0, 0);
    plane.rotation.x = -Math.PI / 2
    scene.add(plane);
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
    directionalLight.position.set(x,y, z);
    scene.add(directionalLight);
    return directionalLight;
}

function createAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0x777777, 0.2);
    scene.add(ambientLight);
    return ambientLight;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMoon(radius) {
    const moonGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const moon = new THREE.Mesh(moonGeometry);
    addMaterials(moon, 0xffffbb, 0xffff44);
    scene.add(moon);
    return moon;
}

function createCylinderSpotlight(obj, radius) {
    const cylinderGeometry = new THREE.CylinderGeometry(radius/3, radius/3, radius/6, segments);
    const cylinderMesh = new THREE.Mesh(cylinderGeometry);
    addMaterials(cylinderMesh, 0xaaaa55, 0xff0000);
    cylinderMesh.position.y = -radius/3; 
    obj.add(cylinderMesh);

    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, -10, 0);

    const spotlight = new THREE.SpotLight(orangeLight, 1.2, 0, Math.PI / 3, 0.5);;

    spotlight.target = spotLightTarget;
    spotlight.add(spotLightTarget);
    obj.userData.lights.spotlight = spotlight;
    
    cylinderMesh.add(spotlight);
}


function createSmallSpheres(obj, radius, smallSphereRadius, numSmallSpheres, segments) {
    const smallSphereGeometry = new THREE.SphereGeometry(smallSphereRadius, segments, segments);

    for (let i = 0; i < numSmallSpheres; i++) {
        const smallSphereMesh = new THREE.Mesh(smallSphereGeometry);
        addMaterials(smallSphereMesh, 0xaaaa55, 0xff0000);
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
    addMaterials(cockpitMesh, 0xffffff, 0x000000);
    cockpitMesh.position.y = radius;
    obj.add(cockpitMesh);
}

function createMainBody(radius, segments) {
    const bodyGeometry = new THREE.SphereGeometry(radius, segments, segments);
    bodyGeometry.scale(1, 1/3, 1);
    const bodyMesh = new THREE.Mesh(bodyGeometry);
    addMaterials(bodyMesh, 0x3355aa, 0x000000);
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

function createHouse(l ,h, w) {
    const vertices = new Float32Array([
        // Front face
        -l, -h, w,  // Vertex 0
        l, -h, w,   // Vertex 1
        l, h, w,    // Vertex 2
        -l, h, w,   // Vertex 3
      
        // Back face
        -l, -h, -w, // Vertex 4
        l, -h, -w,  // Vertex 5
        l, h, -w,   // Vertex 6
        -l, h, -w,   // Vertex 7

        // Pyramid top
        -0.8 * l, 2.0 * h, 0, // Vertex 8
        0.8 * l, 2.0 * h, 0  // Vertex 9
      ]);
      
      // Create an array to define the parallelepiped's faces using indices
      const indices = [
        // Parallellepiped
        // Front face
        0, 1, 2,
        2, 3, 0,
      
        // Back face
        4, 6, 5,
        4, 7, 6,
      
        // Top face
        3, 2, 6,
        3, 6, 7,
      
        // Bottom face
        0, 4, 1,
        1, 4, 5,
      
        // Left face
        0, 3, 7,
        0, 7, 4,
      
        // Right face
        1, 5, 6,
        1, 6, 2,

        //Roof
        //Front Face
        3, 2, 9,
        9, 8, 3,

        //Left Face
        3, 8, 7,

        //Right Face
        2, 6, 9,
      ];

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3) );
    geometry.setIndex(indices);
    const mesh = new THREE.Mesh(geometry);
    addMaterials(mesh, 0xffffff, 0x000000);
    mesh.position.set(5, 5, 5);
    scene.add(mesh);
    mesh.rotation.y = 0.5;
}

//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function checkCollisions(){
    'use strict';

}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){
    'use strict';

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
            activeCamera =  cameras[key];
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
        case 'p':
        case 'P':
            let visibility = ufo.userData.lights.spotlight.visible;
            ufo.userData.lights.spotlight.visible = !visibility;
            break;  
        case 's':
        case 'S':
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