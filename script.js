// ==================================================
//  Variables y Estado Global
// ==================================================
let theme = 'light'; // 'light' o 'dark'
const state = {
  // Configuración
  numSimulaciones: 1,
  numCaras: 6,
  velocidadAnim: 1.0, // multiplicador (1× por defecto)
  criterioBernoulli: 9,

  // Historial de tiradas
  tiradasUniforme: [],       // ej: [5, 2, 6, 1, ...]
  tiradasBernoulli: [],      // ej: [{d1: 3, d2: 5, suma: 8, exito: false}, ...]

  // Logros
  logros: {
    primerDobleSeis: false,
    cienTiradas: false
  }
};

// ==================================================
//  Helper: Guardar / Recuperar localStorage
// ==================================================
function saveToLocalStorage() {
  localStorage.setItem('simu_state', JSON.stringify(state));
}
function loadFromLocalStorage() {
  const data = localStorage.getItem('simu_state');
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(state, saved);
  }
}

// ==================================================
//  Tema Claro/Oscuro
// ==================================================
function toggleTheme() {
  if (theme === 'light') {
    theme = 'dark';
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.getElementById('toggle-theme').innerText = '☀️';
  } else {
    theme = 'light';
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.getElementById('toggle-theme').innerText = '🌙';
  }
  saveToLocalStorage();
}

// ==================================================
//  Inicialización de BD y Estado
// ==================================================
window.addEventListener('DOMContentLoaded', () => {
  // 1) Cargar tema y estado previos
  loadFromLocalStorage();
  if (state.numCaras !== undefined) {
    document.getElementById('input-num-caras').value = state.numCaras;
    document.getElementById('label-caras-uniforme').innerText = state.numCaras;
    document.getElementById('cube-uniforme').setAttribute('data-caras', state.numCaras);
    document.getElementById('cube1-bernoulli').setAttribute('data-caras', state.numCaras);
    document.getElementById('cube2-bernoulli').setAttribute('data-caras', state.numCaras);
  }
  if (state.numSimulaciones !== undefined) {
    document.getElementById('input-num-simulaciones').value = state.numSimulaciones;
  }
  if (state.velocidadAnim !== undefined) {
    document.getElementById('slider-velocidad').value = state.velocidadAnim;
    document.getElementById('label-velocidad').innerText = state.velocidadAnim + '×';
  }
  if (state.criterioBernoulli !== undefined) {
    document.getElementById('input-criterio').value = state.criterioBernoulli;
    document.getElementById('label-criterio').innerText = 'Suma ≥';
  }

  // 2) Tema
  if (theme === 'dark') {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.getElementById('toggle-theme').innerText = '☀️';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.getElementById('toggle-theme').innerText = '🌙';
  }

  // 3) Enlazar eventos
  document.getElementById('toggle-theme').addEventListener('click', toggleTheme);
  document.getElementById('input-num-simulaciones').addEventListener('change', e => {
    state.numSimulaciones = parseInt(e.target.value) || 1;
    saveToLocalStorage();
  });
  document.getElementById('input-num-caras').addEventListener('change', e => {
    let n = parseInt(e.target.value) || 6;
    if (n < 2) n = 2;
    if (n > 20) n = 20;
    state.numCaras = n;
    document.getElementById('label-caras-uniforme').innerText = n;
    // Actualizar data-caras en cubos
    document.getElementById('cube-uniforme').setAttribute('data-caras', n);
    document.getElementById('cube1-bernoulli').setAttribute('data-caras', n);
    document.getElementById('cube2-bernoulli').setAttribute('data-caras', n);
    saveToLocalStorage();
    rebuildUniformeFaces();
    rebuildBernoulliFaces();
  });
  document.getElementById('slider-velocidad').addEventListener('input', e => {
    state.velocidadAnim = parseFloat(e.target.value);
    document.getElementById('label-velocidad').innerText = state.velocidadAnim + '×';
    saveToLocalStorage();
  });
  document.getElementById('input-criterio').addEventListener('change', e => {
    let c = parseInt(e.target.value) || 2;
    if (c < 2) c = 2;
    if (c > state.numCaras * 2) c = state.numCaras * 2;
    state.criterioBernoulli = c;
    saveToLocalStorage();
  });
  document.getElementById('btn-reset').addEventListener('click', resetGeneral);

  // 4) Inicializar gráficos vacíos
  initCharts();

  // 5) Restaurar datos previos (si existen)
  restoreUniformeData();
  restoreBernoulliData();

  // 6) Asociar botones de lanzamiento
  document.getElementById('btn-lanzar-uniforme').addEventListener('click', lanzarUniforme);
  document.getElementById('btn-lanzar-bernoulli').addEventListener('click', lanzarBernoulli);
  document.getElementById('btn-export-uniforme').addEventListener('click', () => exportCSV('uniforme'));
  document.getElementById('btn-export-bernoulli').addEventListener('click', () => exportCSV('bernoulli'));
});

