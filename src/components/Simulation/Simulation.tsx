import { useEffect, useRef } from "react";
import createREGL from "regl";

import simulationStepFrag from "./shaders/simulationStep.frag.glsl?raw";
import simulationStepVert from "./shaders/simulationStep.vert.glsl?raw";
import renderParticlesFrag from "./shaders/renderParticles.frag.glsl?raw";
import renderParticlesVert from "./shaders/renderParticles.vert.glsl?raw";

interface SimulationProps {
  onRandomizeRef?: (randomizeFn: () => void) => void;
  onResetRef?: (resetFn: () => void) => void;
  attractionRules: number[][];
  setAttractionRules: (rules: number[][]) => void;
  config: {
    maxDistance: number;
    damping: number;
    timeScale: number;
    wallRepel: number;
    wallForce: number;
    particleSize: number;
    useProportionalScaling: boolean;
    refPopulation: number;
    scalingRatio: number;
    mouseRepel: boolean;
  };
  setConfig: (config: SimulationProps["config"]) => void;
}

export function Simulation({
  onRandomizeRef,
  onResetRef,
  attractionRules,
  setAttractionRules,
  config,
  setConfig,
}: SimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<{
    regl: any;
    cleanup: () => void;
  } | null>(null);
  const mousePos = useRef({ x: 0, y: 0 }); // Store mouse position in simulation

  useEffect(() => {
    if (!canvasRef.current || !config || !attractionRules) return;

    const canvas = canvasRef.current;

    // Simulation state
    let camera = {
      x: 0.0,
      y: +0.012, // Slight top offset
      zoom: 0.8, // Initial zoom
    };

    let mouseState = {
      isDragging: false,
      lastX: 0,
      lastY: 0,
    };

    const POPULATION = 10000;
    const PARTICLES_PER_TYPE = POPULATION / 6;
    const PARTICLE_TYPES = [
      { name: "red", color: [255 / 255, 80 / 255, 80 / 255] },
      { name: "green", color: [80 / 255, 255 / 255, 80 / 255] },
      { name: "blue", color: [80 / 255, 80 / 255, 255 / 255] },
      { name: "yellow", color: [255 / 255, 255 / 255, 80 / 255] },
      { name: "cyan", color: [80 / 255, 255 / 255, 255 / 255] },
      { name: "magenta", color: [255 / 255, 80 / 255, 255 / 255] },
    ];
    const PARTICLE_COUNT = PARTICLES_PER_TYPE * PARTICLE_TYPES.length;
    const PARTICLE_COUNT_SQRT = Math.ceil(Math.sqrt(PARTICLE_COUNT));
    const SIM_RES = PARTICLE_COUNT_SQRT;

    // Calculate proportional particle size based on population
    function getEffectiveParticleSize(): number {
      if (!config.useProportionalScaling) {
        return config.particleSize;
      }

      // Scale inversely with configurable ratio to keep visual density reasonable
      const populationRatio = config.refPopulation / POPULATION;
      const scaleFactor = Math.pow(populationRatio, config.scalingRatio);

      // Apply minimum size threshold to keep particles visible
      return Math.max(2.0, config.particleSize * scaleFactor);
    }

    // Ensure canvas fills the container
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create regl instance
    const regl = createREGL({
      canvas,
      extensions: ["OES_texture_float", "OES_texture_float_linear"],
    });

    // Create initial particle data with types randomly scattered
    function createInitialTextureData(size: number): Float32Array {
      const data = new Float32Array(size * size * 4);

      for (let i = 0; i < size * size; ++i) {
        const index = i * 4;

        // Completely random positions across the screen
        data[index] = Math.random() * 1.6 - 0.8;
        data[index + 1] = Math.random() * 1.6 - 0.8;

        // Start with zero velocity
        data[index + 2] = 0; // vx
        data[index + 3] = 0; // vy
      }
      return data;
    }

    // Create simulation framebuffers
    function createSimulationFBOs() {
      const textureOptions = {
        data: createInitialTextureData(SIM_RES),
        shape: [SIM_RES, SIM_RES] as [number, number],
        type: "float" as const,
        wrap: "clamp" as const,
        min: "nearest" as const,
        mag: "nearest" as const,
      };

      return [0, 1].map(() =>
        regl.framebuffer({
          color: regl.texture(textureOptions),
          depthStencil: false,
        })
      );
    }

    // Create particle types texture (static, doesn't change) - 6 types, 200 each
    function createParticleTypesTexture(): any {
      const data = new Float32Array(SIM_RES * SIM_RES * 4);

      for (let i = 0; i < SIM_RES * SIM_RES; ++i) {
        const index = i * 4;

        // Assign particle types: 200 of each type in order, then random for remainder
        let particleType;
        if (i < PARTICLE_COUNT) {
          particleType =
            Math.floor(i / PARTICLES_PER_TYPE) % PARTICLE_TYPES.length;
        } else {
          particleType = Math.floor(Math.random() * PARTICLE_TYPES.length);
        }

        // Store particle type in red channel (0-5)
        data[index] = particleType;
        data[index + 1] = 0;
        data[index + 2] = 0;
        data[index + 3] = 0;
      }

      return regl.texture({
        data,
        shape: [SIM_RES, SIM_RES] as [number, number],
        type: "float" as const,
        wrap: "clamp" as const,
        min: "nearest" as const,
        mag: "nearest" as const,
      });
    }

    const simulationFBOs = createSimulationFBOs();
    const particleTypesTexture = createParticleTypesTexture();
    let currentFrame = 0;

    // Simulation step shader - updates particle positions and velocities using particle-life rules
    const simulationStep = regl({
      frag: simulationStepFrag,
      vert: simulationStepVert,

      attributes: {
        a_position: [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ],
      },

      uniforms: {
        u_particles: () => simulationFBOs[currentFrame % 2],
        u_particleTypes: () => particleTypesTexture,
        u_resolution: [SIM_RES, SIM_RES],
        u_time: ({ tick }) => tick * 0.01,

        // Pass config values from props
        u_maxDistance: () => config.maxDistance,
        u_damping: () => config.damping,
        u_timeScale: () => config.timeScale,
        u_wallRepel: () => config.wallRepel,
        u_wallForce: () => config.wallForce,

        // Pass 6x6 rules matrix as 12 vec3 uniforms (6 types × 2 vec3 each)
        u_rules0a: () => [
          Number(attractionRules[0][0].toFixed(2)),
          Number(attractionRules[0][1].toFixed(2)),
          Number(attractionRules[0][2].toFixed(2)),
        ], // red->rgb
        u_rules0b: () => [
          Number(attractionRules[0][3].toFixed(2)),
          Number(attractionRules[0][4].toFixed(2)),
          Number(attractionRules[0][5].toFixed(2)),
        ], // red->ycm
        u_rules1a: () => [
          Number(attractionRules[1][0].toFixed(2)),
          Number(attractionRules[1][1].toFixed(2)),
          Number(attractionRules[1][2].toFixed(2)),
        ], // green->rgb
        u_rules1b: () => [
          Number(attractionRules[1][3].toFixed(2)),
          Number(attractionRules[1][4].toFixed(2)),
          Number(attractionRules[1][5].toFixed(2)),
        ], // green->ycm
        u_rules2a: () => [
          Number(attractionRules[2][0].toFixed(2)),
          Number(attractionRules[2][1].toFixed(2)),
          Number(attractionRules[2][2].toFixed(2)),
        ], // blue->rgb
        u_rules2b: () => [
          Number(attractionRules[2][3].toFixed(2)),
          Number(attractionRules[2][4].toFixed(2)),
          Number(attractionRules[2][5].toFixed(2)),
        ], // blue->ycm
        u_rules3a: () => [
          Number(attractionRules[3][0].toFixed(2)),
          Number(attractionRules[3][1].toFixed(2)),
          Number(attractionRules[3][2].toFixed(2)),
        ], // yellow->rgb
        u_rules3b: () => [
          Number(attractionRules[3][3].toFixed(2)),
          Number(attractionRules[3][4].toFixed(2)),
          Number(attractionRules[3][5].toFixed(2)),
        ], // yellow->ycm
        u_rules4a: () => [
          Number(attractionRules[4][0].toFixed(2)),
          Number(attractionRules[4][1].toFixed(2)),
          Number(attractionRules[4][2].toFixed(2)),
        ], // cyan->rgb
        u_rules4b: () => [
          Number(attractionRules[4][3].toFixed(2)),
          Number(attractionRules[4][4].toFixed(2)),
          Number(attractionRules[4][5].toFixed(2)),
        ], // cyan->ycm
        u_rules5a: () => [
          Number(attractionRules[5][0].toFixed(2)),
          Number(attractionRules[5][1].toFixed(2)),
          Number(attractionRules[5][2].toFixed(2)),
        ], // magenta->rgb
        u_rules5b: () => [
          Number(attractionRules[5][3].toFixed(2)),
          Number(attractionRules[5][4].toFixed(2)),
          Number(attractionRules[5][5].toFixed(2)),
        ], // magenta->ycm

        // New mouse interaction uniforms
        u_mouseRepel: () => (config.mouseRepel ? 1.0 : 0.0),
        u_mousePos: () => [mousePos.current.x, mousePos.current.y],
      },

      framebuffer: () => simulationFBOs[(currentFrame + 1) % 2],
      count: 6,
      viewport: { x: 0, y: 0, width: SIM_RES, height: SIM_RES },
    });

    // Create particle indices
    const particleIndices = new Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particleIndices[i] = i;
    }

    // Render particles shader
    const renderParticles = regl({
      vert: renderParticlesVert,
      frag: renderParticlesFrag,

      attributes: {
        a_index: particleIndices,
      },

      uniforms: {
        u_particles: () => simulationFBOs[(currentFrame + 1) % 2],
        u_particleTypes: () => particleTypesTexture,
        u_resolution: [SIM_RES, SIM_RES],
        u_screenSize: ({ viewportWidth, viewportHeight }) => [
          viewportWidth,
          viewportHeight,
        ],
        u_particleSize: () => getEffectiveParticleSize(),

        // Pass camera state
        u_camera: () => [camera.x, camera.y, camera.zoom],

        // Pass particle type colors
        u_color0: () => PARTICLE_TYPES[0].color,
        u_color1: () => PARTICLE_TYPES[1].color,
        u_color2: () => PARTICLE_TYPES[2].color,
        u_color3: () => PARTICLE_TYPES[3].color,
        u_color4: () => PARTICLE_TYPES[4].color,
        u_color5: () => PARTICLE_TYPES[5].color,
      },

      blend: {
        enable: true,
        func: {
          src: "one",
          dst: "one",
        },
        equation: {
          rgb: "add",
          alpha: "add",
        },
      },

      primitive: "points",
      count: PARTICLE_COUNT,
    });

    // Event handlers

    // Randomize attraction rules
    function randomizeRules() {
      const newRules = attractionRules.map((row) =>
        row.map(() => Number(((Math.random() - 0.5) * 2).toFixed(2)))
      );
      setAttractionRules(newRules);
      console.log("Rules randomized!", newRules);
    }

    // Reset simulation to initial state
    function resetSimulation() {
      // Recreate the simulation framebuffers with fresh initial data
      const newSimulationFBOs = createSimulationFBOs();

      // Clean up old framebuffers
      simulationFBOs[0].destroy();
      simulationFBOs[1].destroy();

      // Replace with new framebuffers
      simulationFBOs[0] = newSimulationFBOs[0];
      simulationFBOs[1] = newSimulationFBOs[1];

      // Reset frame counter
      currentFrame = 0;

      console.log("Simulation reset!");
    }

    // Mouse and wheel event handlers for camera control
    const handleMouseDown = (event: MouseEvent) => {
      mouseState.isDragging = true;
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
      canvas.style.cursor = "grabbing";
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Convert mouse position to simulation world coordinates
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      // Undo camera transform: world = (screen / zoom) + camera
      mousePos.current.x = ndcX / camera.zoom + camera.x;
      mousePos.current.y = ndcY / camera.zoom + camera.y;

      if (mouseState.isDragging) {
        const deltaX = event.clientX - mouseState.lastX;
        const deltaY = event.clientY - mouseState.lastY;

        // Convert screen delta to world coordinates
        const sensitivity = 0.002 / camera.zoom;
        camera.x -= deltaX * sensitivity;
        camera.y += deltaY * sensitivity; // Flip Y for screen coordinates

        mouseState.lastX = event.clientX;
        mouseState.lastY = event.clientY;
      }
    };

    const handleMouseUp = () => {
      mouseState.isDragging = false;
      canvas.style.cursor = "default";
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
      camera.zoom = Math.max(0.1, Math.min(10.0, camera.zoom * zoomFactor));
    };

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel);

    // Expose randomize function to parent component
    if (onRandomizeRef) {
      onRandomizeRef(randomizeRules);
    }
    if (onResetRef) {
      onResetRef(resetSimulation);
    }

    canvas.style.cursor = "default";

    // Main render loop
    const renderLoop = regl.frame(() => {
      regl.clear({
        color: [0, 0, 0, 1],
        depth: 1,
      });

      // Update particle simulation
      simulationStep();

      // Render particles to screen
      renderParticles();

      // Advance frame counter
      currentFrame++;
    });

    console.log(`Simulating ${PARTICLE_COUNT.toLocaleString()} particles`);

    // Store cleanup function
    simulationRef.current = {
      regl,
      cleanup: () => {
        renderLoop.cancel();
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("mouseleave", handleMouseUp);
        canvas.removeEventListener("wheel", handleWheel);
        regl.destroy();
      },
    };

    return () => {
      if (simulationRef.current) {
        simulationRef.current.cleanup();
        simulationRef.current = null;
      }
    };
  }, [attractionRules, config, setAttractionRules, setConfig]);

  return <canvas ref={canvasRef} className="" />;
}
