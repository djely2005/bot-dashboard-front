import { writable, derived } from 'svelte/store';
import { pathPoints, currentPathIndex } from './pathStore';

// Animation control store
export const animationState = writable({
    isPlaying: false,
    speed: 0.02,
    progress: 0, // 0-1 range
    loop: true,
    currentSegment: 0,
    totalDistance: 0
});

// Animation settings store
export const animationSettings = writable({
    smoothMovement: true,
    rotateToPath: true,
    rotationSpeed: 0.05,
    proximityThreshold: 0.5,
    showDebugPath: true
});

// Current position derived store
export const currentPosition = derived(
    [animationState, pathPoints],
    ([$animationState, $pathPoints]) => {
        if ($pathPoints.length === 0) return null;

        if ($animationState.smoothMovement) {
            return getSmoothPosition($pathPoints, $animationState.progress);
        } else {
            const index = Math.floor($animationState.progress * ($pathPoints.length - 1));
            return $pathPoints[index];
        }
    }
);

// Current target derived store
export const currentTarget = derived(
    [animationState, pathPoints],
    ([$animationState, $pathPoints]) => {
        if ($pathPoints.length === 0) return null;

        const nextIndex = ($animationState.currentSegment + 1) % $pathPoints.length;
        return $pathPoints[nextIndex];
    }
);

// Helper functions
function getSmoothPosition(points, progress) {
    if (points.length < 2) return points[0] || new THREE.Vector3();

    const exactIndex = progress * (points.length - 1);
    const index = Math.floor(exactIndex);
    const alpha = exactIndex % 1;

    const p1 = points[index];
    const p2 = points[Math.min(index + 1, points.length - 1)];

    return new THREE.Vector3().lerpVectors(p1, p2, alpha);
}

// Action creators
export const animationActions = {
    play: () => animationState.update(state => ({ ...state, isPlaying: true })),
    pause: () => animationState.update(state => ({ ...state, isPlaying: false })),
    togglePlay: () => animationState.update(state => ({ ...state, isPlaying: !state.isPlaying })),
    setSpeed: (speed) => animationState.update(state => ({ ...state, speed })),
    setProgress: (progress) => animationState.update(state => ({
        ...state,
        progress: Math.max(0, Math.min(1, progress))
    })),
    reset: () => animationState.update(state => ({
        ...state,
        progress: 0,
        currentSegment: 0
    })),
    calculatePathMetrics: (points) => {
        let totalDistance = 0;
        const segmentDistances = [];

        for (let i = 1; i < points.length; i++) {
            const dist = points[i].distanceTo(points[i-1]);
            segmentDistances.push(dist);
            totalDistance += dist;
        }

        animationState.update(state => ({
            ...state,
            totalDistance,
            segmentDistances
        }));
    }
};