define(['mootools', 'TangleKit', 'Tangle'], function($, _, Tangle) {

  var possiblyBroken = $('.js-modulo-example-possibly-broken');

  var model = {
    initialize: function () {
      this.moduloA = 5;
      this.moduloB = 3;
    }
    , update: function () {
      var res = (this.moduloA % this.moduloB + this.moduloB) % this.moduloB;
      if (isNaN(res)) {
        this.moduloRes = "<span class='undefined-number'>undefined</span>"
        possiblyBroken.addClass('hidden');
      } else {
        this.moduloRes = res;
        possiblyBroken.removeClass('hidden');
      }
      this.moduloALookalike = this.moduloA + this.moduloB + this.moduloB;
    }
  };

  var G = {
    init: function () {
      var rootElement = $('.js-modulo-example')[0];
      var tangle = new Tangle(rootElement, model);
    }
  }

  return G;
});
