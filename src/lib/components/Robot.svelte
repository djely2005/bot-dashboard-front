<script>
    import { onMount, onDestroy } from 'svelte';
    import { currentPosition, currentTarget, animationState, animationSettings } from '../stores/animationStore';

    export let scene;

    let robotModel;
    let frameId;
    let lastTime = 0;

    onMount(async () => {
        const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
        const loader = new OBJLoader();

        loader.load('/models/robot.obj', (obj) => {
            robotModel = obj;
            robotModel.scale.set(0.1, 0.1, 0.1);
            scene.add(robotModel);

            // Start animation loop
            animate();
        });

        return () => {
            if (robotModel) scene.remove(robotModel);
            cancelAnimationFrame(frameId);
        };
    });

    function animate(time = 0) {
        frameId = requestAnimationFrame(animate);

        $animationState.update(state => {
            if (!state.isPlaying) return state;

            const deltaTime = (time - lastTime) / 1000;
            lastTime = time;

            let newProgress = state.progress + (state.speed * deltaTime);
            let newSegment = state.currentSegment;

            if (newProgress >= 1) {
                newProgress = state.loop ? 0 : 1;
                newSegment = 0;
            }

            // Update segment if needed
            const exactIndex = newProgress * ($pathPoints.length - 1);
            newSegment = Math.floor(exactIndex);

            return {
                ...state,
                progress: newProgress,
                currentSegment: newSegment
            };
        });

        // Update robot position and rotation
        if (robotModel && $currentPosition) {
            robotModel.position.copy($currentPosition);

            if ($animationSettings.rotateToPath && $currentTarget) {
                robotModel.lookAt($currentTarget);
            }
        }
    }
</script>

<!-- No template needed, all updates happen in animate() -->