import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

const EscapeTheBoss3DUltra = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef(null);
  const bossRef = useRef(null);
  const initRef = useRef(false);
  
  const [gameState, setGameState] = useState('menu');
  const [bossName, setBossName] = useState('Mr. Boss');
  const [tempBossName, setTempBossName] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [bossHealth, setBossHealth] = useState(5);
  const [inventory, setInventory] = useState({ shield: 0, speed: 0, bomb: 0 });
  const [notifications, setNotifications] = useState([]);
  const [difficulty, setDifficulty] = useState('normal');
  
  const audioContextRef = useRef(null);
  const gameDataRef = useRef({
    playerPos: { x: 0, z: 0 },
    bossPos: { x: 10, z: 10 },
    bombs: [],
    explosions: [],
    coins: [],
    powerUps: [],
    particles: []
  });

  const playSound = (freq, dur) => {
    if (!soundOn) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  const addNotification = (text, color = '#4CAF50') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, color }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2000);
  };

  const createPlayerModel = () => {
    const group = new THREE.Group();
    
    const bodyGeometry = new THREE.CapsuleGeometry(0.25, 0.8, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4CAF50,
      metalness: 0.4,
      roughness: 0.6
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.5;
    group.add(body);

    const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      metalness: 0.2,
      roughness: 0.8
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 1.2;
    group.add(head);

    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.35, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.35, 0.18);
    group.add(rightEye);

    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 8, 8);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      metalness: 0.2,
      roughness: 0.8
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.castShadow = true;
    leftArm.position.set(-0.3, 0.8, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.castShadow = true;
    rightArm.position.set(0.3, 0.8, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    return group;
  };

  const createBossModel = () => {
    const group = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      metalness: 0.6,
      roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.9;
    group.add(body);

    const headGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5555,
      metalness: 0.5,
      roughness: 0.5
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 1.7;
    group.add(head);

    const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.8, 0.25);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.8, 0.25);
    group.add(rightEye);

    const armGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      metalness: 0.7,
      roughness: 0.3
    });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.castShadow = true;
    leftArm.position.set(-0.6, 1.2, 0);
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.castShadow = true;
    rightArm.position.set(0.6, 1.2, 0);
    group.add(rightArm);

    const hornGeometry = new THREE.ConeGeometry(0.1, 0.5, 16);
    const hornMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.castShadow = true;
    leftHorn.position.set(-0.25, 2.15, 0);
    leftHorn.rotation.z = 0.3;
    group.add(leftHorn);
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.castShadow = true;
    rightHorn.position.set(0.25, 2.15, 0);
    rightHorn.rotation.z = -0.3;
    group.add(rightHorn);

    return group;
  };

  const createExplosionParticles = (x, z, scene) => {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.08 + Math.random() * 0.1, 1, 0.5),
        metalness: 0.5,
        roughness: 0.5
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(x, 1 + Math.random() * 0.5, z);
      particle.castShadow = true;
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.3 + 0.2,
        (Math.random() - 0.5) * 0.3
      );
      
      scene.add(particle);
      gameDataRef.current.particles.push({
        mesh: particle,
        velocity,
        life: 1
      });
    }
  };

  const init3D = () => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 100, 150);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.camera.far = 150;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x667eea, 0.5);
    pointLight1.position.set(15, 10, 15);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x764ba2, 0.5);
    pointLight2.position.set(-15, 10, -15);
    scene.add(pointLight2);

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a4a,
      metalness: 0.1,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const player = createPlayerModel();
    player.position.set(gameDataRef.current.playerPos.x, 0, gameDataRef.current.playerPos.z);
    playerRef.current = player;
    scene.add(player);

    const boss = createBossModel();
    boss.position.set(gameDataRef.current.bossPos.x, 0, gameDataRef.current.bossPos.z);
    bossRef.current = boss;
    scene.add(boss);

    gameDataRef.current.coins = [];
    for (let i = 0; i < 10; i++) {
      const coinGroup = new THREE.Group();
      
      const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 32);
      const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 1,
        roughness: 0.1
      });
      const coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.castShadow = true;
      coin.receiveShadow = true;
      coin.rotation.x = Math.PI / 2;
      coinGroup.add(coin);

      const glowGeometry = new THREE.CylinderGeometry(0.27, 0.27, 0.08, 32);
      const glowMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = Math.PI / 2;
      coinGroup.add(glow);

      coinGroup.position.set(
        Math.random() * 24 + 3,
        0.5,
        Math.random() * 24 + 3
      );
      scene.add(coinGroup);
      gameDataRef.current.coins.push({
        mesh: coinGroup,
        x: coinGroup.position.x,
        z: coinGroup.position.z,
        collected: false
      });
    }

    gameDataRef.current.powerUps = [];
    const powerUpTypes = [
      { name: 'shield', color: 0x2196F3, emissive: 0x1565c0 },
      { name: 'speed', color: 0xFF9800, emissive: 0xe65100 },
      { name: 'bomb', color: 0x9C27B0, emissive: 0x6a0dad }
    ];
    
    for (let i = 0; i < 3; i++) {
      const puGeometry = new THREE.OctahedronGeometry(0.35, 3);
      const puMaterial = new THREE.MeshStandardMaterial({
        color: powerUpTypes[i].color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: powerUpTypes[i].emissive,
        emissiveIntensity: 0.5
      });
      const pu = new THREE.Mesh(puGeometry, puMaterial);
      pu.castShadow = true;
      pu.receiveShadow = true;
      pu.position.set(
        Math.random() * 24 + 3,
        1,
        Math.random() * 24 + 3
      );
      scene.add(pu);
      gameDataRef.current.powerUps.push({
        mesh: pu,
        x: pu.position.x,
        z: pu.position.z,
        type: powerUpTypes[i].name,
        collected: false
      });
    }

    const keys = {};
    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (sceneRef.current && inventory.bomb > 0) {
          placeBomb(sceneRef.current);
        }
      }
    };
    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();

      const moveSpeed = inventory.speed > 0 ? 0.15 : 0.1;
      if (keys['arrowup'] || keys['w']) gameDataRef.current.playerPos.z -= moveSpeed;
      if (keys['arrowdown'] || keys['s']) gameDataRef.current.playerPos.z += moveSpeed;
      if (keys['arrowleft'] || keys['a']) gameDataRef.current.playerPos.x -= moveSpeed;
      if (keys['arrowright'] || keys['d']) gameDataRef.current.playerPos.x += moveSpeed;

      gameDataRef.current.playerPos.x = Math.max(-14, Math.min(14, gameDataRef.current.playerPos.x));
      gameDataRef.current.playerPos.z = Math.max(-14, Math.min(14, gameDataRef.current.playerPos.z));

      player.position.x = gameDataRef.current.playerPos.x;
      player.position.z = gameDataRef.current.playerPos.z;
      player.position.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;

      const dx = gameDataRef.current.playerPos.x - gameDataRef.current.bossPos.x;
      const dz = gameDataRef.current.playerPos.z - gameDataRef.current.bossPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > 0.5) {
        gameDataRef.current.bossPos.x += (dx / distance) * 0.08;
        gameDataRef.current.bossPos.z += (dz / distance) * 0.08;
      }

      gameDataRef.current.bossPos.x = Math.max(-14, Math.min(14, gameDataRef.current.bossPos.x));
      gameDataRef.current.bossPos.z = Math.max(-14, Math.min(14, gameDataRef.current.bossPos.z));

      boss.position.x = gameDataRef.current.bossPos.x;
      boss.position.z = gameDataRef.current.bossPos.z;
      boss.rotation.y += 0.01;

      gameDataRef.current.coins.forEach(coin => {
        coin.mesh.rotation.z += 0.05;
        coin.mesh.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.2;

        const cdx = player.position.x - coin.x;
        const cdz = player.position.z - coin.z;
        if (Math.sqrt(cdx * cdx + cdz * cdz) < 1.5 && !coin.collected) {
          coin.collected = true;
          scene.remove(coin.mesh);
          
          for (let i = 0; i < 15; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({
              color: 0xffd700,
              emissive: 0xffd700,
              emissiveIntensity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(coin.mesh.position);
            particle.castShadow = true;

            const pvelocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.3,
              Math.random() * 0.3 + 0.2,
              (Math.random() - 0.5) * 0.3
            );

            scene.add(particle);
            gameDataRef.current.particles.push({ mesh: particle, velocity: pvelocity, life: 1 });
          }

          setScore(s => s + 100);
          addNotification('💰 +$100', '#4CAF50');
          playSound(800, 0.1);
        }
      });

      gameDataRef.current.powerUps.forEach(pu => {
        pu.mesh.rotation.x += 0.02;
        pu.mesh.rotation.y += 0.03;
        pu.mesh.position.y = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.3;

        const pudx = player.position.x - pu.x;
        const pudz = player.position.z - pu.z;
        if (Math.sqrt(pudx * pudx + pudz * pudz) < 1.5 && !pu.collected) {
          pu.collected = true;
          scene.remove(pu.mesh);

          if (pu.type === 'shield') {
            setInventory(prev => ({ ...prev, shield: 5 }));
            addNotification('🛡️ Shield Activated!', '#2196F3');
          } else if (pu.type === 'speed') {
            setInventory(prev => ({ ...prev, speed: 8 }));
            addNotification('⚡ Speed Boost!', '#FF9800');
          } else {
            setInventory(prev => ({ ...prev, bomb: prev.bomb + 3 }));
            addNotification('🎯 +3 Bombs!', '#9C27B0');
          }
          setScore(s => s + 500);
          playSound(1200, 0.15);
        }
      });

      gameDataRef.current.bombs.forEach((bomb, idx) => {
        bomb.mesh.scale.x = 1 + Math.sin(clock.getElapsedTime() * 8) * 0.2;
        bomb.mesh.scale.y = bomb.mesh.scale.x;
        bomb.mesh.scale.z = bomb.mesh.scale.x;
        bomb.timer--;

        if (bomb.timer <= 0) {
          scene.remove(bomb.mesh);
          gameDataRef.current.bombs.splice(idx, 1);
          createExplosion(bomb.x, bomb.z, scene);
        }
      });

      gameDataRef.current.explosions.forEach((exp, idx) => {
        exp.mesh.scale.x *= 1.02;
        exp.mesh.scale.y *= 1.02;
        exp.mesh.scale.z *= 1.02;
        exp.mesh.material.opacity -= 0.05;

        if (exp.mesh.material.opacity <= 0) {
          scene.remove(exp.mesh);
          gameDataRef.current.explosions.splice(idx, 1);
        }
      });

      gameDataRef.current.particles.forEach((particle, idx) => {
        particle.mesh.position.add(particle.velocity);
        particle.velocity.y -= 0.01;
        particle.life -= 0.02;
        particle.mesh.material.opacity = particle.life;

        if (particle.life <= 0) {
          scene.remove(particle.mesh);
          gameDataRef.current.particles.splice(idx, 1);
        }
      });

      setInventory(prev => ({
        shield: Math.max(0, prev.shield - deltaTime),
        speed: Math.max(0, prev.speed - deltaTime),
        bomb: prev.bomb
      }));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  };

  const createExplosion = (x, z, scene) => {
    if (!scene) return;

    const explosionGeometry = new THREE.SphereGeometry(2, 16, 16);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.9
    });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.set(x, 2, z);
    scene.add(explosion);

    gameDataRef.current.explosions.push({
      mesh: explosion,
      x,
      z,
      timer: 10
    });

    createExplosionParticles(x, z, scene);

    const edx = bossRef.current.position.x - x;
    const edz = bossRef.current.position.z - z;
    if (Math.sqrt(edx * edx + edz * edz) < 3) {
      setBossHealth(prev => Math.max(0, prev - 1));
      setScore(s => s + 1000);
      addNotification('💥 BOSS HIT! +$1000', '#FF5722');
      playSound(600, 0.3);
      if (bossHealth <= 1) {
        setGameState('gameOver');
      }
    }

    playSound(500, 0.2);
  };

  const placeBomb = (scene) => {
    if (!scene || inventory.bomb <= 0) return;

    const bombGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const bombMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
    bomb.position.set(gameDataRef.current.playerPos.x, 0.5, gameDataRef.current.playerPos.z);
    bomb.castShadow = true;
    bomb.receiveShadow = true;
    scene.add(bomb);

    gameDataRef.current.bombs.push({
      mesh: bomb,
      x: gameDataRef.current.playerPos.x,
      z: gameDataRef.current.playerPos.z,
      timer: 120
    });

    setInventory(prev => ({ ...prev, bomb: prev.bomb - 1 }));
    addNotification('💣 Bomb placed!', '#FF9800');
    playSound(400, 0.1);
  };

  const startGame = () => {
    if (tempBossName.trim()) setBossName(tempBossName);
    setScore(0);
    setBossHealth(difficulty === 'hard' ? 7 : difficulty === 'easy' ? 3 : 5);
    setInventory({ shield: 0, speed: 0, bomb: 3 });
    gameDataRef.current.playerPos = { x: 0, z: 0 };
    gameDataRef.current.bossPos = { x: 10, z: 10 };
    gameDataRef.current.bombs = [];
    gameDataRef.current.explosions = [];
    gameDataRef.current.coins = [];
    gameDataRef.current.powerUps = [];
    gameDataRef.current.particles = [];
    initRef.current = false;
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState === 'playing') {
      init3D();
    }
  }, [gameState]);

  if (gameState === 'menu') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '700px',
          width: '100%',
          background: 'white',
          borderRadius: '20px',
          padding: '50px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ fontSize: '56px', color: '#667eea', margin: '0 0 10px' }}>
            🏢 ESCAPE THE BOSS 3D ULTRA 💣
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '40px' }}>
            The Most Advanced 3D Office Game Ever Created
          </p>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
              👔 BOSS NAME
            </label>
            <input
              type="text"
              value={tempBossName}
              onChange={(e) => setTempBossName(e.target.value)}
              placeholder="Enter your boss's name..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
              ⚙️ DIFFICULTY
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
            >
              <option value="easy">🟢 Easy (3 HP)</option>
              <option value="normal">🟡 Normal (5 HP)</option>
              <option value="hard">🔴 Hard (7 HP)</option>
            </select>
          </div>

          <button
            onClick={startGame}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            START 3D GAME 🎮
          </button>

          <button
            onClick={() => setSoundOn(!soundOn)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              background: soundOn ? '#4CAF50' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {soundOn ? '🔊 Sound ON' : '🔇 Sound OFF'}
          </button>

          <div style={{
            marginTop: '30px',
            textAlign: 'left',
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            <p style={{ fontWeight: 'bold', marginTop: 0 }}>✨ FEATURES:</p>
            <p>🎨 Advanced 3D graphics with particles & animations</p>
            <p>💫 Dynamic lighting & shadows</p>
            <p>🎭 Animated characters</p>
            <p>⬆️⬇️⬅️➡️ WASD - Move in 3D world | SPACE - Place bombs</p>
            <p>💰 Collect coins & power-ups to escape!</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <div style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          color: 'white',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          padding: '20px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ margin: '0 0 15px', fontSize: '28px' }}>💰 ${Math.round(score)}</h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
            <p style={{ margin: '5px 0' }}>❤️ Boss HP: {Array(Math.max(0, bossHealth)).fill('❤️').join('')}</p>
            <p style={{ margin: '5px 0' }}>💣 Bombs: {Math.round(inventory.bomb)}</p>
            <p style={{ margin: '5px 0' }}>🛡️ Shield: {Math.round(inventory.shield)}s</p>
            <p style={{ margin: '5px 0' }}>⚡ Speed: {Math.round(inventory.speed)}s</p>
          </div>
        </div>

        <div style={{ position: 'fixed', top: '30px', right: '30px', zIndex: 100 }}>
          {notifications.map(notif => (
            <div key={notif.id} style={{
              background: notif.color,
              color: 'white',
              padding: '15px 25px',
              borderRadius: '10px',
              marginBottom: '12px',
              fontWeight: 'bold',
              fontSize: '15px',
              animation: 'slideIn 0.3s ease',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)'
            }}>
              {notif.text}
            </div>
          ))}
        </div>

        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          textAlign: 'center',
          fontSize: '16px',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          padding: '15px 30px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          ⬆️⬇️⬅️➡️ or WASD to move • SPACE to place bomb
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '20px',
        padding: '50px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '64px', margin: '0 0 20px', color: '#333' }}>🎊 VICTORY! 🎊</h1>
        <p style={{ fontSize: '22px', color: '#666', marginBottom: '30px' }}>You escaped from {bossName}!</p>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          borderRadius: '15px',
          marginBottom: '30px',
          color: 'white'
        }}>
          <p style={{ fontSize: '16px', margin: '0 0 15px' }}>Total Earnings & Bonuses</p>
          <p style={{ fontSize: '56px', fontWeight: 'bold', margin: 0 }}>💰 ${Math.round(score)}</p>
        </div>
        <button
          onClick={() => setGameState('menu')}
          style={{
            width: '100%',
            padding: '18px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Play Again 🎮
        </button>
      </div>
    </div>
  );
};

export default EscapeTheBoss3DUltra;
