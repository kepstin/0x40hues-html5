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

      this.root = null

      this.beatBar = null
      this.beatLeft = null
      this.beatRight = null
      this.beatCenter = null

      this.controls = null

      this.imageName = null
      this.imageNameLink = null
      this.imageNameText = null

      this.songTitle = null
      this.songTitleLink = null
      this.songTitleText = null

      this.hueName = null

      this.volInput = null
      this.volLabel = null

      this.queuedResizeImageName = null
      this.queuedResizeSongTitle = null

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
      var text = this.imageNameText

      link.className = ""
      if (text.offsetWidth > link.clientWidth) {
        link.className = "small"
      }
      if (text.offsetWidth > link.clientWidth) {
        link.className = "x-small"
      }
    }

    Self.prototype.handleQueuedResizeImageName = function() {
      this.resizeImageName()
      this.queuedResizeImageName = null;
    }

    Self.prototype.updateImageName = function(image) {
      var name = this.imageName

      while (name.firstElementChild) {
        name.removeChild(name.firstElementChild);
      }

      var link = name.ownerDocument.createElement("a")
      link.href = image.source
      link.target = "_blank"
      name.appendChild(link)
      this.imageNameLink = link

      var text = name.ownerDocument.createElement("span")
      text.textContent = image.fullname.toUpperCase()
      link.appendChild(text)
      this.imageNameText = text

      this.resizeImageName()
    }

    Self.prototype.updateSongTitle = function(song) {
      var title = this.songTitle

      while (title.firstElementChild) {
        title.removeChild(title.firstElementChild)
      }

      var link = title.ownerDocument.createElement("a")
      link.href = song.source
      link.target = "_blank"
      title.appendChild(link)
      this.songTitleLink = link

      var text = title.ownerDocument.createElement("span")
      text.textContent = song.title.toUpperCase()
      link.appendChild(text)
      this.songTitleText = text

      this.resizeSongTitle()
    }

    Self.prototype.resizeSongTitle = function() {
      var link = this.songTitleLink
      var text = this.songTitleText

      link.className = ""
      if (text.offsetWidth > link.clientWidth) {
        link.className = "small"
      }
      if (text.offsetWidth > link.clientWidth) {
        link.className = "x-small"
      }
    }

    Self.prototype.handleQueuedResizeSongTitle = function() {
      this.resizeSongTitle()
      this.queuedResizeSongTitle = null;
    }

    Self.prototype.updateHueName = function(hueInfo) {
      var name = this.hueName

      while (name.firstElementChild) {
        name.removeChild(name.firstElementChild)
      }

      var text = name.ownerDocument.createElement("span")
      text.textContent = hueInfo.hue.name.toUpperCase()
      name.appendChild(text)
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
      root.appendChild(beatCenter)
      this.beatCenter = beatCenter

      this.hues.addEventListener("beat", this.updateBeatBar.bind(this))
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
      this.imageName = imageName
      this.hues.addEventListener("imagechange", this.updateImageName.bind(this))

      var songTitle = doc.createElement("div")
      songTitle.className = "hues-m-songtitle"
      controls.appendChild(songTitle)
      this.songTitle = songTitle
      this.hues.addEventListener("songchange", this.updateSongTitle.bind(this))

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
    }

    Self.prototype.handleInvertEffect = function(beatTime, inverted) {
      if (inverted) {
        this.root.classList.add('inverted');
      } else {
        this.root.classList.remove('inverted');
      }
    }

    Self.prototype.setupUI = function(root) {
      this.root = root
      var doc = root.ownerDocument

      this.hues.addEventListener("inverteffect",
          this.handleInvertEffect.bind(this));

      this.setupBeatBar()
      this.setupControls()

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
