import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

const EscapeTheBossGame = () => {
  const GRID_SIZE = 13;
  const CELL_SIZE = 32;
  const GAME_SPEED = 200;

  const audioContextRef = useRef(null);

  const playSound = useCallback((frequency, duration) => {
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
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  const [gameState, setGameState] = useState('menu');
  const [bossName, setBossName] = useState('Mr. Boss');
  const [tempBossName, setTempBossName] = useState('');
  const [difficulty, setDifficulty] = useState('normal');
  const [soundOn, setSoundOn] = useState(true);
  const [bossType, setBossType] = useState('angry');

  const bossTypes = {
    angry: { name: 'Angry Boss', emoji: '😠', speed: 'normal' },
    lazy: { name: 'Lazy Boss', emoji: '😴', speed: 'slow' },
    sneaky: { name: 'Sneaky Boss', emoji: '🕵️', speed: 'fast' },
    corporate: { name: 'Corporate Boss', emoji: '💼', speed: 'normal' }
  };

  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [bossPos, setBossPos] = useState({ x: 11, y: 11 });
  const [bombs, setBombs] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [playerInventory, setPlayerInventory] = useState({ shield: 0, speed: 0, bomb: 0 });
  const [bossHealth, setBossHealth] = useState(3);
  const [combos, setCombos] = useState(0);
  const [level, setLevel] = useState(1);
  const [leaderboard, setLeaderboard] = useState([
    { name: 'Top Player', score: 5000 },
    { name: 'Game Master', score: 4500 },
    { name: 'Boss Slayer', score: 4000 }
  ]);

  useEffect(() => {
    if (gameState === 'playing') {
      const initialCoins = [];
      const coinCount = 8 + level;
      for (let i = 0; i < coinCount; i++) {
        let x, y;
        do {
          x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
          y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        } while ((x === 1 && y === 1) || (x === 11 && y === 11));
        initialCoins.push({ x, y, value: 100 + Math.random() * 50 });
      }
      setCoins(initialCoins);

      const initialPowerUps = [];
      const powerUpTypes = ['shield', 'speed', 'bomb'];
      for (let i = 0; i < 3; i++) {
        let x, y;
        do {
          x = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
          y = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
        } while ((x === 1 && y === 1) || (x === 11 && y === 11));
        initialPowerUps.push({ x, y, type: powerUpTypes[i] });
      }
      setPowerUps(initialPowerUps);
      setBossHealth(3 + level);
    }
  }, [gameState, level]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyPress = (e) => {
      const speed = playerInventory.speed > 0 ? 2 : 1;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setPlayerPos(prev => ({ ...prev, y: Math.max(0, prev.y - speed) }));
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setPlayerPos(prev => ({ ...prev, y: Math.min(GRID_SIZE - 1, prev.y + speed) }));
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setPlayerPos(prev => ({ ...prev, x: Math.max(0, prev.x - speed) }));
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setPlayerPos(prev => ({ ...prev, x: Math.min(GRID_SIZE - 1, prev.x + speed) }));
          e.preventDefault();
          break;
        case ' ':
          e.preventDefault();
          placeBomb();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, playerInventory]);

  const placeBomb = useCallback(() => {
    if (playerInventory.bomb > 0) {
      setBombs(prev => [...prev, { x: playerPos.x, y: playerPos.y, timer: 3 }]);
      setPlayerInventory(prev => ({ ...prev, bomb: prev.bomb - 1 }));
      playSound(400, 0.1);
    }
  }, [playerPos, playerInventory.bomb, playSound]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameInterval = setInterval(() => {
      setBossPos(prev => {
        let newX = prev.x;
        let newY = prev.y;
        const diffX = playerPos.x - prev.x;
        const diffY = playerPos.y - prev.y;

        if (bossType === 'lazy') {
          if (Math.random() > 0.7) {
            newX += Math.random() > 0.5 ? 1 : -1;
            newY += Math.random() > 0.5 ? 1 : -1;
          }
        } else if (bossType === 'sneaky') {
          if (Math.random() > 0.5) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
              newX += diffX > 0 ? 1 : -1;
            } else {
              newY += diffY > 0 ? 1 : -1;
            }
          } else {
            newX += Math.random() > 0.5 ? 1 : -1;
          }
        } else {
          if (Math.abs(diffX) > Math.abs(diffY)) {
            newX += diffX > 0 ? 1 : -1;
          } else {
            newY += diffY > 0 ? 1 : -1;
          }
        }

        newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
        newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));

        return { x: newX, y: newY };
      });

      setBombs(prevBombs => {
        const updatedBombs = prevBombs.map(b => ({ ...b, timer: b.timer - 1 }));
        const remainingBombs = updatedBombs.filter(b => b.timer > 0);
        const explodedBombs = updatedBombs.filter(b => b.timer <= 0);

        const newExplosions = [];
        explodedBombs.forEach(bomb => {
          newExplosions.push({ x: bomb.x, y: bomb.y, timer: 2 });
          playSound(500, 0.2);
          for (let i = 1; i <= 2; i++) {
            if (bomb.x + i < GRID_SIZE) newExplosions.push({ x: bomb.x + i, y: bomb.y, timer: 2 });
            if (bomb.x - i >= 0) newExplosions.push({ x: bomb.x - i, y: bomb.y, timer: 2 });
            if (bomb.y + i < GRID_SIZE) newExplosions.push({ x: bomb.x, y: bomb.y + i, timer: 2 });
            if (bomb.y - i >= 0) newExplosions.push({ x: bomb.x, y: bomb.y - i, timer: 2 });
          }
        });

        setExplosions(prev => [...prev, ...newExplosions].filter(e => e.timer > 0));
        return remainingBombs;
      });

      setExplosions(prev => prev.map(e => ({ ...e, timer: e.timer - 1 })).filter(e => e.timer > 0));

      setPlayerInventory(prev => ({
        shield: Math.max(0, prev.shield - 1),
        speed: Math.max(0, prev.speed - 1),
        bomb: prev.bomb
      }));
    }, GAME_SPEED);

    return () => clearInterval(gameInterval);
  }, [gameState, playerPos, bossType, playSound]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    setCoins(prev => {
      const remaining = prev.filter(coin => {
        if (coin.x === playerPos.x && coin.y === playerPos.y) {
          const coinValue = Math.round(coin.value);
          setScore(s => s + coinValue);
          setCombos(c => c + 1);
          playSound(800, 0.1);
          return false;
        }
        return true;
      });
      return remaining;
    });

    setPowerUps(prev => {
      const remaining = prev.filter(pu => {
        if (pu.x === playerPos.x && pu.y === playerPos.y) {
          if (pu.type === 'shield') {
            setPlayerInventory(prev => ({ ...prev, shield: 5 }));
          } else if (pu.type === 'speed') {
            setPlayerInventory(prev => ({ ...prev, speed: 8 }));
          } else if (pu.type === 'bomb') {
            setPlayerInventory(prev => ({ ...prev, bomb: prev.bomb + 3 }));
          }
          setScore(s => s + 500);
          playSound(1200, 0.15);
          return false;
        }
        return true;
      });
      return remaining;
    });

    let hitByExplosion = false;
    explosions.forEach(exp => {
      if (exp.x === playerPos.x && exp.y === playerPos.y) {
        hitByExplosion = true;
      }
    });

    if (hitByExplosion) {
      if (playerInventory.shield > 0) {
        setPlayerInventory(prev => ({ ...prev, shield: 0 }));
        setScore(s => s - 500);
        playSound(200, 0.2);
      } else {
        setGameOver(true);
        setGameState('gameOver');
        playSound(100, 0.5);
      }
    }

    let bossHitCount = 0;
    explosions.forEach(exp => {
      if (exp.x === bossPos.x && exp.y === bossPos.y) {
        bossHitCount++;
      }
    });

    if (bossHitCount > 0) {
      setBossHealth(prev => prev - bossHitCount);
      setScore(s => s + (1000 * bossHitCount * (1 + combos * 0.1)));
      playSound(600, 0.3);

      if (bossHealth - bossHitCount <= 0) {
        if (level < 3) {
          setLevel(l => l + 1);
          setBossPos({ x: 11, y: 11 });
          setScore(s => s + 5000);
          playSound(1000, 0.5);
        } else {
          setGameState('gameOver');
        }
      } else {
        setBossPos({ x: 11, y: 11 });
        setCombos(0);
      }
    }

    if (playerPos.x === bossPos.x && playerPos.y === bossPos.y) {
      if (playerInventory.shield > 0) {
        setPlayerInventory(prev => ({ ...prev, shield: 0 }));
        playSound(200, 0.2);
      } else {
        setGameOver(true);
        setGameState('gameOver');
        playSound(100, 0.5);
      }
    }
  }, [playerPos, explosions, playerInventory, gameState, bossPos, bossHealth, combos, playSound]);

  const startGame = () => {
    if (tempBossName.trim()) {
      setBossName(tempBossName);
    }
    setPlayerPos({ x: 1, y: 1 });
    setBossPos({ x: 11, y: 11 });
    setScore(0);
    setBombs([]);
    setExplosions([]);
    setPlayerInventory({ shield: 0, speed: 0, bomb: 3 });
    setCombos(0);
    setLevel(1);
    setBossHealth(3);
    setGameOver(false);
    setGameState('playing');
    playSound(800, 0.2);
  };

  const resetGame = () => {
    setGameState('menu');
    setTempBossName('');
  };

  const renderBoard = () => {
    const tiles = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isWall = (x % 2 === 0 && y % 2 === 0) || (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1);

        let cellContent = null;
        let backgroundColor = isWall ? '#2c2c2c' : '#f0f0f0';

        if (playerPos.x === x && playerPos.y === y) {
          cellContent = '🧑';
          if (playerInventory.shield > 0) backgroundColor = '#fff0d9';
          if (playerInventory.speed > 0) backgroundColor = '#fff9e6';
        } else if (bossPos.x === x && bossPos.y === y) {
          cellContent = bossTypes[bossType].emoji;
        } else if (bombs.some(b => b.x === x && b.y === y)) {
          cellContent = '💣';
        } else if (explosions.some(e => e.x === x && e.y === y)) {
          cellContent = '💥';
          backgroundColor = '#ffcccc';
        } else if (coins.some(c => c.x === x && c.y === y)) {
          cellContent = '💰';
        } else if (powerUps.some(p => p.x === x && p.y === y)) {
          const pu = powerUps.find(p => p.x === x && p.y === y);
          cellContent = pu.type === 'shield' ? '🛡️' : pu.type === 'speed' ? '⚡' : '🎯';
        }

        tiles.push(
          <div
            key={`${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              background: backgroundColor,
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
          >
            {cellContent}
          </div>
        );
      }
    }
    return tiles;
  };

  if (gameState === 'menu') {
    return (
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '20px', color: '#333' }}>
          🏢 ESCAPE THE BOSS 💣
        </h1>

        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>Boss Name:</p>
          <input
            type="text"
            value={tempBossName}
            onChange={(e) => setTempBossName(e.target.value)}
            placeholder="Enter your boss name..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginBottom: '15px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />

          <p style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>Boss Type:</p>
          <select
            value={bossType}
            onChange={(e) => setBossType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginBottom: '15px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          >
            {Object.entries(bossTypes).map(([key, boss]) => (
              <option key={key} value={key}>
                {boss.emoji} {boss.name}
              </option>
            ))}
          </select>

          <p style={{ marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>Difficulty:</p>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              marginBottom: '15px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>

          <button
            onClick={startGame}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            START GAME 🎮
          </button>

          <button
            onClick={() => setSoundOn(!soundOn)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {soundOn ? '🔊' : '🔇'} Sound {soundOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#333' }}>
            🏆 Top Scores
          </h2>
          {leaderboard.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ddd', color: '#666' }}>
              <span>#{idx + 1} {entry.name}</span>
              <span style={{ fontWeight: 'bold' }}>${entry.score}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px', fontSize: '13px', color: '#666' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>HOW TO PLAY:</p>
          <p>↑↓←→ or WASD - Move</p>
          <p>SPACE - Place bomb</p>
          <p>💰 Collect coins</p>
          <p>🛡️ Shield - Protects once</p>
          <p>⚡ Speed - Move faster</p>
          <p>🎯 Bombs - More bombs</p>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const bossDisplay = bossTypes[bossType];
    const healthBar = Array(Math.max(0, bossHealth)).fill('❤️').join('') || '💀';

    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 10px', color: '#333' }}>
              Level {level} - {bossDisplay.emoji} {bossName}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#666' }}>
              <div>💰 ${Math.round(score)}</div>
              <div>🔥 Combo x{combos}</div>
              <div>💣 Bombs: {playerInventory.bomb}</div>
              <div>⏱️ Speed: {playerInventory.speed}s</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              Boss HP: {healthBar}
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ↩️ Menu
            </button>
          </div>
        </div>

        <div style={{
          position: 'relative',
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: '#f5f5f5',
          border: '3px solid #333',
          margin: '0 auto'
        }}>
          {renderBoard()}
        </div>

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Use arrow keys or WASD. Press SPACE to place bomb!
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    const totalEarnings = Math.round(score);
    const isVictory = level > 3;

    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: isVictory ? '#4CAF50' : '#333' }}>
          {isVictory ? '🏆 YOU WON! 🏆' : 'GAME OVER!'}
        </h1>

        <div style={{ background: '#f5f5f5', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
            {isVictory ? `All bosses defeated!` : `You escaped from ${bossName}!`}
          </p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '10px' }}>
            💰 ${totalEarnings}
          </p>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Total OT Pay & Bonus Earned
          </p>

          <button
            onClick={resetGame}
            style={{
              width: '100%',
              padding: '12px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {isVictory ? 'Play Again 🎮' : 'Try Again 🎮'}
          </button>
        </div>
      </div>
    );
  }
};

export default EscapeTheBossGame;
