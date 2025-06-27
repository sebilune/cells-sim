# Cellular Automata: A "Clusters" Variation

<img src="./src/assets/img/logo.png" align="right" alt="Cells Sim Logo" width="120" height="auto">

A web based cellular automata simulation playground inspired by [Jeffrey Ventrella's "Clusters"](http://www.ventrella.com/Clusters) algorithm. It simulates the movement and interaction of up to a million particles using rules of attraction and repulsion, creating complex and organic patterns.

## How It Works

This simulation was made as an exploration of mine into the field of Artificial Life, demonstrating how complex, life-like behaviors can emerge from a simple set of rules which particles follow. The system is modeled as a discrete-time, two-dimensional particle system where the behavior of each particle is determined by forces exerted upon it by other particles.

### Particle State

The simulation consists of a population of up to a million particles. Each particle is a distinct entity defined by its state, which includes:

- **Position** `(x, y)`: Its coordinates in the 2D space.
- **Velocity** `(vx, vy)`: Its speed and direction of movement.
- **Type**: Red, green, blue, yellow, cyan, or magenta.

### Rules of Interaction

The core of the simulation's emergent behavior lies in a `6x6` interaction matrix. This matrix defines the fundamental laws of the simulated space, specifying the nature of the force between any two particle types. For a particle of color `A` and a particle color of `B`, the matrix contains a value, `n`, that dictates their interaction.

- If `n` is **positive**, the force is **attractive**, pulling the particles together.
- If `n` is **negative**, the force is **repulsive**, pushing them apart.

The magnitude of this interaction coefficient determines the strength of the force. At the start of each simulation, or when the rules are randomized, this matrix is populated with random values between -1 and 1. This randomization creates a vast landscape of possible worlds, each with its own unique physics, leading to an incredible diversity of emergent patterns.

<!-- TODO: Add an image here showing the 6x6 grid of the rules matrix, perhaps with colors indicating attraction (warm colors like red/yellow) and repulsion (cool colors like blue/purple). -->

### Force Law and Simulation Loop

The simulation evolves in discrete time steps. In each step, the following calculations are performed for every particle in parallel:

1.  **Force Calculation**: The net force on a particle is the sum of forces from all other particles within a predefined `maxDistance`. The force exerted by one particle on another follows a simplified gravity-like law: `F = g / d`, where `g` is the interaction value from the rules matrix and `d` is the distance between the particles. This inverse relationship means that closer particles exert a stronger influence.

2.  **Numerical Integration**: Once the total force vector is calculated for a particle, its velocity and position are updated using a semi-implicit Euler integration method:

    - `velocity_new = (velocity_old + total_force) * damping`
    - `position_new = position_old + velocity_new * timeScale`

    The `damping` factor acts like friction, preventing the system from becoming unstable and allowing structures to form and stabilize.

3.  **Boundary Conditions**: A simple wall repulsion force is applied to keep particles within the visible area, preventing them from flying off-screen.

<!-- TODO: Add a diagram here illustrating two particles of different types, their distance 'd', and the resulting force vector 'F' between them. Show both an attractive (g > 0) and a repulsive (g < 0) case. -->

### Computing

To make the real-time simulation of thousands of particles possible, the entire computational workload is offloaded to the GPU using WebGL.

- **Data as Textures**: Particle data (position and velocity) is stored in WebGL textures. Each pixel in a texture corresponds to a single particle, with the pixel's RGBA color channels used to encode the `x, y, vx, vy` values.

- **"Ping-Pong" Technique**: The simulation loop is implemented in a GLSL fragment shader. This shader reads the particle states from an input texture (`u_particles`), performs the force and integration calculations, and writes the new states to an output texture. To avoid reading from and writing to the same texture simultaneously, two textures are used in a "ping-pong" fashion. On each frame, the roles of the input and output textures are swapped.

### Emergence

The often organic looking patterns you see are not explicitly designed. They are **emergent properties** of the algorithm. The simple, local interaction rules, when applied simultaneously to thousands of particles, give rise to complex, self-organizing global structures. Depending on the (random) rule set, you can witness behaviors analogous to flocking, cellular division, predator-prey dynamics, and the formation of stable, complex "organisms." This simulation serves as a powerful illustration of how complexity can arise from simplicity, a fundamental concept in chaos theory and artificial life.

<!-- TODO: Add a gallery of screenshots here showcasing different emergent patterns from different random rule sets. For example, one showing tight clusters, one showing swirling galaxies, and one showing filament-like structures. -->

The simulation is powered by a custom GLSL (OpenGL Shading Language) implementation of the "Clusters" algorithm. The core of the simulation runs on the GPU, allowing for a massive number of particles to be processed in real-time.

The simulation consists of two main shaders:

- **Step Shader:** This shader is responsible for updating the position and velocity of each particle based on a set of rules. These rules define the attraction and repulsion forces between different types of particles.
- **Render Shader:** This shader is responsible for rendering the particles to the screen. It uses the particle positions and types to draw each particle with its corresponding color.

The simulation customizable, many parameters are adjustable such as the number of particles, the rules of interaction, and the physics.

## Usage

The simulation can be controlled using the settings panel, in the top-right corner of the screen. The following settings can be adjusted:

- **Overlay:** Toggles the visibility of the overlay, which displays the simulation's performance metrics.
- **Population:** Controls the number of particles in the simulation.
- **Physics:** Controls the physical properties of the simulation. You can adjust parameters such as:

  - `maxDistance`: Maximum distance for particle interactions.
  - `damping`: Amount of velocity reduction per step (friction).
  - `timeScale`: Speed at which the simulation runs.
  - `wallRepel`: Strength of repulsion from the simulation boundaries.
  - `wallForce`: Additional force applied near the walls.
  - `particleSize`: Size of each particle.
  - `useProportionalScaling`: Whether particle size scales with population.
  - `refPopulation`: Reference population for scaling calculations.
  - `scalingRatio`: Ratio used for proportional scaling.
  - `mouseRepel`: Strength of repulsion from the mouse cursor.

View settings can be controlled using the following mouse and keyboard shortcuts:

- **Click and drag:** Camera panning.
- **Scroll wheel:** Zoom in/out.

## Stack

- **React:** JavaScript library for UI.
- **TypeScript:** Typed superset of JavaScript.
- **Vite:** Build tool for modern web apps.
- **regl:** Functional WebGL library.
- **GLSL:** OpenGL Shading Language.
- **Tailwind CSS:** Utility-first CSS framework.
- **Radix UI:** Unstyled, accessible React components.

## Installation

If you would like to get a local build of this project, clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/cells-sim.git
cd cells-sim
npm install
```

Then, start the development server:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more information.
