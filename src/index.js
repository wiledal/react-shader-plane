import React from "react";
import { useState, useEffect, useRef } from "react";
import { Texture, Mesh, PlaneBufferGeometry, MeshBasicMaterial } from "three";
import { useThree, useFrame, Canvas } from "react-three-fiber";

let defaultShader = `
  vec4 texelColor = texture2D( map, vUv );
  texelColor = mapTexelToLinear( texelColor );
  diffuseColor = texelColor;
`;

let defaultUniforms = {
  uTime: {
    type: "float",
    value: 0
  },
  uMouse: {
    type: "vec2",
    value: [0, 0]
  }
};

function printUniform(key, data) {
  return `uniform ${data.type} ${key};`;
}

function printUniforms(uniforms) {
  let keys = Object.keys(uniforms);

  return `
    ${keys.map(key => printUniform(key, uniforms[key])).join("")}
  `;
}

export function Plane(props) {
  let { camera, gl, mouse } = useThree();
  let [plane, setPlane] = useState();
  let [shader, setShader] = useState();

  function onBeforeCompile(shader) {
    let newUniforms = {
      ...defaultUniforms,
      ...props.uniforms
    };

    shader.uniforms = {
      ...shader.uniforms,
      ...newUniforms
    };
    shader.fragmentShader =
      `
      ${printUniforms(newUniforms)}
    ` +
      shader.fragmentShader
        .replace(
          "#include <common>",
          `
      ${props.functions || ""}

      #include <common>
    `
        )
        .replace(
          "#include <map_fragment>",
          `
        ${props.fragmentShader || defaultShader}
      `
        );

    setShader(shader);
  }

  useEffect(() => {
    camera.position.z = 500;

    let geom = new PlaneBufferGeometry(1, 1, 24, 24);
    let mat = new MeshBasicMaterial({
      map: props.map,
      onBeforeCompile: onBeforeCompile
    });
    let mesh = new Mesh(geom, mat);

    setPlane(mesh);
  }, []);

  useFrame(() => {
    if (shader) {
      shader.uniforms.uTime.value = performance.now();
      plane.scale.x = gl.domElement.width;
      plane.scale.y = gl.domElement.height;
      shader.uniforms.uMouse.value = [mouse.x, mouse.y];
    }

    if (props.onFrame) props.onFrame(shader);
  });

  return (
    <React.Fragment>{plane && <primitive object={plane} />}</React.Fragment>
  );
}

export default function ShaderPlane(
  props = {
    uniforms: [],
    map: Texture,
    fragmentShader: defaultShader,
    functions: ``,
    onFrame: Function
  }
) {
  return (
    <Canvas orthographic>
      <Plane {...props} />
    </Canvas>
  );
}
