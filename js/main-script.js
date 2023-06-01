//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
// cameras
var activeCamera; 
const cameras = {};
//lights
var directionalLight;
var ambientLight;
// 3D objects
var moon;
const axis = new THREE.AxisHelper(20);
const updatables = [];
const sceneObjects = [];
// other 
const clock = new THREE.Clock();
var scene, renderer;

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
    scene.background = new THREE.Color(0xadd8e6); // light-blue
    moon = createMoon(2, -15, 15, -5);
    directionalLight = createDirectionalLight(1, 1, 1);
    ambientLight = createAmbientLight();
    axis.visible = true;
    scene.add(axis);  
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createPerspectiveCamera(x,y,z) {
    'use strict';
    var camera = new THREE.PerspectiveCamera( 70,
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
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    return directionalLight;
}

function createAmbientLight() {
    const ambientLight = new THREE.AmbientLight(0x333333, 0.2);
    scene.add(ambientLight);
    return ambientLight;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createMoon(r, x, y, z) {
    const moonGeometry = new THREE.SphereGeometry(r, 32, 32);
    const moon = new THREE.Mesh(moonGeometry);
    addMaterials(moon, 0xffffbb, 0xffff44);
    moon.position.set(x, y, z);
    scene.add(moon);
    return moon;
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

}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e){
    'use strict';
    var key = e.key;
    switch (key) {
        case '1':
            activeCamera =  cameras[key];
            break;
        case 'd':
        case 'D':
            directionalLight.visible = !directionalLight.visible;    
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
    }        

}