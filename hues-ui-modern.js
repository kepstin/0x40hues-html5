/* 0x40 Hues of HTML5
 * "Modern" style UI controls
 *
 * Copyright (c) 2015 Calvin Walton <calvin.walton@kepstin.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

window.HuesUIModern = (function() {
  "use strict";
  var Self = (function() {
    var Self = function(hues) {
      this.hues = hues;

      this.root = null;
      this.huesRoot = null;

      this.beatBar = null
      this.beatLeft = null
      this.beatRight = null
      this.beatCenter = null

      this.controls = null

      this.imageName = null
      this.imageNameLink = null
      this.imageNameText = null
      this.imageNameTextLength = null
      this.imageNameClientWidth = null

      this.songTitle = null
      this.songTitleLink = null
      this.songTitleText = null
      this.songTitleTextLength = null
      this.songTitleClientWidth = null

      this.hueName = null

      this.volInput = null
      this.volLabel = null

      this.imagesMode = null

      this.queuedResizeImageName = null
      this.queuedResizeSongTitle = null

      this.charWidthNormal = null
      this.charWidthSmall = null

      Object.seal(this)
    }

    Self.prototype.updateBeatBar = function(beat) {
      var beats = this.hues.getBeatString()

      var current = beats[0]
      var rest = beats.slice(1)

      this.beatLeft.textContent = rest
      this.beatRight.textContent = rest


      if (current != ".") {
        while (this.beatCenter.firstElementChild) {
          this.beatCenter.removeChild(this.beatCenter.firstElementChild)
        }
        var span = this.beatCenter.ownerDocument.createElement("span")
        span.textContent = current
        this.beatCenter.appendChild(span)
      }
    }

    Self.prototype.resizeImageName = function() {
      var link = this.imageNameLink

      var className = ""
      if (this.imageNameTextLength * this.charWidthNormal > this.imageNameClientWidth) {
        className = "small";
      }
      if (this.imageNameTextLength * this.charWidthSmall > this.imageNameClientWidth) {
        className = "x-small";
      }
      link.className = className;
    }

    Self.prototype.handleQueuedResizeImageName = function() {
      var link = this.imageNameLink;
      this.imageNameClientWidth = link.clientWidth;
      this.resizeImageName()
      this.queuedResizeImageName = null;
    }

    Self.prototype.updateImageName = function(image) {
      var link = this.imageNameLink
      var text = this.imageNameText

      link.href = image.source

      var textContent = image.fullname.toUpperCase()
      text.textContent = textContent
      this.imageNameTextLength = textContent.length;

      this.resizeImageName()
    }

    Self.prototype.setupCharWidth = function(link, text) {
      var textContent = "";
      for (var i = 0; i < 100; i++) {
        textContent += "0";
      }
      text.textContent = textContent;

      this.charWidthNormal = text.offsetWidth / 100;

      link.className = "small";

      this.charWidthSmall = text.offsetWidth / 100;

      text.textContent = "";
    }

    Self.prototype.updateSongTitle = function(song) {
      var link = this.songTitleLink
      var text = this.songTitleText

      link.href = song.source

      var textContent = song.title.toUpperCase()
      text.textContent = textContent
      this.songTitleTextLength = textContent.length;

      this.resizeSongTitle()
    }

    Self.prototype.resizeSongTitle = function() {
      var link = this.songTitleLink

      var className = ""
      if (this.songTitleTextLength * this.charWidthNormal > this.songTitleClientWidth) {
        className = "small";
      }
      if (this.songTitleTextLength * this.charWidthSmall > this.songTitleClientWidth) {
        className = "x-small";
      }
      link.className = className;
    }

    Self.prototype.handleQueuedResizeSongTitle = function() {
      var link = this.songTitleLink;
      this.songTitleClientWidth = link.clientWidth;
      this.resizeSongTitle()
      this.queuedResizeSongTitle = null;
    }

    Self.prototype.updateHueName = function(hueInfo) {
      var hueName = this.hueName

      hueName.textContent = hueInfo.hue.name.toUpperCase()
    }

    Self.prototype.handleResize = function() {
      if (!this.queuedResizeSongTitle) {
        this.queuedResizeSongTitle = window.requestAnimationFrame(
            this.handleQueuedResizeSongTitle.bind(this))
      }
      if (!this.queuedResizeImageName) {
        this.queuedResizeImageName = window.requestAnimationFrame(
            this.handleQueuedResizeImageName.bind(this))
      }
    }

    Self.prototype.updateVolume = function(muted, gain) {
      var label = this.volLabel
      var input = this.volInput

      var text = gain.toFixed(1) + "dB"
      if (muted) {
        text = "(" + text + ")"
      }
      label.textContent = text
      input.value = gain
    }

    Self.prototype.setupVolume = function(box) {
      var volBar = box.ownerDocument.createElement("div")
      volBar.className = "hues-m-vol-bar"
      box.appendChild(volBar)

      var label = box.ownerDocument.createElement("button")
      volBar.appendChild(label)
      this.volLabel = label
      label.addEventListener("click", (function() {
        if (this.hues.isMuted()) {
          this.hues.unmute()
        } else {
          this.hues.mute()
        }
      }).bind(this))

      var input = box.ownerDocument.createElement("input")
      input.type = "range"
      input.min = -60
      input.max = 5
      input.step = 1
      volBar.appendChild(input)
      this.volInput = input
      input.addEventListener("input", (function() {
        this.hues.setVolume(parseFloat(input.value))
      }).bind(this))
      input.addEventListener("keyup", function(e) {
        var key = e.key;
        if (!key) {
          switch (e.keyCode) {
          case 37: key = 'ArrowLeft'; break
          case 38: key = 'ArrowUp'; break
          case 39: key = 'ArrowRight'; break
          case 40: key = 'ArrowDown'; break
          }
        }
        switch (key) {
        case 'ArrowDown':
        case 'Down':
        case 'ArrowUp':
        case 'Up':
        case 'ArrowLeft':
        case 'Left':
        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          break;
        }
      });

      this.updateVolume(this.hues.isMuted(), this.hues.getVolume())
      Hues.addEventListener("volumechange", this.updateVolume.bind(this))
    }

    Self.prototype.setupBeatBar = function() {
      var root = this.root
      var doc = root.ownerDocument

      var beatBar = doc.createElement("div")
      beatBar.className = "hues-m-beatbar"
      root.appendChild(beatBar)
      this.beatBar = beatBar

      var beatLeft = doc.createElement("div")
      beatLeft.className = "hues-m-beatleft"
      beatBar.appendChild(beatLeft)
      this.beatLeft = beatLeft

      var beatRight = doc.createElement("div")
      beatRight.className = "hues-m-beatright"
      beatBar.appendChild(beatRight)
      this.beatRight = beatRight
      
      var beatCenter = doc.createElement("div")
      beatCenter.className = "hues-m-beatcenter"
      beatBar.appendChild(beatCenter)
      this.beatCenter = beatCenter

      this.hues.addEventListener("beat", this.updateBeatBar.bind(this))
    }

    Self.prototype.setupPlayControls = function(box) {
      var doc = box.ownerDocument;

      var songsBox = doc.createElement("div");
      songsBox.className = "hues-m-songs-controls";
      box.appendChild(songsBox);

      var songsSelect = doc.createElement("button");
      songsSelect.className = "hues-m-songs-select";
      songsSelect.textContent = "SONGS";
      songsBox.appendChild(songsSelect);

      var songsButtonBg = doc.createElement("div");
      songsButtonBg.className = "hues-m-button-bg";
      songsBox.appendChild(songsButtonBg);
      var songsButtonBgSide = doc.createElement("div");
      songsButtonBgSide.className = "hues-m-button-sidebg";
      songsButtonBg.appendChild(songsButtonBgSide);
      var songsButtonBgMid = doc.createElement("div");
      songsButtonBgMid.className = "hues-m-button-midbg";
      songsButtonBg.appendChild(songsButtonBgMid);

      var songsPrev = doc.createElement("button");
      songsPrev.className = "hues-m-button-left";
      songsPrev.textContent = "<";
      songsPrev.title = "Previous Song";
      songsPrev.addEventListener("click", (function() {
        this.hues.prevSong();
      }).bind(this));
      songsBox.appendChild(songsPrev);

      var songsNext = doc.createElement("button");
      songsNext.className = "hues-m-button-right";
      songsNext.textContent = ">";
      songsNext.title = "Next Song";
      songsNext.addEventListener("click", (function() {
        this.hues.nextSong();
      }).bind(this));
      songsBox.appendChild(songsNext);

      var songsRand = doc.createElement("button");
      songsRand.className = "hues-m-button-mid";
      songsRand.textContent = "🔀";
      songsRand.title = "Random Song";
      songsRand.addEventListener("click", (function() {
        this.hues.randomSong();
      }).bind(this));
      songsBox.appendChild(songsRand);

      var imagesBox = doc.createElement("div");
      imagesBox.className = "hues-m-images-controls";
      box.appendChild(imagesBox);

      var imagesSelect = doc.createElement("button");
      imagesSelect.className = "hues-m-images-select";
      imagesSelect.textContent = "IMAGES";
      imagesBox.appendChild(imagesSelect);

      var imagesButtonBg = doc.createElement("div");
      imagesButtonBg.className = "hues-m-button-bg";
      imagesBox.appendChild(imagesButtonBg);
      var imagesButtonBgSide = doc.createElement("div");
      imagesButtonBgSide.className = "hues-m-button-sidebg";
      imagesButtonBg.appendChild(imagesButtonBgSide);
      var imagesButtonBgMid = doc.createElement("div");
      imagesButtonBgMid.className = "hues-m-button-midbg";
      imagesButtonBg.appendChild(imagesButtonBgMid);

      var imagesPrev = doc.createElement("button");
      imagesPrev.className = "hues-m-button-left";
      imagesPrev.textContent = "<";
      imagesPrev.title = "Previous Image";
      imagesPrev.addEventListener("click", (function() {
        this.hues.setAutoMode("normal");
        this.hues.prevImage();
      }).bind(this));
      imagesBox.appendChild(imagesPrev);

      var imagesNext = doc.createElement("button");
      imagesNext.className = "hues-m-button-right";
      imagesNext.textContent = ">";
      imagesNext.title = "Next Image";
      imagesNext.addEventListener("click", (function() {
        this.hues.setAutoMode("normal");
        this.hues.nextImage();
      }).bind(this));
      imagesBox.appendChild(imagesNext);

      var imagesMode = doc.createElement("button");
      imagesMode.className = "hues-m-button-mid";
      imagesBox.appendChild(imagesMode);
      this.imagesMode = imagesMode;
      imagesMode.addEventListener("click", this.handleImageMode.bind(this));
      this.hues.addEventListener("automodechange",
          this.updateImageMode.bind(this));
      this.updateImageMode(this.hues.getAutoMode());
    }

    Self.prototype.updateImageMode = function(autoMode) {
      var imagesMode = this.imagesMode;
      if (autoMode == "normal") {
        imagesMode.textContent = "▶";
        imagesMode.title = "Start Auto Mode";
      } else {
        imagesMode.textContent = "⏸";
        imagesMode.title = "Pause Auto Mode";
      }
    }

    Self.prototype.handleImageMode = function() {
      if (this.hues.getAutoMode() == "normal") {
        this.hues.setAutoMode("full auto");
      } else {
        this.hues.setAutoMode("normal");
      }
    }

    Self.prototype.setupControls = function() {
      var root = this.root
      var doc = root.ownerDocument

      var controls = doc.createElement("div")
      controls.className = "hues-m-controls"
      root.appendChild(controls)
      this.controls = controls

      var imageName = doc.createElement("div")
      imageName.className = "hues-m-imagename"
      controls.appendChild(imageName)
      var imageNameLink = doc.createElement("a")
      imageNameLink.href = "#"
      imageNameLink.target = "_blank"
      imageName.appendChild(imageNameLink)
      var imageNameText = doc.createElement("span")
      imageNameLink.appendChild(imageNameText)
      this.imageName = imageName
      this.imageNameLink = imageNameLink
      this.imageNameText = imageNameText
      this.hues.addEventListener("imagechange", this.updateImageName.bind(this))

      var songTitle = doc.createElement("div")
      songTitle.className = "hues-m-songtitle"
      controls.appendChild(songTitle)
      var songTitleLink = doc.createElement("a")
      songTitleLink.href = "#"
      songTitleLink.target = "_blank"
      songTitle.appendChild(songTitleLink)
      var songTitleText = doc.createElement("span")
      songTitleLink.appendChild(songTitleText)
      this.songTitle = songTitle
      this.songTitleLink = songTitleLink
      this.songTitleText = songTitleText
      this.hues.addEventListener("songchange", this.updateSongTitle.bind(this))

      this.setupCharWidth(songTitleLink, songTitleText);

      var leftBox = doc.createElement("div")
      leftBox.className = "hues-m-leftbox"
      controls.appendChild(leftBox)

      var hueName = doc.createElement("div")
      hueName.className = "hues-m-huename"
      leftBox.appendChild(hueName)
      this.hueName = hueName
      this.hues.addEventListener("huechange", this.updateHueName.bind(this))

      this.setupVolume(leftBox)

      var rightBox = doc.createElement("div")
      rightBox.className = "hues-m-rightbox"
      controls.appendChild(rightBox)

      this.setupPlayControls(rightBox)
    }

    Self.prototype.setupUI = function(root) {
      var doc = root.ownerDocument;

      var uiRoot = doc.createElement("div");
      uiRoot.className = "hues-m-root";
      root.appendChild(uiRoot);

      this.root = uiRoot;
      this.huesRoot = root;

      this.setupBeatBar()
      this.setupControls()

      this.handleQueuedResizeSongTitle();
      this.handleQueuedResizeImageName();

      window.addEventListener("resize", this.handleResize.bind(this))
    }

    return Self
  })()

  return function(hues) {
    var self = new Self(hues)
    this.setupUI = function(rootElement) {
      self.setupUI(rootElement)
    }
    Object.seal(this)
  }
})()