// ==================================================
//  RECONSTRUCCIÓN DINÁMICA DE CARAS DEL DADO (si n≠6)
// ==================================================
function rebuildUniformeFaces() {
  const container = document.getElementById('cube-uniforme');
  const n = state.numCaras;
  container.innerHTML = ''; // Limpiar caras viejas

  if (n === 6) {
    // Reconstruir cara 1..6 en posición estándar
    const faces = ['front','back','right','left','top','bottom'];
    faces.forEach((faceName, idx) => {
      const div = document.createElement('div');
      div.classList.add('face', faceName);
      div.innerText = (idx + 1).toString();
      container.appendChild(div);
    });
    container.style.display = 'block';
    document.getElementById('numero-uniforme').style.display = 'none';
  } else {
    // No mostramos cubo 3D; mostramos “numero-large”
    container.style.display = 'none';
    document.getElementById('numero-uniforme').style.display = 'flex';
  }
}

function rebuildBernoulliFaces() {
  ['cube1-bernoulli','cube2-bernoulli'].forEach(id => {
    const container = document.getElementById(id);
    const n = state.numCaras;
    container.innerHTML = '';
    if (n === 6) {
      const faces = ['front','back','right','left','top','bottom'];
      faces.forEach((faceName, idx) => {
        const div = document.createElement('div');
        div.classList.add('face', faceName);
        div.innerText = (idx + 1).toString();
        container.appendChild(div);
      });
      container.style.display = 'block';
      document.getElementById(id.replace('cube','numero')).style.display = 'none';
    } else {
      container.style.display = 'none';
      document.getElementById(id.replace('cube','numero')).style.display = 'flex';
    }
  });
}

// ==================================================
//  RESET GENERAL DE LA APLICACIÓN
// ==================================================
function resetGeneral() {
  if (!confirm('¿Seguro que deseas reiniciar todo? Esto borrará tiradas, logros y contadores.')) return;
  // Reset estado
  state.tiradasUniforme = [];
  state.tiradasBernoulli = [];
  state.logros.primerDobleSeis = false;
  state.logros.cienTiradas = false;

  // Reset contadores en pantalla
  document.getElementById('count-uniforme').innerText = '0';
  document.getElementById('mean-uniforme').innerText = '0';
  document.getElementById('median-uniforme').innerText = '0';
  document.getElementById('mode-uniforme').innerText = '—';
  document.getElementById('var-uniforme').innerText = '0';
  document.getElementById('std-uniforme').innerText = '0';
  ChartistUpdateUniforme([], []); // limpiar gráficos
  restoreUniformeData(); // refrescar

  document.getElementById('count-bernoulli').innerText = '0';
  document.getElementById('count-exitos').innerText = '0';
  document.getElementById('count-fracasos').innerText = '0';
  document.getElementById('mean-bernoulli').innerText = '0';
  document.getElementById('var-bernoulli').innerText = '0';
  document.getElementById('std-bernoulli').innerText = '0';
  ChartistUpdateBernoulli([], []);
  restoreBernoulliData();

  // Guardar cambios
  saveToLocalStorage();
  alert('¡Se ha reiniciado todo!');
}

// ==================================================
//  FUNCIÓN: Generar número aleatorio [1..n]
// ==================================================
function randomInt(n) {
  return Math.floor(Math.random() * n) + 1;
}

