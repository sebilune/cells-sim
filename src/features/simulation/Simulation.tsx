import { useEffect, useRef } from "react";

import createREGL from "regl";

import simulationStepFrag from "./shaders/simulationStep.frag.glsl?raw";
import simulationStepVert from "./shaders/simulationStep.vert.glsl?raw";
import renderParticlesFrag from "./shaders/renderParticles.frag.glsl?raw";
import renderParticlesVert from "./shaders/renderParticles.vert.glsl?raw";

import type { Config } from "@/types/simulation";

interface SimulationProps {
  onRandomizeRef?: (randomizeFn: () => void) => void;
  onResetRef?: (resetFn: () => void) => void;
  config: Config;
  setConfig: (config: Config) => void;
  onFpsUpdate?: (fps: number) => void;
}

export function Simulation({
  onRandomizeRef,
  onResetRef,
  config,
  setConfig,
  onFpsUpdate,
}: SimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<{
    regl: any;
    cleanup: () => void;
  } | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // Refs for rules and physics
  const rulesRef = useRef(config.rules);
  const physicsRef = useRef(config.physics);

  useEffect(() => {
    rulesRef.current = config.rules;
  }, [config.rules]);
  useEffect(() => {
    physicsRef.current = config.physics;
  }, [config.physics]);

  useEffect(() => {
    if (!canvasRef.current || !config) return;

    // If population is 0, skip simulation setup and clear canvas particles
    if (config.population === 0) {
      if (simulationRef.current) {
        simulationRef.current.cleanup();
        simulationRef.current = null;
      }

      // Clear the canvas with regl
      const canvas = canvasRef.current;
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
      return;
    }

    const canvas = canvasRef.current;

    // Track canvas size and aspect ratio
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
    let aspect = canvasWidth / canvasHeight;

    // Simulation state
    let camera = {
      x: 0.0,
      y: +0.012, // Slight top offset
      zoom: 0.8, // Initial zoom
      aspect: aspect, // Add aspect to camera
    };

    let mouseState = {
      isDragging: false,
      lastX: 0,
      lastY: 0,
    };

    const POPULATION = config.population;
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

    // Ensure canvas fills the container
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

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

        // Use refs for physics
        u_maxDistance: () => physicsRef.current.maxDistance,
        u_damping: () => physicsRef.current.damping,
        u_timeScale: () => physicsRef.current.timeScale,
        u_wallRepel: () => physicsRef.current.wallRepel,
        u_wallForce: () => physicsRef.current.wallForce,

        // Use refs for rules (6x6 matrix as vec3 uniforms, 6 types * 2 vec3 each)
        u_rules0a: () => [
          Number(rulesRef.current[0][0].toFixed(2)),
          Number(rulesRef.current[0][1].toFixed(2)),
          Number(rulesRef.current[0][2].toFixed(2)),
        ], // red -> rgb
        u_rules0b: () => [
          Number(rulesRef.current[0][3].toFixed(2)),
          Number(rulesRef.current[0][4].toFixed(2)),
          Number(rulesRef.current[0][5].toFixed(2)),
        ], // red -> ycm
        u_rules1a: () => [
          Number(rulesRef.current[1][0].toFixed(2)),
          Number(rulesRef.current[1][1].toFixed(2)),
          Number(rulesRef.current[1][2].toFixed(2)),
        ], // green -> rgb
        u_rules1b: () => [
          Number(rulesRef.current[1][3].toFixed(2)),
          Number(rulesRef.current[1][4].toFixed(2)),
          Number(rulesRef.current[1][5].toFixed(2)),
        ], // green -> ycm
        u_rules2a: () => [
          Number(rulesRef.current[2][0].toFixed(2)),
          Number(rulesRef.current[2][1].toFixed(2)),
          Number(rulesRef.current[2][2].toFixed(2)),
        ], // blue -> rgb
        u_rules2b: () => [
          Number(rulesRef.current[2][3].toFixed(2)),
          Number(rulesRef.current[2][4].toFixed(2)),
          Number(rulesRef.current[2][5].toFixed(2)),
        ], // blue -> ycm
        u_rules3a: () => [
          Number(rulesRef.current[3][0].toFixed(2)),
          Number(rulesRef.current[3][1].toFixed(2)),
          Number(rulesRef.current[3][2].toFixed(2)),
        ], // yellow -> rgb
        u_rules3b: () => [
          Number(rulesRef.current[3][3].toFixed(2)),
          Number(rulesRef.current[3][4].toFixed(2)),
          Number(rulesRef.current[3][5].toFixed(2)),
        ], // yellow -> ycm
        u_rules4a: () => [
          Number(rulesRef.current[4][0].toFixed(2)),
          Number(rulesRef.current[4][1].toFixed(2)),
          Number(rulesRef.current[4][2].toFixed(2)),
        ], // cyan -> rgb
        u_rules4b: () => [
          Number(rulesRef.current[4][3].toFixed(2)),
          Number(rulesRef.current[4][4].toFixed(2)),
          Number(rulesRef.current[4][5].toFixed(2)),
        ], // cyan -> ycm
        u_rules5a: () => [
          Number(rulesRef.current[5][0].toFixed(2)),
          Number(rulesRef.current[5][1].toFixed(2)),
          Number(rulesRef.current[5][2].toFixed(2)),
        ], // magenta -> rgb
        u_rules5b: () => [
          Number(rulesRef.current[5][3].toFixed(2)),
          Number(rulesRef.current[5][4].toFixed(2)),
          Number(rulesRef.current[5][5].toFixed(2)),
        ], // magenta -> ycm

        // Mouse interaction uniforms
        u_mouseRepel: () => physicsRef.current.mouseRepel,
        u_mouseRepelRadius: () => physicsRef.current.mouseRepel * 0.1,
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
        u_canvasSize: () => [canvas.width, canvas.height],
        u_aspect: () => aspect,
        u_particleSize: () => physicsRef.current.particleSize,
        u_camera: () => [camera.x, camera.y, camera.zoom, camera.aspect],

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
      const newRules = config.rules.map((row) =>
        row.map(() => Number(((Math.random() - 0.5) * 2).toFixed(2)))
      );
      setConfig({ ...config, rules: newRules });
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
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      // Undo camera transform: world = (screen / zoom) + camera
      mousePos.current.x = (ndcX * camera.aspect) / camera.zoom + camera.x;
      mousePos.current.y = ndcY / camera.zoom + camera.y;

      if (mouseState.isDragging) {
        const deltaX = event.clientX - mouseState.lastX;
        const deltaY = event.clientY - mouseState.lastY;
        const sensitivity = 0.002 / camera.zoom;
        camera.x -= deltaX * sensitivity;
        camera.y += deltaY * sensitivity;
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

    // Update on window resize
    const handleResize = () => {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      aspect = canvasWidth / canvasHeight;
      camera.aspect = aspect;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    };
    window.addEventListener("resize", handleResize);

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

    let lastFpsUpdate = performance.now();
    let frameCount = 0;
    let fps = 0;

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

      frameCount++;

      // Calculate FPS every 0.5 seconds
      const now = performance.now();
      if (now - lastFpsUpdate > 500) {
        // Frames per second over the last interval
        fps = (frameCount * 1000) / (now - lastFpsUpdate);
        // Report FPS to parent component (UI)
        if (onFpsUpdate) onFpsUpdate(Math.round(fps));
        // Reset timer and frame counter for next interval
        lastFpsUpdate = now;
        frameCount = 0;
      }

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
        window.removeEventListener("resize", handleResize);
        regl.destroy();
      },
    };

    return () => {
      if (simulationRef.current) {
        simulationRef.current.cleanup();
        simulationRef.current = null;
      }
    };
  }, [config.population, setConfig, onFpsUpdate]);

  return <canvas ref={canvasRef} className="bg-black" />;
}
