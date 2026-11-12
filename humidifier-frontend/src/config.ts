const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const VITE_API_BASE_URL: string =
    rawBaseUrl && rawBaseUrl.length > 0
        ? rawBaseUrl.replace(/\/+$/, '')
        : 'http://localhost:3839';

export const VITE_API_KEY: string = import.meta.env.VITE_API_KEY?.trim() ?? '';

export const API_BASE_URL: string = VITE_API_BASE_URL;
export const API_KEY: string = VITE_API_KEY;
