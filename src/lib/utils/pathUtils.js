import { pathPoints } from '../stores/pathStore';

export function extractPathFromModel(model) {
    const points = [];
    model.traverse((child) => {
        if (child.isMesh) {
            const geometry = child.geometry;
            const positionAttribute = geometry.getAttribute('position');
            for (let i = 0; i < positionAttribute.count; i++) {
                points.push(new THREE.Vector3(
                    positionAttribute.getX(i),
                    positionAttribute.getY(i),
                    positionAttribute.getZ(i)
                ));
            }
        }
    });
    pathPoints.set(points);
    return points;
}

export function calculatePathLength(points) {
    return points.reduce((total, point, i) => {
        return i > 0 ? total + point.distanceTo(points[i-1]) : total;
    }, 0);
}