<script>
    import { movementSpeed } from '../stores/animationStore';

    let speed = 0.02;

    function updateSpeed() {
        movementSpeed.set(speed);
    }
</script>

<div class="controls">
    <label>
        Movement Speed:
        <input type="range" min="0.001" max="0.1" step="0.001" bind:value={speed} on:input={updateSpeed}>
        {speed.toFixed(3)}
    </label>
</div>

<style>
    .controls {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        color: white;
        z-index: 100;
    }
</style>