window.HuesEffect = (function() {
  "use strict";

  /* Shaders */

  /* The vertex shader simply passes through the vertex and image sampler
   * positions. Coordinate space is precalculated in Javascript. */
  var COMPOSITE_VERTEX_SOURCE_HEADER =
    "attribute vec2 a_position;\n" +
    "attribute vec2 a_imagePosition;\n";
  var COMPOSITE_VERTEX_SOURCE_NOBLUR =
    "varying vec2 v_imageSample;\n" +
    "void blur(vec2 position) {\n" +
    "  v_imageSample = position;\n" +
    "}\n";
  var COMPOSITE_VERTEX_SOURCE_BLUR_V9 =
    "varying vec2 v_blurSample[9];\n" +
    "uniform vec2 u_blur;\n" +
    "void blur(vec2 position) {\n" +
    "  v_blurSample[0] = position + u_blur * -1.00;\n" +
    "  v_blurSample[1] = position + u_blur * -0.75;\n" +
    "  v_blurSample[2] = position + u_blur * -0.50;\n" +
    "  v_blurSample[3] = position + u_blur * -0.25;\n" +
    "  v_blurSample[4] = position;\n" +
    "  v_blurSample[5] = position + u_blur *  0.25;\n" +
    "  v_blurSample[6] = position + u_blur *  0.50;\n" +
    "  v_blurSample[7] = position + u_blur *  0.75;\n" +
    "  v_blurSample[8] = position + u_blur *  1.00;\n" +
    "}\n";
  var COMPOSITE_VERTEX_SOURCE_BLUR_V15 =
    "varying vec2 v_blurSample[15];\n" +
    "uniform vec2 u_blur;\n" +
    "void blur(vec2 position) {\n" +
    "  v_blurSample[ 0] = position + u_blur * -1.000000000;\n" +
    "  v_blurSample[ 1] = position + u_blur * -0.857142857;\n" +
    "  v_blurSample[ 2] = position + u_blur * -0.714285714;\n" +
    "  v_blurSample[ 3] = position + u_blur * -0.571428571;\n" +
    "  v_blurSample[ 4] = position + u_blur * -0.428571429;\n" +
    "  v_blurSample[ 5] = position + u_blur * -0.285714286;\n" +
    "  v_blurSample[ 6] = position + u_blur * -0.142857143;\n" +
    "  v_blurSample[ 7] = position;\n" +
    "  v_blurSample[ 8] = position + u_blur *  0.142857143;\n" +
    "  v_blurSample[ 9] = position + u_blur *  0.285714286;\n" +
    "  v_blurSample[10] = position + u_blur *  0.428571429;\n" +
    "  v_blurSample[11] = position + u_blur *  0.571428571;\n" +
    "  v_blurSample[12] = position + u_blur *  0.714285714;\n" +
    "  v_blurSample[13] = position + u_blur *  0.857142857;\n" +
    "  v_blurSample[14] = position + u_blur *  1.000000000;\n" +
    "}\n";
  var COMPOSITE_VERTEX_SOURCE_BLUR_V27 =
    "varying vec2 v_blurSample[27];\n" +
    "uniform vec2 u_blur;\n" +
    "void blur(vec2 position) {\n" +
    "  v_blurSample[ 0] = position + u_blur * -1.000000000;\n" +
    "  v_blurSample[ 1] = position + u_blur * -0.923076923;\n" +
    "  v_blurSample[ 2] = position + u_blur * -0.846153846;\n" +
    "  v_blurSample[ 3] = position + u_blur * -0.769230769;\n" +
    "  v_blurSample[ 4] = position + u_blur * -0.692307692;\n" +
    "  v_blurSample[ 5] = position + u_blur * -0.615384615;\n" +
    "  v_blurSample[ 6] = position + u_blur * -0.538461538;\n" +
    "  v_blurSample[ 7] = position + u_blur * -0.461538462;\n" +
    "  v_blurSample[ 8] = position + u_blur * -0.384615385;\n" +
    "  v_blurSample[ 9] = position + u_blur * -0.307692308;\n" +
    "  v_blurSample[10] = position + u_blur * -0.230769231;\n" +
    "  v_blurSample[11] = position + u_blur * -0.153846154;\n" +
    "  v_blurSample[12] = position + u_blur * -0.076923077;\n" +
    "  v_blurSample[13] = position;\n" +
    "  v_blurSample[14] = position + u_blur *  0.076923077;\n" +
    "  v_blurSample[15] = position + u_blur *  0.153846154;\n" +
    "  v_blurSample[16] = position + u_blur *  0.230769231;\n" +
    "  v_blurSample[17] = position + u_blur *  0.307692308;\n" +
    "  v_blurSample[18] = position + u_blur *  0.384615385;\n" +
    "  v_blurSample[19] = position + u_blur *  0.461538462;\n" +
    "  v_blurSample[20] = position + u_blur *  0.538461538;\n" +
    "  v_blurSample[21] = position + u_blur *  0.615384615;\n" +
    "  v_blurSample[22] = position + u_blur *  0.692307692;\n" +
    "  v_blurSample[23] = position + u_blur *  0.769230769;\n" +
    "  v_blurSample[24] = position + u_blur *  0.846153846;\n" +
    "  v_blurSample[25] = position + u_blur *  0.923076923;\n" +
    "  v_blurSample[26] = position + u_blur * -1.000000000;\n" +
    "}\n";
  var COMPOSITE_VERTEX_SOURCE_FOOTER =
    "void main() {\n" +
    "  gl_Position = vec4(a_position, 0, 1);\n" +
    "  blur(a_imagePosition);\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_HEADER =
    "precision mediump float;\n" +
    "uniform float u_blackout;\n" +
    "uniform sampler2D u_image;\n" +
    "uniform vec3 u_hue;\n";
  var COMPOSITE_FRAGMENT_SOURCE_NOBLUR =
    "varying vec2 v_imageSample;\n" +
    "vec4 blur() {\n" +
    "  if (v_imageSample.x < 0.0 || v_imageSample.y < 0.0 ||\n" +
    "      v_imageSample.x > 1.0 || v_imageSample.y > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  return texture2D(u_image, v_imageSample);\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLUR_V9 =
    "varying vec2 v_blurSample[9];\n" +
    "vec4 blur() {\n" +
    "  if (v_blurSample[4].x < 0.0 || v_blurSample[4].y < 0.0 ||\n" +
    "      v_blurSample[4].x > 1.0 || v_blurSample[4].y > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  vec4 color = vec4(0.0);\n" +
    "  /* One dimensional discrete Gaussian kernel, 9 samples */\n" +
    "  /* sigma=1.5 samples, normalized */\n" +
    "  color += texture2D(u_image, v_blurSample[0]) * 0.008488;\n" +
    "  color += texture2D(u_image, v_blurSample[1]) * 0.038078;\n" +
    "  color += texture2D(u_image, v_blurSample[2]) * 0.111165;\n" +
    "  color += texture2D(u_image, v_blurSample[3]) * 0.211357;\n" +
    "  color += texture2D(u_image, v_blurSample[4]) * 0.261824;\n" +
    "  color += texture2D(u_image, v_blurSample[5]) * 0.211357;\n" +
    "  color += texture2D(u_image, v_blurSample[6]) * 0.111165;\n" +
    "  color += texture2D(u_image, v_blurSample[7]) * 0.038078;\n" +
    "  color += texture2D(u_image, v_blurSample[8]) * 0.008488;\n" +
    "  return color;\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLUR_V15 =
    "varying vec2 v_blurSample[15];\n" +
    "vec4 blur() {\n" +
    "  if (v_blurSample[7].x < 0.0 || v_blurSample[7].y < 0.0 ||\n" +
    "      v_blurSample[7].x > 1.0 || v_blurSample[7].y > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  vec4 color = vec4(0.0);\n" +
    "  /* One dimensional discrete Gaussian kernel, 15 samples */\n" +
    "  /* sigma=2.5 samples, normalized */\n" +
    "  color += texture2D(u_image, v_blurSample[ 0]) * 0.003320;\n" +
    "  color += texture2D(u_image, v_blurSample[ 1]) * 0.009267;\n" +
    "  color += texture2D(u_image, v_blurSample[ 2]) * 0.022087;\n" +
    "  color += texture2D(u_image, v_blurSample[ 3]) * 0.044948;\n" +
    "  color += texture2D(u_image, v_blurSample[ 4]) * 0.078109;\n" +
    "  color += texture2D(u_image, v_blurSample[ 5]) * 0.115911;\n" +
    "  color += texture2D(u_image, v_blurSample[ 6]) * 0.146884;\n" +
    "  color += texture2D(u_image, v_blurSample[ 7]) * 0.158949;\n" +
    "  color += texture2D(u_image, v_blurSample[ 8]) * 0.146884;\n" +
    "  color += texture2D(u_image, v_blurSample[ 9]) * 0.115911;\n" +
    "  color += texture2D(u_image, v_blurSample[10]) * 0.078109;\n" +
    "  color += texture2D(u_image, v_blurSample[11]) * 0.044948;\n" +
    "  color += texture2D(u_image, v_blurSample[12]) * 0.022087;\n" +
    "  color += texture2D(u_image, v_blurSample[13]) * 0.009267;\n" +
    "  color += texture2D(u_image, v_blurSample[14]) * 0.003320;\n" +
    "  return color;\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLUR_V27 =
    "varying vec2 v_blurSample[27];\n" +
    "vec4 blur() {\n" +
    "  if (v_blurSample[13].x < 0.0 || v_blurSample[13].y < 0.0 ||\n" +
    "      v_blurSample[13].x > 1.0 || v_blurSample[13].y > 1.0) {\n" +
    "    return vec4(0.0);\n" +
    "  }\n" +
    "  vec4 color = vec4(0.0);\n" +
    "  /* One dimensional discrete Gaussian kernel, 27 samples */\n" +
    "  /* sigma=4.5 samples, normalized */\n" +
    "  color += texture2D(u_image, v_blurSample[ 0]) * 0.001390;\n" +
    "  color += texture2D(u_image, v_blurSample[ 1]) * 0.002571;\n" +
    "  color += texture2D(u_image, v_blurSample[ 2]) * 0.004527;\n" +
    "  color += texture2D(u_image, v_blurSample[ 3]) * 0.007587;\n" +
    "  color += texture2D(u_image, v_blurSample[ 4]) * 0.012105;\n" +
    "  color += texture2D(u_image, v_blurSample[ 5]) * 0.018387;\n" +
    "  color += texture2D(u_image, v_blurSample[ 6]) * 0.026588;\n" +
    "  color += texture2D(u_image, v_blurSample[ 7]) * 0.036604;\n" +
    "  color += texture2D(u_image, v_blurSample[ 8]) * 0.047973;\n" +
    "  color += texture2D(u_image, v_blurSample[ 9]) * 0.059856;\n" +
    "  color += texture2D(u_image, v_blurSample[10]) * 0.071099;\n" +
    "  color += texture2D(u_image, v_blurSample[11]) * 0.080401;\n" +
    "  color += texture2D(u_image, v_blurSample[12]) * 0.086556;\n" +
    "  color += texture2D(u_image, v_blurSample[13]) * 0.086556;\n" +
    "  color += texture2D(u_image, v_blurSample[14]) * 0.086556;\n" +
    "  color += texture2D(u_image, v_blurSample[15]) * 0.080401;\n" +
    "  color += texture2D(u_image, v_blurSample[16]) * 0.071099;\n" +
    "  color += texture2D(u_image, v_blurSample[17]) * 0.059856;\n" +
    "  color += texture2D(u_image, v_blurSample[18]) * 0.047973;\n" +
    "  color += texture2D(u_image, v_blurSample[19]) * 0.036604;\n" +
    "  color += texture2D(u_image, v_blurSample[20]) * 0.026588;\n" +
    "  color += texture2D(u_image, v_blurSample[21]) * 0.018387;\n" +
    "  color += texture2D(u_image, v_blurSample[22]) * 0.012105;\n" +
    "  color += texture2D(u_image, v_blurSample[23]) * 0.007587;\n" +
    "  color += texture2D(u_image, v_blurSample[24]) * 0.004527;\n" +
    "  color += texture2D(u_image, v_blurSample[25]) * 0.002571;\n" +
    "  color += texture2D(u_image, v_blurSample[26]) * 0.001390;\n" +
    "  return color;\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLEND_PLAIN =
    "vec4 blend(vec4 sample) {\n" +
    "  return vec4(sample.rgb + u_hue * (1.0 - sample.a), 1.0);\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLEND_ALPHA =
    "vec4 blend(vec4 sample) {\n" +
    "  sample *= 0.7;\n" +
    "  return vec4(sample.rgb + u_hue * (1.0 - sample.a), 1.0);\n" +
    "}\n";
  var COMPOSITE_FRAGMENT_SOURCE_BLEND_HARDLIGHT =
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
    "vec4 blend(vec4 sample) {\n" +
    "  // First alpha blend the image onto solid white\n" +
    "  sample = vec4(sample.rgb + vec3(1.0) * (1.0 - sample.a), 1.0);\n" +
    "  // Then calculate the hard light result\n" +
    "  vec3 lit = overlay(u_hue, vec3(sample));\n" +
    "  // Then mix the two; 70% hard light\n" +
    "  return vec4(mix(vec3(sample), lit, 0.7), 1.0);\n" +
    "}\n";

  var COMPOSITE_FRAGMENT_SOURCE_FOOTER =
    "vec4 blackout(vec4 sample) {\n" +
    "  return mix(sample, vec4(0.0, 0.0, 0.0, 1.0), u_blackout);\n" +
    "}\n" +
    "void main() {\n" +
    "  vec4 blurSample = blur();\n" +
    "  vec4 blendSample = blend(blurSample);\n" +
    "  vec4 blackoutSample = blackout(blendSample);\n" +
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
     * Default, to match flash, is 128. Setting this to 0 disables blur.
     */
    blurAmount: 0x80,

    /* Internal state */

    /* The Hues object that handles the music syncing and effect parsing */
    hues: null,

    /* The webgl context being used for rendering */
    gl: null,

    /* Canvas saved width and height, to detect resizes */
    canvasClientWidth: 0,
    canvasClientHeight: 0,

    /* The compiled shader programs */
    resampleShader: null,
    compositeShader: null,
    compositeNoblurShader: null,

    /* Vertex buffers */
    resamplePositionBuf: null,
    positionBuf: null,
    imagePositionBuf: null,

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
    image: null,
    imageAnimated: false,
    imageFrame: 0,
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
    /* For synchronized animations */
    imageBeatSync: 0,
    songBeatSync: 0,
    songStartTime: 0,
    songBeatDuration: 0,

    /* Stuff for blur calculations */
    blurActive: false,
    /* Blur direction is 0 for vertical, 1 for horizontal */
    blurDirection: 0,
    blurStartTime: 0,
    blurX: 0,
    blurY: 0,

    /* Blackout calculations */
    blackoutActive: false,
    blackoutClear: false,
    blackoutFadeinActive: false,
    shortBlackoutActive: false,
    shortBlackoutDuration: 0,
    blackoutStartTime: 0,
    blackout: 0.0,

    /* Loading callbacks */

    imageLoadCallback: function(image, blob) {
      var img = document.createElement("img");
      img.addEventListener("load", function() {
        var gl = self.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // TODO: allow switching between nearest and linear scaling?
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, img);

        image.texture = texture;
        image.width = img.naturalWidth;
        image.height = img.naturalHeight;
      });
      img.src = URL.createObjectURL(blob);
    },

    imageFrameLoadCallback: function(image, frame, blob) {
      if (typeof(image.textures) === "undefined") {
        image.textures = [];
      }

      var img = document.createElement("img");
      img.addEventListener("load", function() {
        var gl = self.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // TODO: allow switching between nearest and linear scaling?
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, gl.ALPHA, gl.UNSIGNED_BYTE, img);

        image.textures[frame - 1] = texture;
        image.width = img.naturalWidth;
        image.height = img.naturalHeight;
      });
      img.src = URL.createObjectURL(blob);
    },

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
      var img = imageInfo.img;
      var texture = imageInfo.texture;

      switch (imageInfo.align) {
      case "left": self.imageAlign = 1; break;
      case "right": self.imageAlign = 2; break;
      default: self.imageAlign = 0; break;
      }

      self.image = imageInfo;

      if (texture) {
        self.imageAnimated = false;
        self.imageTexture = texture;
      } else {
        if (imageInfo.name == "Lain" && !self.seenLain) {
          self.seenLain = true;
          console.log("Are you Lain of the Wired? Who are you really?");
        }

        self.imageAnimated = true;
        self.imageFrame = -1;
        self.imageFrames = imageInfo.animation;
        self.imageStartTime = startTime;
        self.imageFrameDuration = imageInfo.frameDuration / 1000;
        /* Texture is handled in the imageAnimationUpdate() function */

        var beatSync = parseFloat(imageInfo.beatSync);
        if (isFinite(beatSync)) {
          self.imageBeatSync = beatSync;
        } else {
          self.imageBeatSync = 0;
        }
      }

      self.imageSizeUpdate();
      self.imageBeatSyncUpdate();
      self.renderNeeded = true;
    },

    songChangeCallback: function(song, loopStart, buildStart, beatDuration) {
      var beatSync = parseFloat(song.beatSync);
      if (isFinite(beatSync)) {
        self.songBeatSync = beatSync;
      } else {
        self.songBeatSync = 0;
      }
      self.songStartTime = loopStart;
      self.songBeatDuration = beatDuration;
      self.imageBeatSyncUpdate();
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
        /* ++ should behave like +. to match flash, so only do the blackout
         * fade animation if blackout isn't currently active */
        if (!self.blackoutActive) {
          self.blackoutClear = false;
          self.blackoutFadeinActive = true;
        }
      } else {
        self.blackoutClear = true;
      }
      self.blackoutActive = blackoutActive;
      self.blackoutStartTime = beatTime;
    },

    shortBlackoutEffectCallback: function(beatTime, duration) {
      self.blackoutClear = false;
      self.shortBlackoutActive = true;
      /* If you get a combination +|, the short blackout on the | continues the
       * blackout from the +, rather than redoing the fade. */
      if (!self.blackoutActive) {
        self.blackoutFadeinActive = true;
      }
      self.blackoutActive = false;
      self.blackoutStartTime = beatTime;
      self.shortBlackoutDuration = duration;
    },

    fadeHueEffectCallback: function(beatTime, duration, prevHue, newHue) {
      /* TODO: This might be handled by huechange later */
      self.hueFadeActive = true;
      self.hueFadeStartTime = beatTime;
      self.hueFadeDuration = duration;
      self.hueFadeStartHue = prevHue.rgb;
      self.hueFadeEndHue = newHue.rgb;
      self.renderNeeded = true;
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
      if (self.canvasClientWidth != canvas.clientWidth ||
          self.canvasClientHeight != canvas.clientHeight) {
        console.log("Updating canvas size");
	var ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(canvas.clientWidth * ratio);
        canvas.height = Math.round(canvas.clientHeight * ratio);
	self.canvasClientWidth = canvas.clientWidth;
	self.canvasClientHeight = canvas.clientHeight;

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
      var image = self.image;
      var scaledHeight = image.height;
      var scaledWidth = image.width;
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
      imagePosition.top = Math.floor(vPadding / 2);
      imagePosition.bottom = Math.floor(scaledHeight - (vPadding / 2));

      /* The horizontal padding depends on the alignment. */
      var hPadding = scaledWidth - canvasWidth;
      var smartAlign = self.smartAlign;
      var align = self.imageAlign;
      if (!smartAlign || align == 0) {
        imagePosition.left = Math.floor(hPadding / 2);
        imagePosition.right = Math.floor(scaledWidth - (hPadding / 2));
      } else if (align == 1) {
        imagePosition.left = 0;
        imagePosition.right = scaledWidth - hPadding;
      } else if (align == 2) {
        imagePosition.left = hPadding;
        imagePosition.right = scaledWidth;
      }

      image.scaledHeight = scaledHeight;
      image.scaledWidth = scaledWidth;

      /* Convert coordinates to GL texture space */
      imagePosition.top /= scaledHeight;
      imagePosition.bottom /= scaledHeight;
      imagePosition.left /= scaledWidth;
      imagePosition.right /= scaledWidth;

      self.imagePosition = imagePosition;

      var gl = self.gl;
      var imagePositionBuf = self.imagePositionBuf;
      gl.bindBuffer(gl.ARRAY_BUFFER, imagePositionBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            imagePosition.left, imagePosition.top,
            imagePosition.right, imagePosition.top,
            imagePosition.left, imagePosition.bottom,
            imagePosition.right, imagePosition.bottom]),
          gl.DYNAMIC_DRAW);
    },

    imageBeatSyncUpdate: function() {
      if (self.imageBeatSync > 0 && self.songBeatSync > 0) {
        var image = self.image;

        self.imageStartTime = self.songStartTime;
        self.imageFrameDuration = self.songBeatDuration *
            self.songBeatSync * self.imageBeatSync /
            image.textures.length;

        console.log("Beat sync image: " + self.imageBeatSync + " song: " +
            self.songBeatSync + " beat duration: " + self.songBeatDuration +
            " frames: " + image.textures.length +
            " calculated frame duration: " + self.imageFrameDuration);
      }
    },

    imageAnimationUpdate: function(time) {
      if (!self.imageAnimated) {
        return;
      }

      var image = self.image;

      var textures = image.textures;
      var frame;
      if (time < self.imageStartTime) {
        frame = textures.length +
          Math.floor((time - self.imageStartTime) /
              self.imageFrameDuration) % textures.length - 1;
      } else {
        frame = Math.floor((time - self.imageStartTime) /
            self.imageFrameDuration) % textures.length;
      }

      if (frame == self.imageFrame) {
        return;
      }

      var texture = image.textures[frame];

      self.imageTexture = texture;

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

      /* In the flash, the blur decays by half every frame.
       * I've turned that into a continuous function, assuming 60fps. */
      var startTime = self.blurStartTime;
      var radius = self.blurAmount * Math.pow(2, -(time - startTime) * 60);

      /* Termination condition */
      if (radius < 0.5) {
        self.blurActive = false;
        self.blurX = 0;
        self.blurY = 0;
        self.renderNeeded = true;
        return;
      }

      var direction = self.blurDirection;
      var canvas = self.gl.canvas;
      var image = self.image;
      if (direction == 0) {
        self.blurX = 0;
        self.blurY = radius / image.scaledHeight;
      } else {
        self.blurX = radius / image.scaledWidth;
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

      var shader = self.compositeShader;
      if (self.blurX > 0 || self.blurY > 0) {
        shader = self.compositeShader;
      } else {
        shader = self.compositeNoblurShader;
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

      gl.useProgram(shader);

      /* Vertex shader */

      //gl.bindTexture(gl.TEXTURE_2D, self.compositeTexture);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, self.imageTexture);
      var uImageLoc = gl.getUniformLocation(shader, "u_image");
      gl.uniform1i(uImageLoc, 0);

      /* Set up the quad to render the screen on */
      var aPositionLoc = gl.getAttribLocation(shader, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, self.positionBuf);
      gl.enableVertexAttribArray(aPositionLoc);
      gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

      /* Set up the texture coordinates */
      var aImagePositionLoc = gl.getAttribLocation(shader, "a_imagePosition");
      gl.bindBuffer(gl.ARRAY_BUFFER, self.imagePositionBuf);
      gl.enableVertexAttribArray(aImagePositionLoc);
      gl.vertexAttribPointer(aImagePositionLoc, 2, gl.FLOAT, false, 0, 0);

      /* Fragment shader */

      /* Horizontal/Vertical blur */
      var uBlur = gl.getUniformLocation(shader, "u_blur");
      gl.uniform2f(uBlur, self.blurX, self.blurY);

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

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        self.gl = gl;

        return resolve();
      });
    },

    compileOneShader: function(vertexShaderSource, fragmentShaderSource) {
      var gl = self.gl;
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log("Vertex shader compile failure:");
        console.log(gl.getShaderInfoLog(vertexShader));
        throw new Error("Could not compile vertex shader");
      }
      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log("Fragment shader compile failure:");
        console.log(gl.getShaderInfoLog(fragmentShader));
        throw new Error("Could not compile fragment shader");
      }
      var shader = gl.createProgram();
      gl.attachShader(shader, vertexShader);
      gl.attachShader(shader, fragmentShader);
      gl.linkProgram(shader);
      if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
        console.log("Shader link failure:");
        console.log(gl.getProgramInfoLog(shader));
        /* Try pulling out additional ANGLE logs if available */
        var webglDebug = gl.getExtension("WEBGL_debug_shaders");
        if (webglDebug) {
          console.log("Vertex Translated source:");
          console.log(webglDebug.getTranslatedShaderSource(vertexShader));
          console.log("Fragment Translated source:");
          console.log(webglDebug.getTranslatedShaderSource(fragmentShader));
        }
        throw new Error("Could not link shader program");
      }
      return shader;
    },

    /* Compile the shader programs that run the effects. */
    compileShader: function() {
      return new Promise(function(resolve, reject) {
        var gl = self.gl;
	var varyings = gl.getParameter(gl.MAX_VARYING_VECTORS);
	console.log("Compiling shaders for MAX_VARYING_VECTORS=" + varyings);

	var vertexShaderSource;
	var fragmentShaderSource;

        /* Compile the compositing shader */

        /* Determine which blend function to use */
        var fragmentBlendSource;
        switch (self.blendMode) {
        case 0:
          fragmentBlendSource = COMPOSITE_FRAGMENT_SOURCE_BLEND_PLAIN;
          break;
        case 1:
          fragmentBlendSource = COMPOSITE_FRAGMENT_SOURCE_BLEND_ALPHA;
          break;
        case 2:
          fragmentBlendSource = COMPOSITE_FRAGMENT_SOURCE_BLEND_HARDLIGHT;
          break;
        default:
          throw new Error("Unsupported blend mode: " + self.blendMode);
        }

        /* Compile the "noblur" composite shader
         * When no blur is active, saves a whole bunch of texture lookups. */
        vertexShaderSource = COMPOSITE_VERTEX_SOURCE_HEADER +
          COMPOSITE_VERTEX_SOURCE_NOBLUR + COMPOSITE_VERTEX_SOURCE_FOOTER;
        fragmentShaderSource = COMPOSITE_FRAGMENT_SOURCE_HEADER +
          COMPOSITE_FRAGMENT_SOURCE_NOBLUR + fragmentBlendSource +
          COMPOSITE_FRAGMENT_SOURCE_FOOTER;
        self.compositeNoblurShader = self.compileOneShader(
            vertexShaderSource, fragmentShaderSource);

        /* Select the blur fragment shader to use based on the number
         * of varying vectors available. More vectors gives better-looking
         * blur results */
	if (varyings >= 27) {
          vertexShaderSource = COMPOSITE_VERTEX_SOURCE_HEADER +
            COMPOSITE_VERTEX_SOURCE_BLUR_V27 + COMPOSITE_VERTEX_SOURCE_FOOTER;
          fragmentShaderSource = COMPOSITE_FRAGMENT_SOURCE_HEADER +
            COMPOSITE_FRAGMENT_SOURCE_BLUR_V27 + fragmentBlendSource +
            COMPOSITE_FRAGMENT_SOURCE_FOOTER;
	} else if (varyings >= 15) {
          vertexShaderSource = COMPOSITE_VERTEX_SOURCE_HEADER +
            COMPOSITE_VERTEX_SOURCE_BLUR_V15 + COMPOSITE_VERTEX_SOURCE_FOOTER;
          fragmentShaderSource = COMPOSITE_FRAGMENT_SOURCE_HEADER +
            COMPOSITE_FRAGMENT_SOURCE_BLUR_V15 + fragmentBlendSource +
            COMPOSITE_FRAGMENT_SOURCE_FOOTER;
        } else if (varyings >= 9) {
          vertexShaderSource = COMPOSITE_VERTEX_SOURCE_HEADER +
            COMPOSITE_VERTEX_SOURCE_BLUR_V9 + COMPOSITE_VERTEX_SOURCE_FOOTER;
          fragmentShaderSource = COMPOSITE_FRAGMENT_SOURCE_HEADER +
            COMPOSITE_FRAGMENT_SOURCE_BLUR_V9 + fragmentBlendSource +
            COMPOSITE_FRAGMENT_SOURCE_FOOTER;
        }

        if (varyings >= 9) {
          self.compositeShader = self.compileOneShader(
              vertexShaderSource, fragmentShaderSource);
        } else {
          self.compositeShader = self.compositeNoblurShader;
        }

        return resolve();
      });
    },

    setupVertexBuffers: function() {
      if (self.positionBuf && self.imagePositionBuf) {
        return Promise.resolve();
      }
      return new Promise(function(resolve, reject) {
        var gl = self.gl;
        var positionBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
              -1, 1, 1, 1, -1, -1, 1, -1]),
            gl.STATIC_DRAW);
        self.positionBuf = positionBuf;

        var imagePositionBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, imagePositionBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
              0, 0, 1, 0, 0, 1, 1, 1]),
            gl.DYNAMIC_DRAW);
        self.imagePositionBuf = imagePositionBuf;
        return resolve();
      });
    },

    /* Set up the various callback functions on the Hues object that will
     * trigger the effects.
     */
    setupCallbacks: function() {
      var hues = self.hues;
      hues.addEventListener("imageload", self.imageLoadCallback);
      hues.addEventListener("imageframeload", self.imageFrameLoadCallback);
      hues.addEventListener("huechange", self.hueChangeCallback);
      hues.addEventListener("imagechange", self.imageChangeCallback);
      hues.addEventListener("songchange", self.songChangeCallback);
      hues.addEventListener("verticalblureffect",
          self.verticalBlurEffectCallback);
      hues.addEventListener("horizontalblureffect",
          self.horizontalBlurEffectCallback);
      hues.addEventListener("blackouteffect", self.blackoutEffectCallback);
      hues.addEventListener("shortblackouteffect",
          self.shortBlackoutEffectCallback);
      hues.addEventListener("fadehueeffect", self.fadeHueEffectCallback);
      hues.addEventListener("frame", self.frameCallback);
    },

    setupPromise: null,
    setup: function(hues, canvas) {
      self.hues = hues;
      var setupPromise = self.getWebglContext(canvas)
        .then(self.compileShader)
        .then(self.setupVertexBuffers)
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
    setupComplete: self.setupComplete,
    renderFrame: function() {
      self.frameCallback(0);
    }
  };
})();
