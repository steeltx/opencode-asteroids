'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

const SHIP_SKINS = [
  { id: 'classic', name: 'Clásica', color: '#fff', flame: '#ff8200', vertices: [[20, 0], [-12, -9], [-7, 0], [-12, 9]] },
  { id: 'neon', name: 'Neón', color: '#00e5ff', flame: '#ff46dc', vertices: [[20, 0], [-10, -10], [-4, 0], [-10, 10]] },
  { id: 'fighter', name: 'Caza', color: '#ff6262', flame: '#ffd700', vertices: [[20, 0], [0, -5], [-12, -11], [-9, 0], [-12, 11], [0, 5]] },
  { id: 'retro', name: 'Retro', color: '#82ff82', flame: '#ffb347', vertices: [[20, 0], [5, -6], [5, -10], [-12, -10], [-7, 0], [-12, 10], [5, 10], [5, 6]] },
];
const SKIN_STORAGE_KEY = 'asteroids.shipSkin';
let selectedSkin = SHIP_SKINS[0];

function selectSkin(id) {
  selectedSkin = SHIP_SKINS.find(skin => skin.id === id) || SHIP_SKINS[0];
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, selectedSkin.id);
  } catch {
    // La selección sigue funcionando si el almacenamiento está bloqueado.
  }
}

function initSkinSelector() {
  try {
    const savedId = localStorage.getItem(SKIN_STORAGE_KEY);
    selectedSkin = SHIP_SKINS.find(skin => skin.id === savedId) || SHIP_SKINS[0];
  } catch {
    // Se conserva la skin predeterminada si no hay acceso al almacenamiento.
  }
  const selector = document.getElementById('skin-selector');
  for (const skin of SHIP_SKINS) {
    const option = document.createElement('option');
    option.value = skin.id;
    option.textContent = skin.name;
    selector.appendChild(option);
  }
  selector.value = selectedSkin.id;
  selector.addEventListener('change', () => selectSkin(selector.value));
  selector.addEventListener('keydown', event => event.stopPropagation());
  selector.addEventListener('keyup', event => event.stopPropagation());
}

function drawShipShape(scale = 1) {
  ctx.strokeStyle = selectedSkin.color;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  selectedSkin.vertices.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x * scale, y * scale);
    else ctx.lineTo(x * scale, y * scale);
  });
  ctx.closePath();
  ctx.stroke();
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

const SHOOTING_STAR_SPEED = 240;
const SHOOTING_STAR_LIFETIME = 6;

class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    const angle = Math.atan2(this.vy, this.vx);
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
    this.ttl = SHOOTING_STAR_LIFETIME;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.ttl));
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.atan2(this.vy, this.vx));
    const trail = ctx.createLinearGradient(-70, 0, 0, 0);
    trail.addColorStop(0, 'rgba(255, 215, 0, 0)');
    trail.addColorStop(1, '#ffd700');
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-70, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5;
      const radius = i % 2 === 0 ? this.radius : this.radius / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

const SPEED_BOOST_DURATION = 5;
const SPEED_POWER_UP_CHANCE = 0.15;
const TRIPLE_SHOT_DURATION = 5;
const TRIPLE_SHOT_POWER_UP_CHANCE = 0.15;
const BURST_SHOT_INTERVAL = 0.08;

class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.ttl = 10;
  }

  update(dt) {
    this.ttl -= dt;
  }

  activate(ship) {
    ship.speedBoostRemaining = SPEED_BOOST_DURATION;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -10);
    ctx.lineTo(-6, 2);
    ctx.lineTo(1, 2);
    ctx.lineTo(-3, 10);
    ctx.lineTo(6, -2);
    ctx.lineTo(-1, -2);
    ctx.closePath();
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.restore();
  }
}

class TripleShotPowerUp extends SpeedPowerUp {
  activate(ship) {
    ship.tripleShotRemaining = TRIPLE_SHOT_DURATION;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#ff70df';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (const y of [-7, 0, 7]) {
      ctx.moveTo(-6, y);
      ctx.lineTo(6, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedBoostRemaining = 0;
    this.tripleShotRemaining = 0;
    this.burstShotsRemaining = 0;
    this.burstTimer = 0;
    this.burstAngle = this.angle;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    const boostedTime = Math.min(dt, this.speedBoostRemaining);
    const movementTime = dt + boostedTime;
    this.x = wrap(this.x + this.vx * movementTime, W);
    this.y = wrap(this.y + this.vy * movementTime, H);
    this.speedBoostRemaining = Math.max(0, this.speedBoostRemaining - dt);
    this.tripleShotRemaining = Math.max(0, this.tripleShotRemaining - dt);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    if (this.tripleShotRemaining > 0) {
      this.burstShotsRemaining = 2;
      this.burstTimer = BURST_SHOT_INTERVAL;
      this.burstAngle = this.angle;
    }
    return [this.createBullet(this.angle)];
  }

  createBullet(angle) {
    const NOSE = 21;
    const ox = this.x + Math.cos(angle) * NOSE;
    const oy = this.y + Math.sin(angle) * NOSE;
    return new Bullet(ox, oy, angle);
  }

  updateBurst(dt) {
    if (this.dead || this.burstShotsRemaining === 0) return [];
    this.burstTimer -= dt;
    const shots = [];
    while (this.burstTimer <= 0 && this.burstShotsRemaining > 0) {
      shots.push(this.createBullet(this.burstAngle));
      this.burstShotsRemaining--;
      this.burstTimer += BURST_SHOT_INTERVAL;
    }
    return shots;
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    drawShipShape();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = selectedSkin.flame;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
  asteroids.push(new ShootingStar(0, rand(0, H)));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoostRemaining = 0;
  ship.tripleShotRemaining = 0;
  ship.burstShotsRemaining = 0;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  powerUps.forEach(powerUp => powerUp.update(dt));
  powerUps = powerUps.filter(powerUp => powerUp.ttl > 0);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  bullets.push(...ship.updateBurst(dt));

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        if (Math.random() < SPEED_POWER_UP_CHANCE) {
          powerUps.push(new SpeedPowerUp(a.x, a.y));
        }
        if (Math.random() < TRIPLE_SHOT_POWER_UP_CHANCE) {
          powerUps.push(new TripleShotPowerUp(a.x, a.y));
        }
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  if (state === 'playing') {
    powerUps = powerUps.filter(powerUp => {
      if (dist(ship, powerUp) >= ship.radius + powerUp.radius) return true;
      powerUp.activate(ship);
      return false;
    });
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.lineWidth   = 1.2;
  drawShipShape(0.5);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);
  if (ship.speedBoostRemaining > 0) {
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(`VELOCIDAD ${ship.speedBoostRemaining.toFixed(1)}s`, 14, 50);
    ctx.fillStyle = '#fff';
  }
  if (ship.tripleShotRemaining > 0) {
    ctx.fillStyle = '#ff70df';
    ctx.fillText(`TRIPLE SHOT ${ship.tripleShotRemaining.toFixed(1)}s`, 14, 74);
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerUps.forEach(powerUp => powerUp.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initSkinSelector();
initGame();
requestAnimationFrame(loop);
