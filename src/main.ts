import createREGL from "regl";

let camera = {
  x: 0.0,
  y: 0.0,
  zoom: 1.0,
};

let mouseState = {
  isDragging: false,
  lastX: 0,
  lastY: 0,
};

const POPULATION = 10000;
const PARTICLES_PER_TYPE = POPULATION / 6;
const PARTICLE_TYPES = [
  { name: "red", color: [255 / 255, 80 / 255, 80 / 255] }, // [1.0, 0.314, 0.314]
  { name: "green", color: [80 / 255, 255 / 255, 80 / 255] }, // [0.314, 1.0, 0.314]
  { name: "blue", color: [80 / 255, 80 / 255, 255 / 255] }, // [0.314, 0.314, 1.0]
  { name: "yellow", color: [255 / 255, 255 / 255, 80 / 255] }, // [1.0, 1.0, 0.314]
  { name: "cyan", color: [80 / 255, 255 / 255, 255 / 255] }, // [0.314, 1.0, 1.0]
  { name: "magenta", color: [255 / 255, 80 / 255, 255 / 255] }, // [1.0, 0.314, 1.0]
];
const PARTICLE_COUNT = PARTICLES_PER_TYPE * PARTICLE_TYPES.length; // 6000 total
const PARTICLE_COUNT_SQRT = Math.ceil(Math.sqrt(PARTICLE_COUNT)); // ~78x78 grid
const SIM_RES = PARTICLE_COUNT_SQRT;

// 36 interaction rules (6x6 matrix)
let ATTRACTION_RULES = [
  [-0.32, -0.17, 0.34, 0.15, -0.1, 0.2], // red interactions
  [-0.34, -0.1, -0.2, 0.15, 0.25, -0.15], // green interactions
  [0.15, -0.2, 0.34, -0.17, 0.1, -0.25], // blue interactions
  [-0.17, 0.15, -0.32, -0.1, -0.2, 0.3], // yellow interactions
  [-0.1, 0.25, 0.1, -0.2, 0.15, -0.3], // cyan interactions
  [0.2, -0.15, -0.25, 0.3, -0.3, 0.1], // magenta interactions
];

const CONFIG = {
  maxDistance: 0.25, // Interaction radius in normalized space
  damping: 0.2, // Velocity damping
  timeScale: 10.0, // Simulation speed
  wallRepel: 0.125, // Buffer zone in normalized space
  wallForce: 0.01, // Wall repulsion strength
  particleSize: 10.0, // Base particle size
  useProportionalScaling: true,
  refPopulation: 1200, // Reference population for scaling ratio
  scalingRatio: 0.5, // 0.5 = sqrt, 1.0 = linear, 0.25 = gentler
};

// Calculate proportional particle size based on population
function getEffectiveParticleSize(): number {
  if (!CONFIG.useProportionalScaling) {
    return CONFIG.particleSize;
  }

  // Scale inversely with configurable ratio to keep visual density reasonable
  const populationRatio = CONFIG.refPopulation / POPULATION;
  const scaleFactor = Math.pow(populationRatio, CONFIG.scalingRatio);

  // Apply minimum size threshold to keep particles visible
  return Math.max(2.0, CONFIG.particleSize * scaleFactor);
}

// Get canvas element
const canvas =
  document.querySelector("canvas") || document.createElement("canvas");
if (!document.querySelector("canvas")) {
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "-1";
}

// Create regl instance
const regl = createREGL({
  canvas,
  extensions: ["OES_texture_float", "OES_texture_float_linear"],
});

// Check if extensions are available
const hasFloatTextures = regl.hasExtension("OES_texture_float");
console.log("Float textures supported:", hasFloatTextures);

// Utility to create initial particle data with types randomly scattered
function createInitialTextureData(size: number): Float32Array {
  const data = new Float32Array(size * size * 4);

  for (let i = 0; i < size * size; ++i) {
    const index = i * 4;

    // Completely random positions across the screen
    data[index] = Math.random() * 1.6 - 0.8; // x: random in [-0.8, 0.8]
    data[index + 1] = Math.random() * 1.6 - 0.8; // y: random in [-0.8, 0.8]

    // Start with zero velocity
    data[index + 2] = 0; // vx
    data[index + 3] = 0; // vy
  }
  return data;
}

// Create ping-pong framebuffers for simulation + particle types texture
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
      particleType = Math.floor(i / PARTICLES_PER_TYPE) % PARTICLE_TYPES.length;
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

