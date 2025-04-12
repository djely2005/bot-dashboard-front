<script>
    import { onMount } from 'svelte';
    import { pathPoints, currentPathIndex } from '../stores/pathStore';
    import { tweened } from 'svelte/motion';

    export let scene;

    let robotModel;
    const position = tweened({ x: 0, y: 0, z: 0 }, { duration: 100 });
    const rotation = tweened({ x: 0, y: 0, z: 0 }, { duration: 100 });

    onMount(async () => {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
        const loader = new OBJLoader();

        loader.load('/models/robot.obj', (obj) => {
            robotModel = obj;
            robotModel.scale.set(0.1, 0.1, 0.1);
            scene.add(robotModel);

            // Subscribe to path updates
            const unsubscribe = pathPoints.subscribe(points => {
                if (points.length > 0) {
                    currentPathIndex.set(0);
                    updatePosition(points[0]);
                }
            });

            return () => {
                if (robotModel) scene.remove(robotModel);
                unsubscribe();
            };
        });
    });

    function updatePosition(point) {
        position.set({ x: point.x, y: point.y, z: point.z });
        // Rotation logic would go here
    }

    $: $pathPoints, $currentPathIndex, updatePosition($pathPoints[$currentPathIndex]);
</script>

<!-- Position updates are handled through the store -->