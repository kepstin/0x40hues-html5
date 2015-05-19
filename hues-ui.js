/* Approximation of Retro UI */
(function() {
  "use strict";
  var selector = window.huesConfig["uiSelector"];
  var autoPlay = window.huesConfig["autoPlay"];
  if (typeof(selector) === 'undefined') {
    selector = 'body';
  }
  if (typeof(autoPlay) === 'undefined') {
    autoPlay = false;
  }

  var HuesUI = {};

  var setupRootElement = function() {
    var rootElement = document.querySelector(selector);
    if (!rootElement) {
      return Promise.reject(Error("Cannot find requested root element " +
            rootElement + " on page."));
    }
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    return Promise.resolve(rootElement);
  }

  var setupStatusMode = function(statusDiv) {
    var modeDiv = document.createElement("div");
    statusDiv.appendChild(modeDiv);
    var modeLabel = document.createElement("span");
    modeLabel.textContent = "M=";
    modeDiv.appendChild(modeLabel);
    var modeField = document.createElement("span");
    modeField.textContent = "undefined";
    modeDiv.appendChild(modeField);

    var updateModeField = function(autoMode) {
      if (autoMode) {
        modeField.textContent = "FULL AUTO";
      } else {
        modeField.textContent = "NORMAL";
      }
    };
    updateModeField(Hues.getAutoMode());
    Hues.addEventListener("automodechange", updateModeField);
  }

  var setupStatusImage = function(statusDiv) {
    var imageDiv = document.createElement("div");
    statusDiv.appendChild(imageDiv);
    var imageLabel = document.createElement("span");
    imageLabel.textContent = "I=";
    imageDiv.appendChild(imageLabel);
    var imageField = document.createElement("span");
    imageField.textContent = "undefined";
    imageDiv.appendChild(imageField);

    var updateImageField = function(imageInfo) {
      imageField.textContent = imageInfo["name"].toUpperCase();
    }
    updateImageField(Hues.getCurrentImage());
    Hues.addEventListener("imagechange", updateImageField);
  };

  var setupStatusBeatNum = function(statusDiv) {
    var beatDiv = document.createElement("div");
    statusDiv.appendChild(beatDiv);
    var beatLabel = document.createElement("span");
    beatLabel.textContent = "B=$0x";
    beatDiv.appendChild(beatLabel);
    var beatField = document.createElement("span");
    beatField.textContent = "0000";
    beatDiv.appendChild(beatField);

    var updateBeatField = function(beat) {
      var beatNum = "0";
      if (beat["buildup"] !== null) {
        beatNum = beat["buildup"].toString(16);
      } else if (beat["loop"] !== null) {
        beatNum = beat["loop"].toString(16);
      }
      var padding = 4 - beatNum.length;
      if (padding > 0) {
        beatNum = "0".repeat(padding) + beatNum;
      }
      beatField.textContent = beatNum.toUpperCase();
    };
    Hues.addEventListener("beat", updateBeatField);
  };

  var setupStatusHue = function(statusDiv) {
    var hueDiv = document.createElement("div");
    statusDiv.appendChild(hueDiv);
    var hueLabel = document.createElement("span");
    hueLabel.textContent = "C=$0x";
    hueDiv.appendChild(hueLabel);
    var hueField = document.createElement("span");
    hueDiv.appendChild(hueField);

    var updateHueField = function(hueInfo) {
      var hueNum = hueInfo["index"].toString(16);
      if (hueNum.length < 2) {
        hueNum = "0" + hueNum;
      }
      hueField.textContent = hueNum.toUpperCase();
    };
    updateHueField(Hues.getCurrentHue());
    Hues.addEventListener("huechange", updateHueField);
  };

  var setupStatusHueName = function(statusDiv) {
    var hueField = document.createElement("div");
    statusDiv.appendChild(hueField);

    var updateHueField = function(hueInfo) {
      hueField.textContent = hueInfo["hue"]["name"].toUpperCase();
    }
    updateHueField(Hues.getCurrentHue());
    Hues.addEventListener("huechange", updateHueField);
  };

  var setupStatusSong = function(statusDiv) {
    var songField = document.createElement("div");
    statusDiv.appendChild(songField);

    var updateSongField = function(song) {
      if (song) {
        songField.textContent = song["title"].toUpperCase();
      } else {
        songField.textContent = "[UNDEFINED]";
      }
    }
    updateSongField(Hues.getCurrentSong());
    Hues.addEventListener("songchange", updateSongField);
  }

  var setupStatusBeats = function(statusDiv) {
    var beatsDiv = document.createElement("div");
    beatsDiv.style.overflowX = "hidden";
    beatsDiv.style.whiteSpace = "nowrap";
    statusDiv.appendChild(beatsDiv);
    var beatsLabel = document.createElement("span");
    beatsLabel.textContent = ">>";
    beatsDiv.appendChild(beatsLabel);
    var beatsField = document.createElement("span");
    beatsDiv.appendChild(beatsField);

    var updateBeats = function(beat) {
      var beats = Hues.getBeatString();
      beatsField.textContent = beats;
    }
    Hues.addEventListener("beat", updateBeats);
  }

  var setupStatusArea = function(rootElement) {
    var statusDiv = document.createElement("div");
    statusDiv.style.position = "absolute";
    statusDiv.style.left = "0";
    statusDiv.style.right = "0";
    statusDiv.style.bottom = "0";
    rootElement.appendChild(statusDiv);

    setupStatusMode(statusDiv);
    setupStatusImage(statusDiv);
    setupStatusBeatNum(statusDiv);
    setupStatusHue(statusDiv);
    setupStatusHueName(statusDiv);
    setupStatusSong(statusDiv);
    setupStatusBeats(statusDiv);

    return Promise.resolve(rootElement);
  }

  var setupCanvas = function(rootElement) {
    var canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.display = "block";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.right = "0";
    canvas.style.bottom = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = rootElement.clientWidth;
    canvas.height = rootElement.clientHeight;
    rootElement.appendChild(canvas);

    var resizeCanvas = function() {
      canvas.width = rootElement.clientWidth;
      canvas.height = rootElement.clientHeight;
    };
    window.addEventListener('resize', resizeCanvas, false);

    var imageCanvas = document.createElement("canvas");
    var imageCtx = imageCanvas.getContext("2d");
    var updateImage = function(imageInfo) {
      var img = imageInfo["img"];
      if (typeof(img) === "undefined") {
        /* TODO: animation */
        return;
      }
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;
      imageCtx.fillStyle = "white";
      imageCtx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
      imageCtx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);
    };
    updateImage(Hues.getCurrentImage());
    Hues.addEventListener("imagechange", updateImage);

    var ctx = canvas.getContext("2d");
    var updateHue = function(hueInfo) {
      ctx.save();
      ctx.fillStyle = hueInfo["hue"]["hex"];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height);
      ctx.restore();
    };
    updateHue(Hues.getCurrentHue());
    Hues.addEventListener("huechange", updateHue);

    return Promise.resolve(rootElement);
  };

  var setupKeyHandlers = function(rootElement) {
    /* Even though we have the root element, keys are going to be installed
     * on the window. */

    /* Arrow keys don't have "press" events */
    window.addEventListener("keyup", function(e) {
      if (e.keyCode == 38) {
        console.log("Up Arrow - Next Song");
        Hues.nextSong();
      } else if (e.keyCode == 40) {
        console.log("Down Arrow - Previous Song");
        /* Down Arrow - Previous Song */
        Hues.prevSong();
      }
    });
  }
  
  var initialize = function() {
    var rootElement = setupRootElement();
    var respack = Hues.loadDefaultRespack();

    return Promise.all([rootElement, respack])
    .then(function(args) { return args[0]; })
    .then(setupCanvas)
    .then(setupStatusArea)
    .then(setupKeyHandlers)
    .then(function() {
      if (autoPlay) { return Hues.playSong(); }
    }).catch(function(error) {
      console.log(error);
    });
  }
  HuesUI["initialize"] = initialize;

  window.HuesUI = HuesUI;
})();

if (document.readyState == "complete") {
  HuesUI.initialize();
} else {
  document.addEventListener("readystatechange", function() {
    if (document.readyState == "complete") {
      HuesUI.initialize();
    }
  });
}
