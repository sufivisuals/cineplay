import { Router, Request, Response } from 'express';

export const nleRouter = Router();

/**
 * Export Comments as DaVinci Resolve Marker CSV.
 */
nleRouter.get('/davinci/markers/:assetId', (_req: Request, res: Response): void => {
  const csvHeaders = 'Name,Description,In,Out,Duration,Color\n';
  const csvRow1 = '"Highlight Level Note","Pull down exposure -0.3 stops","00:00:04:00","00:00:04:01","00:00:00:01","Red"\n';
  const csvRow2 = '"Pacing Note","Hold reaction shot for 6 frames","00:00:15:00","00:00:15:01","00:00:00:01","Green"\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="davinci_markers.csv"');
  res.send(csvHeaders + csvRow1 + csvRow2);
});

/**
 * Export Comments as Premiere Pro FCP XML Markers.
 */
nleRouter.get('/premiere/markers/:assetId', (_req: Request, res: Response): void => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="4">
  <sequence>
    <name>CinePlay Markers Export</name>
    <marker>
      <name>Highlight Exposure</name>
      <comment>Pull down exposure by -0.3 stops</comment>
      <in>96</in>
      <out>97</out>
    </marker>
  </sequence>
</xmeml>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', 'attachment; filename="premiere_markers.xml"');
  res.send(xmlContent);
});
