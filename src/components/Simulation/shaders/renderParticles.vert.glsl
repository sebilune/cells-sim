// renderParticles.vert.glsl
// Computes screen position and size for each particle, passing type to fragment shader

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
  // Compute UV for this particle index
  float x = mod(a_index, u_resolution.x);
  float y = floor(a_index / u_resolution.x);
  vec2 uv = (vec2(x, y) + 0.5) / u_resolution;
  
  // Fetch particle state
  vec4 particle = texture2D(u_particles, uv);
  vec2 position = particle.xy;
  float particleType = texture2D(u_particleTypes, uv).r;
  
  v_particleType = particleType;
  
  // Transform to world and screen
  vec2 worldPos = (position - u_camera.xy) * u_camera.z;
  
  gl_PointSize = u_particleSize * u_camera.z;
  gl_Position = vec4(worldPos, 0.0, 1.0);
}
