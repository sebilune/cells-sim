// renderParticles.vert.glsl
// Computes screen position and size for each particle, passing type to fragment shader

precision highp float;
uniform sampler2D u_particles;
uniform sampler2D u_particleTypes;
uniform vec2 u_resolution;
uniform float u_aspect;
uniform float u_particleSize;
uniform vec4 u_camera; // x, y, zoom, aspect
attribute float a_index;
varying float v_particleType;

void main() {
  // Compute UV for this particle index
  float x = mod(a_index, u_resolution.x);
  float y = floor(a_index / u_resolution.x);
  vec2 uv = (vec2(x, y) + 0.5) / u_resolution;
  
  // Fetch particle state
  vec4 particle = texture2D(u_particles, uv);
  vec2 position = particle.xy;
  float particleType = texture2D(u_particleTypes, uv).r;
  
  v_particleType = particleType;
  
  // Map simulation world to canvas, preserving square aspect

  // Apply camera transform (pan/zoom)
  vec2 worldPos = (position - u_camera.xy) * u_camera.z;

  // Fit square sim into canvas
  float simAspect = 1.0; // Always square
  float canvasAspect = u_aspect;
  vec2 scaledPos;
  if (canvasAspect > simAspect) {
    // Canvas is wider than tall: scale X
    scaledPos = vec2(worldPos.x / canvasAspect, worldPos.y);
  } else {
    // Canvas is taller than wide: scale Y
    scaledPos = vec2(worldPos.x, worldPos.y * canvasAspect);
  }

  gl_PointSize = u_particleSize * u_camera.z;
  gl_Position = vec4(scaledPos, 0.0, 1.0);
}
