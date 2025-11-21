import { UAParser } from 'ua-parser-js';

export interface ParsedUserAgent {
  device: string;
  browser: string;
  os: string;
}

const parser = new UAParser();

export function parseUserAgent(userAgent?: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { device: 'unknown', browser: 'Unknown', os: 'Unknown' };
  }

  parser.setUA(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  return {
    device: device.type || 'desktop',
    browser: browser.name || 'Unknown',
    os: os.name || 'Unknown',
  };
}