// ==================================================
//  Sonido básico con Web Audio API al lanzar (click corto)
// ==================================================
function playSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.type = 'square';
  o.frequency.setValueAtTime(800, ctx.currentTime);
  g.gain.setValueAtTime(0.1, ctx.currentTime);
  o.start();
  o.stop(ctx.currentTime + 0.05); // 50 ms
}

// ==================================================
//  Partículas sencillas al “éxito extremo”
// ==================================================
let particlesCanvas, particlesCtx;
function initParticles() {
  particlesCanvas = document.createElement('canvas');
  particlesCanvas.id = 'particles-canvas';
  document.body.appendChild(particlesCanvas);
  particlesCtx = particlesCanvas.getContext('2d');
  resizeParticlesCanvas();
  window.addEventListener('resize', resizeParticlesCanvas);
}
function resizeParticlesCanvas() {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}
const particles = [];
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.alpha = 1.0;
    this.size = Math.random() * 4 + 2;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.02;
  }
  draw() {
    particlesCtx.save();
    particlesCtx.globalAlpha = this.alpha;
    particlesCtx.fillStyle = '#ffd700';
    particlesCtx.beginPath();
    particlesCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    particlesCtx.fill();
    particlesCtx.restore();
  }
}
function spawnParticles(count, x, y) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y));
  }
}
function animateParticles() {
  particlesCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].alpha <= 0) {
      particles.splice(i, 1);
    } else {
      particles[i].draw();
    }
  }
  requestAnimationFrame(animateParticles);
}

// Inicializar partículas en carga
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  animateParticles();
});

// ==================================================
//  Animación del Cubo 3D (solo si 6 caras)
//  Calcula rotación aleatoria para mostrar cara al azar
// ==================================================
function rotateCubeRandom(cubeEl) {
  const cara = randomInt(6); // 1..6
  // Predefinir rotaciones que muestran cada cara
  const rotations = {
    1: 'rotateX(0deg) rotateY(0deg)',      // front = 1
    2: 'rotateX(0deg) rotateY(-90deg)',    // right = 2
    3: 'rotateX(90deg) rotateY(0deg)',     // top = 3
    4: 'rotateX(-90deg) rotateY(0deg)',    // bottom = 4
    5: 'rotateX(0deg) rotateY(90deg)',     // left = 5
    6: 'rotateX(180deg) rotateY(0deg)'     // back = 6
  };
  const transformStr = rotations[cara];
  cubeEl.style.transition = `${0.6 / state.velocidadAnim}s ease`; // velocidad adaptada
  cubeEl.style.transform = transformStr;
  return cara;
}

