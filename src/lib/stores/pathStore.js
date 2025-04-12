import { writable } from 'svelte/store';

export const pathPoints = writable([]);
export const currentPathIndex = writable(0);
export const isPathLoaded = writable(false);