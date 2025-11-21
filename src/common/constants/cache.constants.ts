export const CACHE_KEYS = {
  PUBLIC_FORM: (id: string) => `public-form:${id}`,
} as const;

export const CACHE_TTL = {
  PUBLIC_FORM: 600, // 10 minutos
} as const;