// ==================================================
//  Lógica de Estadísticas (media, mediana, moda, varianza, stddev)
// ==================================================
function calcularMedia(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function calcularVarianza(arr) {
  if (arr.length === 0) return 0;
  const m = calcularMedia(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
}
function calcularDesviacion(arr) {
  return Math.sqrt(calcularVarianza(arr));
}
function calcularMediana(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}
function calcularModa(arr) {
  if (arr.length === 0) return '—';
  const freq = {};
  arr.forEach(v => {
    freq[v] = (freq[v] || 0) + 1;
  });
  let maxCount = 0;
  let moda = [];
  Object.entries(freq).forEach(([num, cnt]) => {
    if (cnt > maxCount) {
      maxCount = cnt;
      moda = [Number(num)];
    } else if (cnt === maxCount) {
      moda.push(Number(num));
    }
  });
  return moda.join(', ');
}

// ==================================================
//  CHART.JS: Declaración de variables para gráficos
// ==================================================
let chartUniforme, chartMovingAverage, chartCumulative, chartTheoreticalEmpirical;
let chartBernoulli, chartBernThEmp;

// Inicializar todos los gráficos con datos vacíos
function initCharts() {
  const ctxUniforme = document.getElementById('chart-uniforme').getContext('2d');
  const ctxMoving = document.getElementById('chart-moving-average').getContext('2d');
  const ctxCum = document.getElementById('chart-cumulative').getContext('2d');
  const ctxTheEmp = document.getElementById('chart-theoretical-vs-empirical').getContext('2d');
  const ctxBern = document.getElementById('chart-bernoulli').getContext('2d');
  const ctxBernTeEmp = document.getElementById('chart-bern-theoretical-vs-empirical').getContext('2d');

  // Datos iniciales uniformes
  chartUniforme = new Chart(ctxUniforme, {
    type: 'bar',
    data: {
      labels: Array.from({ length: state.numCaras }, (_, i) => (i + 1).toString()),
      datasets: [{
        label: 'Frecuencia',
        data: Array(state.numCaras).fill(0),
        backgroundColor: Array(state.numCaras).fill('rgba(30, 136, 229, 0.7)'),
        borderColor: Array(state.numCaras).fill('rgba(30, 136, 229, 1)'),
        borderWidth: 1
      }]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Media móvil inicial (vacía)
  chartMovingAverage = new Chart(ctxMoving, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Media móvil',
        data: [],
        fill: false,
        borderColor: 'rgba(67, 160, 71, 1)',
        tension: 0.3
      }]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Distribución acumulada
  chartCumulative = new Chart(ctxCum, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Distribución acumulada',
        data: [],
        fill: false,
        borderColor: 'rgba(30, 136, 229, 1)',
        tension: 0.3
      }]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Teórica vs Empírica uniforme
  chartTheoreticalEmpirical = new Chart(ctxTheEmp, {
    type: 'bar',
    data: {
      labels: Array.from({ length: state.numCaras }, (_, i) => (i + 1).toString()),
      datasets: [
        {
          label: 'Empírico',
          data: Array(state.numCaras).fill(0),
          backgroundColor: 'rgba(30, 136, 229, 0.7)'
        },
        {
          label: 'Teórico',
          data: Array(state.numCaras).fill(1 / state.numCaras),
          backgroundColor: 'rgba(255, 193, 7, 0.7)'
        }
      ]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1
        }
      }
    }
  });

  // Bernoulli: éxitos vs fracasos
  chartBernoulli = new Chart(ctxBern, {
    type: 'bar',
    data: {
      labels: ['Éxito', 'Fracaso'],
      datasets: [{
        label: 'Frecuencia',
        data: [0, 0],
        backgroundColor: ['rgba(67,160,71,0.7)', 'rgba(244,67,54,0.7)'],
        borderColor: ['rgba(67,160,71,1)', 'rgba(244,67,54,1)'],
        borderWidth: 1
      }]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Bernoulli: prob teórica vs empírica
  chartBernThEmp = new Chart(ctxBernTeEmp, {
    type: 'bar',
    data: {
      labels: ['Éxito', 'Fracaso'],
      datasets: [
        {
          label: 'Empírico',
          data: [0, 0],
          backgroundColor: ['rgba(67,160,71,0.7)', 'rgba(244,67,54,0.7)']
        },
        {
          label: 'Teórico',
          data: [0, 0], // se calculará dinámicamente
          backgroundColor: ['rgba(255,193,7,0.7)', 'rgba(128,128,128,0.7)']
        }
      ]
    },
    options: {
      animation: { duration: 600 / state.velocidadAnim },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 1
        }
      }
    }
  });
}

// ==================================================
//  RESTAURAR DATOS ANTERIORES (al recargar página)
// ==================================================
function restoreUniformeData() {
  const arr = state.tiradasUniforme;
  // Actualizar estadísticas
  document.getElementById('count-uniforme').innerText = arr.length.toString();
  document.getElementById('mean-uniforme').innerText = calcularMedia(arr).toFixed(3);
  document.getElementById('median-uniforme').innerText = calcularMediana(arr).toString();
  document.getElementById('mode-uniforme').innerText = calcularModa(arr);
  document.getElementById('var-uniforme').innerText = calcularVarianza(arr).toFixed(3);
  document.getElementById('std-uniforme').innerText = calcularDesviacion(arr).toFixed(3);

  // Actualizar gráfico de frecuencias
  const freq = Array(state.numCaras).fill(0);
  arr.forEach(v => {
    if (v >= 1 && v <= state.numCaras) freq[v - 1]++;
  });
  chartUniforme.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartUniforme.data.datasets[0].data = freq;
  chartUniforme.data.datasets[0].backgroundColor = Array(state.numCaras).fill('rgba(30,136,229,0.7)');
  chartUniforme.data.datasets[0].borderColor = Array(state.numCaras).fill('rgba(30,136,229,1)');
  chartUniforme.update();

  // Media móvil de últimas 20 tiradas
  const maData = [];
  const labelsMA = [];
  for (let i = 0; i < arr.length; i++) {
    const slice = arr.slice(Math.max(0, i - 19), i + 1);
    maData.push(calcularMedia(slice));
    labelsMA.push((i + 1).toString());
  }
  chartMovingAverage.data.labels = labelsMA;
  chartMovingAverage.data.datasets[0].data = maData;
  chartMovingAverage.update();

  // Distribución acumulada
  const cumFreq = [];
  let acumulado = 0;
  freq.forEach(f => {
    acumulado += f;
    cumFreq.push(acumulado);
  });
  chartCumulative.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartCumulative.data.datasets[0].data = cumFreq;
  chartCumulative.update();

  // Teórica vs Empírica (Uniforme)
  const empData = freq.map(f => f / (arr.length || 1));
  const teoVal = 1 / state.numCaras;
  const teoData = Array(state.numCaras).fill(teoVal);
  chartTheoreticalEmpirical.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartTheoreticalEmpirical.data.datasets[0].data = empData;
  chartTheoreticalEmpirical.data.datasets[1].data = teoData;
  chartTheoreticalEmpirical.data.datasets[0].backgroundColor = Array(state.numCaras).fill('rgba(30,136,229,0.7)');
  chartTheoreticalEmpirical.data.datasets[0].borderColor   = Array(state.numCaras).fill('rgba(30,136,229,1)');
  chartTheoreticalEmpirical.update();
}

function restoreBernoulliData() {
  const arr = state.tiradasBernoulli;
  // Estadísticas generales
  document.getElementById('count-bernoulli').innerText = arr.length.toString();
  const exitos = arr.filter(x => x.exito).length;
  const fracasos = arr.length - exitos;
  document.getElementById('count-exitos').innerText = exitos.toString();
  document.getElementById('count-fracasos').innerText = fracasos.toString();
  // Media, varianza, std en función de la suma
  const sumas = arr.map(x => x.suma);
  document.getElementById('mean-bernoulli').innerText = calcularMedia(sumas).toFixed(3);
  document.getElementById('var-bernoulli').innerText = calcularVarianza(sumas).toFixed(3);
  document.getElementById('std-bernoulli').innerText = calcularDesviacion(sumas).toFixed(3);

  // Actualizar histograma Bernoulli
  chartBernoulli.data.datasets[0].data = [exitos, fracasos];
  chartBernoulli.update();

  // Calcular probabilidad teórica Bernoulli
  const n = state.numCaras;
  const crit = state.criterioBernoulli;
  let conteoExito = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      if (i + j >= crit) conteoExito++;
    }
  }
  const totalComb = n * n;
  const pExito = conteoExito / totalComb;
  const pFracaso = 1 - pExito;
  chartBernThEmp.data.datasets[0].data = [exitos / (arr.length || 1), fracasos / (arr.length || 1)];
  chartBernThEmp.data.datasets[1].data = [pExito, pFracaso];
  chartBernThEmp.update();
}

