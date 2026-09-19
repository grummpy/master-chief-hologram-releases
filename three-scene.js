import * as THREE from './assets/vendor/three.module.min.js';

const canvas = document.getElementById('threeScene');
const stage = document.getElementById('holoStage');
let enabled = false, state = 'idle', pointerX = 0, pointerY = 0;
let renderer, scene, camera, mascot, halo, clock;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setEnabled(value) {
  enabled = Boolean(value && renderer && mascot);
  canvas.hidden = !enabled;
  stage.classList.toggle('three-active', enabled);
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.z = 4.4;
    clock = new THREE.Clock();
    const texture = new THREE.TextureLoader().load('./assets/characters/command-officer-reference-v1.png', undefined, undefined, () => setEnabled(false));
    texture.colorSpace = THREE.SRGBColorSpace;
    mascot = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 2.45), new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .92, depthWrite: false }));
    halo = new THREE.Mesh(new THREE.RingGeometry(1.24, 1.28, 64), new THREE.MeshBasicMaterial({ color: 0x34dfff, transparent: true, opacity: .28, side: THREE.DoubleSide }));
    halo.position.z = -.08;
    scene.add(halo, mascot);
    const resize = () => { const rect = stage.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(stage);
    resize();
    stage.addEventListener('pointermove', event => { if (reducedMotion.matches) return; const rect = stage.getBoundingClientRect(); pointerX = ((event.clientX - rect.left) / rect.width - .5) * .28; pointerY = ((event.clientY - rect.top) / rect.height - .5) * .1; });
    stage.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
    render();
  } catch (error) {
    stage.dataset.threeError = String(error?.message || error);
    setEnabled(false);
  }
}

function render() {
  // Ten frames per second is enough for the subtle hologram idle movement and
  // avoids keeping the GPU busy at the display's full refresh rate.
  setTimeout(() => requestAnimationFrame(render), 100);
  if (!renderer || !enabled || document.hidden) return;
  const t = reducedMotion.matches ? 0 : clock.getElapsedTime();
  mascot.rotation.y += (pointerX - mascot.rotation.y) * .04;
  mascot.rotation.x += (pointerY - mascot.rotation.x) * .04;
  const activity = reducedMotion.matches ? 0 : state === 'thinking' ? .05 : state === 'listening' ? .035 : .018;
  mascot.position.y = Math.sin(t * 1.25) * activity;
  const wave = state === 'wave' ? Math.sin(t * 4) * .035 : 0;
  mascot.rotation.z += (wave - mascot.rotation.z) * .1;
  halo.rotation.z = reducedMotion.matches ? 0 : t * .08;
  halo.material.opacity = state === 'thinking' ? .48 : .28;
  renderer.render(scene, camera);
}

window.masterChiefThreeD = { setState: value => { state = value; }, setEnabled };
init();
window.dispatchEvent(new Event('master-chief-three-ready'));
