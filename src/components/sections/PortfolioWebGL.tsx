"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_progress;
uniform vec3 u_accent;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv += u_pointer * 0.065;

  vec3 color = vec3(0.0);
  float vignette = smoothstep(1.65, 0.16, length(uv * vec2(0.82, 1.0)));

  for (float layer = 0.0; layer < 4.0; layer += 1.0) {
    float depth = 1.15 + layer * 0.72;
    vec2 space = uv * depth;
    space.y += u_progress * (0.72 + layer * 0.32);
    space.x += sin(u_time * 0.045 + layer * 1.9) * 0.035;
    vec2 cell = floor(space * 7.0);
    vec2 local = fract(space * 7.0) - 0.5;
    float seed = hash21(cell + layer * 19.7);
    float star = smoothstep(0.065, 0.0, length(local)) * step(0.925, seed);
    float pulse = 0.68 + 0.32 * sin(u_time * (0.45 + seed) + seed * 18.0);
    color += u_accent * star * pulse * (0.12 + layer * 0.035);
  }

  vec2 glowCenter = vec2(u_pointer.x * 0.28, -0.08 + u_pointer.y * 0.16);
  float atmosphere = exp(-length((uv - glowCenter) * vec2(0.72, 1.1)) * 1.75);
  float horizon = exp(-abs(uv.y + 0.15 + sin(uv.x * 2.2 + u_time * 0.08) * 0.035) * 12.0);
  color += u_accent * atmosphere * 0.075;
  color += u_accent * horizon * 0.028;

  float grain = hash21(gl_FragCoord.xy + fract(u_time) * 91.0) - 0.5;
  color += grain * 0.009;
  color *= vignette;

  gl_FragColor = vec4(color, clamp(vignette * 0.92, 0.0, 1.0));
}
`;

type PortfolioWebGLProps = {
  progress: number;
};

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function PortfolioWebGL({ progress }: PortfolioWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const pointer = gl.getUniformLocation(program, "u_pointer");
    const time = gl.getUniformLocation(program, "u_time");
    const scroll = gl.getUniformLocation(program, "u_progress");
    const accent = gl.getUniformLocation(program, "u_accent");

    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    let frame = 0;
    let visible = true;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };

    const onPointerMove = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.y = (0.5 - event.clientY / window.innerHeight) * 2;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "20% 0px" },
    );

    const draw = (now: number) => {
      current.x += (target.x - current.x) * 0.055;
      current.y += (target.y - current.y) * 0.055;
      if (visible) {
        resize();
        gl.uniform2f(resolution, canvas.width, canvas.height);
        gl.uniform2f(pointer, current.x, current.y);
        gl.uniform1f(time, now * 0.001);
        gl.uniform1f(scroll, progressRef.current * 4.0);
        gl.uniform3f(accent, 0.72, 0.58, 0.36);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      frame = requestAnimationFrame(draw);
    };

    observer.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-80 mix-blend-screen"
    />
  );
}
