import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 13;
const CELL_SIZE = 32;
const GAME_SPEED = 200;

export default function EscapeTheBossGame() {
  const audioRef = useRef(null);

  const [gameState, setGameState] = useState("menu");
  const [bossName, setBossName] = useState("Mr. Boss");
  const [tempBossName, setTempBossName] = useState("");

  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [bossPos, setBossPos] = useState({ x: 11, y: 11 });

  const [bombs, setBombs] = useState([]);
  const [explosions, setExplosions] = useState([]);

  const [coins, setCoins] = useState([]);
  const [powerUps, setPowerUps] = useState([]);

  const [score, setScore] = useState(0);
  const [bossHealth, setBossHealth] = useState(3);

  const [inventory, setInventory] = useState({
    bomb: 3,
    shield: 0,
    speed: 0
  });

  const bossTypes = {
    angry: { emoji: "😠" },
    lazy: { emoji: "😴" },
    sneaky: { emoji: "🕵️" }
  };

  const [bossType, setBossType] = useState("angry");

  const playSound = useCallback((freq, dur) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + dur
      );

      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  }, []);

  const randomPos = () => ({
    x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
    y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
  });

  const spawnItems = () => {
    const newCoins = [];
    for (let i = 0; i < 8; i++) {
      newCoins.push({ ...randomPos(), value: 100 });
    }

    const newPowerUps = [
      { ...randomPos(), type: "shield" },
      { ...randomPos(), type: "speed" },
      { ...randomPos(), type: "bomb" }
    ];

    setCoins(newCoins);
    setPowerUps(newPowerUps);
  };

  const startGame = () => {
    if (tempBossName) setBossName(tempBossName);

    setPlayerPos({ x: 1, y: 1 });
    setBossPos({ x: 11, y: 11 });

    setScore(0);
    setBossHealth(3);

    setBombs([]);
    setExplosions([]);

    setInventory({
      bomb: 3,
      shield: 0,
      speed: 0
    });

    spawnItems();
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const handleMove = e => {
      const speed = inventory.speed ? 2 : 1;

      setPlayerPos(p => {
        let { x, y } = p;

        if (e.key === "ArrowUp" || e.key === "w") y -= speed;
        if (e.key === "ArrowDown" || e.key === "s") y += speed;
        if (e.key === "ArrowLeft" || e.key === "a") x -= speed;
        if (e.key === "ArrowRight" || e.key === "d") x += speed;

        x = Math.max(0, Math.min(GRID_SIZE - 1, x));
        y = Math.max(0, Math.min(GRID_SIZE - 1, y));

        return { x, y };
      });

      if (e.key === " " && inventory.bomb > 0) {
        setBombs(b => [...b, { ...playerPos, timer: 3 }]);

        setInventory(i => ({
          ...i,
          bomb: i.bomb - 1
        }));

        playSound(400, 0.1);
      }
    };

    window.addEventListener("keydown", handleMove);
    return () => window.removeEventListener("keydown", handleMove);
  }, [playerPos, inventory, playSound, gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = setInterval(() => {
      setBossPos(prev => {
        const dx = playerPos.x - prev.x;
        const dy = playerPos.y - prev.y;

        let x = prev.x;
        let y = prev.y;

        if (Math.abs(dx) > Math.abs(dy)) x += dx > 0 ? 1 : -1;
        else y += dy > 0 ? 1 : -1;

        return {
          x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
          y: Math.max(0, Math.min(GRID_SIZE - 1, y))
        };
      });

      setBombs(b =>
        b
          .map(b => ({ ...b, timer: b.timer - 1 }))
          .filter(b => {
            if (b.timer <= 0) {
              explode(b);
              return false;
            }
            return true;
          })
      );
    }, GAME_SPEED);

    return () => clearInterval(loop);
  }, [playerPos, gameState]);

  const explode = bomb => {
    const newExplosions = [{ ...bomb, timer: 2 }];

    for (let i = 1; i <= 2; i++) {
      newExplosions.push({ x: bomb.x + i, y: bomb.y, timer: 2 });
      newExplosions.push({ x: bomb.x - i, y: bomb.y, timer: 2 });
      newExplosions.push({ x: bomb.x, y: bomb.y + i, timer: 2 });
      newExplosions.push({ x: bomb.x, y: bomb.y - i, timer: 2 });
    }

    setExplosions(e => [...e, ...newExplosions]);

    playSound(600, 0.2);
  };

  useEffect(() => {
    setExplosions(e =>
      e.map(e => ({ ...e, timer: e.timer - 1 })).filter(e => e.timer > 0)
    );
  }, [bombs]);

  useEffect(() => {
    coins.forEach(c => {
      if (c.x === playerPos.x && c.y === playerPos.y) {
        setScore(s => s + c.value);
        playSound(900, 0.1);
        setCoins(cs => cs.filter(x => x !== c));
      }
    });
  }, [playerPos, coins]);

  const renderBoard = () => {
    const tiles = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        let emoji = "";

        if (playerPos.x === x && playerPos.y === y) emoji = "🧑";
        else if (bossPos.x === x && bossPos.y === y)
          emoji = bossTypes[bossType].emoji;
        else if (bombs.some(b => b.x === x && b.y === y)) emoji = "💣";
        else if (explosions.some(e => e.x === x && e.y === y)) emoji = "💥";
        else if (coins.some(c => c.x === x && c.y === y)) emoji = "💰";

        tiles.push(
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x * CELL_SIZE,
              top: y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              border: "1px solid #ddd",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 20
            }}
          >
            {emoji}
          </div>
        );
      }
    }

    return tiles;
  };

  if (gameState === "menu") {
    return (
      <div style={{ padding: 20 }}>
        <h1>ESCAPE THE BOSS 💣</h1>

        <input
          value={tempBossName}
          onChange={e => setTempBossName(e.target.value)}
          placeholder="Boss name"
        />

        <button onClick={startGame}>Start</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>
        {bossName} HP: {bossHealth}
      </h2>

      <div
        style={{
          position: "relative",
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          border: "3px solid black"
        }}
      >
        {renderBoard()}
      </div>

      <p>Score: {score}</p>
    </div>
  );
}