// Simulation step - updates particle positions and velocities using particle-life rules
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
    // 6x6 rules matrix passed as 6 vec6 uniforms
    uniform vec3 u_rules0a; // red rules: red->red, red->green, red->blue
    uniform vec3 u_rules0b; // red rules: red->yellow, red->cyan, red->magenta
    uniform vec3 u_rules1a; // green rules: green->red, green->green, green->blue  
    uniform vec3 u_rules1b; // green rules: green->yellow, green->cyan, green->magenta
    uniform vec3 u_rules2a; // blue rules: blue->red, blue->green, blue->blue
    uniform vec3 u_rules2b; // blue rules: blue->yellow, blue->cyan, blue->magenta
    uniform vec3 u_rules3a; // yellow rules: yellow->red, yellow->green, yellow->blue
    uniform vec3 u_rules3b; // yellow rules: yellow->yellow, yellow->cyan, yellow->magenta
    uniform vec3 u_rules4a; // cyan rules: cyan->red, cyan->green, cyan->blue
    uniform vec3 u_rules4b; // cyan rules: cyan->yellow, cyan->cyan, cyan->magenta
    uniform vec3 u_rules5a; // magenta rules: magenta->red, magenta->green, magenta->blue
    uniform vec3 u_rules5b; // magenta rules: magenta->yellow, magenta->cyan, magenta->magenta
    varying vec2 v_uv;
    
    // Helper function to get attraction rule between two particle types (6x6 matrix)
    float getRule(float typeA, float typeB) {
      // Handle all 6 particle types
      if (typeA < 0.5) { // red (0)
        if (typeB < 0.5) return u_rules0a.x;      // red -> red
        else if (typeB < 1.5) return u_rules0a.y; // red -> green
        else if (typeB < 2.5) return u_rules0a.z; // red -> blue
        else if (typeB < 3.5) return u_rules0b.x; // red -> yellow
        else if (typeB < 4.5) return u_rules0b.y; // red -> cyan
        else return u_rules0b.z;                  // red -> magenta
      }
      else if (typeA < 1.5) { // green (1)
        if (typeB < 0.5) return u_rules1a.x;      // green -> red
        else if (typeB < 1.5) return u_rules1a.y; // green -> green
        else if (typeB < 2.5) return u_rules1a.z; // green -> blue
        else if (typeB < 3.5) return u_rules1b.x; // green -> yellow
        else if (typeB < 4.5) return u_rules1b.y; // green -> cyan
        else return u_rules1b.z;                  // green -> magenta
      }
      else if (typeA < 2.5) { // blue (2)
        if (typeB < 0.5) return u_rules2a.x;      // blue -> red
        else if (typeB < 1.5) return u_rules2a.y; // blue -> green
        else if (typeB < 2.5) return u_rules2a.z; // blue -> blue
        else if (typeB < 3.5) return u_rules2b.x; // blue -> yellow
        else if (typeB < 4.5) return u_rules2b.y; // blue -> cyan
        else return u_rules2b.z;                  // blue -> magenta
      }
      else if (typeA < 3.5) { // yellow (3)
        if (typeB < 0.5) return u_rules3a.x;      // yellow -> red
        else if (typeB < 1.5) return u_rules3a.y; // yellow -> green
        else if (typeB < 2.5) return u_rules3a.z; // yellow -> blue
        else if (typeB < 3.5) return u_rules3b.x; // yellow -> yellow
        else if (typeB < 4.5) return u_rules3b.y; // yellow -> cyan
        else return u_rules3b.z;                  // yellow -> magenta
      }
      else if (typeA < 4.5) { // cyan (4)
        if (typeB < 0.5) return u_rules4a.x;      // cyan -> red
        else if (typeB < 1.5) return u_rules4a.y; // cyan -> green
        else if (typeB < 2.5) return u_rules4a.z; // cyan -> blue
        else if (typeB < 3.5) return u_rules4b.x; // cyan -> yellow
        else if (typeB < 4.5) return u_rules4b.y; // cyan -> cyan
        else return u_rules4b.z;                  // cyan -> magenta
      }
      else { // magenta (5)
        if (typeB < 0.5) return u_rules5a.x;      // magenta -> red
        else if (typeB < 1.5) return u_rules5a.y; // magenta -> green
        else if (typeB < 2.5) return u_rules5a.z; // magenta -> blue
        else if (typeB < 3.5) return u_rules5b.x; // magenta -> yellow
        else if (typeB < 4.5) return u_rules5b.y; // magenta -> cyan
        else return u_rules5b.z;                  // magenta -> magenta
      }
    }

    void main() {
      vec4 particle = texture2D(u_particles, v_uv);
      vec2 position = particle.xy;
      vec2 velocity = particle.zw;
      
      // Get current particle type
      float particleType = texture2D(u_particleTypes, v_uv).r;
      
      vec2 force = vec2(0.0);
      
      // Sample neighborhood in a larger grid pattern for 100-pixel interaction range
      const int range = 8; // Check 16x16 neighborhood for wider interactions
      
      for (int x = -range; x <= range; x++) {
        for (int y = -range; y <= range; y++) {
          if (x == 0 && y == 0) continue;
          
          vec2 offset = vec2(float(x), float(y)) / u_resolution;
          vec2 neighborUV = v_uv + offset;
          
          // Skip if outside texture bounds
          if (neighborUV.x < 0.0 || neighborUV.x > 1.0 || 
              neighborUV.y < 0.0 || neighborUV.y > 1.0) continue;
              
          vec4 neighborParticle = texture2D(u_particles, neighborUV);
          vec2 neighborPos = neighborParticle.xy;
          
          vec2 diff = neighborPos - position;
          float dist = length(diff);
          
          // Only interact if within max distance (100 pixels in normalized space)
          if (dist > 0.001 && dist < u_maxDistance) {
            float neighborType = texture2D(u_particleTypes, neighborUV).r;
            
            // Get attraction rule for this particle type pair
            float attraction = getRule(particleType, neighborType);
            
            // Apply force EXACTLY like original: (attraction_rule * 1) / distance
            float F = attraction / dist;
            force += diff * F * 0.001; // Scale for GPU stability
          }
        }
      }
      
      // Update velocity with damping: velocity = (velocity + force) * damping
      velocity = (velocity + force) * u_damping;
      
      // Update position: position += velocity * timeScale
      position += velocity * u_timeScale;
      
      // Wall repulsion: 50-pixel buffer zone with soft boundaries
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
    // Pass config values as uniforms
    u_maxDistance: () => CONFIG.maxDistance,
    u_damping: () => CONFIG.damping,
    u_timeScale: () => CONFIG.timeScale,
    u_wallRepel: () => CONFIG.wallRepel,
    u_wallForce: () => CONFIG.wallForce,
    // Pass 6x6 rules matrix as 12 vec3 uniforms (6 types × 2 vec3 each)
    u_rules0a: () => [
      ATTRACTION_RULES[0][0],
      ATTRACTION_RULES[0][1],
      ATTRACTION_RULES[0][2],
    ], // red->rgb
    u_rules0b: () => [
      ATTRACTION_RULES[0][3],
      ATTRACTION_RULES[0][4],
      ATTRACTION_RULES[0][5],
    ], // red->ycm
    u_rules1a: () => [
      ATTRACTION_RULES[1][0],
      ATTRACTION_RULES[1][1],
      ATTRACTION_RULES[1][2],
    ], // green->rgb
    u_rules1b: () => [
      ATTRACTION_RULES[1][3],
      ATTRACTION_RULES[1][4],
      ATTRACTION_RULES[1][5],
    ], // green->ycm
    u_rules2a: () => [
      ATTRACTION_RULES[2][0],
      ATTRACTION_RULES[2][1],
      ATTRACTION_RULES[2][2],
    ], // blue->rgb
    u_rules2b: () => [
      ATTRACTION_RULES[2][3],
      ATTRACTION_RULES[2][4],
      ATTRACTION_RULES[2][5],
    ], // blue->ycm
    u_rules3a: () => [
      ATTRACTION_RULES[3][0],
      ATTRACTION_RULES[3][1],
      ATTRACTION_RULES[3][2],
    ], // yellow->rgb
    u_rules3b: () => [
      ATTRACTION_RULES[3][3],
      ATTRACTION_RULES[3][4],
      ATTRACTION_RULES[3][5],
    ], // yellow->ycm
    u_rules4a: () => [
      ATTRACTION_RULES[4][0],
      ATTRACTION_RULES[4][1],
      ATTRACTION_RULES[4][2],
    ], // cyan->rgb
    u_rules4b: () => [
      ATTRACTION_RULES[4][3],
      ATTRACTION_RULES[4][4],
      ATTRACTION_RULES[4][5],
    ], // cyan->ycm
    u_rules5a: () => [
      ATTRACTION_RULES[5][0],
      ATTRACTION_RULES[5][1],
      ATTRACTION_RULES[5][2],
    ], // magenta->rgb
    u_rules5b: () => [
      ATTRACTION_RULES[5][3],
      ATTRACTION_RULES[5][4],
      ATTRACTION_RULES[5][5],
    ], // magenta->ycm
  },

  framebuffer: () => simulationFBOs[(currentFrame + 1) % 2],
  count: 6,

  viewport: { x: 0, y: 0, width: SIM_RES, height: SIM_RES },
});

