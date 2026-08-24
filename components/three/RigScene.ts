import * as THREE from "three";

/**
 * The ReBench calibration object: a slow-turning machined assembly where each
 * plate is a layer of the inference stack and a graduated dial + scan plane
 * "measure" it. Purely decorative, fully procedural, no assets.
 *
 * Returns a cleanup fn. If `reducedMotion` is true a single frame is drawn
 * and no animation loop runs.
 */
export function initRig(canvas: HTMLCanvasElement, reducedMotion: boolean): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(4.6, 3.4, 5.4);
  camera.lookAt(0, 0.9, 0);

  scene.add(new THREE.AmbientLight(0xfff6e6, 0.75));
  const key = new THREE.DirectionalLight(0xffe9c8, 1.15);
  key.position.set(5, 8, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8f9ea8, 0.5);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const paper = new THREE.Color("#e8e2d2");
  const ink = new THREE.Color("#2c2820");
  const dim = new THREE.Color("#8b8373");
  const accent = new THREE.Color("#d53a0c");

  const root = new THREE.Group();
  scene.add(root);

  // ---- plates: one per layer of the inference stack ---------------------
  const plates: THREE.Mesh[] = [];
  const plateDefs = [
    { w: 2.6, d: 1.9, label: "GPU" },
    { w: 2.2, d: 1.6, label: "ENGINE" },
    { w: 1.8, d: 1.3, label: "QUANT" },
    { w: 1.4, d: 1.0, label: "MODEL" },
  ];
  const plateMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.62, metalness: 0.22 });
  const edgeMat = new THREE.LineBasicMaterial({ color: paper, transparent: true, opacity: 0.85 });

  plateDefs.forEach((p, i) => {
    const geo = new THREE.BoxGeometry(p.w, 0.16, p.d);
    const mesh = new THREE.Mesh(geo, plateMat);
    mesh.position.y = 0.24 + i * 0.52;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    mesh.add(edges);
    root.add(mesh);
    plates.push(mesh);
  });

  // ---- central graduated axis -------------------------------------------
  const axisGroup = new THREE.Group();
  root.add(axisGroup);
  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 2.9, 8),
    new THREE.MeshBasicMaterial({ color: paper })
  );
  axis.position.y = 1.45;
  axisGroup.add(axis);

  const tickMat = new THREE.LineBasicMaterial({ color: paper, transparent: true, opacity: 0.7 });
  for (let i = 0; i <= 28; i++) {
    const y = 0.12 + (i / 28) * 2.66;
    const major = i % 4 === 0;
    const len = major ? 0.34 : 0.16;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, y, 0),
      new THREE.Vector3(len, y, 0),
    ]);
    const tick = new THREE.Line(g, tickMat);
    axisGroup.add(tick);
  }

  // ---- calibration dial (rotating graduated ring) -----------------------
  const dial = new THREE.Group();
  dial.position.y = -0.02;
  root.add(dial);

  const ringR = 2.15;
  const dialMat = new THREE.LineBasicMaterial({ color: dim, transparent: true, opacity: 0.9 });
  const circlePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    circlePts.push(new THREE.Vector3(Math.cos(a) * ringR, 0, Math.sin(a) * ringR));
  }
  dial.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), dialMat));

  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const major = i % 6 === 0;
    const r0 = ringR;
    const r1 = ringR - (major ? 0.16 : 0.08);
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * r0, 0, Math.sin(a) * r0),
      new THREE.Vector3(Math.cos(a) * r1, 0, Math.sin(a) * r1),
    ]);
    dial.add(new THREE.Line(g, major
      ? new THREE.LineBasicMaterial({ color: paper })
      : dialMat));
  }

  // vermilion index marker on the dial
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.2, 4),
    new THREE.MeshBasicMaterial({ color: accent })
  );
  marker.position.set(ringR + 0.1, 0.05, 0);
  marker.rotation.z = -Math.PI / 2;
  dial.add(marker);

  // ---- scan plane sweeping the stack ------------------------------------
  const scan = new THREE.Mesh(
    new THREE.RingGeometry(0.05, ringR - 0.35, 64),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
  );
  scan.rotation.x = -Math.PI / 2;
  scan.position.y = 0.2;
  root.add(scan);

  const scanEdge = new THREE.Mesh(
    new THREE.RingGeometry(ringR - 0.38, ringR - 0.35, 64),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  scanEdge.rotation.x = -Math.PI / 2;
  scan.add(scanEdge);

  // ---- datum crosshair under everything ---------------------------------
  const gridMat = new THREE.LineBasicMaterial({ color: dim, transparent: true, opacity: 0.35 });
  for (let i = -3; i <= 3; i++) {
    const a = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i * 0.8, -0.2, -2.4),
      new THREE.Vector3(i * 0.8, -0.2, 2.4),
    ]);
    const b = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.4, -0.2, i * 0.8),
      new THREE.Vector3(2.4, -0.2, i * 0.8),
    ]);
    root.add(new THREE.Line(a, gridMat), new THREE.Line(b, gridMat));
  }

  // ---- sizing ------------------------------------------------------------
  let raf = 0;
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const clock = new THREE.Clock();
  let visible = true;
  let disposed = false;

  const frame = () => {
    const t = clock.getElapsedTime();
    root.rotation.y = t * 0.22;
    dial.rotation.y = -t * 0.34;
    plates.forEach((p, i) => {
      p.position.y = 0.24 + i * 0.52 + Math.sin(t * 0.6 + i * 1.4) * 0.012;
    });
    // scan sweeps 0.15 -> 2.35
    const sweep = 0.15 + (Math.sin(t * 0.5 - Math.PI / 2) * 0.5 + 0.5) * 2.2;
    scan.position.y = sweep;
    (scan.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.abs(Math.sin(t * 0.5)) * 0.1;

    renderer.render(scene, camera);
    if (!reducedMotion && visible && !disposed && !document.hidden) {
      raf = requestAnimationFrame(frame);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !reducedMotion && !disposed) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    },
    { threshold: 0.02 }
  );
  io.observe(canvas);

  const onVis = () => {
    if (!document.hidden && visible && !reducedMotion && !disposed) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVis);

  if (reducedMotion) {
    // one composed frame, no loop
    root.rotation.y = 0.7;
    scan.position.y = 1.3;
    renderer.render(scene, camera);
  } else {
    raf = requestAnimationFrame(frame);
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    renderer.dispose();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        Array.isArray(m) ? m.forEach((x) => x.dispose()) : m.dispose();
      }
    });
  };
}
