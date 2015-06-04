if (typeof(window.AudioContext) === 'undefined' &&
    typeof(window.webkitAudioContext) !== 'undefined') {
  window.AudioContext = window.webkitAudioContext
  if (typeof(window.AudioContext.prototype.createGain) === 'undefined' &&
      typeof(window.AudioContext.prototype.createGainNode) !== 'undefined') {
    window.AudioContext.prototype.createGain =
      window.audioContext.prototype.createGainNode
  }
  if (typeof(window.AudioContext.prototype.hack_createBufferSource) ===
      'undefined') {
    window.AudioContext.prototype._hack_createBufferSource =
      window.AudioContext.prototype.createBufferSource
    window.AudioContext.prototype.createBufferSource = function() {
      var node = this.hack_createBufferSource()
      if (typeof(node.start) === 'undefined') {
        // This doesn't permit the 2-argument start method.
        node.start = node.noteOn
      }
      if (typeof(node.stop) === 'undefined') {
        node.stop = node.noteOff
      }
      return node
    }
  }
}
