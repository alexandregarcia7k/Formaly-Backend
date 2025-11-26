interface IpApiResponse {
  status: string;
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  query?: string;
}

const cache = new Map<string, { data: string | null; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function getLocationFromIp(
  ip?: string | null,
): Promise<string | null> {
  if (!ip) {
    return null;
  }

  const cached = cache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,region,regionName,country`,
    );

    if (response.status === 429) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data: IpApiResponse = await response.json();

    if (data.status !== 'success') {
      return null;
    }

    const location = data.regionName || data.country || null;

    cache.set(ip, {
      data: location,
      expires: Date.now() + CACHE_TTL,
    });

    return location;
  } catch {
    return null;
  }
}
