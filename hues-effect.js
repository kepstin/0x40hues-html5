window.HuesEffect = (function() {
  "use strict";

  /* Shaders */

  /* The vertex shader simply passes through the vertex and image sampler
   * positions. Coordinate space is precalculated in Javascript. */
  var vertexShaderSource =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n" +
    "varying vec2 v_imagePosition;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(position, 0, 1);\n" +
    "  v_imagePosition = a_imagePosition;\n" +
    "}\n";

  /* The fragment shader handles doing the blurring, blend mode, blackout.
   * Note that the fragment shader uses premultiplied alpha throughout. The
   * UNPACK_PREMULTIPLY_ALPHA_WEBGL pixelStore parameter should be set. */
  var fragmentShaderSource =
    "precision mediump float;\n" +
    "varying vec2 v_imagePosition;\n" +
    "uniform int u_blurSamples;\n" +
    "uniform float u_blurX;\n" +
    "uniform float u_blurY;\n" +
    "uniform int u_blendMode;\n" +
    "uniform float u_blackout;\n" +
    "uniform sampler2D u_image;\n" +
    "uniform vec3 u_hue;\n" +
    "vec4 blur(sampler2D image, vec2 imagePosition) {\n" +
    "  // The only texture wrap mode supported for NPOT textures is clamp\n" +
    "  // but we want transparent outside the image area instead.\n" +
    "  if (imagePosition.x < 0.0 || imagePosition.y < 0.0 ||\n" +
    "      imagePosition.x > 1.0 || imagePosition.x > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  if (u_blurX > 0.0 || u_blurY > 0.0) {\n" +
    "    float totalWeight = 0.0;\n" +
    "    vec4 finalColor = vec4(0.0);\n" +
    "    for (int i = -u_blurSamples; i <= u_blurSamples; i++) {\n" +
    "      float weight = 1.0 - abs(float(i) / float(u_blurSamples));\n" +
    "      float offset = float(i) / float(u_blurSamples);\n" +
    "      vec2 displacement = vec2(offset * u_blurX, offset * u_blurY);\n" +
    "      vec4 sample = texture2D(image, imagePosition + displacement);\n" +
    "      finalColor += sample * weight;\n" +
    "      total += weight;\n" +
    "    }\n" +
    "    return finalColor / totalWeight;\n" +
    "  } else {\n" +
    "    return texture2D(image, imagePosition);\n" +
    "  }\n" +
    "}\n" +
    "vec4 blendPlain(vec4 sample, vec3 hue) {\n" +
    "  return vec4(sample.rgb + hue * (1.0 - sample.a), 1.0);\n" +
    "}\n" +
    "vec4 blendAlpha(vec4 sample, vec3 hue) {\n" +
    "  sample *= 0.7;\n" +
    "  return vec4(sample.rgb + hue * (1.0 - sample.a), 1.0);\n" +
    "}\n" +
    "float overlay(float a, float b) {\n" +
    "  if (a < 0.5) {\n" +
    "    return 2.0 * a * b;\n" +
    "  } else {\n" +
    "    return 1.0 - 2.0 * (1.0 - a) * (1.0 - b);\n" +
    "  }\n" +
    "}\n" +
    "vec3 overlay(vec3 a, vec3 b) {\n" +
    "  return vec3(\n" +
    "    overlay(a.r, b.r), overlay(a.g, b.g), overlay(a.b, b.b));\n" +
    "}\n" +
    "vec4 blendHardLight(vec4 sample, vec3 hue) {\n" +
    "  // First alpha blend the image onto solid white\n" +
    "  sample = vec4(sample.rgb + vec3(1.0) * (1.0 - sample.a), 1.0);\n" +
    "  // Then calculate the hard light result\n" +
    "  vec3 lit = overlay(hue, vec3(sample));\n" +
    "  // Then mix the two; 70% hard light\n" +
    "  return vec4(mix(vec3(sample), lit, 0.7), 1.0);\n" +
    "}\n" +
    "vec4 blackout(vec4 sample, float alpha) {\n" +
    "  return mix(sample, vec4(0.0, 0.0, 0.0, 1.0), alpha);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec4 blurSample = blur(u_image, v_imagePosition);\n" +
    "  vec4 blendSample;\n" +
    "  if (u_blendMode == 2) {\n" +
    "    blendSample = blendHardLight(blurSample, u_hue);\n" +
    "  } else if (u_blendMode == 1) {\n" +
    "    blendSample = blendAlpha(blurSample, u_hue);\n" +
    "  } else {\n" +
    "    blendSample = blendPlain(blurSample, u_hue);\n" +
    "  }\n" +
    "  vec4 blackoutSample = blackout(blendSample, u_blackout);\n" +
    "  gl_FragColor = blackoutSample;\n" +
    "}\n";

  var self = {
    /* Configuration options */

    /* Whether to use image alignment info from respacks */
    smartAlign: true,

    /* How to scale images
     *
     * One of the following values:
     * 0: "off"
     *   Images are not scaled.
     * 1: "on"
     *   Images are scaled to have the same height as the canvas.
     * 2: "semi"
     *   Images are scaled to have the same height as the canvas only if they
     *   are taller than the canvas.
     */
    scale: 1,

    /* Whether to use linear filtering when scaling images */
    imageSmoothing: true,

    /* The selected hue blend mode for drawing the image.
     *
     * One of the following values:
     * 0: "plain"
     *   Image is alpha-blended over the hue.
     * 1: "alpha"
     *   Image is alpha-blended over the hue at 70% opacity.
     * 2: "hard light".
     *   Image is alpha-blended over a white background. The hue is blended
     *   over the image with "hard light" mode at 70% opacity.
     */
    blendMode: 2,

    /* Blur size, in pixels.
     *
     * Recommended values are 0x10 (16) for low, 0x20 (32) for medium, 0x40 (64)
     * for high. Setting this to 0 disables blur.
     */
    blurAmount: 0x20,

    /* Blur decay time, in milliseconds
     *
     * TODO: Figure out the correct values to use here
     * Currently recommend 200ms for slow, 150 for medium, 100 for fast,
     * 50 for faster!
     * Don't set this to 0; use blurAmount to disable blur.
     */
    blurDecay: 100,

    /* Internal state */

    /* The webgl context being used for rendering */
    gl: null,

    /* The compiled shader program */
    shader: null,

    getWebglContext: function(canvas) {
      if (self.gl) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var webglOpts = {
          alpha: false,
          depth: false,
          stencil: false,
          antialias: false,
        };
        var gl = canvas.getContext("webgl", webglOpts) ||
          canvas.getContext("experimental-webgl", webglOpts);
        if (!gl) {
          return reject(Error("Unable to get a webgl canvas context"));
        }
        self.gl = gl;
        return resolve();
      });
    },

    compileShader: function() {
      if (self.shader) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var gl = self.gl;
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
          console.log("Vertex shader compile failure:");
          console.log(gl.getShaderInfoLog(vertexShader));
          return reject("Could not compile vertex shader");
        }
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
          console.log("Fragment shader compile failure:");
          console.log(gl.getShaderInfoLog(fragmentShader));
          return reject("Could not compile fragment shader");
        }
        var shader = gl.createProgram();
        gl.attachShader(shader, vertexShader);
        gl.attachShader(shader, fragmentShader);
        gl.linkProgram(shader);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.log("Shader link failure:");
          console.log(gl.getProgramInfoLog(shader));
          return reject("Could not link shader program");
        }
        self.shader = shader;
        return resolve();
      });
    },

    setup: function(canvas) {
      return self.getWebglContext(canvas)
        .then(self.compileShader);
    }
  };
  return {
    setup: function(canvas) { return self.setup(canvas); }
  };
})();
