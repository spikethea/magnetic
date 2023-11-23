import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Objects
import iceCreamURL from './assets/meshes/ice_cream_2.glb';
import truckURL from './assets/meshes/ice_cream_truck.glb';

//Textures
import defaultTexture from './assets/images/default__texture.png';
import mangoTexture from './assets/images/mango__texture.png';
import pistachioTexture from './assets/images/pistachio__texture.png';
import strawberryTexture from './assets/images/strawberry__texture.png';

//SVG
import pistachioIcon from './assets/images/pistachio-icon.svg';
import strawberryIcon from './assets/images/strawberry-icon.svg';
import mangoIcon from './assets/images/mango-icon.svg';


export default function main () {

    const iceCreamList = document.querySelector('.icecream-container__tray');
    const inputSlider = document.querySelector('.slidecontainer');
    const ARPrompt = document.querySelector('.ar-prompt');
    const ARButton = document.querySelector('#ar-button');
    const snapshotBtn = document.querySelector('#snapshot-zappar');

    let defaultRotation = 0;
    let isTouching = false;
    let initialTouch = 0;
    let lerpVector = null;

    iceCreamList.maxWidth = window.screen.width;

    // canvas must be binded after appended
    const canvas = document.createElement('canvas');

    document.body.appendChild(canvas);
        
    const renderer = new THREE.WebGLRenderer({
        antialias:true,
        canvas: canvas,
    });
    renderer.setClearColor(0x87CEEB, 1);
    renderer.setSize(window.innerWidth/2,window.innerHeight/2, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    let session = null;
    
    const EnterVRButton = VRButton.createButton( renderer );
    document.body.appendChild( EnterVRButton );

    const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 )
    camera.matrixAutoUpdate = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    const prevGamePads = new Map();

    //Setup Zappar
    let hasPlaced = false;

    let ambient = new THREE.AmbientLight(0x656765)
    let light = new THREE.DirectionalLight(0xFFFFFFF, 1);
    light.position.set(10, 10, 5);
    
    scene.add(ambient);
    scene.add(light);

    let floorGeometry = new THREE.PlaneGeometry(500, 500, 1, 1);
    let floorMat = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide} );
    let floor = new THREE.Mesh(floorGeometry, floorMat);
    floor.rotateX(-90)
    floor.position.z = -15;
    floor.position.y = -15;

    let icecream;
    let icecreamtruck;
    let icecreamScale = 1;

    let currentflavour;
    const iceCream = [
            {
                name: "Strawberry",
                tagName: "strawberriesAndCream",
                texture: strawberryTexture,
                svg: strawberryIcon,
                id: 0,
            },
            {
                name: "Pistachio",
                tagName: "pistachio",
                texture: pistachioTexture,
                svg: pistachioIcon,
                id: 1,
            },
            {
                name: "Mango",
                tagName: "mango",
                texture: mangoTexture,
                svg: mangoIcon,
                id: 2,
            }
    ];

    function selectIceCream (index) {
        // No action if selected already
        if (currentflavour === index && !hasPlaced) {
            return;
        }
        currentflavour = index;

        icecream.position.y = 8;
        icecream.position.z = -8;


        const texture = new THREE.TextureLoader().load(
            iceCream[index].texture
        );

        icecream.material.map = texture;
        texture.flipY = false;
        texture.needsUpdate = true;
        lerpVector = new THREE.Vector3(0, -2, -8)
        
    }

    const generateUI = () => {

        iceCream.forEach((element, index) => {
            console.log(element);
            const entry = document.createElement('a');
            entry.className = 'item-container'
            const icon = document.createElement('img');
            icon.src = element.svg;
            const name = document.createElement('p');
            name.innerHTML = element.name

            entry.appendChild(icon);
            entry.appendChild(name);

            entry.addEventListener('click', e => {
                e.preventDefault();

                selectIceCream(index);
            });
            iceCreamList.appendChild(entry);
        });
    }

    const buildControllers = () => {
        const controllerModelFactory = new XRControllerModelFactory();

        const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

        const line = new THREE.Line( geometry );
        line.name = 'line';
		line.scale.z = 10;
        
        const controllers = [];
        
        for(let i=0; i<=1; i++){
            const controller = renderer.xr.getController( i );
            controller.add( line.clone() );
            controller.userData.selectPressed = false;
            scene.add( controller );
            
            controllers.push( controller );
            
            const grip = renderer.xr.getControllerGrip( i );
            grip.add( controllerModelFactory.createControllerModel( grip ) );
            console.log(grip);
            scene.add( grip );
        }
        
        return controllers;
    }

    const activateXR = async () => {
        console.log('XR Started')
        let i = 0;
        let handedness = "unknown";

        session = renderer.xr.getSession();
        console.log()

        // A 'local' reference space has a native origin that is located
        // near the viewer's position at the time the session was created.
        scene.add(floor);

        buildControllers();
		//a check to prevent console errors if only one input source
		if (isIterable(session.inputSources)) {
            for (const source of session.inputSources) {
                if (source && source.handedness) {
                    handedness = source.handedness; //left or right controllers
                }
                if (!source.gamepad) continue;
                console.log('gamepad');
                const controller = renderer.xr.getController(i++);
                console.log(source);
                console.log(controller);
                const old = prevGamePads.get(source);
                const data = {
                    handedness: handedness,
                    buttons: source.gamepad.buttons.map((b) => b.value),
                    axes: source.gamepad.axes.slice(0)
                };
                console.log(old);

                
                //process data accordingly to create 'events'
            }
        }
    }

    function loadIceCream () {

        const gltfloader = new GLTFLoader();
        gltfloader.load (iceCreamURL,
                moveIceCream, (xhr) => {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            function(error){
                console.log(error)
        });
    }

    function loadTruck () {

        const gltfloader = new GLTFLoader();
        gltfloader.load (truckURL,
                (gltf) => {
                    icecreamtruck = gltf.scene.children[0];
                    icecream.material.needsUpdate = true
                    scene.add( icecreamtruck );
                    icecreamtruck.scale.set(0.2, 0.2, 0.2);
                    console.log(icecreamtruck.position);
                    icecreamtruck.rotation.z = THREE.MathUtils.degToRad(-30);
                    icecreamtruck.position.z = -50;
                    icecreamtruck.position.x = 5;
                }, (xhr) => {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            function(error){
                console.log(error)
        });
    }


    function moveIceCream (gltf) {
        icecream = gltf.scene.children[0];
        icecream.material.specular= 0x000000;
        icecream.material.needsUpdate = true
        scene.add( icecream );
        icecream.position.y = 8;
        
        icecream.rotation.z = 0.2;
    }

    const rotateIceCream = e => {
        isTouching = true;

        e.preventDefault();
        const touch = e.touches[0].clientX;
        icecream.rotation.y = defaultRotation + (touch - initialTouch)*0.01;
    }


    loadIceCream();
    loadTruck();
    generateUI();

    function animate () {
        renderer.setAnimationLoop( render );
    }

    function render () {//loop causes the renderer to draw the scene every time the screen is refreshed.
                

        if (icecream) {
            if (!isTouching) {
                icecream.rotation.y += 0.01;
            }

            if (icecreamScale !== icecream.scale.x) {
                icecream.scale.x = icecreamScale;
                icecream.scale.y = icecreamScale*2.345;
                icecream.scale.z = icecreamScale;
            }
            if (lerpVector) {
                console.log(icecream.position)
                icecream.position.lerp(lerpVector, 0.1);
                setTimeout(() => {
                    icecream.position.y = -2;
                    console.log(lerpVector);
                    lerpVector = null
                }, 800);
            }
        }

        // if (!hasPlaced) instantWorldTracker.setAnchorPoseFromCameraOffset(0, 0, -5);
        // camera.updateFrame(renderer);

            if (session) {
                dollyMove();
            }
            renderer.render( scene, camera );
    }

    animate();

    inputSlider.addEventListener('input', e => {
        // Avoid endless updates
        if (icecreamScale !== e.target.value / e.target.max) {
            icecreamScale = e.target.value / e.target.max;
        }
    });

    canvas.addEventListener('click', placeIceCream);
    canvas.addEventListener('touchstart', placeIceCream);

    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        initialTouch = e.touches[0].clientX;
    });
    
    canvas.addEventListener('touchmove', rotateIceCream);

    canvas.addEventListener('touchend', () => {
        isTouching = false;
        defaultRotation = icecream.rotation.y;
    });

    renderer.xr.addEventListener( 'sessionstart', activateXR);

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth,window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;

        //camera.updateProjectionMatrix();
    });


    function placeIceCream () {
        // If no flavour has been selected, select the first object
        if (!hasPlaced) {
            selectIceCream(0);
            ARPrompt.style.display = 'none';
            
            const texture = new THREE.TextureLoader().load(
                defaultTexture
            );
    
            icecream.material.map = texture;
            texture.flipY = false;
            texture.needsUpdate = true;
        }
        hasPlaced = true;

        canvas.removeEventListener('click', placeIceCream, false);
        canvas.removeEventListener('touchstart', placeIceCream, false);
    }
    
    function dollyMove() {

        var handedness = "unknown";
    
        let i = 0;
    
        if (session) {
            // let xrCamera = renderer.xr.getCamera(camera);
            // xrCamera.getWorldDirection(cameraVector);
    
            //a check to prevent console errors if only one input source
            if (isIterable(session.inputSources)) {
                for (const source of session.inputSources) {
                    if (source && source.handedness) {
                        handedness = source.handedness; //left or right controllers
                    }
                    if (!source.gamepad) continue;
                    const controller = renderer.xr.getController(i++);
                    const old = prevGamePads.get(source);
                    const data = {
                        handedness: handedness,
                        buttons: source.gamepad.buttons.map((b) => b.value),
                        axes: source.gamepad.axes.slice(0)
                    };
                    if (old) {
                        data.buttons.forEach((value, i) => {
                            //handlers for buttons
                            if (value !== old.buttons[i] || Math.abs(value) > 0.8) {
                                //check if it is 'all the way pushed'
                                if (value === 1) {
                                    console.log("Button" + i + "Down");
                                    if (i === 5) {
                                        if (currentflavour + 1 < iceCream.length) {
                                            selectIceCream(currentflavour + 1);
                                        } else {
                                            selectIceCream(0);
                                        }
                                    }
                                }
                            }
                        });
                        // data.axes.forEach((value, i) => {
                        //     //handlers for thumbsticks
                        //     //if thumbstick axis has moved beyond the minimum threshold from center, windows mixed reality seems to wander up to about .17 with no input
                        //     if (Math.abs(value) > 0.2) {
                        //         //set the speedFactor per axis, with acceleration when holding above threshold, up to a max speed
                        //         speedFactor[i] > 1 ? (speedFactor[i] = 1) : (speedFactor[i] *= 1.001);
                        //         console.log(value, speedFactor[i], i);
                        //         if (i == 2) {
                        //             //left and right axis on thumbsticks
                        //             if (data.handedness == "left") {
                        //                 // (data.axes[2] > 0) ? console.log('left on left thumbstick') : console.log('right on left thumbstick')
    
                        //                 //move our dolly
                        //                 //we reverse the vectors 90degrees so we can do straffing side to side movement
                        //                 dolly.position.x -= cameraVector.z * speedFactor[i] * data.axes[2];
                        //                 dolly.position.z += cameraVector.x * speedFactor[i] * data.axes[2];
    
                        //                 //provide haptic feedback if available in browser
                        //                 if (
                        //                     source.gamepad.hapticActuators &&
                        //                     source.gamepad.hapticActuators[0]
                        //                 ) {
                        //                     var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                        //                     if (pulseStrength > 0.75) {
                        //                         pulseStrength = 0.75;
                        //                     }
    
                        //                     var didPulse = source.gamepad.hapticActuators[0].pulse(
                        //                         pulseStrength,
                        //                         100
                        //                     );
                        //                 }
                        //             } else {
                        //                 // (data.axes[2] > 0) ? console.log('left on right thumbstick') : console.log('right on right thumbstick')
                        //                 dolly.rotateY(-THREE.MathUtils.degToRad(data.axes[2]));
                        //             }
                        //             controls.update();
                        //         }
    
                        //         if (i == 3) {
                        //             //up and down axis on thumbsticks
                        //             if (data.handedness == "left") {
                        //                 // (data.axes[3] > 0) ? console.log('up on left thumbstick') : console.log('down on left thumbstick')
                        //                 dolly.position.y -= speedFactor[i] * data.axes[3];
                        //                 //provide haptic feedback if available in browser
                        //                 if (
                        //                     source.gamepad.hapticActuators &&
                        //                     source.gamepad.hapticActuators[0]
                        //                 ) {
                        //                     var pulseStrength = Math.abs(data.axes[3]);
                        //                     if (pulseStrength > 0.75) {
                        //                         pulseStrength = 0.75;
                        //                     }
                        //                     var didPulse = source.gamepad.hapticActuators[0].pulse(
                        //                         pulseStrength,
                        //                         100
                        //                     );
                        //                 }
                        //             } else {
                        //                 // (data.axes[3] > 0) ? console.log('up on right thumbstick') : console.log('down on right thumbstick')
                        //                 dolly.position.x -= cameraVector.x * speedFactor[i] * data.axes[3];
                        //                 dolly.position.z -= cameraVector.z * speedFactor[i] * data.axes[3];
    
                        //                 //provide haptic feedback if available in browser
                        //                 if (
                        //                     source.gamepad.hapticActuators &&
                        //                     source.gamepad.hapticActuators[0]
                        //                 ) {
                        //                     var pulseStrength = Math.abs(data.axes[2]) + Math.abs(data.axes[3]);
                        //                     if (pulseStrength > 0.75) {
                        //                         pulseStrength = 0.75;
                        //                     }
                        //                     var didPulse = source.gamepad.hapticActuators[0].pulse(
                        //                         pulseStrength,
                        //                         100
                        //                     );
                        //                 }
                        //             }
                        //             controls.update();
                        //         }
                        //     } else {
                        //         //axis below threshold - reset the speedFactor if it is greater than zero  or 0.025 but below our threshold
                        //         if (Math.abs(value) > 0.025) {
                        //             speedFactor[i] = 0.025;
                        //         }
                        //     }
                        // });
                    }
                    prevGamePads.set(source, data);
                }
            }
        }
    }
    
    function isIterable(obj) {
        // checks for null and undefined
        if (obj == null) {
            return false;
        }
        return typeof obj[Symbol.iterator] === "function";
    }
}