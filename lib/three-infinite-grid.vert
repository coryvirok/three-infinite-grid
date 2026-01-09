precision mediump float;

// Input vertex attributes
//in vec3 position; // Changed from implicit attribute

// Output variables to fragment shader
out vec4 vUv;    // Changed from 'varying'
out vec4 vPos;   // Changed from 'varying'

// Uniforms
// uniform mat4 projectionMatrix; // Explicitly declared
// uniform mat4 modelViewMatrix;  // Explicitly declared
// uniform mat4 modelMatrix;      // Explicitly declared
// uniform mat4 instanceMatrix;   // Explicitly declared (assuming mat4)
// uniform vec3 cameraPosition;   // Explicitly declared

uniform int uPlane;
uniform float uScale;
uniform float uMajorGridFactor;

#define XZ_PLANE 0
#define XY_PLANE 1
#define ZY_PLANE 2

void main() {
    vPos = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);

    float division = uScale * uMajorGridFactor;

    vec3 worldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;

    // trick to reduce visual artifacts when far from the world origin
    vec3 cameraCenteringOffset = floor(cameraPosition / division) * division;

    // Original vUv assignments preserved
    if(uPlane == XZ_PLANE){
        vUv.yx = (worldPos - cameraCenteringOffset).xz;
        vUv.wz = worldPos.xz;
    }

    if(uPlane == XY_PLANE){
        vUv.yx = (worldPos - cameraCenteringOffset).xy;
        vUv.wz = worldPos.xy;
    }

    if(uPlane == ZY_PLANE){
        vUv.yx = (worldPos - cameraCenteringOffset).zy;
        vUv.wz = worldPos.zy;
    }

    gl_Position = vPos;
}
