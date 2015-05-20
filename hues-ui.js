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
      if (beat["buildup"] !== null) {
        beatNum += " (BUILD)";
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

  var setupStatusCredits = function(statusDiv) {
    var creditsDiv = document.createElement("div");
    creditsDiv.style.opacity = "0.50";
    statusDiv.appendChild(creditsDiv);
    var creditsLink = document.createElement("a");
    creditsLink.href = "https://github.com/kepstin/0x40hues-html5";
    creditsLink.textContent = "0x40 HUES OF HTML5 BY KEPSTIN";
    creditsLink.target = "_blank";
    creditsDiv.appendChild(creditsLink);
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
    setupStatusCredits(statusDiv);
    setupStatusBeats(statusDiv);

    return Promise.resolve(rootElement);
  }

  var setupProgress = function(rootElement) {
    return new Promise(function(resolve, reject) {
      var progressDiv = document.createElement("div");
      progressDiv.style.position = "relative";
      progressDiv.style.top = "50%";
      progressDiv.style.transform = "translateY(-50%);"
      progressDiv.style.textAlign = "center";
      progressDiv.style.fontSize = "600%";
      rootElement.appendChild(progressDiv);

      var completed = 0;
      var total = 0;
      var updateProgress = function() {
        var progress;
        if (total == 0) {
          progress = 0;
        } else {
          progress = completed / total;
        }
        progress = Math.floor(progress * 64);

        var progressStr = progress.toString(16);
        var padding = 2 - progressStr.length;
        if (padding > 0) {
          progressStr = "0".repeat(padding) + progressStr;
        }
        progressDiv.textContent = "0x" + progressStr;
      };
      Hues.addEventListener("progressstart", function() {
        completed = 0;
        total = 0;
        progressDiv.style.display = "block";
        updateProgress();
      });
      Hues.addEventListener("progress", function(done, added) {
        completed += done;
        total += added;
        updateProgress();
      });
      Hues.addEventListener("progressend", function() {
        setTimeout(function() {
          progressDiv.style.display = "none";
          resolve(rootElement);
        }, 500);
      });
    });
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

    var currentImageInfo = null;
    var imageCanvas = document.createElement("canvas");
    var imageCtx = imageCanvas.getContext("2d");
    var updateImage = function(imageInfo) {
      var img = imageInfo["img"];
      if (typeof(img) === "undefined") {
        return;
      }
      currentImageInfo = imageInfo;
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

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      var scaledWidth = (canvas.height / imageCanvas.height) *
          imageCanvas.width;
      switch (currentImageInfo["align"]) {
      case "left":
        ctx.drawImage(imageCanvas, 0, 0, scaledWidth, canvas.height);
        break;
      case "right":
        ctx.drawImage(imageCanvas, canvas.width - scaledWidth, 0,
            scaledWidth, canvas.height);
        break;
      case "center":
        ctx.drawImage(imageCanvas, (canvas.width - scaledWidth) / 2, 0,
            scaledWidth, canvas.height);
        break;
      }
      ctx.globalCompositeOperation = "hard-light";
      ctx.fillStyle = hueInfo["hue"]["hex"];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    var progress = rootElement.then(setupProgress);
    var respack = rootElement.then(Hues.loadDefaultRespack);

    return Promise.all([rootElement, progress, respack])
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
