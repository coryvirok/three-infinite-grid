export const frag = `precision mediump float;

in vec4 vUv; // Changed from 'varying' to 'in'

// Declare an output variable for the fragment color
//layout(location = 0) out vec4 FragColor; // Replaces gl_FragColor

uniform int uPlane;
uniform float uScale;

uniform float uMajorGridFactor;

uniform float uMinorLineWidth;
uniform float uMajorLineWidth;
uniform float uAxisLineWidth;

uniform vec3 uMinorLineColor;
uniform vec3 uMajorLineColor;

uniform vec3 uXAxisColor;
uniform vec3 uYAxisColor;
uniform vec3 uZAxisColor;
uniform vec3 uCenterColor;

uniform float uOpacity;

#define XZ_PLANE 0
#define XY_PLANE 1
#define ZY_PLANE 2

vec2 saturateFunc(vec2 value) {
    return clamp(value, 0.0, 1.0);
}

vec4 PristineGrid(vec4 uv) {
    float majorGridSize = uScale * uMajorGridFactor;

    // dFdx and dFdy are standard in GLSL ES 3.00
    vec4 uvDDXY = vec4(dFdx(uv.xy), dFdy(uv.xy));
    vec2 uvDeriv = vec2(length(uvDDXY.xz), length(uvDDXY.yw));

    //axes
    float axisLineWidth = max(uMajorLineWidth * uScale, uAxisLineWidth * uScale);
    vec2 axisDrawWidth = max(vec2(axisLineWidth), uvDeriv);
    vec2 axisLineAA = uvDeriv * 1.5;
    vec2 axisLines2 = smoothstep(axisDrawWidth + axisLineAA, axisDrawWidth - axisLineAA, abs(uv.zw * 2.0));
    axisLines2 *= saturateFunc(axisLineWidth / axisDrawWidth);

    //major grid
    float majorDiv = max(0.1, majorGridSize);
    vec2 majorUVDeriv = uvDeriv / majorDiv;
    float majorLineWidth = uMajorLineWidth * uScale / majorDiv;
    vec2 majorDrawWidth = clamp(vec2(majorLineWidth), majorUVDeriv, vec2(0.5));
    vec2 majorLineAA = majorUVDeriv * 1.5;
    vec2 majorGridUV = 1.0 - abs(fract(uv.xy / majorDiv) * 2.0 - 1.0);
    vec2 majorGrid2 = smoothstep(majorDrawWidth + majorLineAA, majorDrawWidth - majorLineAA, majorGridUV);
    majorGrid2 *= saturateFunc(majorLineWidth / majorDrawWidth);
    majorGrid2 = saturateFunc(majorGrid2 - axisLines2); // hack
    majorGrid2 = mix(majorGrid2, vec2(majorLineWidth), saturateFunc(majorUVDeriv * 2.0 - 1.0));

    //minor grid
    float minorDiv = max(0.1, uScale);
    vec2 minorUVDeriv = uvDeriv / minorDiv;
    float minorLineWidth = uMinorLineWidth * uScale / minorDiv;
    vec2 minorDrawWidth = clamp(vec2(minorLineWidth), minorUVDeriv, vec2(0.5));
    vec2 minorLineAA = minorUVDeriv * 1.5;
    vec2 minorGridUV = 1.0 - abs(fract(uv.xy / minorDiv) * 2.0 - 1.0);
    vec2 minorGrid2 = smoothstep(minorDrawWidth + minorLineAA, minorDrawWidth - minorLineAA, minorGridUV);
    minorGrid2 *= saturateFunc(minorLineWidth / minorDrawWidth);
    minorGrid2 = saturateFunc(minorGrid2 - axisLines2); // hack
    minorGrid2 = mix(minorGrid2, vec2(minorLineWidth), saturateFunc(minorUVDeriv * 2.0 - 1.0));

    //axis falloff
    float lim = axisLineWidth + 0.01 * uScale;
    minorGrid2 = (abs(uv.z) > lim && abs(uv.w) > lim) ? minorGrid2 : vec2(0.0);

    //combine grids
    float minorGrid = mix(minorGrid2.x, 1.0, minorGrid2.y);
    float majorGrid = mix(majorGrid2.x, 1.0, majorGrid2.y);

    // COLORS WITH ALPHA
    vec4 xAxisColor = vec4(uXAxisColor, 1.0);
    vec4 yAxisColor = vec4(uYAxisColor, 1.0);
    vec4 zAxisColor = vec4(uZAxisColor, 1.0);
    vec4 centerColor = vec4(uCenterColor, 1.0);
    vec4 majorLineColor = vec4(uMajorLineColor, 1.0);
    vec4 minorLineColor = vec4(uMinorLineColor, 1.0);

    vec4 aAxisColor = xAxisColor;
    vec4 bAxisColor = zAxisColor;

    if(uPlane == XY_PLANE){
        aAxisColor = xAxisColor;
        bAxisColor = yAxisColor;
    }

    if(uPlane == ZY_PLANE){
        aAxisColor = zAxisColor;
        bAxisColor = yAxisColor;
    }

    aAxisColor = mix(aAxisColor, centerColor, axisLines2.y);

    vec4 axisLines = mix(bAxisColor * axisLines2.y, aAxisColor, axisLines2.x);

    vec4 col = vec4(minorLineColor.rgb, minorGrid * minorLineColor.a);
    col = mix(col, majorLineColor, majorGrid * majorLineColor.a);
    col = col * (1.0 - axisLines.a) + axisLines;

    return col;
}

void main() {
    vec4 grid = PristineGrid(vUv);

    //FragColor = grid * vec4(1.0, 1.0, 1.0, uOpacity); // Assign to the custom 'out' variable
    pc_fragColor = grid * vec4(1.0, 1.0, 1.0, uOpacity); // Assign to the custom 'out' variable
}
`

export const vert = `precision mediump float;

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
`
