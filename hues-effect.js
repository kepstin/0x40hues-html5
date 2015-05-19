(function() {
  var self = {
    "canvas": null,
    "ctx": null
  };

  var setupCanvas = function(canvas) {
    self["canvas"] = canvas;
    
  };

  window.HuesEffect = {
    "setupCanvas": setupCanvas;
  };
})();
