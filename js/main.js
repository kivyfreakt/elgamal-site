"use strict";

require.config({
  paths: {
      mootools: '3rdparty/TangleKit/mootools'
    , Tangle: '3rdparty/Tangle'
    , mathjax: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_HTML&amp;delayStartupUntil=configured'
    , sprintf: '3rdparty/TangleKit/sprintf.js'
    , BVTouchable: '3rdparty/TangleKit/BVTouchable'
    , TangleKit: '3rdparty/TangleKit/TangleKit'
    , BigInt: '3rdparty/BigInt'

  },

  shim: {
          mootools: { exports: '$$' }
        , Tangle: { exports: 'Tangle' }
        , mathjax: { exports: 'MathJax'
                   , init: function () { MathJax.Hub.Config({ jax: ["input/TeX", "output/HTML-CSS"]
                                                            , extensions: ["tex2jax.js","MathMenu.js","MathZoom.js"]
                                                            , TeX: { extensions: [ "AMSmath.js"
                                                                                 , "AMSsymbols.js"
                                                                                 , "noErrors.js"
                                                                                 , "noUndefined.js"
                                                                                 ]
                                                                   }
                                                            , tex2jax: { inlineMath: [ ['%%','%%'] ]
                                                                       , displayMath: [ ['$$','$$'] ]
                                                                       , processEscapes: true
                                                                       }
                                                            , "HTML-CSS": { availableFonts: ["TeX"] }
                                                            });
                                          MathJax.Hub.Startup.onload();
                                          return MathJax;
                                       }
                   }
        }
});

require([ '3rdparty/domReady!'
        , 'mathjax'
        , 'modulo-example'
        , 'attack-example'
        ]
       , function(_, mathjax, moduloExample, attackExample) {
  moduloExample.init();
  attackExample.init();
});
