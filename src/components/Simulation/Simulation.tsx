import { useEffect, useRef } from "react";
import createREGL from "regl";

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

    // Ensure canvas fills the container and wait for proper layout
    // Simple canvas setup - just set dimensions
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
      frag: `
        precision highp float;
        uniform sampler2D u_particles;
        uniform sampler2D u_particleTypes;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_maxDistance;
        uniform float u_damping;
        uniform float u_timeScale;
        uniform float u_wallRepel;
        uniform float u_wallForce;
        uniform vec3 u_rules0a; uniform vec3 u_rules0b;
        uniform vec3 u_rules1a; uniform vec3 u_rules1b;
        uniform vec3 u_rules2a; uniform vec3 u_rules2b;
        uniform vec3 u_rules3a; uniform vec3 u_rules3b;
        uniform vec3 u_rules4a; uniform vec3 u_rules4b;
        uniform vec3 u_rules5a; uniform vec3 u_rules5b;
        varying vec2 v_uv;
        
        float getRule(float typeA, float typeB) {
          if (typeA < 0.5) {
            if (typeB < 0.5) return u_rules0a.x;
            else if (typeB < 1.5) return u_rules0a.y;
            else if (typeB < 2.5) return u_rules0a.z;
            else if (typeB < 3.5) return u_rules0b.x;
            else if (typeB < 4.5) return u_rules0b.y;
            else return u_rules0b.z;
          }
          else if (typeA < 1.5) {
            if (typeB < 0.5) return u_rules1a.x;
            else if (typeB < 1.5) return u_rules1a.y;
            else if (typeB < 2.5) return u_rules1a.z;
            else if (typeB < 3.5) return u_rules1b.x;
            else if (typeB < 4.5) return u_rules1b.y;
            else return u_rules1b.z;
          }
          else if (typeA < 2.5) {
            if (typeB < 0.5) return u_rules2a.x;
            else if (typeB < 1.5) return u_rules2a.y;
            else if (typeB < 2.5) return u_rules2a.z;
            else if (typeB < 3.5) return u_rules2b.x;
            else if (typeB < 4.5) return u_rules2b.y;
            else return u_rules2b.z;
          }
          else if (typeA < 3.5) {
            if (typeB < 0.5) return u_rules3a.x;
            else if (typeB < 1.5) return u_rules3a.y;
            else if (typeB < 2.5) return u_rules3a.z;
            else if (typeB < 3.5) return u_rules3b.x;
            else if (typeB < 4.5) return u_rules3b.y;
            else return u_rules3b.z;
          }
          else if (typeA < 4.5) {
            if (typeB < 0.5) return u_rules4a.x;
            else if (typeB < 1.5) return u_rules4a.y;
            else if (typeB < 2.5) return u_rules4a.z;
            else if (typeB < 3.5) return u_rules4b.x;
            else if (typeB < 4.5) return u_rules4b.y;
            else return u_rules4b.z;
          }
          else {
            if (typeB < 0.5) return u_rules5a.x;
            else if (typeB < 1.5) return u_rules5a.y;
            else if (typeB < 2.5) return u_rules5a.z;
            else if (typeB < 3.5) return u_rules5b.x;
            else if (typeB < 4.5) return u_rules5b.y;
            else return u_rules5b.z;
          }
        }

        void main() {
          vec4 particle = texture2D(u_particles, v_uv);
          vec2 position = particle.xy;
          vec2 velocity = particle.zw;
          
          float particleType = texture2D(u_particleTypes, v_uv).r;
          
          vec2 force = vec2(0.0);
          
          const int range = 8;
          
          for (int x = -range; x <= range; x++) {
            for (int y = -range; y <= range; y++) {
              if (x == 0 && y == 0) continue;
              
              vec2 offset = vec2(float(x), float(y)) / u_resolution;
              vec2 neighborUV = v_uv + offset;
              
              if (neighborUV.x < 0.0 || neighborUV.x > 1.0 || 
                  neighborUV.y < 0.0 || neighborUV.y > 1.0) continue;
                  
              vec4 neighborParticle = texture2D(u_particles, neighborUV);
              vec2 neighborPos = neighborParticle.xy;
              
              vec2 diff = neighborPos - position;
              float dist = length(diff);
              
              if (dist > 0.001 && dist < u_maxDistance) {
                float neighborType = texture2D(u_particleTypes, neighborUV).r;
                float attraction = getRule(particleType, neighborType);
                float F = attraction / dist;
                force += diff * F * 0.001;
              }
            }
          }
          
          velocity = (velocity + force) * u_damping;
          position += velocity * u_timeScale;
          
          if (position.x <= -1.0 + u_wallRepel) {
            velocity.x += (-1.0 + u_wallRepel - position.x) * u_wallForce;
          }
          if (position.x >= 1.0 - u_wallRepel) {
            velocity.x -= (position.x - (1.0 - u_wallRepel)) * u_wallForce;
          }
          if (position.y <= -1.0 + u_wallRepel) {
            velocity.y += (-1.0 + u_wallRepel - position.y) * u_wallForce;
          }
          if (position.y >= 1.0 - u_wallRepel) {
            velocity.y -= (position.y - (1.0 - u_wallRepel)) * u_wallForce;
          }

          gl_FragColor = vec4(position, velocity);
        }
      `,

      vert: `
        precision highp float;
        attribute vec2 a_position;
        varying vec2 v_uv;
        
        void main() {
          v_uv = 0.5 * (a_position + 1.0);
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `,

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
          attractionRules[0][0],
          attractionRules[0][1],
          attractionRules[0][2],
        ], // red->rgb
        u_rules0b: () => [
          attractionRules[0][3],
          attractionRules[0][4],
          attractionRules[0][5],
        ], // red->ycm
        u_rules1a: () => [
          attractionRules[1][0],
          attractionRules[1][1],
          attractionRules[1][2],
        ], // green->rgb
        u_rules1b: () => [
          attractionRules[1][3],
          attractionRules[1][4],
          attractionRules[1][5],
        ], // green->ycm
        u_rules2a: () => [
          attractionRules[2][0],
          attractionRules[2][1],
          attractionRules[2][2],
        ], // blue->rgb
        u_rules2b: () => [
          attractionRules[2][3],
          attractionRules[2][4],
          attractionRules[2][5],
        ], // blue->ycm
        u_rules3a: () => [
          attractionRules[3][0],
          attractionRules[3][1],
          attractionRules[3][2],
        ], // yellow->rgb
        u_rules3b: () => [
          attractionRules[3][3],
          attractionRules[3][4],
          attractionRules[3][5],
        ], // yellow->ycm
        u_rules4a: () => [
          attractionRules[4][0],
          attractionRules[4][1],
          attractionRules[4][2],
        ], // cyan->rgb
        u_rules4b: () => [
          attractionRules[4][3],
          attractionRules[4][4],
          attractionRules[4][5],
        ], // cyan->ycm
        u_rules5a: () => [
          attractionRules[5][0],
          attractionRules[5][1],
          attractionRules[5][2],
        ], // magenta->rgb
        u_rules5b: () => [
          attractionRules[5][3],
          attractionRules[5][4],
          attractionRules[5][5],
        ], // magenta->ycm
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
      vert: `
        precision highp float;
        uniform sampler2D u_particles;
        uniform sampler2D u_particleTypes;
        uniform vec2 u_resolution;
        uniform vec2 u_screenSize;
        uniform float u_particleSize;
        uniform vec3 u_camera;
        attribute float a_index;
        varying float v_particleType;

        void main() {
          float x = mod(a_index, u_resolution.x);
          float y = floor(a_index / u_resolution.x);
          vec2 uv = (vec2(x, y) + 0.5) / u_resolution;
          
          vec4 particle = texture2D(u_particles, uv);
          vec2 position = particle.xy;
          float particleType = texture2D(u_particleTypes, uv).r;
          
          v_particleType = particleType;
          
          vec2 worldPos = (position - u_camera.xy) * u_camera.z;
          
          gl_PointSize = u_particleSize * u_camera.z;
          gl_Position = vec4(worldPos, 0.0, 1.0);
        }
      `,

      frag: `
        precision highp float;
        varying float v_particleType;
        
        uniform vec3 u_color0; uniform vec3 u_color1; uniform vec3 u_color2;
        uniform vec3 u_color3; uniform vec3 u_color4; uniform vec3 u_color5;
        
        vec3 getColor(float particleType) {
          if (particleType < 0.5) return u_color0;
          else if (particleType < 1.5) return u_color1;
          else if (particleType < 2.5) return u_color2;
          else if (particleType < 3.5) return u_color3;
          else if (particleType < 4.5) return u_color4;
          else return u_color5;
        }
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(gl_PointCoord, center);
          
          float radius = 0.4;
          float outlineWidth = 0.05;
          
          if (dist > radius) discard;
          
          vec3 color;
          if (dist > radius - outlineWidth) {
            color = vec3(1.0, 1.0, 1.0);
          } else {
            color = getColor(v_particleType);
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,

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
          src: "src alpha",
          dst: "one minus src alpha",
        },
      },

      primitive: "points",
      count: PARTICLE_COUNT,
    });

    // Event handlers

    // Randomize attraction rules
    function randomizeRules() {
      const newRules = attractionRules.map((row) =>
        row.map(() => (Math.random() - 0.5) * 2)
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "r" || event.key === "R") {
        randomizeRules();
      }
    };

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel);
    document.addEventListener("keydown", handleKeyDown);

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
        document.removeEventListener("keydown", handleKeyDown);
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