// ==================================================
//  LÓGICA: Simulación Distribución Uniforme
// ==================================================
function lanzarUniforme() {
  playSound();
  const n = state.numCaras;
  const batch = state.numSimulaciones;
  const resultados = []; // para animación secuencial

  for (let k = 0; k < batch; k++) {
    // Si es 6 caras, animar cubo; si no, mostrar número
    if (n === 6) {
      const cubeEl = document.getElementById('cube-uniforme');
      setTimeout(() => {
        const cara = rotateCubeRandom(cubeEl); // 1..6
        state.tiradasUniforme.push(cara);
        document.getElementById('uniforme-resultado').innerText = `Obtuviste: ${cara}`;
        postProcessUniforme(cara);
        checkLogrosUniforme(cara);
        saveToLocalStorage();
      }, k * (600 / state.velocidadAnim));
    } else {
      // Animación “temblor” en el número grande
      const numEl = document.getElementById('numero-uniforme');
      numEl.classList.add('animate-num');
      setTimeout(() => {
        numEl.classList.remove('animate-num');
        const cara = randomInt(n);
        numEl.innerText = cara.toString();
        state.tiradasUniforme.push(cara);
        document.getElementById('uniforme-resultado').innerText = `Obtuviste: ${cara}`;
        postProcessUniforme(cara);
        saveToLocalStorage();
      }, k * (600 / state.velocidadAnim));
    }
  }
}

