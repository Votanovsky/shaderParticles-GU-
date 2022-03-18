import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import * as dat from 'dat.gui'
import gsap from 'gsap'

console.log(gsap);


import t from '../static/01-end.jpg'
import t1 from '../static/01-first.jpg'
import t2 from '../static/02-first.jpg'
import t3 from '../static/02-end.jpg'

const video = document.getElementById('video1')
const video2 = document.getElementById('video3')


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

let bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
const settings = initSettings()
// Bloom
function postProcessing() {
    let renderScene = new RenderPass( scene, camera );

    // let bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
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
        bloomStrength: 0,
        bloomRadius: 0,
        bloomThreshold: 0
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
            // child.material.uniforms.distortion.value = settings.distortion;
            // bloomPass.strength = settings.bloomStrength;
            child.material.needsUpdate = true;
            
        }
    });
    
}

// Objects
const geometry = new THREE.PlaneBufferGeometry( 480*1.745, 820*1.745, 480, 820);

// Materials
const material = new THREE.ShaderMaterial({
    // extensions: {
    //     derivatives: "#extension GL_OES_standard_derivatives : enable"
    // },
    // side: THREE.DoubleSide,
    uniforms: {
        time: {type: "float", value: utime},
        progress: {type: "float", value: utime},
        distortion: {type: "float", value: 0},
        t: {type: "t", value: new THREE.TextureLoader().load(t)},
        t1: {type: "t", value: new THREE.TextureLoader().load(t1)},
        resolution: {tupe: "v4", value: new THREE.Vector4()},
        uvRate1: {
            value: new THREE.Vector2(1,1)
        }
    },
    vertexShader:   document.getElementById('vertex-shader').textContent,
    fragmentShader: document.getElementById('fragment-shader').textContent

    
});

const material1 = new THREE.ShaderMaterial({
    // extensions: {
    //     derivatives: "#extension GL_OES_standard_derivatives : enable"
    // },
    // side: THREE.DoubleSide,
    uniforms: {
        time: {type: "float", value: utime},
        progress: {type: "float", value: utime},
        distortion: {type: "float", value: 0},
        t: {type: "t", value: new THREE.TextureLoader().load(t2)},
        t1: {type: "t", value: new THREE.TextureLoader().load(t3)},
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
const mesh1 = new THREE.Points(geometry,material1)


// gsap ===========
video.addEventListener('ended', ()=> {
    scene.clear()
    scene.add(mesh)
    gsap.to(video, {
        duration: 0.1,
        opacity: 0
    })
    gsap.to(material.uniforms.distortion, {
        duration: 3,
        value:1.5,
        ease: "power2.inOut"
    })

    gsap.to(material.uniforms.progress, {
        duration: 1,
        delay:1.5,
        value:1,
    })

    gsap.to(bloomPass, {
        duration: 2,
        strength:5,
        ease: "power2.in"
    })
    gsap.to(material.uniforms.distortion, {
        duration: 2,
        value:0,
        delay: 2,
        ease: "power2.inOut"
    })
    gsap.to(bloomPass, {
        duration: 2,
        strength:0,
        delay: 2,
        ease: "power2.out",
        onComplete:()=> {
            video2.currentTime = 0;
            video2.play()
            gsap.to(video2, {
                duration: 0.1,
                opacity: 1
            })
            // video.currentTime = 0;
            // video.play();
            // gsap.to(video, {
            //     duration: 0.1,
            //     opacity: 1
            // })
        }
    })
})

video2.addEventListener('ended', ()=> {
    scene.clear()
    scene.add(mesh1)
    gsap.to(video2, {
        duration: 0.1,
        opacity: 0
    })
    gsap.to(material.uniforms.distortion, {
        duration: 3,
        value:1.5,
        ease: "power2.inOut"
    })

    gsap.to(material.uniforms.progress, {
        duration: 1,
        delay:1.5,
        value:1,
    })

    gsap.to(bloomPass, {
        duration: 2,
        strength:5,
        ease: "power2.in"
    })
    gsap.to(material.uniforms.distortion, {
        duration: 2,
        value:0,
        delay: 2,
        ease: "power2.inOut"
    })
    gsap.to(bloomPass, {
        duration: 2,
        strength:0,
        delay: 2,
        ease: "power2.out",
        onComplete:()=> {
            video.currentTime = 0;
            video.play()
            gsap.to(video, {
                duration: 0.1,
                opacity: 1
            })
            // video.currentTime = 0;
            // video.play();
            // gsap.to(video, {
            //     duration: 0.1,
            //     opacity: 1
            // })
        }
    })
})