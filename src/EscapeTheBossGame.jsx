import React, { useState, useEffect, useRef } from 'react';

const EscapeTheBossMobile = () => {
  const audioContextRef = useRef(null);
  
  // Game States
  const [gameState, setGameState] = useState('menu');
  const [bossName, setBossName] = useState('Mr. Boss');
  const [tempBossName, setTempBossName] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  
  // Gameplay States
  const [score, setScore] = useState(0);
  const [bossHealth, setBossHealth] = useState(5);
  const [bombs, setBombs] = useState(0);
  const [shield, setShield] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  // Player position
  const [playerX, setPlayerX] = useState(1);
  const [playerY, setPlayerY] = useState(1);
  
  // Boss position
  const [bossX, setBossX] = useState(11);
  const [bossY, setBossY] = useState(11);
  
  // Game objects
  const [gameBombs, setGameBombs] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [coins, setCoins] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  
  const GRID_SIZE = 13;
  const CELL_SIZE = 30;

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

  const addNotification = (text, color) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, text, color }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2000);
  };

  const startGame = (difficulty, bossNameInput) => {
    const finalBossName = bossNameInput.trim() ? bossNameInput : 'Mr. Boss';
    setBossName(finalBossName);
    
    const healthMap = { easy: 3, normal: 5, hard: 7 };
    
    setScore(0);
    setBossHealth(healthMap[difficulty] || 5);
    setBombs(3);
    setShield(0);
    setSpeed(0);
    setPlayerX(1);
    setPlayerY(1);
    setBossX(11);
    setBossY(11);
    setGameBombs([]);
    setExplosions([]);
    
    // Create coins
    const newCoins = [];
    for (let i = 0; i < 8; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * 11) + 1;
        y = Math.floor(Math.random() * 11) + 1;
      } while ((x === 1 && y === 1) || (x === 11 && y === 11));
      newCoins.push({ x, y, id: Math.random() });
    }
    setCoins(newCoins);
    
    // Create power-ups
    const newPowerUps = [];
    const types = ['shield', 'speed', 'bomb'];
    for (let i = 0; i < 3; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * 11) + 1;
        y = Math.floor(Math.random() * 11) + 1;
      } while ((x === 1 && y === 1) || (x === 11 && y === 11));
      newPowerUps.push({ x, y, type: types[i], id: Math.random() });
    }
    setPowerUps(newPowerUps);
    
    setGameState('playing');
    playSound(800, 0.2);
  };

  const movePlayer = (direction) => {
    const moveSpeed = speed > 0 ? 2 : 1;
    
    if (direction === 'up') setPlayerY(y => Math.max(0, y - moveSpeed));
    if (direction === 'down') setPlayerY(y => Math.min(12, y + moveSpeed));
    if (direction === 'left') setPlayerX(x => Math.max(0, x - moveSpeed));
    if (direction === 'right') setPlayerX(x => Math.min(12, x + moveSpeed));
  };

  const placeBomb = () => {
    if (bombs <= 0) return;
    setGameBombs(prev => [...prev, { x: playerX, y: playerY, timer: 60, id: Math.random() }]);
    setBombs(b => b - 1);
    addNotification('💣 Bomb!', '#FF9800');
    playSound(400, 0.1);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Boss AI
      setBossX(prevX => {
        let newBossX = prevX;
        const dx = playerX - prevX;
        
        if (Math.abs(dx) > 0.5) {
          newBossX = prevX + (dx > 0 ? 1 : -1);
        }
        
        return Math.max(0, Math.min(12, newBossX));
      });

      setBossY(prevY => {
        let newBossY = prevY;
        const dy = playerY - prevY;
        
        if (Math.abs(dy) > 0.5) {
          newBossY = prevY + (dy > 0 ? 1 : -1);
        }
        
        return Math.max(0, Math.min(12, newBossY));
      });

      // Update bombs and create explosions
      setGameBombs(prev => {
        const updated = prev.map(b => ({ ...b, timer: b.timer - 1 }));
        const remaining = updated.filter(b => b.timer > 0);
        const exploded = updated.filter(b => b.timer <= 0);
        
        if (exploded.length > 0) {
          const newExp = [];
          exploded.forEach(bomb => {
            newExp.push({ x: bomb.x, y: bomb.y, timer: 1, id: Math.random() });
            playSound(500, 0.2);
            
            for (let i = 1; i <= 2; i++) {
              if (bomb.x + i < GRID_SIZE) newExp.push({ x: bomb.x + i, y: bomb.y, timer: 1, id: Math.random() });
              if (bomb.x - i >= 0) newExp.push({ x: bomb.x - i, y: bomb.y, timer: 1, id: Math.random() });
              if (bomb.y + i < GRID_SIZE) newExp.push({ x: bomb.x, y: bomb.y + i, timer: 1, id: Math.random() });
              if (bomb.y - i >= 0) newExp.push({ x: bomb.x, y: bomb.y - i, timer: 1, id: Math.random() });
            }
          });
          setExplosions(newExp);
        }
        
        return remaining;
      });

      // Update explosions
      setExplosions(prev => prev.filter(e => e.timer > 0).map(e => ({ ...e, timer: e.timer - 1 })));

      // Coin collision
      setCoins(prev => {
        const remaining = prev.filter(coin => {
          if (coin.x === playerX && coin.y === playerY) {
            setScore(s => s + 100);
            addNotification('💰 +$100', '#4CAF50');
            playSound(800, 0.1);
            return false;
          }
          return true;
        });
        return remaining;
      });

      // Power-up collision
      setPowerUps(prev => {
        const remaining = prev.filter(pu => {
          if (pu.x === playerX && pu.y === playerY) {
            if (pu.type === 'shield') {
              setShield(5);
              addNotification('🛡️ Shield!', '#2196F3');
            } else if (pu.type === 'speed') {
              setSpeed(8);
              addNotification('⚡ Speed!', '#FF9800');
            } else {
              setBombs(b => b + 3);
              addNotification('🎯 +3 Bombs!', '#9C27B0');
            }
            setScore(s => s + 500);
            playSound(1200, 0.15);
            return false;
          }
          return true;
        });
        return remaining;
      });

      // Timers
      setShield(s => Math.max(0, s - 1));
      setSpeed(sp => Math.max(0, sp - 1));
    }, 200);

    return () => clearInterval(gameLoop);
  }, [gameState, playerX, playerY]);

  // Explosion collision with player
  useEffect(() => {
    if (gameState !== 'playing') return;

    let hitPlayer = false;
    for (let exp of explosions) {
      if (exp.x === playerX && exp.y === playerY) {
        hitPlayer = true;
        break;
      }
    }
    
    if (hitPlayer) {
      if (shield > 0) {
        setShield(0);
        addNotification('💔 Shield broken!', '#FF9800');
        playSound(200, 0.2);
      } else {
        setGameState('gameOver');
        addNotification('💀 Game Over!', '#f44336');
        playSound(100, 0.5);
      }
    }
  }, [explosions, playerX, playerY, shield, gameState]);

  // Explosion collision with boss
  useEffect(() => {
    if (gameState !== 'playing') return;

    let bossHits = 0;
    for (let exp of explosions) {
      if (exp.x === bossX && exp.y === bossY) {
        bossHits++;
      }
    }
    
    if (bossHits > 0) {
      setBossHealth(h => {
        const newHealth = h - bossHits;
        if (newHealth <= 0) {
          setGameState('gameOver');
          addNotification('🎊 Victory!', '#4CAF50');
          playSound(1000, 0.5);
        } else {
          addNotification('💥 Hit!', '#FF5722');
          playSound(600, 0.3);
        }
        return Math.max(0, newHealth);
      });
      setScore(s => s + 1000 * bossHits);
    }
  }, [explosions, bossX, bossY, gameState]);

  const renderBoard = () => {
    const tiles = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isWall = (x % 2 === 0 && y % 2 === 0) || (x === 0 || y === 0 || x === 12 || y === 12);
        let content = '';
        let bgColor = isWall ? '#333' : '#e0f2e0';

        if (playerX === x && playerY === y) {
          content = '🧑';
          if (shield > 0) bgColor = '#fff9e6';
        } else if (bossX === x && bossY === y) {
          content = '😠';
        } else if (gameBombs.some(b => b.x === x && b.y === y)) {
          content = '💣';
        } else if (explosions.some(e => e.x === x && e.y === y)) {
          content = '💥';
          bgColor = '#ffcccc';
        } else if (coins.some(c => c.x === x && c.y === y)) {
          content = '💰';
        } else if (powerUps.some(p => p.x === x && p.y === y)) {
          const pu = powerUps.find(p => p.x === x && p.y === y);
          content = pu.type === 'shield' ? '🛡️' : pu.type === 'speed' ? '⚡' : '🎯';
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
              backgroundColor: bgColor,
              border: '1px solid #999',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            {content}
          </div>
        );
      }
    }
    return tiles;
  };

  // MENU SCREEN
  if (gameState === 'menu') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          background: 'white',
          borderRadius: '15px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '15px' }}>🏢💣</div>
          <h1 style={{ fontSize: '36px', color: '#333', margin: '0 0 10px', fontWeight: 'bold' }}>
            ESCAPE THE BOSS
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '0 0 25px', lineHeight: '1.6' }}>
            Survive the office! Trap your boss with bombs and escape!
          </p>

          <input
            type="text"
            value={tempBossName}
            onChange={(e) => setTempBossName(e.target.value)}
            placeholder="Enter boss name..."
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '2px solid #667eea',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />

          <select
            onChange={(e) => {
              startGame(e.target.value, tempBossName);
            }}
            defaultValue=""
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '8px',
              border: '2px solid #667eea',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">Select Difficulty...</option>
            <option value="easy">🟢 Easy (3 HP)</option>
            <option value="normal">🟡 Normal (5 HP)</option>
            <option value="hard">🔴 Hard (7 HP)</option>
          </select>

          <button
            onClick={() => setSoundOn(!soundOn)}
            style={{
              width: '100%',
              padding: '10px',
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
        </div>
      </div>
    );
  }

  // GAMEPLAY SCREEN
  if (gameState === 'playing') {
    const bossHealthBar = Array(Math.max(0, bossHealth)).fill('❤️').join('') || '💀';

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '10px',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* HUD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>💰 Score</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>${Math.round(score)}</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>❤️ Boss HP</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{bossHealthBar}</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '10px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            border: bombs > 0 ? '2px solid #FF9800' : '2px solid #ccc'
          }}>
            <div style={{ fontSize: '20px' }}>💣</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{bombs}</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            border: shield > 0 ? '2px solid #2196F3' : '2px solid #ccc'
          }}>
            <div style={{ fontSize: '20px' }}>🛡️</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{Math.round(shield)}s</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            border: speed > 0 ? '2px solid #FF9800' : '2px solid #ccc'
          }}>
            <div style={{ fontSize: '20px' }}>⚡</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{Math.round(speed)}s</div>
          </div>
        </div>

        {/* Game Board */}
        <div style={{
          position: 'relative',
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: '#e8f5e9',
          border: '3px solid #333',
          margin: '0 auto 10px',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {renderBoard()}
        </div>

        {/* Mobile Controls */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Arrow Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '5px',
            marginBottom: '10px'
          }}>
            <div></div>
            <button
              onClick={() => movePlayer('up')}
              style={{
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⬆️
            </button>
            <div></div>

            <button
              onClick={() => movePlayer('left')}
              style={{
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⬅️
            </button>
            <button
              onClick={() => movePlayer('down')}
              style={{
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⬇️
            </button>
            <button
              onClick={() => movePlayer('right')}
              style={{
                padding: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ➡️
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5px'
          }}>
            <button
              onClick={placeBomb}
              style={{
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                background: bombs > 0 ? '#FF9800' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: bombs > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              💣 Bomb
            </button>
            <button
              onClick={() => setGameState('menu')}
              style={{
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ↩️ Menu
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 100 }}>
          {notifications.map(notif => (
            <div
              key={notif.id}
              style={{
                background: notif.color,
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {notif.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // GAME OVER SCREEN
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'white',
        borderRadius: '15px',
        padding: '40px 20px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 15px', color: '#333' }}>🎊 VICTORY!</h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
          You escaped from {bossName}!
        </p>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '20px',
          color: 'white'
        }}>
          <p style={{ fontSize: '14px', margin: '0 0 10px' }}>Total Earnings</p>
          <p style={{ fontSize: '42px', fontWeight: 'bold', margin: 0 }}>💰 ${Math.round(score)}</p>
        </div>
        <button
          onClick={() => {
            setGameState('menu');
            setTempBossName('');
          }}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Play Again 🎮
        </button>
      </div>
    </div>
  );
};

export default EscapeTheBossMobile;