// Actualizar estadísticas y gráficos tras cada tirada uniforme
function postProcessUniforme(ultimaCara) {
  const arr = state.tiradasUniforme;
  document.getElementById('count-uniforme').innerText = arr.length.toString();
  document.getElementById('mean-uniforme').innerText = calcularMedia(arr).toFixed(3);
  document.getElementById('median-uniforme').innerText = calcularMediana(arr).toString();
  document.getElementById('mode-uniforme').innerText = calcularModa(arr);
  document.getElementById('var-uniforme').innerText = calcularVarianza(arr).toFixed(3);
  document.getElementById('std-uniforme').innerText = calcularDesviacion(arr).toFixed(3);

  // Actualizar histograma
  const freq = Array(state.numCaras).fill(0);
  arr.forEach(v => {
    if (v >= 1 && v <= state.numCaras) freq[v - 1]++;
  });
  chartUniforme.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartUniforme.data.datasets[0].data = freq;
  chartUniforme.data.datasets[0].backgroundColor = Array(state.numCaras).fill('rgba(30,136,229,0.7)');
  chartUniforme.update();

  // Media móvil últimas 20
  const maData = [];
  const labelsMA = [];
  for (let i = 0; i < arr.length; i++) {
    const slice = arr.slice(Math.max(0, i - 19), i + 1);
    maData.push(calcularMedia(slice));
    labelsMA.push((i + 1).toString());
  }
  chartMovingAverage.data.labels = labelsMA;
  chartMovingAverage.data.datasets[0].data = maData;
  chartMovingAverage.update();

  // Distribución acumulada
  const cumFreq = [];
  let acumulado = 0;
  freq.forEach(f => {
    acumulado += f;
    cumFreq.push(acumulado);
  });
  chartCumulative.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartCumulative.data.datasets[0].data = cumFreq;
  chartCumulative.update();

  // Teórica vs Empírica
  const total = arr.length;
  const empData = freq.map(f => f / total);
  const teoVal = 1 / state.numCaras;
  const teoData = Array(state.numCaras).fill(teoVal);
  chartTheoreticalEmpirical.data.labels = Array.from({length: state.numCaras}, (_, i) => (i + 1).toString());
  chartTheoreticalEmpirical.data.datasets[0].data = empData;
  chartTheoreticalEmpirical.data.datasets[1].data = teoData;
  chartTheoreticalEmpirical.update();
}

// Verificar logros en uniforme (doble seis si n=6)
function checkLogrosUniforme(cara) {
  if (state.numCaras === 6 && cara === 6 && !state.logros.primerDobleSeis) {
    alert('🎉 ¡Logro desbloqueado: Primer 6! 🎉');
    state.logros.primerDobleSeis = true;
  }
  if (state.tiradasUniforme.length >= 100 && !state.logros.cienTiradas) {
    alert('🏆 ¡Logro desbloqueado: 100 tiradas! 🏆');
    state.logros.cienTiradas = true;
  }
}

