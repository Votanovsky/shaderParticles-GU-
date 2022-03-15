import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import * as dat from 'dat.gui'


import t from '../static/4.jpg'
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Lights

const pointLight = new THREE.PointLight(0xffffff, 0.1)
// pointLight.position.x = 2
// pointLight.position.y = 3
// pointLight.position.z = 4
pointLight.position.set(2, 3, 4)
scene.add(pointLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    composer.setSize( sizes.width, sizes.height );
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.001, 5000)
camera.position.set(0,0,1500);
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    // canvas: canvas,
    canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))



const settings = initSettings()
// Bloom
function postProcessing() {
    let renderScene = new RenderPass( scene, camera );

    let bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    // bloomPass.threshold = params.bloomThreshold;
    // bloomPass.strength = params.bloomStrength;
    // bloomPass.radius = params.bloomRadius;
    bloomPass.strength = settings.bloomStrength;
    
    let composer = new EffectComposer( renderer );
    composer.addPass( renderScene );
    composer.addPass( bloomPass );
    
    return composer 
}

function initSettings() {
    const settings = {
        distortion: 0,
        bloomStrength: 1.5,
        bloomRadius: .4,
        bloomThreshold: .35
    }

    gui.add(settings, "distortion", 0, 3, .001)
    gui.add(settings, "bloomRadius", 0, 100, .1)
    gui.add(settings, "bloomStrength", 0, 10, .01)
    gui.add(settings, "bloomThreshold", 0, 1, .01)

    return settings
}


/**
 * Animate
 */

const clock = new THREE.Clock()

let utime = 0;

const composer = postProcessing()


const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    utime+=0.05
    // Update Orbital Controls
    controls.update()

    // Render
    composer.render()
    // renderer.render(scene, camera)

    // Call tick again on the next frame
    composer.passes[1].strength = settings.bloomStrength
    composer.passes[1].radius = settings.bloomRadius
    composer.passes[1].threshold = settings.bloomThreshold
    
    updateUniforms()
    // console.log(composer.passes[1].strength)
    
    window.requestAnimationFrame(tick)
}

tick()

function updateUniforms() {
    scene.traverse(function(child) {
        if (child instanceof THREE.Points
            && child.material.type === 'ShaderMaterial') {
            child.material.uniforms.time.value = utime;
            child.material.uniforms.distortion.value = settings.distortion;
            // bloomPass.strength = settings.bloomStrength;
            child.material.needsUpdate = true;
            
        }
    });
    
}

// Objects
const geometry = new THREE.PlaneBufferGeometry( 1920, 1080, 900, 900);

// Materials
const material = new THREE.ShaderMaterial({
    // extensions: {
    //     derivatives: "#extension GL_OES_standard_derivatives : enable"
    // },
    // side: THREE.DoubleSide,
    uniforms: {
        time: {type: "float", value: utime},
        distortion: {type: "float", value: 0},
        t: {type: "t", value: new THREE.TextureLoader().load(t)},
        resolution: {tupe: "v4", value: new THREE.Vector4()},
        uvRate1: {
            value: new THREE.Vector2(1,1)
        }
    },
    vertexShader:   document.getElementById('vertex-shader').textContent,
    fragmentShader: document.getElementById('fragment-shader').textContent

    
});

// Mesh
const mesh = new THREE.Points(geometry,material)
scene.add(mesh)