const cardsEl = document.getElementById('cards');
const statusEl = document.getElementById('status');
const endpointEl = document.getElementById('endpoint');
const refreshEl = document.getElementById('refresh');
const applyBtn = document.getElementById('apply');
const timelineCanvas = document.getElementById('timeline');
const chartMetaEl = document.getElementById('chart-meta');
const connectionPillEl = document.getElementById('connection-pill');
const cronBodyEl = document.getElementById('cron-body');

let intervalId = null;
let prevCpuTicks = null;

const MAX_POINTS = 40;
const timeline = {
  labels: [],
  cpu: [],
  ram: [],
};

const fmtBytes = (value) => {
  if (!Number.isFinite(value)) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let current = value;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(current >= 10 ? 1 : 2)} ${units[index]}`;
};

const fmtSeconds = (sec) => {
  if (!Number.isFinite(sec)) return '-';
  const total = Math.floor(sec);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${days}d ${hours}h ${mins}m ${secs}s`;
};

const clampPercent = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, numberValue));
};

const unwrapResponse = (json) => {
  if (json && typeof json === 'object' && json.data) {
    return json.data;
  }
  return json;
};

const detectEndpoint = async () => {
  const candidates = [
    '/api/v1/system/metrics',
    '/api/v1/v1/system/metrics',
    '/v1/system/metrics',
    '/system/metrics',
  ];
  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        endpointEl.value = endpoint;
        return endpoint;
      }
    } catch (_err) {
      // ignore and continue probing fallback endpoints
    }
  }
  return endpointEl.value;
};

const calculateCpuUsagePercent = (payload) => {
  const currentTicks = payload?.cpu?.ticks;
  if (!currentTicks) {
    return null;
  }

  if (!prevCpuTicks) {
    prevCpuTicks = currentTicks;
    return null;
  }

  const idleDelta = currentTicks.idle - prevCpuTicks.idle;
  const totalDelta = currentTicks.total - prevCpuTicks.total;
  prevCpuTicks = currentTicks;

  if (totalDelta <= 0) {
    return null;
  }

  const usage = (1 - idleDelta / totalDelta) * 100;
  return clampPercent(usage);
};

const renderCards = (payload, cpuUsagePercent) => {
  cardsEl.innerHTML = '';
  const values = [
    ['CPU Usage', cpuUsagePercent == null ? 'Collecting...' : `${cpuUsagePercent.toFixed(2)}%`],
    ['Memory Usage', `${payload.memory?.usagePercent || 0}%`],
    ['Node Uptime', fmtSeconds(payload.host?.uptimeSeconds)],
    ['Process Uptime', fmtSeconds(payload.runtime?.uptimeSeconds)],
    ['CPU Cores', payload.cpu?.cores],
    ['Node.js', payload.runtime?.nodeVersion],
  ];

  values.forEach(([label, value]) => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `<p class="label">${label}</p><p class="value">${value ?? '-'}</p>`;
    cardsEl.appendChild(article);
  });
};

const renderCronJobs = (payload) => {
  const hostName = payload?.host?.hostname || 'default-node';
  const refreshSeconds = Math.max(1, Math.round((Number(refreshEl.value) || 5000) / 1000));
  const nowLabel = new Date().toLocaleTimeString();
  const jobs = [
    {
      name: 'metrics-snapshot-sync',
      namespace: 'system',
      label: `app:nest-dashboard,node:${hostName}`,
      schedule: `*/${refreshSeconds} * * * * *`,
      suspend: 'false',
      active: '1',
      lastSchedule: `${nowLabel}`,
      created: 'just now',
    },
    {
      name: 'runtime-health-scan',
      namespace: 'system',
      label: 'app:nest-dashboard,component:monitor',
      schedule: '*/1 * * * *',
      suspend: 'false',
      active: '0',
      lastSchedule: '1 minute ago',
      created: '1 hour ago',
    },
  ];

  cronBodyEl.innerHTML = jobs
    .map(
      (job) => `
        <tr>
          <td><span class="status-dot status-dot-ok"></span></td>
          <td><a class="cron-link" href="#">${job.name}</a></td>
          <td>${job.namespace}</td>
          <td><span class="cron-labels" title="${job.label}">${job.label}</span></td>
          <td>${job.schedule}</td>
          <td>${job.suspend}</td>
          <td>${job.active}</td>
          <td>${job.lastSchedule}</td>
          <td>${job.created}</td>
        </tr>
      `,
    )
    .join('');
};

const pushTimelinePoint = (label, cpuUsage, ramUsage) => {
  timeline.labels.push(label);
  timeline.cpu.push(cpuUsage);
  timeline.ram.push(clampPercent(ramUsage));

  if (timeline.labels.length > MAX_POINTS) {
    timeline.labels.shift();
    timeline.cpu.shift();
    timeline.ram.shift();
  }

  chartMetaEl.textContent = `Max points: ${MAX_POINTS} | current: ${timeline.labels.length}`;
};

const drawTimelineChart = () => {
  const ctx = timelineCanvas.getContext('2d');
  const rect = timelineCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  timelineCanvas.width = Math.floor(rect.width * dpr);
  timelineCanvas.height = Math.floor(rect.height * dpr);
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(31, 41, 55, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + (innerHeight / 5) * i;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(31, 41, 55, 0.75)';
  ctx.font = '12px Trebuchet MS';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i += 1) {
    const value = 100 - i * 20;
    const y = padding.top + (innerHeight / 5) * i;
    ctx.fillText(`${value}%`, padding.left - 6, y + 4);
  }

  const drawLine = (points, color) => {
    if (points.length < 2) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((point, index) => {
      const x = padding.left + (innerWidth / (points.length - 1)) * index;
      const y = padding.top + innerHeight - (innerHeight * clampPercent(point)) / 100;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  drawLine(timeline.cpu, '#0ea5e9');
  drawLine(timeline.ram, '#f97316');

  ctx.textAlign = 'left';
  ctx.font = '13px Trebuchet MS';
  ctx.fillStyle = '#0ea5e9';
  ctx.fillText('CPU Usage', padding.left, height - 8);
  ctx.fillStyle = '#f97316';
  ctx.fillText('Memory Usage', padding.left + 105, height - 8);
};

const loadData = async () => {
  const endpoint = endpointEl.value.trim();
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const payload = unwrapResponse(json);
    const cpuUsagePercent = calculateCpuUsagePercent(payload);
    const ramUsagePercent = clampPercent(payload.memory?.usagePercent);
    const pointLabel = new Date().toLocaleTimeString();

    pushTimelinePoint(pointLabel, cpuUsagePercent ?? 0, ramUsagePercent);
    drawTimelineChart();
    renderCards(payload, cpuUsagePercent);
    renderCronJobs(payload);
    connectionPillEl.textContent = 'Connected';

    const updatedAt = payload.timestamp
      ? new Date(payload.timestamp).toLocaleString()
      : new Date().toLocaleString();
    statusEl.className = 'status status-ok';
    statusEl.textContent = `Healthy - last updated at ${updatedAt}`;
  } catch (error) {
    connectionPillEl.textContent = 'Disconnected';
    statusEl.className = 'status status-warn';
    statusEl.textContent = `Unable to fetch metrics from ${endpoint}. Error: ${error.message}`;
  }
};

const startPolling = () => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  const interval = Number(refreshEl.value) || 5000;
  loadData();
  intervalId = setInterval(loadData, interval);
};

applyBtn.addEventListener('click', startPolling);
window.addEventListener('resize', drawTimelineChart);

(async () => {
  await detectEndpoint();
  startPolling();
})();