// Create particle indices for rendering
const particleIndices = new Array(PARTICLE_COUNT);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  particleIndices[i] = i;
}

// Render particles to screen with type-based colors
const renderParticles = regl({
  vert: `
    precision highp float;
    uniform sampler2D u_particles;
    uniform sampler2D u_particleTypes;
    uniform vec2 u_resolution;
    uniform vec2 u_screenSize;
    uniform float u_particleSize;
    uniform vec3 u_camera; // x, y offset and zoom
    attribute float a_index;
    varying float v_particleType;

    void main() {
      // Convert particle index to texture coordinates
      float x = mod(a_index, u_resolution.x);
      float y = floor(a_index / u_resolution.x);
      vec2 uv = (vec2(x, y) + 0.5) / u_resolution;
      
      // Sample particle position and type from textures
      vec4 particle = texture2D(u_particles, uv);
      vec2 position = particle.xy;
      vec2 velocity = particle.zw;
      float particleType = texture2D(u_particleTypes, uv).r;
      
      // Pass particle type to fragment shader
      v_particleType = particleType;
      
      // Apply camera transformation: pan and zoom
      vec2 worldPos = (position - u_camera.xy) * u_camera.z;
      
      // Set particle size to a constant value - no velocity scaling
      gl_PointSize = u_particleSize * u_camera.z; // Scale size with zoom
      
      gl_Position = vec4(worldPos, 0.0, 1.0);
    }
  `,

  frag: `
    precision highp float;
    varying float v_particleType;
    
    // Color uniforms for each particle type
    uniform vec3 u_color0; // red
    uniform vec3 u_color1; // green
    uniform vec3 u_color2; // blue
    uniform vec3 u_color3; // yellow
    uniform vec3 u_color4; // cyan
    uniform vec3 u_color5; // magenta
    
    // Get particle color based on type using uniforms
    vec3 getColor(float particleType) {
      if (particleType < 0.5) return u_color0;        // red
      else if (particleType < 1.5) return u_color1;   // green  
      else if (particleType < 2.5) return u_color2;   // blue
      else if (particleType < 3.5) return u_color3;   // yellow
      else if (particleType < 4.5) return u_color4;   // cyan
      else return u_color5;                           // magenta
    }
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(gl_PointCoord, center);
      
      // Define the circle radius and outline thickness
      float radius = 0.4;
      float outlineWidth = 0.05;
      
      // Check if we're outside the circle
      if (dist > radius) discard;
      
      vec3 color;
      // Check if we're in the outline area (near the edge of the circle)
      if (dist > radius - outlineWidth) {
        // Bright white outline - fully opaque and bright
        color = vec3(1.0, 1.0, 1.0);
      } else {
        // Particle color for the interior
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
    u_camera: () => [camera.x, camera.y, camera.zoom], // Pass camera state
    // Pass particle type colors as uniforms
    u_color0: () => PARTICLE_TYPES[0].color, // red
    u_color1: () => PARTICLE_TYPES[1].color, // green
    u_color2: () => PARTICLE_TYPES[2].color, // blue
    u_color3: () => PARTICLE_TYPES[3].color, // yellow
    u_color4: () => PARTICLE_TYPES[4].color, // cyan
    u_color5: () => PARTICLE_TYPES[5].color, // magenta
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

// Randomize attraction rules
function randomizeRules() {
  for (let i = 0; i < PARTICLE_TYPES.length; i++) {
    for (let j = 0; j < PARTICLE_TYPES.length; j++) {
      ATTRACTION_RULES[i][j] = (Math.random() - 0.5) * 2; // Random between -1 and 1
    }
  }
  console.log("6x6 Rules randomized!", ATTRACTION_RULES);
}

// Mouse and wheel event handlers for camera control
canvas.addEventListener("mousedown", (event) => {
  mouseState.isDragging = true;
  mouseState.lastX = event.clientX;
  mouseState.lastY = event.clientY;
  canvas.style.cursor = "grabbing";
});

canvas.addEventListener("mousemove", (event) => {
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
});

canvas.addEventListener("mouseup", () => {
  mouseState.isDragging = false;
  canvas.style.cursor = "default";
});

canvas.addEventListener("mouseleave", () => {
  mouseState.isDragging = false;
  canvas.style.cursor = "default";
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const zoomSpeed = 0.1;
  const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
  camera.zoom = Math.max(0.1, Math.min(10.0, camera.zoom * zoomFactor));
});

// Initial cursor style
canvas.style.cursor = "default";

// Keyboard handler for randomization and proportional scaling toggle
document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    randomizeRules();
  } else if (event.key === "p" || event.key === "P") {
    CONFIG.useProportionalScaling = !CONFIG.useProportionalScaling;
    console.log(
      `Proportional scaling: ${CONFIG.useProportionalScaling ? "ON" : "OFF"}`
    );
    console.log(
      `Effective particle size: ${getEffectiveParticleSize().toFixed(2)}`
    );
  }
});

// Main render loop
regl.frame(() => {
  // Clear the screen
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
console.log('Press "R" to randomize attraction rules');
console.log('Press "P" to toggle proportional particle scaling');
console.log(
  `Proportional scaling: ${CONFIG.useProportionalScaling ? "ON" : "OFF"}`
);
console.log(`Current particle size: ${getEffectiveParticleSize().toFixed(2)}`);