// ==================================================
//  LÓGICA: Simulación Distribución Bernoulli
// ==================================================
function lanzarBernoulli() {
  playSound();
  const n = state.numCaras;
  const batch = state.numSimulaciones;
  const crit = state.criterioBernoulli;

  for (let k = 0; k < batch; k++) {
    if (n === 6) {
      // Animar ambos cubos
      const c1 = document.getElementById('cube1-bernoulli');
      const c2 = document.getElementById('cube2-bernoulli');
      setTimeout(() => {
        const cara1 = rotateCubeRandom(c1);
        const cara2 = rotateCubeRandom(c2);

        const suma = cara1 + cara2;
        const esExito = suma >= crit;
        state.tiradasBernoulli.push({ d1: cara1, d2: cara2, suma, exito: esExito });

        document.getElementById('bernoulli-resultado').innerText =
          `Dados: ${cara1} + ${cara2} = ${suma} → ${esExito ? 'Éxito' : 'Fracaso'}`;

        postProcessBernoulli(suma, esExito);
        saveToLocalStorage();

        // Partículas si doble seis (=12) o si exito = suma = crit muy alto
        if (suma === 12) {
          const rect = c1.getBoundingClientRect();
          spawnParticles(30, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      }, k * (600 / state.velocidadAnim));
    } else {
      // Sin cubos 3D: mostrar número grande
      const n1 = document.getElementById('numero1-bernoulli');
      const n2 = document.getElementById('numero2-bernoulli');
      n1.classList.add('animate-num');
      n2.classList.add('animate-num');
      setTimeout(() => {
        n1.classList.remove('animate-num');
        n2.classList.remove('animate-num');
        const cara1 = randomInt(n);
        const cara2 = randomInt(n);
        n1.innerText = cara1.toString();
        n2.innerText = cara2.toString();
        const suma = cara1 + cara2;
        const esExito = suma >= crit;
        state.tiradasBernoulli.push({ d1: cara1, d2: cara2, suma, exito: esExito });
        document.getElementById('bernoulli-resultado').innerText =
          `Dados: ${cara1} + ${cara2} = ${suma} → ${esExito ? 'Éxito' : 'Fracaso'}`;
        postProcessBernoulli(suma, esExito);
        saveToLocalStorage();
      }, k * (600 / state.velocidadAnim));
    }
  }
}

function postProcessBernoulli(suma, exito) {
  // Actualizar contadores
  const arr = state.tiradasBernoulli;
  document.getElementById('count-bernoulli').innerText = arr.length.toString();
  const exitos = arr.filter(x => x.exito).length;
  const fracasos = arr.length - exitos;
  document.getElementById('count-exitos').innerText = exitos.toString();
  document.getElementById('count-fracasos').innerText = fracasos.toString();

  // Estadísticas en base a sumas
  const sumas = arr.map(x => x.suma);
  document.getElementById('mean-bernoulli').innerText = calcularMedia(sumas).toFixed(3);
  document.getElementById('var-bernoulli').innerText = calcularVarianza(sumas).toFixed(3);
  document.getElementById('std-bernoulli').innerText = calcularDesviacion(sumas).toFixed(3);

  // Histograma éxitos vs fracasos
  chartBernoulli.data.datasets[0].data = [exitos, fracasos];
  chartBernoulli.update();

  // Probabilidad teórica vs empírica
  const n = state.numCaras;
  const crit = state.criterioBernoulli;
  let conteoExito = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      if (i + j >= crit) conteoExito++;
    }
  }
  const totalComb = n * n;
  const pExito = conteoExito / totalComb;
  const pFracaso = 1 - pExito;
  chartBernThEmp.data.datasets[0].data = [exitos / (arr.length || 1), fracasos / (arr.length || 1)];
  chartBernThEmp.data.datasets[1].data = [pExito, pFracaso];
  chartBernThEmp.update();
}

// ==================================================
//  EXPORTAR A CSV
// ==================================================
function exportCSV(tipo) {
  let csvContent = '';
  if (tipo === 'uniforme') {
    csvContent += 'Cara\n';
    state.tiradasUniforme.forEach(v => {
      csvContent += `${v}\n`;
    });
  } else {
    csvContent += 'Dado1,Dado2,Suma,Exito\n';
    state.tiradasBernoulli.forEach(obj => {
      csvContent += `${obj.d1},${obj.d2},${obj.suma},${obj.exito}\n`;
    });
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `${tipo}_tiradas_${now}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==================================================
//  ANIMACIONES DE NÚMERO (si caras ≠ 6)
// ==================================================
const styleNumAnimation = document.createElement('style');
styleNumAnimation.innerHTML = `
  @keyframes temblor-num {
    0% { transform: translate(2px,1px) rotate(0deg); }
    25% { transform: translate(-1px,-1px) rotate(-1deg); }
    50% { transform: translate(-2px,0px) rotate(2deg); }
    75% { transform: translate(1px,2px) rotate(0deg); }
    100% { transform: translate(0px,-1px) rotate(1deg); }
  }
  .animate-num {
    animation: temblor-num 0.6s ease-in-out;
  }
`;
document.head.appendChild(styleNumAnimation);
