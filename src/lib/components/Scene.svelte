<script>
    import { onMount } from 'svelte';
    import { pathPoints, isPathLoaded } from '../stores/pathStore';
    import Robot from './Robot.svelte';
    import PathModel from './PathModel.svelte';
    import PathVisualizer from './PathVisualizer.svelte';

    let scene, camera, renderer;
    let container;

    onMount(() => {
        // Three.js initialization
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            container.removeChild(renderer.domElement);
        };
    });
</script>

<div bind:this={container} class="scene-container">
    {#if $isPathLoaded}
        <Robot {scene} />
        <PathModel {scene} />
        <PathVisualizer {scene} />
    {/if}
</div>

<style>
    .scene-container {
        width: 100%;
        height: 100vh;
        position: relative;
    }
</style>