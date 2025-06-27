// Passes quad vertex positions and UVs for simulation step

precision highp float;
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  // Map from [-1,1] quad to [0,1] UV
  v_uv = 0.5 * (a_position + 1.0);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
