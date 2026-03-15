import { Injectable } from '@nestjs/common';
import * as os from 'os';

import { getSystemLogsCount, readSystemLogs } from './system-log.store';

@Injectable()
export class SystemService {
  getLogs(limit = 200) {
    return {
      items: readSystemLogs(limit),
      total: getSystemLogsCount(),
    };
  }

  getMetrics() {
    const cpuInfo = os.cpus();
    const processMemory = process.memoryUsage();
    const cpuTimes = cpuInfo.reduce(
      (acc, cpu) => {
        acc.user += cpu.times.user;
        acc.nice += cpu.times.nice;
        acc.sys += cpu.times.sys;
        acc.idle += cpu.times.idle;
        acc.irq += cpu.times.irq;
        return acc;
      },
      { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
    );
    const cpuTotalTicks =
      cpuTimes.user +
      cpuTimes.nice +
      cpuTimes.sys +
      cpuTimes.idle +
      cpuTimes.irq;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      timestamp: new Date().toISOString(),
      runtime: {
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
        nodeVersion: process.version,
        uptimeSeconds: process.uptime(),
      },
      host: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptimeSeconds: os.uptime(),
      },
      cpu: {
        model: cpuInfo[0]?.model || 'Unknown CPU',
        cores: cpuInfo.length,
        loadAverage: os.loadavg(),
        ticks: {
          idle: cpuTimes.idle,
          total: cpuTotalTicks,
        },
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: totalMemory > 0 ? Number(((usedMemory / totalMemory) * 100).toFixed(2)) : 0,
        process: {
          rss: processMemory.rss,
          heapTotal: processMemory.heapTotal,
          heapUsed: processMemory.heapUsed,
          external: processMemory.external,
          arrayBuffers: processMemory.arrayBuffers,
        },
      },
    };
  }
}
