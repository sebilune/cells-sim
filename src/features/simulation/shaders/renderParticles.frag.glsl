// Renders each particle as a colored circle with white outline

precision highp float;
varying float v_particleType;

// Particle type colors
uniform vec3 u_color0; uniform vec3 u_color1; uniform vec3 u_color2;
uniform vec3 u_color3; uniform vec3 u_color4; uniform vec3 u_color5;

// Returns color for a given particle type
vec3 getColor(float particleType) {
  if (particleType < 0.5) return u_color0;
  else if (particleType < 1.5) return u_color1;
  else if (particleType < 2.5) return u_color2;
  else if (particleType < 3.5) return u_color3;
  else if (particleType < 4.5) return u_color4;
  else return u_color5;
}

void main() {
  // Draw a circle with a white outline
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
