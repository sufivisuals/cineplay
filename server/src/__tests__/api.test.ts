import { expect, test, describe } from 'bun:test';

const API_URL = 'http://localhost:4000/api/v1';

describe('CinePlay Pro API Integration Tests', () => {
  test('GET /health returns healthy status', async () => {
    const res = await fetch('http://localhost:4000/health');
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  test('POST /assets/upload/initiate returns presigned chunk URLs', async () => {
    const res = await fetch(`${API_URL}/assets/upload/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'feature_cut.mp4',
        fileSize: 104857600,
        mimeType: 'video/mp4',
        chunkCount: 3,
      }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.chunkUrls.length).toBe(3);
  });

  test('GET /nle/davinci/markers/:id exports valid CSV timeline markers', async () => {
    const res = await fetch(`${API_URL}/nle/davinci/markers/demo-asset-1`);
    const csvText = await res.text();
    expect(res.status).toBe(200);
    expect(csvText).toContain('Name,Description,In,Out,Duration,Color');
    expect(csvText).toContain('Highlight Level Note');
  });

  test('GET /nle/premiere/markers/:id exports valid FCP XML sequence markers', async () => {
    const res = await fetch(`${API_URL}/nle/premiere/markers/demo-asset-1`);
    const xmlText = await res.text();
    expect(res.status).toBe(200);
    expect(xmlText).toContain('<?xml version="1.0"');
    expect(xmlText).toContain('<xmeml version="4">');
  });
});
