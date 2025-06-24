// Simulation step: updates positions and velocities using particle-life rules
// Each particle interacts with its neighbors based on attraction rules and wall repulsion

precision highp float;

// Particle state and configuration uniforms
uniform sampler2D u_particles;
uniform sampler2D u_particleTypes;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_maxDistance;
uniform float u_damping;
uniform float u_timeScale;
uniform float u_wallRepel;
uniform float u_wallForce;

// Mouse repulsion uniform
uniform float u_mouseRepel; // Strength
uniform float u_mouseRepelRadius; // Radius (NDC)
uniform vec2 u_mousePos;    // Mouse position (NDC)

// 6x6 attraction rules matrix, split into 12 vec3s for WebGL uniform limits
uniform vec3 u_rules0a; uniform vec3 u_rules0b;
uniform vec3 u_rules1a; uniform vec3 u_rules1b;
uniform vec3 u_rules2a; uniform vec3 u_rules2b;
uniform vec3 u_rules3a; uniform vec3 u_rules3b;
uniform vec3 u_rules4a; uniform vec3 u_rules4b;
uniform vec3 u_rules5a; uniform vec3 u_rules5b;

varying vec2 v_uv;

// Lookup the attraction rule for a given pair of types
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
  // Read current particle state
  vec4 particle = texture2D(u_particles, v_uv);
  vec2 position = particle.xy;
  vec2 velocity = particle.zw;

  float particleType = texture2D(u_particleTypes, v_uv).r;
  vec2 force = vec2(0.0);

  // Neighborhood search: sum forces from nearby particles
  const int range = 8;
  for (int x = -range; x <= range; x++) {
    for (int y = -range; y <= range; y++) {
      if (x == 0 && y == 0) continue;
      vec2 offset = vec2(float(x), float(y)) / u_resolution;
      vec2 neighborUV = v_uv + offset;
      if (neighborUV.x < 0.0 || neighborUV.x > 1.0 || neighborUV.y < 0.0 || neighborUV.y > 1.0) continue;
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

  // Integrate velocity and position
  velocity = (velocity + force) * u_damping;
  position += velocity * u_timeScale;

  // Wall repulsion logic
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

  // Mouse repel logic
  if (u_mouseRepel > 0.01 && u_mouseRepelRadius > 0.01) {
    float mouseRadius = u_mouseRepelRadius;
    float mouseStrength = u_mouseRepel;
    float d = length(position - u_mousePos);
    if (d < mouseRadius) {
      vec2 repel = normalize(position - u_mousePos) * (mouseRadius - d) * mouseStrength;
      velocity += repel;
    }
  }

  // Output new state
  gl_FragColor = vec4(position, velocity);
}
