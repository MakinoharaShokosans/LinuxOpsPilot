import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SreNetworkSurfaceView,
  SrePolarRadar240,
  SrePortMatrixTable,
  SreStorageGaugeStrip,
} from './SreNetworkStorageDial';

describe('SreNetworkStorageDial', () => {
  describe('SrePolarRadar240 & SrePortMatrixTable (Two-Way Linkage)', () => {
    it('renders 240px polar radar with 0~65535 axis labels and concentric rings', () => {
      render(<SrePolarRadar240 hoveredPortId={null} onHoverPort={() => {}} />);
      expect(screen.getByText('0 / 65535')).toBeDefined();
      expect(screen.getByText('16384')).toBeDefined();
      expect(screen.getByText('32768')).toBeDefined();
      expect(screen.getByText('49152')).toBeDefined();
      expect(screen.getByText(/0.0.0.0/)).toBeDefined();
      expect(screen.getByText(/127.0.0.1/)).toBeDefined();
      expect(screen.getByTestId('radar-port-22')).toBeDefined();
      expect(screen.getByTestId('radar-port-5432')).toBeDefined();
    });

    it('renders port matrix table with all required columns and items', () => {
      render(<SrePortMatrixTable hoveredPortId={null} onHoverPort={() => {}} />);
      expect(screen.getByText('PORT')).toBeDefined();
      expect(screen.getByText('PROTO')).toBeDefined();
      expect(screen.getByText('PROCESS (PID)')).toBeDefined();
      expect(screen.getByText('BIND_ADDR')).toBeDefined();
      expect(screen.getByText('RISK_LEVEL')).toBeDefined();

      expect(screen.getByText(':22')).toBeDefined();
      expect(screen.getByText(':5432')).toBeDefined();
      expect(screen.getByText(':1716')).toBeDefined();
      expect(screen.getAllByText('CRITICAL · 暴露').length).toBeGreaterThan(0);
      expect(screen.getAllByText('SECURE · 回环').length).toBeGreaterThan(0);
    });

    it('links hover from radar point to table row and vice versa in composite view', () => {
      render(<SreNetworkSurfaceView />);
      expect(screen.getByText('网络拓扑与端口暴露面大盘')).toBeDefined();

      // Hover over radar scatter point for port 1716 (danger)
      const radarPoint = screen.getByTestId('radar-port-1716');
      fireEvent.mouseEnter(radarPoint);

      // Radar active telemetry pill appears
      expect(screen.getByText(':1716 (kdeconnectd)')).toBeDefined();
      expect(screen.getByText('[CRITICAL · 暴露]')).toBeDefined();

      // Hover over table row for port 22
      const row22 = screen.getByTestId('port-row-22');
      fireEvent.mouseEnter(row22);

      // Parameter capsule updates to port 22
      expect(screen.getByText(':22 (sshd)')).toBeDefined();
      expect(screen.getByText('[WARN · 监听]')).toBeDefined();
    });
  });

  describe('SreStorageGaugeStrip', () => {
    it('renders storage pressure strip and shows rich Layer 3 GeometricTooltip on hover', async () => {
      render(<SreStorageGaugeStrip />);
      const diskStrip = screen.getByText('DISK:');
      expect(diskStrip).toBeDefined();
      expect(screen.getByText('/ 22%')).toBeDefined();
      expect(screen.getByText('/boot 47% (r=47%)')).toBeDefined();

      // Hover to trigger GeometricTooltip
      fireEvent.mouseEnter(diskStrip);
      expect(await screen.findByText('/ (btrfs):')).toBeDefined();
      expect(screen.getByText(/22% used · 128G free · Inode: 14%/)).toBeDefined();
      expect(screen.getByText('/boot (ext4):')).toBeDefined();
      expect(screen.getByText(/47% used · 480M free · Inode: 2%/)).toBeDefined();
      expect(screen.getByText('I/O Delta: Read 0 MB/s · Write 1.2 MB/s')).toBeDefined();
    });
  });
});
