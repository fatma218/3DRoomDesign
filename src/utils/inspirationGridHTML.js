export const getInspirationGridHTML = (cols = 2) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#1a1a2e}
    canvas{display:block;touch-action:manipulation}
    #labels{position:absolute;top:0;left:0;width:100%;pointer-events:none}
    .style-tag{
      position:absolute;
      background:rgba(15,52,96,0.85);
      color:#fff;font-family:sans-serif;font-size:9px;font-weight:700;
      padding:3px 7px;border-radius:6px;letter-spacing:1px;
    }
    .lbl-name{
      position:absolute;
      color:#fff;font-family:sans-serif;font-size:12px;font-weight:600;
      background:rgba(0,0,0,0.6);
      padding:5px 9px;border-radius:8px;
      max-width:80%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    }
    .lbl-likes{
      position:absolute;
      background:rgba(0,0,0,0.6);
      color:#fff;font-family:sans-serif;font-size:10px;font-weight:600;
      padding:4px 8px;border-radius:8px;
      display:flex;align-items:center;gap:3px;
    }
    .lbl-likes .heart{color:#e94560;font-size:11px}
  </style>
</head>
<body>
<canvas id="c"></canvas>
<div id="labels"></div>

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
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const COLS = ${cols};
const canvas = document.getElementById('c');
const labelsEl = document.getElementById('labels');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.autoClear = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const loader = new GLTFLoader();
const ROOMS = [];
let cellW = innerWidth / COLS;
let cellH = cellW;

function toRN(data){
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(data));
}

function buildScene(modelClone){
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x0a0a1a);
  sc.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dl = new THREE.DirectionalLight(0xffffff, 1.0);
  dl.position.set(2, 4, 3);
  sc.add(dl);
  sc.add(new THREE.HemisphereLight(0x6688ff, 0x1a1a2e, 0.5));

  let box = new THREE.Box3().setFromObject(modelClone);
  const size = new THREE.Vector3(); box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  if(maxDim > 0) modelClone.scale.setScalar(2.5 / maxDim);

  modelClone.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(modelClone);
  const center = new THREE.Vector3(); box.getCenter(center);
  modelClone.position.x = -center.x;
  modelClone.position.z = -center.z;
  modelClone.position.y = -box.min.y;

  sc.add(modelClone);

  const finalBox = new THREE.Box3().setFromObject(modelClone);
  const finalCenter = new THREE.Vector3(); finalBox.getCenter(finalCenter);
  const finalSize = new THREE.Vector3(); finalBox.getSize(finalSize);

  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  const dist = Math.max(finalSize.x, finalSize.z) * 1.7;
  cam.position.set(dist, dist*0.85, dist);
  cam.lookAt(finalCenter);

  return {scene:sc, camera:cam, model:modelClone};
}

function rebuildLabels(){
  labelsEl.innerHTML = '';
  ROOMS.forEach((r, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * cellW;
    const y = row * cellH;

    const tag = document.createElement('div');
    tag.className = 'style-tag';
    tag.style.left = (x + 8) + 'px';
    tag.style.top = (y + 8) + 'px';
    tag.textContent = r.style.toUpperCase();
    labelsEl.appendChild(tag);

    const likes = document.createElement('div');
    likes.className = 'lbl-likes';
    likes.style.left = (x + cellW - 60) + 'px';
    likes.style.top = (y + 8) + 'px';
    likes.innerHTML = '<span class="heart">♥</span> ' + r.likes;
    labelsEl.appendChild(likes);

    const lbl = document.createElement('div');
    lbl.className = 'lbl-name';
    lbl.style.left = (x + 8) + 'px';
    lbl.style.top = (y + cellH - 30) + 'px';
    lbl.style.maxWidth = (cellW - 16) + 'px';
    lbl.textContent = r.name;
    labelsEl.appendChild(lbl);
  });
}

function resizeCanvas(){
  const rows = Math.max(1, Math.ceil(ROOMS.length / COLS));
  const totalH = rows * cellH;
  renderer.setSize(innerWidth, totalH);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = totalH + 'px';
  rebuildLabels();
}

window.addRoomThumbnail = function(id, b64, name, likes, style){
  try {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) buf[i] = bin.charCodeAt(i);

    loader.parse(buf.buffer, '',
      gltf => {
        const sc = buildScene(gltf.scene);
        ROOMS.push({id, name, likes, style, ...sc});
        resizeCanvas();
        toRN({type:'roomThumbnailReady', id});
      },
      err => toRN({type:'error', id, message: err?.message || 'parse failed'})
    );
  } catch(e) {
    toRN({type:'error', id, message: e.message});
  }
};

window.clearAllRooms = function(){
  ROOMS.forEach(r => {
    r.scene.traverse(o => {
      if(o.geometry) o.geometry.dispose();
      if(o.material){
        if(Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  });
  ROOMS.length = 0;
  labelsEl.innerHTML = '';
  resizeCanvas();
};

// Tap → ouvrir viewer plein écran
function handleTap(x, y){
  const col = Math.floor(x / cellW);
  const row = Math.floor(y / cellH);
  const idx = row * COLS + col;
  if(col >= 0 && col < COLS && idx >= 0 && idx < ROOMS.length){
    toRN({type:'roomTapped', id: ROOMS[idx].id});
  }
}

let tStart = {x:0, y:0, ms:0};
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  tStart = {x:t.clientX, y:t.clientY, ms:Date.now()};
}, {passive:true});

canvas.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const dx = Math.abs(t.clientX - tStart.x);
  const dy = Math.abs(t.clientY - tStart.y);
  const dt = Date.now() - tStart.ms;
  if(dx < 12 && dy < 12 && dt < 400){
    handleTap(t.clientX, t.clientY);
  }
}, {passive:true});

// Animation
function animate(){
  requestAnimationFrame(animate);
  if(ROOMS.length > 0){
    renderer.setScissorTest(true);
    const totalH = Math.ceil(ROOMS.length / COLS) * cellH;
    ROOMS.forEach((r, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = col * cellW;
      const yFromBottom = totalH - (row + 1) * cellH;
      //r.model.rotation.y += 0.005;
      renderer.setViewport(x, yFromBottom, cellW, cellH);
      renderer.setScissor(x, yFromBottom, cellW, cellH);
      renderer.setClearColor(0x0a0a1a, 1);
      renderer.clear(true, true, false);
      renderer.render(r.scene, r.camera);
    });
  }
}
animate();

window.addEventListener('resize', () => {
  cellW = innerWidth / COLS;
  cellH = cellW;
  resizeCanvas();
});

setTimeout(() => toRN({type:'ready'}), 200);
</script>
</body>
</html>`;
