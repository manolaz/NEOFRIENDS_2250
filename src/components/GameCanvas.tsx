'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function GameCanvas() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [gardenScore, setGardenScore] = useState(0);
    const [activeMenu, setActiveMenu] = useState<string | null>(null); // State to track active menu
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle menu visibility

    // Function to toggle menu visibility
    const toggleMenu = (menuName: string | null) => {
        if (activeMenu === menuName) {
            setIsMenuOpen(!isMenuOpen);
        } else {
            setActiveMenu(menuName);
            setIsMenuOpen(true);
        }
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue background

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        camera.position.set(0, 10, 15);
        camera.lookAt(0, 0, 0);

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        // Add renderer to DOM
        canvasRef.current.appendChild(renderer.domElement);

        // Create the urban environment

        // Create ground plane (city block)
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.8,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Create empty lots (garden plots)
        const plots = [];
        const plotSize = 3;
        const plotGeometry = new THREE.PlaneGeometry(plotSize, plotSize);
        const emptyPlotMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 1 }); // Brown soil
        const plantedPlotMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7 }); // Green plants

        // Create a 3x3 grid of garden plots
        for (let x = -6; x <= 6; x += 6) {
            for (let z = -6; z <= 6; z += 6) {
                const plot = new THREE.Mesh(plotGeometry, emptyPlotMaterial);
                plot.position.set(x, 0.01, z);  // Slightly above ground to avoid z-fighting
                plot.rotation.x = -Math.PI / 2;
                plot.receiveShadow = true;
                plot.userData = { isPlanted: false, growthStage: 0, maxGrowth: 3 };
                scene.add(plot);
                plots.push(plot);
            }
        }

        // Add simple buildings around the plots
        const buildingGeometry = new THREE.BoxGeometry(2, 5, 2);
        const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA });

        const buildingPositions = [
            [-10, 2.5, -10], [10, 2.5, -10], [-10, 2.5, 10], [10, 2.5, 10]
        ];

        buildingPositions.forEach(pos => {
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(pos[0], pos[1], pos[2]);
            building.castShadow = true;
            scene.add(building);
        });

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);

        // Click handler for planting
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onClick = (event: MouseEvent) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            // Check for intersections with plots
            const intersects = raycaster.intersectObjects(plots);
            if (intersects.length > 0) {
                const plot = intersects[0].object;
                if (!plot.userData.isPlanted) {
                    // Plant the garden
                    plot.material = plantedPlotMaterial;
                    plot.userData.isPlanted = true;
                    setGardenScore(prev => prev + 10);

                    // Start growth cycle
                    plot.userData.growthInterval = setInterval(() => {
                        if (plot.userData.growthStage < plot.userData.maxGrowth) {
                            plot.userData.growthStage++;
                            // Make the color more vibrant as plants grow
                            const hue = 0.33; // Green hue
                            const saturation = 0.5 + (plot.userData.growthStage / plot.userData.maxGrowth) * 0.5;
                            const lightness = 0.3 + (plot.userData.growthStage / plot.userData.maxGrowth) * 0.2;
                            (plot.material as THREE.MeshStandardMaterial).color.setHSL(hue, saturation, lightness);

                            setGardenScore(prev => prev + 5);
                        } else {
                            clearInterval(plot.userData.growthInterval);
                        }
                    }, 3000); // Growth occurs every 3 seconds
                }
            }
        };

        window.addEventListener('click', onClick);

        // Handle window resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        animate();

        // Clean up on unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', onClick);

            // Clear all growth intervals
            plots.forEach(plot => {
                if (plot.userData.growthInterval) {
                    clearInterval(plot.userData.growthInterval);
                }
            });

            renderer.dispose();

            if (canvasRef.current) {
                canvasRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Component for menu button
    const MenuButton = ({ label, onClick, active }: { label: string, onClick: () => void, active: boolean }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg transition-all ${active
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
        >
            {label}
        </button>
    );

    // Menu content components
    const renderMenuContent = () => {
        if (!isMenuOpen) return null;

        switch (activeMenu) {
            case 'garden':
                return (
                    <div className="p-4 bg-white bg-opacity-90 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Garden Information</h3>
                        <p>Total Score: {gardenScore}</p>
                        <p>Gardens Planted: {Math.floor(gardenScore / 10)}</p>
                        <p>Growth Cycles: {Math.floor((gardenScore % 10) / 5)}</p>
                        <hr className="my-2" />
                        <p className="text-sm italic">Plant more gardens to increase your score!</p>
                    </div>
                );
            case 'inventory':
                return (
                    <div className="p-4 bg-white bg-opacity-90 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Inventory</h3>
                        <p>Seeds: Unlimited</p>
                        <p>Water: Unlimited</p>
                        <p>Fertilizer: 0 (Coming Soon)</p>
                        <hr className="my-2" />
                        <p className="text-sm italic">Visit the shop to purchase upgrades!</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-4 bg-white bg-opacity-90 rounded-lg shadow-lg">
                        <h3 className="text-lg font-bold mb-2">Game Settings</h3>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked className="form-checkbox" />
                                <span>Sound Effects</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" defaultChecked className="form-checkbox" />
                                <span>Music</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <span>Graphics Quality:</span>
                                <select className="form-select px-2 py-1 rounded">
                                    <option>Low</option>
                                    <option selected>Medium</option>
                                    <option>High</option>
                                </select>
                            </label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative w-full h-screen">
            <div
                ref={canvasRef}
                className="w-full h-screen"
                style={{ overflow: 'hidden' }}
            />

            {/* Score Display */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded">
                <h2 className="text-xl font-bold">Urban Garden Score: {gardenScore}</h2>
                <p className="text-sm">Click on empty lots to plant gardens!</p>
            </div>

            {/* Navigation Menu */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 p-2 rounded-full">
                <div className="flex space-x-2">
                    <MenuButton
                        label="Garden Info"
                        onClick={() => toggleMenu('garden')}
                        active={activeMenu === 'garden' && isMenuOpen}
                    />
                    <MenuButton
                        label="Inventory"
                        onClick={() => toggleMenu('inventory')}
                        active={activeMenu === 'inventory' && isMenuOpen}
                    />
                    <MenuButton
                        label="Settings"
                        onClick={() => toggleMenu('settings')}
                        active={activeMenu === 'settings' && isMenuOpen}
                    />
                </div>
            </div>

            {/* Menu Content */}
            {isMenuOpen && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 min-w-[300px]">
                    {renderMenuContent()}
                </div>
            )}

            {/* Help Button */}
            <button
                className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl"
                onClick={() => toggleMenu('help')}
            >
                ?
            </button>

            {/* Help Modal */}
            {activeMenu === 'help' && isMenuOpen && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold mb-4">How to Play</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Click on brown soil plots to plant gardens</li>
                        <li>Gardens will grow automatically over time</li>
                        <li>Your score increases as gardens grow</li>
                        <li>Create as many urban gardens as possible to maximize your score!</li>
                    </ul>
                    <button
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => toggleMenu(null)}
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}