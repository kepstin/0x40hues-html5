/* Approximation of Retro UI */
(function() {
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

    var updateBeats = function() {
      var beats = Hues.getBeatString();
      if (beats) {
        beatsField.textContent = beats;
      } else {
        beatsField.textContent = "";
      }
      window.requestAnimationFrame(updateBeats);
    }
    window.requestAnimationFrame(updateBeats);
  }

  var setupStatusArea = function(rootElement) {
    var statusDiv = document.createElement("div");
    statusDiv.style.position = "absolute";
    statusDiv.style.left = "0";
    statusDiv.style.right = "0";
    statusDiv.style.bottom = "0";
    rootElement.appendChild(statusDiv);

    setupStatusMode(statusDiv);
    setupStatusSong(statusDiv);
    setupStatusBeats(statusDiv);

    return Promise.resolve(statusDiv);
  }

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
    var components = [];

    components.push(rootElement.then(setupStatusArea));

    Promise.all(components)
    .then(Hues.loadDefaultRespack)
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
