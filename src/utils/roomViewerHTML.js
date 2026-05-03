export const getRoomViewerHTML = () => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <title>Room Viewer</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#1a1a2e}
    canvas{display:block;touch-action:none}
    #info{
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,0.55);color:rgba(255,255,255,0.9);
      padding:7px 16px;border-radius:18px;
      font-family:sans-serif;font-size:11px;letter-spacing:0.3px;
      pointer-events:none;z-index:50;white-space:nowrap;
    }
  </style>
</head>
<body>

<canvas id="c"></canvas>
<div id="info">👆 Glisse pour pivoter  ·  🤏 Pince pour zoomer</div>

<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"
  }
}
</script>

<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 200);
camera.position.set(5, 5, 5);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.1);
sun.position.set(8, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xb0c8ff, 0.3);
fill.position.set(-4, 6, -4);
scene.add(fill);
scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 0.4));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.5;
controls.maxDistance = 40;
controls.target.set(0, 1, 0);

const loader = new GLTFLoader();

function toRN(data){
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
}

window.loadRoom = function(b64){
  try {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i);

    loader.parse(buf.buffer, '',
      gltf => {
        const root = gltf.scene;

        // Mesurer & normaliser
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 6 / maxDim;
        root.scale.setScalar(scale);

        // Centrer + poser au sol
        root.updateMatrixWorld(true);
        const box2 = new THREE.Box3().setFromObject(root);
        const center2 = new THREE.Vector3(); box2.getCenter(center2);
        root.position.x = -center2.x;
        root.position.z = -center2.z;
        root.position.y = -box2.min.y;

        root.traverse(c => {
          if(c.isMesh){
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });

        scene.add(root);

        // Caméra à bonne distance
        const finalBox = new THREE.Box3().setFromObject(root);
        const finalSize = new THREE.Vector3(); finalBox.getSize(finalSize);
        const finalCenter = new THREE.Vector3(); finalBox.getCenter(finalCenter);
        const dist = Math.max(finalSize.x, finalSize.z) * 1.5;
        camera.position.set(dist, dist*0.85, dist);
        controls.target.copy(finalCenter);
        controls.update();

        toRN({type:'roomLoaded'});
      },
      err => {
        toRN({type:'error', message: err?.message || 'Parse failed'});
      }
    );
  } catch(e){
    toRN({type:'error', message: e.message});
  }
};

function animate(){
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => toRN({type:'ready'}), 200);
</script>
</body>
</html>`;
