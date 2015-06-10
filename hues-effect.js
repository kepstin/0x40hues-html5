window.HuesEffect = (function() {
  "use strict";

  /* Shaders */

  /* The vertex shader simply passes through the vertex and image sampler
   * positions. Coordinate space is precalculated in Javascript. */
  var vertexShaderSource_v1 =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n" +
    "varying vec2 v_imagePosition;\n" +
    "uniform vec2 u_blur;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0, 1);\n" +
    "  // Flip the image vertically...\n" +
    "  v_imagePosition = vec2(a_imagePosition.x, 1.0 - a_imagePosition.y);\n" +
    "}\n";
  var vertexShaderSource_v9 =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n" +
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[8];\n" +
    "uniform vec2 u_blur;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0, 1);\n" +
    "  // Flip the image vertically...\n" +
    "  v_imagePosition = vec2(a_imagePosition.x, 1.0 - a_imagePosition.y);\n" +
    "  // Sample positions for blur\n" +
    "  v_blurPosition[0] = v_imagePosition + u_blur * -1.00;\n" +
    "  v_blurPosition[1] = v_imagePosition + u_blur * -0.75;\n" +
    "  v_blurPosition[2] = v_imagePosition + u_blur * -0.50;\n" +
    "  v_blurPosition[3] = v_imagePosition + u_blur * -0.25;\n" +
    "  v_blurPosition[4] = v_imagePosition + u_blur *  0.25;\n" +
    "  v_blurPosition[5] = v_imagePosition + u_blur *  0.50;\n" +
    "  v_blurPosition[6] = v_imagePosition + u_blur *  0.75;\n" +
    "  v_blurPosition[7] = v_imagePosition + u_blur *  1.00;\n" +
    "}\n";
  var vertexShaderSource_v15 =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n" +
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[14];\n" +
    "uniform vec2 u_blur;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0, 1);\n" +
    "  // Flip the image vertically...\n" +
    "  v_imagePosition = vec2(a_imagePosition.x, 1.0 - a_imagePosition.y);\n" +
    "  // Sample positions for blur\n" +
    "  v_blurPosition[ 0] = v_imagePosition + u_blur * -1.0000;\n" +
    "  v_blurPosition[ 1] = v_imagePosition + u_blur * -0.8571;\n" +
    "  v_blurPosition[ 2] = v_imagePosition + u_blur * -0.7143;\n" +
    "  v_blurPosition[ 3] = v_imagePosition + u_blur * -0.5714;\n" +
    "  v_blurPosition[ 4] = v_imagePosition + u_blur * -0.4289;\n" +
    "  v_blurPosition[ 5] = v_imagePosition + u_blur * -0.2857;\n" +
    "  v_blurPosition[ 6] = v_imagePosition + u_blur * -0.1429;\n" +
    "  v_blurPosition[ 7] = v_imagePosition + u_blur *  0.1429;\n" +
    "  v_blurPosition[ 8] = v_imagePosition + u_blur *  0.2857;\n" +
    "  v_blurPosition[ 9] = v_imagePosition + u_blur *  0.4289;\n" +
    "  v_blurPosition[10] = v_imagePosition + u_blur *  0.5714;\n" +
    "  v_blurPosition[11] = v_imagePosition + u_blur *  0.7143;\n" +
    "  v_blurPosition[12] = v_imagePosition + u_blur *  0.8571;\n" +
    "  v_blurPosition[13] = v_imagePosition + u_blur *  1.0000;\n" +
    "}\n";
  var vertexShaderSource_v27 =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n" +
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[26];\n" +
    "uniform vec2 u_blur;\n" +
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0, 1);\n" +
    "  // Flip the image vertically...\n" +
    "  v_imagePosition = vec2(a_imagePosition.x, 1.0 - a_imagePosition.y);\n" +
    "  // Sample positions for blur\n" +
    "  v_blurPosition[ 0] = v_imagePosition + u_blur * -1.000000;\n" +
    "  v_blurPosition[ 1] = v_imagePosition + u_blur * -0.923077;\n" +
    "  v_blurPosition[ 2] = v_imagePosition + u_blur * -0.846154;\n" +
    "  v_blurPosition[ 3] = v_imagePosition + u_blur * -0.769231;\n" +
    "  v_blurPosition[ 4] = v_imagePosition + u_blur * -0.692308;\n" +
    "  v_blurPosition[ 5] = v_imagePosition + u_blur * -0.615385;\n" +
    "  v_blurPosition[ 6] = v_imagePosition + u_blur * -0.538462;\n" +
    "  v_blurPosition[ 7] = v_imagePosition + u_blur * -0.461538;\n" +
    "  v_blurPosition[ 8] = v_imagePosition + u_blur * -0.384615;\n" +
    "  v_blurPosition[ 9] = v_imagePosition + u_blur * -0.307692;\n" +
    "  v_blurPosition[10] = v_imagePosition + u_blur * -0.230769;\n" +
    "  v_blurPosition[11] = v_imagePosition + u_blur * -0.153846;\n" +
    "  v_blurPosition[12] = v_imagePosition + u_blur * -0.076923;\n" +
    "  v_blurPosition[13] = v_imagePosition + u_blur *  0.076923;\n" +
    "  v_blurPosition[14] = v_imagePosition + u_blur *  0.153846;\n" +
    "  v_blurPosition[15] = v_imagePosition + u_blur *  0.230769;\n" +
    "  v_blurPosition[16] = v_imagePosition + u_blur *  0.307692;\n" +
    "  v_blurPosition[17] = v_imagePosition + u_blur *  0.384615;\n" +
    "  v_blurPosition[18] = v_imagePosition + u_blur *  0.461538;\n" +
    "  v_blurPosition[19] = v_imagePosition + u_blur *  0.538462;\n" +
    "  v_blurPosition[20] = v_imagePosition + u_blur *  0.615385;\n" +
    "  v_blurPosition[21] = v_imagePosition + u_blur *  0.692308;\n" +
    "  v_blurPosition[22] = v_imagePosition + u_blur *  0.769231;\n" +
    "  v_blurPosition[23] = v_imagePosition + u_blur *  0.846154;\n" +
    "  v_blurPosition[24] = v_imagePosition + u_blur *  0.923077;\n" +
    "  v_blurPosition[25] = v_imagePosition + u_blur * -1.000000;\n" +
    "}\n";

  /* The fragment shader handles doing the blurring, blend mode, blackout.
   * Note that the fragment shader uses premultiplied alpha throughout. The
   * UNPACK_PREMULTIPLY_ALPHA_WEBGL pixelStore parameter should be set. */
  var fragmentShaderSource_header =
    "precision mediump float;\n" +
    "uniform bool u_fragBlur;\n" +
    "uniform int u_blendMode;\n" +
    "uniform float u_blackout;\n" +
    "uniform sampler2D u_image;\n" +
    "uniform vec3 u_hue;\n";
  var fragmentShaderSource_blur_v1 =
    "varying vec2 v_imagePosition;\n" +
    "vec4 blur() {\n" +
    "  if (v_imagePosition.x < 0.0 || v_imagePosition.y < 0.0 ||\n" +
    "      v_imagePosition.x > 1.0 || v_imagePosition.x > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  // Blur? What blur?\n" +
    "  return texture2D(u_image, v_imagePosition);\n" +
    "}\n";
  var fragmentShaderSource_blur_v9 =
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[14];\n" +
    "vec4 blur() {\n" +
    "  if (v_imagePosition.x < 0.0 || v_imagePosition.y < 0.0 ||\n" +
    "      v_imagePosition.x > 1.0 || v_imagePosition.x > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  if (u_fragBlur) {\n" +
    "    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);\n" +
    "    // One dimensional discrete Gaussian kernel, 9 samples\n" +
    "    // sigma=1.5 samples, normalized\n" +
    "    color += texture2D(u_image, v_blurPosition[0]) * 0.008488;\n" +
    "    color += texture2D(u_image, v_blurPosition[7]) * 0.008488;\n" +
    "    color += texture2D(u_image, v_blurPosition[1]) * 0.038078;\n" +
    "    color += texture2D(u_image, v_blurPosition[6]) * 0.038078;\n" +
    "    color += texture2D(u_image, v_blurPosition[2]) * 0.111165;\n" +
    "    color += texture2D(u_image, v_blurPosition[5]) * 0.111165;\n" +
    "    color += texture2D(u_image, v_blurPosition[3]) * 0.211357;\n" +
    "    color += texture2D(u_image, v_blurPosition[4]) * 0.211357;\n" +
    "    color += texture2D(u_image, v_imagePosition  ) * 0.261824;\n" +
    "  } else {\n" +
    "    return texture2D(u_image, v_imagePosition);\n" +
    "  }\n" +
    "}\n";
  var fragmentShaderSource_blur_v15 =
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[14];\n" +
    "vec4 blur() {\n" +
    "  if (v_imagePosition.x < 0.0 || v_imagePosition.y < 0.0 ||\n" +
    "      v_imagePosition.x > 1.0 || v_imagePosition.x > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  if (u_fragBlur) {\n" +
    "    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);\n" +
    "    // One dimensional discrete Gaussian kernel, 15 samples\n" +
    "    // sigma=2.5 samples, normalized\n" +
    "    color += texture2D(u_image, v_blurPosition[ 0]) * 0.003320;\n" +
    "    color += texture2D(u_image, v_blurPosition[13]) * 0.003320;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 1]) * 0.009267;\n" +
    "    color += texture2D(u_image, v_blurPosition[12]) * 0.009267;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 2]) * 0.022087;\n" +
    "    color += texture2D(u_image, v_blurPosition[11]) * 0.022087;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 3]) * 0.044948;\n" +
    "    color += texture2D(u_image, v_blurPosition[10]) * 0.044948;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 4]) * 0.078109;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 9]) * 0.078109;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 5]) * 0.115911;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 8]) * 0.115911;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 6]) * 0.146884;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 7]) * 0.146884;\n" +
    "    color += texture2D(u_image, v_imagePosition   ) * 0.158949;\n" +
    "  } else {\n" +
    "    return texture2D(u_image, v_imagePosition);\n" +
    "  }\n" +
    "}\n";
  var fragmentShaderSource_blur_v27 =
    "varying vec2 v_imagePosition;\n" +
    "varying vec2 v_blurPosition[26];\n" +
    "vec4 blur(sampler2D image, vec2 pos) {\n" +
    "  if (v_imagePosition.x < 0.0 || v_imagePosition.y < 0.0 ||\n" +
    "      v_imagePosition.x > 1.0 || v_imagePosition.x > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  if (u_fragBlur) {\n" +
    "    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);\n" +
    "    // One dimensional discrete Gaussian kernel, 27 samples\n" +
    "    // sigma=4.5 samples, normalized\n" +
    "    color += texture2D(u_image, v_blurPosition[ 0]) * 0.001390;\n" +
    "    color += texture2D(u_image, v_blurPosition[25]) * 0.001390;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 1]) * 0.002571;\n" +
    "    color += texture2D(u_image, v_blurPosition[24]) * 0.002571;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 2]) * 0.004527;\n" +
    "    color += texture2D(u_image, v_blurPosition[23]) * 0.004527;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 3]) * 0.007587;\n" +
    "    color += texture2D(u_image, v_blurPosition[22]) * 0.007587;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 4]) * 0.012105;\n" +
    "    color += texture2D(u_image, v_blurPosition[21]) * 0.012105;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 5]) * 0.018387;\n" +
    "    color += texture2D(u_image, v_blurPosition[20]) * 0.018387;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 6]) * 0.026588;\n" +
    "    color += texture2D(u_image, v_blurPosition[19]) * 0.026588;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 7]) * 0.036604;\n" +
    "    color += texture2D(u_image, v_blurPosition[18]) * 0.036604;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 8]) * 0.047973;\n" +
    "    color += texture2D(u_image, v_blurPosition[17]) * 0.047973;\n" +
    "    color += texture2D(u_image, v_blurPosition[ 9]) * 0.059856;\n" +
    "    color += texture2D(u_image, v_blurPosition[16]) * 0.059856;\n" +
    "    color += texture2D(u_image, v_blurPosition[10]) * 0.071099;\n" +
    "    color += texture2D(u_image, v_blurPosition[15]) * 0.071099;\n" +
    "    color += texture2D(u_image, v_blurPosition[11]) * 0.080401;\n" +
    "    color += texture2D(u_image, v_blurPosition[14]) * 0.080401;\n" +
    "    color += texture2D(u_image, v_blurPosition[12]) * 0.086556;\n" +
    "    color += texture2D(u_image, v_blurPosition[13]) * 0.086556;\n" +
    "    color += texture2D(u_image, v_imagePosition   ) * 0.086556;\n" +
    "    return color;\n" +
    "  } else {\n" +
    "    return texture2D(u_image, v_imagePosition);\n" +
    "  }\n" +
    "}\n";
  var fragmentShaderSource_footer =
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

    /* Blur decay time, in seconds
     *
     * TODO: Figure out the correct values to use here
     * Currently recommend 200ms for slow, 150 for medium, 100 for fast,
     * 50 for faster!
     * Don't set this to 0; use blurAmount to disable blur.
     */
    blurDecay: 0.100,
    //blurDecay: 0.5,

    /* Internal state */

    /* The Hues object that handles the music syncing and effect parsing */
    hues: null,

    /* The webgl context being used for rendering */
    gl: null,

    /* The compiled shader program */
    shader: null,

    /* Effect state */

    /* Whether an effect has changed such that a re-render is required */
    renderNeeded: false,

    /* The current hue */
    hue: [1.0, 1.0, 1.0],

    /* Stuff for hue fade calculation */
    hueFadeActive: false,
    hueFadeStartTime: 0,
    hueFadeDuration: 0,
    hueFadeStartHue: null,
    hueFadeEndHue: null,

    /* The current image */
    img: null,
    imageAnimated: false,
    imageFrame: 0,
    imageFrames: [],
    imageStartTime: 0,
    imageFrameDuration: 0,
    imageTexture: null,
    /* Image alignment is center: 0, left: 1, right: 2 */
    imageAlign: 0,
    imagePosition: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    },

    /* Stuff for blur calculations */
    blurActive: false,
    /* Blur direction is 0 for vertical, 1 for horizontal */
    blurDirection: 0,
    blurStartTime: 0,
    blurX: 0,
    blurY: 0,

    /* Blackout calculations */
    blackoutClear: false,
    blackoutFadeinActive: false,
    shortBlackoutActive: false,
    shortBlackoutDuration: 0,
    blackoutStartTime: 0,
    blackout: 0.0,

    /* Effect callbacks */

    hueChangeCallback: function(newHue, startTime, duration) {
      if (duration > 0) {
        var prevHue = self.hue;
        self.hueFadeActive = true;
        self.hueFadeStartTime = startTime;
        self.hueFadeDuration = duration;
        self.hueFadeStartHue = prevHue;
        self.hueFadeEndHue = newHue.hue.rgb;
      } else {
        self.hueFadeActive = false;
        self.hue = newHue.hue.rgb;
      }
      self.renderNeeded = true;
    },

    imageChangeCallback: function(imageInfo, startTime) {
      var gl = self.gl;
      var texture = self.texture;
      var img = imageInfo.img;

      switch (imageInfo.align) {
      case "left": self.imageAlign = 1; break;
      case "right": self.imageAlign = 2; break;
      default: self.imageAlign = 0; break;
      }

      if (!img) {
        if (imageInfo.name == "Lain") {
          console.log("Are you Lain of the Wired? Who are you really?");
        }
        self.imageAnimated = true;
        self.imageFrame = -1;
        self.imageFrames = imageInfo.animation;
        self.imageStartTime = startTime;
        self.imageFrameDuration = imageInfo.frameDuration / 1000;
        /* Animation is handled in the imageAnimationUpdate() function */
        return;
      } else {
        self.imageAnimated = false;
      }

      gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, img);

      self.img = img;

      self.imageSizeUpdate();
      self.renderNeeded = true;
    },

    verticalBlurEffectCallback: function(startTime) {
      self.blurActive = true;
      self.blurDirection = 0;
      self.blurStartTime = startTime;
    },

    horizontalBlurEffectCallback: function(startTime) {
      self.blurActive = true;
      self.blurDirection = 1;
      self.blurStartTime = startTime;
    },

    blackoutEffectCallback: function(blackoutActive, beatTime) {
      self.shortBlackoutActive = false;
      if (blackoutActive) {
        self.blackoutClear = false;
        self.blackoutFadeinActive = true;
      } else {
        self.blackoutClear = true;
      }
      self.blackoutStartTime = beatTime;
    },

    shortBlackoutEffectCallback: function(beatTime, duration) {
      self.blackoutClear = false;
      self.shortBlackoutActive = true;
      self.blackoutFadeinActive = true;
      self.blackoutStartTime = beatTime;
      self.shortBlackoutDuration = duration;
    },

    /* Effect animations */

    hueUpdate: function(time) {
      /* Bail out if animation not active */
      var active = self.hueFadeActive;
      if (!active) {
        return;
      }

      /* Animation termination condition */
      var startTime = self.hueFadeStartTime;
      var duration = self.hueFadeDuration;
      var endHue = self.hueFadeEndHue;
      if (time > startTime + duration) {
        self.hueFadeActive = false;
        self.hue = endHue;
        self.renderNeeded = true;
        return;
      }

      /* Calculate the intermediate hue for the fade effect */
      var startHue = self.hueFadeStartHue;
      var ratio = (time - self.hueFadeStartTime) / self.hueFadeDuration;
      var hue = [
        startHue[0] * (1 - ratio) + endHue[0] * ratio,
        startHue[1] * (1 - ratio) + endHue[1] * ratio,
        startHue[2] * (1 - ratio) + endHue[2] * ratio,
      ];
      self.hue = hue;
      self.renderNeeded = true;
    },

    /* This checks if the canvas size has changed, which means a redraw */
    canvasSizeUpdate: function() {
      var gl = self.gl;
      var canvas = gl.canvas;
      if (canvas.width != canvas.clientWidth ||
          canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        self.imageSizeUpdate();
        self.renderNeeded = true;
      }
    },

    /* Recalculate the texture coordinate space */
    imageSizeUpdate: function() {
      var img = self.img;
      var canvas = self.gl.canvas;

      /* For convenience, all calculations are done in canvas space. */

      /* Calculate the scaled image size */
      var scaleMode = self.scale;
      var canvasHeight = canvas.height;
      var canvasWidth = canvas.width;
      var scaledHeight = img.height;
      var scaledWidth = img.width;
      if (scaleMode == 1 ||
          (scaleMode == 2 && scaledHeight > canvasHeight)) {
        scaledWidth = scaledWidth * (canvasHeight / scaledHeight);
        scaledHeight = canvasHeight;
      }

      var imagePosition = {
        top: 0,
        bottom: scaledHeight,
        left: 0,
        right: scaledWidth
      };

      /* Calculate the vertical padding.
       * Image is always vertically centered.
       * vPadding is positive if image taller than the canvas, negative if
       * smaller than the canvas. */
      var vPadding = scaledHeight - canvasHeight;
      imagePosition.top = vPadding / 2;
      imagePosition.bottom = scaledHeight - (vPadding / 2);

      /* The horizontal padding depends on the alignment. */
      var hPadding = scaledWidth - canvasWidth;
      var smartAlign = self.smartAlign;
      var align = self.imageAlign;
      if (!smartAlign || align == 0) {
        imagePosition.left = hPadding / 2;
        imagePosition.right = scaledWidth - (hPadding / 2);
      } else if (align == 1) {
        imagePosition.left = 0;
        imagePosition.right = scaledWidth - hPadding;
      } else if (align == 2) {
        imagePosition.left = hPadding;
        imagePosition.right = scaledWidth;
      }

      /* Convert coordinates to GL texture space */
      imagePosition.top /= scaledHeight;
      imagePosition.bottom /= scaledHeight;
      imagePosition.left /= scaledWidth;
      imagePosition.right /= scaledWidth;

      self.imagePosition = imagePosition;
    },

    imageAnimationUpdate: function(time) {
      if (!self.imageAnimated) {
        return;
      }

      var frames = self.imageFrames;
      var frame = Math.floor(time / self.imageFrameDuration) % frames.length;

      if (frame == self.imageFrame) {
        return;
      }

      var img = frames[frame];
      var gl = self.gl;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, img);

      self.img = img;
      self.imageFrame = frame;

      self.imageSizeUpdate();
      self.renderNeeded = true;
    },

    blurUpdate: function(time) {
      /* Bail out if animation not active */
      var active = self.blurActive;
      if (!active) {
        return;
      }

      /* Animation termination condition */
      var startTime = self.blurStartTime;
      var duration = self.blurDecay;
      if (time > startTime + duration) {
        self.blurActive = false;
        self.blurX = 0;
        self.blurY = 0;
        self.renderNeeded = true;
        return;
      }

      var amount = 1.0 - (time - startTime) / duration;
      var radius = self.blurAmount;
      var direction = self.blurDirection;
      var img = self.img;
      if (direction == 0) {
        self.blurX = 0;
        self.blurY = (amount * radius) / img.height;
      } else {
        self.blurX = (amount * radius) / img.width;
        self.blurY = 0;
      }
      self.renderNeeded = true;
    },

    blackoutUpdate: function(time) {
      if (self.blackoutClear) {
        self.blackoutClear = false;
        self.blackoutFadeinActive = false;
        self.shortBlackoutActive = false;
        self.blackout = 0.0;
        self.renderNeeded = true;
        return;
      }

      var startTime = self.blackoutStartTime;
      if (self.blackoutFadeinActive) {
        if (time - startTime > 0.040) {
          self.blackoutFadeinActive = false;
          self.blackout = 1.0;
          self.renderNeeded = true;
        } else {
          self.blackout = (time - startTime) / 0.040;
          self.renderNeeded = true;
        }
      }

      if (self.shortBlackoutActive) {
        if (time > startTime + self.shortBlackoutDuration) {
          self.shortBlackoutActive = false;
          self.blackoutFadeinActive = false;
          self.blackout = 0.0;
          self.renderNeeded = true;
        }
      }
    },

    /* Perform any per-frame calculations needed for effect animations */
    frameCallback: function(time) {
      self.hueUpdate(time);
      self.blurUpdate(time);
      self.blackoutUpdate(time);
      self.imageAnimationUpdate(time);
      self.canvasSizeUpdate();

      if (self.renderNeeded) {
        self.renderFrame();
        self.renderNeeded = false;
      }
    },

    /* The awesome main function that actually renders a frame */
    renderFrame: function() {
      var gl = self.gl;
      var shader = self.shader;

      gl.useProgram(shader);

      /* Vertex shader */

      /* Set up the quad to render the screen on */
      var aPositionLoc = gl.getAttribLocation(shader, "a_position");
      var positionBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aPositionLoc);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      /* Set up the texture coordinates */
      var imagePosition = self.imagePosition;
      var aImagePositionLoc = gl.getAttribLocation(shader, "a_imagePosition");
      var imagePositionBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, imagePositionBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            imagePosition.left, imagePosition.top,
            imagePosition.right, imagePosition.top,
            imagePosition.left, imagePosition.bottom,
            imagePosition.right, imagePosition.bottom]),
          gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aImagePositionLoc);
      gl.vertexAttribPointer(aImagePositionLoc, 2, gl.FLOAT, false, 0, 0);

      /* Fragment shader */

      /* Horizontal/Vertical blur */
      var uBlur = gl.getUniformLocation(shader, "u_blur");
      gl.uniform2f(uBlur, self.blurX, self.blurY);

      var uFragBlur = gl.getUniformLocation(shader, "u_fragBlur");
      gl.uniform1i(uFragBlur, (self.blurX > 0 || self.blurY > 0) ? 1 : 0);

      /* Blend mode */
      var uBlendModeLoc = gl.getUniformLocation(shader, "u_blendMode");
      gl.uniform1i(uBlendModeLoc, self.blendMode);

      /* Blackout */
      var uBlackoutLoc = gl.getUniformLocation(shader, "u_blackout");
      gl.uniform1f(uBlackoutLoc, self.blackout);

      /* Hue */
      var uHueLoc = gl.getUniformLocation(shader, "u_hue");
      gl.uniform3fv(uHueLoc, self.hue);

      /* Do the actual draw command... */
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },

    /* Initialization-related stuff */

    /* Get an appropriately set up WebGL context for the canvas. */
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
          premultipliedAlpha: true
        };
        var gl = canvas.getContext("webgl", webglOpts) ||
          canvas.getContext("experimental-webgl", webglOpts);
        if (!gl) {
          return reject(Error("Unable to get a webgl canvas context"));
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        self.gl = gl;
        return resolve();
      });
    },

    /* Compile the shader program that runs the effects. */
    compileShader: function() {
      if (self.shader) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var gl = self.gl;
	var vertexShaderSource;
	var fragmentShaderSource;
        /* Select the blur fragment shader to use based on the number
         * of varying vectors available. More vectors gives better-looking
         * blur results */
	var varyings = gl.getParameter(gl.MAX_VARYING_VECTORS);
	if (varyings >= 27) {
          vertexShaderSource = vertexShaderSource_v27;
          fragmentShaderSource = fragmentShaderSource_header +
              fragmentShaderSource_blur_v27 + fragmentShaderSource_footer;
	} else if (varyings >= 15) {
          vertexShaderSource = vertexShaderSource_v15;
          fragmentShaderSource = fragmentShaderSource_header +
              fragmentShaderSource_blur_v15 + fragmentShaderSource_footer;
        } else if (varyings >= 9) {
          vertexShaderSource = vertexShaderSource_v9;
          fragmentShaderSource = fragmentShaderSource_header +
              fragmentShaderSource_blur_v9 + fragmentShaderSource_footer;
        } else {
          vertexShaderSource = vertexShaderSource_v1;
          fragmentShaderSource = fragmentShaderSource_header +
              fragmentShaderSource_blur_v1 + fragmentShaderSource_footer;
        }
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
        if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
          console.log("Shader link failure:");
          console.log(gl.getProgramInfoLog(shader));
          /* Try pulling out additional ANGLE logs if available */
          var angleDebug = gl.getExtension("WEBGL_debug_shaders");
          if (angleDebug) {
            console.log("Vertex Translated source:");
            console.log(angleDebug.getTranslatedShaderSource(vertexShader));
            console.log("Fragment Translated source:");
            console.log(angleDebug.getTranslatedShaderSource(fragmentShader));
          }
          return reject("Could not link shader program");
        }
        self.shader = shader;
        return resolve();
      });
    },

    /* Set up the image texture to load waifus into */
    setupImageTexture: function() {
      if (self.imageTexture) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var gl = self.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // TODO: allow switching between nearest and linear scaling?
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        self.imageTexture = texture;
        return resolve();
      });
    },

    /* Set up the various callback functions on the Hues object that will
     * trigger the effects.
     */
    setupCallbacks: function() {
      var hues = self.hues;
      hues.addEventListener("huechange", self.hueChangeCallback);
      hues.addEventListener("imagechange", self.imageChangeCallback);
      hues.addEventListener("verticalblureffect",
          self.verticalBlurEffectCallback);
      hues.addEventListener("horizontalblureffect",
          self.horizontalBlurEffectCallback);
      hues.addEventListener("blackouteffect", self.blackoutEffectCallback);
      hues.addEventListener("shortblackouteffect",
          self.shortBlackoutEffectCallback);
      hues.addEventListener("frame", self.frameCallback);
    },

    setupPromise: null,
    setup: function(hues, canvas) {
      self.hues = hues;
      var setupPromise = self.getWebglContext(canvas)
        .then(self.compileShader)
        .then(self.setupImageTexture)
        .then(self.setupCallbacks);
      self.setupPromise = setupPromise;
      return setupPromise;
    },
    setupComplete: function() {
      return self.setupPromise;
    }
  };
  return {
    setup: self.setup,
    setupComplete: self.setupComplete
  };
})();
