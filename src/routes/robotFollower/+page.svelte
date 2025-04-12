// src/routes/RobotPathAnimation.svelte

<script>
    import { onMount } from 'svelte';
    import * as THREE from 'three';
    import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
    import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    let container;
    let scene, camera, renderer, controls;
    let robot, floor;
    let clock;

    // Path information
    let pathPoints = [];
    let currentPathIndex = 0;
    let robotSpeed = 0.005; // Adjust for desired speed
    let robotRotationSpeed = 0.1;

    onMount(() => {
        initScene();
        animate();

        // Clean up on component unmount
        return () => {
            if (renderer) {
                renderer.dispose();
            }
        };
    });

    function initScene() {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // Set up lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(5, 5, 5);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Clock for animations
        clock = new THREE.Clock();

        // Load models
        loadModels();

        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }

    function loadModels() {
        // Load robot model using OBJ
        loadRobotModel();

        // Load floor model using OBJ
        loadFloorModel();

        // Create a temporary floor and path while models load
        createTemporaryFloorWithPath();
    }

    function loadRobotModel() {
        const mtlLoader = new MTLLoader();

        // First load materials if available
        // Replace '../../lib/3D/robot.mtl' with your actual MTL file path
        // You can remove this part if you don't have material files
        mtlLoader.load('/src/lib/3D/robot.mtl', (materials) => {
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);

                // Load robot OBJ
                // Replace '../../lib/3D/robot.obj' with your actual OBJ file path
                objLoader.load('/src/lib/3D/robot.obj', (object) => {
                        robot = object;

                        // Position adjustments - modify these based on your model
                        robot.position.y = 0.25; // Adjust to place on floor

                        // Make sure the robot casts shadows
                        robot.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        robot.rota

                        scene.add(robot);

                        // If the temporary cube exists, remove it
                        const tempRobot = scene.getObjectByName('tempRobot');
                        if (tempRobot) scene.remove(tempRobot);
                    },
                    // Progress callback
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% robot model loaded');
                    },
                    // Error callback
                    (error) => {
                        console.error('Error loading robot model', error);

                        // Create a fallback cube if model fails to load
                        createTemporaryRobot();
                    });
            },
            undefined,
            // Error callback for MTL loading
            (error) => {
                console.error('Error loading robot materials', error);

                // Try loading the OBJ without materials
                const objLoader = new OBJLoader();
                objLoader.load('/src/lib/3D/robot.obj', (object) => {
                        robot = object;
                        robot.scale.set(1, 1, 1);
                        robot.position.y = 115;
                        robot.rotation.set(0, 0, -Math.PI / 2);
                        robot.traverse((child) => {
                            if (child.isMesh) {
                                child.material = new THREE.MeshStandardMaterial({ color: 0x2194ce });
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });

                        scene.add(robot);

                        const tempRobot = scene.getObjectByName('tempRobot');
                        if (tempRobot) scene.remove(tempRobot);
                    },
                    undefined,
                    () => {
                        createTemporaryRobot();
                    });
            });
    }

    function loadFloorModel() {
        const mtlLoader = new MTLLoader();

        const axesHelper = new THREE.AxesHelper( 2 );
        scene.add( axesHelper );
        // First load materials if available
        mtlLoader.load('/src/lib/3D/map.mtl', (materials) => {
                materials.preload();

                const objLoader = new OBJLoader();
                objLoader.setMaterials(materials);

                // Load floor OBJ
                objLoader.load('/src/lib/3D/map.obj', (object) => {
                        floor = object;

                        // Position adjustments
                        floor.scale.set(1, 1, 1); // Adjust scale as needed

                        // Make sure the floor receives shadows
                        floor.traverse((child) => {
                            if (child.isMesh) {
                                child.receiveShadow = true;
                            }
                        });

                        scene.add(floor);

                        // Remove temporary floor
                        const tempFloor = scene.getObjectByName('tempFloor');
                        if (tempFloor) scene.remove(tempFloor);

                        // Extract path from the floor model
                        extractPathFromFloor();
                    },
                    // Progress callback
                    (xhr) => {
                        console.log((xhr.loaded / xhr.total * 100) + '% floor model loaded');
                    },
                    // Error callback
                    (error) => {
                        console.error('Error loading floor model', error);
                    });
            },
            undefined,
            // Error callback for MTL loading
            (error) => {
                console.error('Error loading floor materials', error);

                // Try loading the OBJ without materials
                const objLoader = new OBJLoader();
                objLoader.load('/src/lib/3D/map.obj', (object) => {
                    floor = object;

                    floor.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshStandardMaterial({ color: 0x999999 });
                            child.receiveShadow = true;
                        }
                    });

                    scene.add(floor);

                    const tempFloor = scene.getObjectByName('tempFloor');
                    if (tempFloor) scene.remove(tempFloor);

                    extractPathFromFloor();
                });
            });
    }

    function createTemporaryRobot() {
        // Create temporary robot placeholder
        const robotGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const robotMaterial = new THREE.MeshStandardMaterial({ color: 0x2194ce });
        const tempRobot = new THREE.Mesh(robotGeometry, robotMaterial);
        tempRobot.name = 'tempRobot';
        tempRobot.castShadow = true;
        tempRobot.position.y = 0.25;
        scene.add(tempRobot);

        // Use this as the robot until the actual model loads
        robot = tempRobot;
    }

    function createTemporaryFloorWithPath() {
        // Create temporary floor placeholder
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            side: THREE.DoubleSide
        });
        const tempFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        tempFloor.name = 'tempFloor';
        tempFloor.rotation.x = -Math.PI / 2;
        tempFloor.receiveShadow = true;
        scene.add(tempFloor);

        // Create a default path (simple square path)
        pathPoints = [
            new THREE.Vector3(-3, 0, -3),
            new THREE.Vector3(-3, 0, 3),
            new THREE.Vector3(3, 0, 3),
            new THREE.Vector3(3, 0, -3),
            new THREE.Vector3(-3, 0, -3) // Close the loop
        ];

        // Visualize the path
        visualizePath();
    }

    function visualizePath() {
        // Remove any existing path visualization
        const existingPath = scene.getObjectByName('pathLine');
        if (existingPath) scene.remove(existingPath);

        // Create new path visualization
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const pathLine = new THREE.Line(pathGeometry, pathMaterial);
        pathLine.name = 'pathLine';
        scene.add(pathLine);
    }

    // Extract path from floor model
    function extractPathFromFloor() {
        // This function would extract the path from your floor model
        // The implementation depends on how your floor model is structured

        // Method 1: If the path is a specific child object in the OBJ
        floor.traverse((child) => {
            if (child.name === 'path' || child.name.includes('path')) {
                if (child.geometry) {
                    const positions = child.geometry.attributes.position;
                    pathPoints = [];

                    for (let i = 0; i < positions.count; i++) {
                        pathPoints.push(new THREE.Vector3(
                            positions.getX(i),
                            positions.getY(i),
                            positions.getZ(i)
                        ));
                    }

                    // Filter segments where movement is along only one axis
                    const filteredPathPoints = [];
                    if (pathPoints.length > 0) {
                        filteredPathPoints.push(pathPoints[0]);
                    }

                    for (let i = 1; i < pathPoints.length; i++) {
                        const prev = filteredPathPoints[filteredPathPoints.length - 1];
                        const current = pathPoints[i];

                        const dx = prev.x !== current.x;
                        const dy = prev.y !== current.y;
                        const dz = prev.z !== current.z;

                        const changedAxes = [dx, dy, dz].filter(Boolean).length;

                        // Only add the current point if movement is along a single axis
                        if (changedAxes === 1) {
                            filteredPathPoints.push(current);
                        }
                        // Otherwise skip this point (it moves along multiple axes)
                    }

                    console.log(filteredPathPoints);

                    // Replace pathPoints with filtered one for visualization
                    pathPoints = filteredPathPoints;
                    visualizePath();
                }
            }
        });


        // Method 2: If the path is represented by a specific material or texture
        // This is just a placeholder example, modify based on your model structure
        floor.traverse((child) => {
            if (child.isMesh && child.material && child.material.name === 'PathMaterial') {
                // Found mesh with path material
                // Extract geometry or vertices as needed
            }
        });

        // If no path was found, keep using the default path
    }

    function moveRobotAlongPath() {
        if (!robot || pathPoints.length === 0) return;

        const currentPoint = pathPoints[currentPathIndex];
        const nextPointIndex = (currentPathIndex + 1) % pathPoints.length;
        const nextPoint = pathPoints[nextPointIndex];

        // Calculate direction to the next point
        const direction = new THREE.Vector3()
            .subVectors(nextPoint, currentPoint)
            .normalize();

        // Current position of the robot
        const currentPosition = robot.position.clone();

        // Calculate distance to the next point
        const distanceToNextPoint = currentPosition.distanceTo(nextPoint);

        if (distanceToNextPoint < 0.1) {
            // Move to the next point in the path
            currentPathIndex = nextPointIndex;
        } else {
            // Move robot toward the next point
            robot.position.add(direction.multiplyScalar(robotSpeed));

            // Rotate robot to face the direction of movement
            if (direction.length() > 0) {
                const targetRotation = Math.atan2(direction.x, direction.y);
                // Smoothly rotate towards the target rotation
                let currentRotation = robot.rotation.y;
                const delta = targetRotation - currentRotation;

                // Handle the -PI to PI transition
                let rotationDelta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
                if (rotationDelta < -Math.PI) rotationDelta += Math.PI * 2;

                robot.rotation.y += rotationDelta * robotRotationSpeed;
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        // Update controls
        controls.update();

        // Update robot position along the path
        moveRobotAlongPath();

        // Update clock
        const delta = clock.getDelta();

        // Render scene
        renderer.render(scene, camera);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
</script>

<div bind:this={container} class="container"></div>

<style>
    .container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
</style>>