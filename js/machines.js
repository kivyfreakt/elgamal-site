/* Machines.js */

var findElementsByClass = function(parentElement, className) {
    var results = [];
    if (parentElement.getElementsByClassName === undefined) {
        var hasClassName = new RegExp("(?:^|\\s)" + className + "(?:$|\\s)"),
            allElements = parentElement.getElementsByTagName("*"),
            element, i;

        for (i = 0; allElements[i] !== null && allElements[i] !== undefined; i++) {
            element = allElements[i];
            var elementClass = element.className;
            if (elementClass && elementClass.indexOf(className) !== -1 && hasClassName.test(elementClass))
                results.push(element);
    }

    return results;

  } else {
    results = parentElement.getElementsByClassName(className);
    return results;
  }
};

var bind = (function( window, document ) {
    if ( document.addEventListener ) {
        return function( elem, type, cb ) {
            if ( (elem && !elem.length) || elem === window ) {
                elem.addEventListener(type, cb, false );
            }
            else if ( elem && elem.length ) {
                var len = elem.length;
                for ( var i = 0; i < len; i++ ) {
                    bind( elem[i], type, cb );
                }
            }
        };
    }
    else if ( document.attachEvent ) {
        return function ( elem, type, cb ) {
            if ( (elem && !elem.length) || elem === window ) {
                elem.attachEvent( 'on' + type, function () {
                    return cb.call(elem, window.event);
                });
            }
            else if ( elem.length ) {
                var len = elem.length;
                for ( var i = 0; i < len; i++ ) {
                    bind( elem[i], type, cb );
                }
            }
        };
    }
})( this, document );


var wire = {
    'keyDisplay': findElementsByClass(document.getElementById('keyDisplay'), 'data')[0],
    'encryptedMsgDisplay': findElementsByClass(document.getElementById('encryptedMsg'), 'data')[0],
    MESSAGES: {
      MESSAGE: 'message',
      KEY: 'publishKey'
    },
    subscribers: {}
};

var wire2 = {
    'keyDisplay': findElementsByClass(document.getElementById('keyDisplay2'), 'data')[0],
    'encryptedMsgDisplay': findElementsByClass(document.getElementById('encryptedMsg2'), 'data')[0],
    MESSAGES: {
      MESSAGE: 'message',
      KEY: 'publishKey'
    },
    subscribers: {}
};

wire.render = function () {
    wire.keyDisplay.innerHTML = 'p: ' + this.publicKey.p + ' g: ' + this.publicKey.g + ' y: ' + this.publicKey.h;
    wire.encryptedMsgDisplay.innerHTML = 'u: ' + this.message.b + ', v: ' + this.message.c;
};

wire2.render = function () {
    wire2.keyDisplay.innerHTML = 'p: ' + this.publicKey.p + ' g: ' + this.publicKey.g + ' y: ' + this.publicKey.h;
    wire2.encryptedMsgDisplay.innerHTML = 'm: ' + this.message.m + 'r: ' + this.message.r + ', s: ' + this.message.s;
};

wire.publish = function (message, data) {
    (wire.subscribers[message] || []).forEach(function (s) {
        s(data);
    });
};

wire2.publish = function (message, data) {
    (wire2.subscribers[message] || []).forEach(function (s) {
        s(data);
    });
};

wire.subscribe = function (message, callback) {
    wire.subscribers[message] = wire.subscribers[message] ? wire.subscribers[message].concat([callback]) : [callback];
};

wire2.subscribe = function (message, callback) {
    wire2.subscribers[message] = wire2.subscribers[message] ? wire2.subscribers[message].concat([callback]) : [callback];
};

(function () {
    var receiver = {
        'el': document.getElementById('aliceMachine'),
        'generatorFieldId': 'generator',
        'primeFieldId': 'prime',
        'privateKeyFieldId': 'privateKey',
        'getPublicKeyBtn': document.getElementById('getPublicKey'),
        'decryptBtn': document.getElementById('decrypt'),
        'getGeneratorBtn': document.getElementById('getGenerators'),
        'generatorInfo': document.getElementById('generatorInfo'),
        'generatorList': document.getElementById('selectG'),
        'randomPrivateKeyBtn': document.getElementById('getRandomPrivateKey')
    },
    g, p, x, eg;

    wire.subscribe(wire.MESSAGES.MESSAGE, function (msg) {
        findElementsByClass(document.getElementById('messageDisplay'), 'inbox-empty')[0].style.display = 'none';
        findElementsByClass(document.getElementById('messageDisplay'), 'inbox-has-message')[0].style.display = 'block';
    });

    bind(receiver.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(receiver.getGeneratorBtn, 'click', function (e) {

        p = parseInt(document.getElementById( receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        document.getElementById(receiver.primeFieldId).className = document.getElementById(receiver.primeFieldId).className.replace(/error/, "");

        var roots = [];

        receiver.generatorInfo.style.display = "none";
        try {
            receiver.generatorList.innerHTML = '<select id="generatorSelect"></select>';
            generatorListEl = document.getElementById('generatorSelect');
            ElGamal.getAllRootsAsync(p, function (roots) {
                generatorListEl.innerHTML += roots.map(function (r) {
                    return '<option value="' + r + '">' + r + '</option>';
                }).join('');
            });

        } catch (e) {
            document.getElementById(receiver.primeFieldId).className += " error";
            receiver.generatorInfo.style.display = "block";
            receiver.generatorList.innerHTML = "";
        }

        findElementsByClass(document.getElementById('messageDisplay'), 'inbox-empty')[0].style.display = 'block';
        findElementsByClass(document.getElementById('messageDisplay'), 'inbox-has-message')[0].style.display = 'none';
        findElementsByClass(document.getElementById('messageDisplay'), 'data')[0].innerHTML = "";

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.getPublicKeyBtn, 'click', function (e) {

        var errorFields = findElementsByClass(receiver.el, 'error'), i = 0, publicKey;

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        function getG() {
            var gSelect = receiver.generatorList.getElementsByTagName('select')[0];

            return parseInt(gSelect.options[gSelect.selectedIndex].value, 10);

        }

        g = getG();
        p = parseInt(document.getElementById(receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        x = parseInt(document.getElementById(receiver.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);


        receiver.privateKey = x;

        eg = new ElGamal(p, g, x);
        try {
            receiver.publicKey = eg.getPublicKey();
            wire.publicKey = receiver.publicKey;
            wire.render();
            wire.publish(wire.MESSAGES.KEY, wire.publicKey);
        }
        catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'NOT_PRIME':
                    document.getElementById('prime').className = 'error';
                    break;
                  case 'NOT_ROOT':
                    document.getElementById('generator').className = 'error';
                    break;
                  case 'INVALID_KEY':
                    document.getElementById('privateKey').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.decryptBtn, 'click', function (e) {

        if (!wire.message) {
            alert('Вам еще не отправили сообщение.');
            return false;
        }
        findElementsByClass(document.getElementById('messageDisplay'), 'data')[0].innerHTML = "Расшифрованное сообщение: " + eg.decrypt(wire.message);

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.randomPrivateKeyBtn, 'click', function (e) {
        var p = parseInt(document.getElementById(receiver.primeFieldId).getElementsByTagName('input')[0].value, 10);
        var key = Math.ceil(Math.random() * p);

        document.getElementById(receiver.privateKeyFieldId ).getElementsByTagName('input')[0].value = key;
    });
}());

(function () {

    var sender = {
        'el': document.getElementById('bobMachine'),
        'privateKeyFieldId': 'encryptPrivate',
        'messageFieldId': 'message',
        'encryptMsgBtn': document.getElementById('encrypt'),
        'randomKeyBtn': document.getElementById('getRandomEncyptKey')
    };

    bind(sender.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(sender.encryptMsgBtn, 'click', function (e) {

        if (!wire.publicKey) {
            alert('Для начала вам нужно получить публичный ключ, чтоб отправить сообщение');
            return false;
        }

        var errorFields = findElementsByClass(sender.el, 'error'), i = 0,
            message = parseInt(document.getElementById( sender.messageFieldId ).getElementsByTagName('input')[0].value, 10),
            privateKey = parseInt(document.getElementById( sender.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        try {
            wire.message = ElGamal.encrypt(message, privateKey, wire.publicKey);
            wire.render();
            wire.publish(wire.MESSAGES.MESSAGE, wire.message);
        } catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'INVALID_ENC_KEY':
                    document.getElementById('encryptPrivate').className = 'error';
                    break;
                  case 'INVALID_MSG':
                    document.getElementById('message').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(sender.randomKeyBtn, 'click', function (e) {
        var p = wire.publicKey.p;
        var key = Math.ceil(Math.random() * p);

        document.getElementById(sender.privateKeyFieldId ).getElementsByTagName('input')[0].value = key;
    });
}());


(function () {
    var receiver2 = {
        'el': document.getElementById('aliceMachine2'),
        'decryptBtn': document.getElementById('decrypt2')
    };

    wire2.subscribe(wire2.MESSAGES.MESSAGE, function (msg) {
        findElementsByClass(document.getElementById('messageDisplay2'), 'inbox-empty')[0].style.display = 'none';
        findElementsByClass(document.getElementById('messageDisplay2'), 'inbox-has-message')[0].style.display = 'block';
    });

    bind(receiver2.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(receiver2.decryptBtn, 'click', function (e) {

        if (!wire2.message) {
            alert('Вам еще не отправили сообщение.');
            return false;
        }
        findElementsByClass(document.getElementById('messageDisplay2'), 'data')[0].innerHTML = "Проверка подписи: " + ElGamal.is_valid(wire2.message,wire2.publicKey);

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);
}());

(function () {
    var sender2 = {
        'el': document.getElementById('bobMachine2'),
        'generatorFieldId': 'generator2',
        'primeFieldId': 'prime2',
        'privateKeyFieldId': 'privateKey2',
        'getPublicKeyBtn': document.getElementById('getPublicKey2'),
        'getGeneratorBtn': document.getElementById('getGenerators2'),
        'generatorInfo': document.getElementById('generatorInfo2'),
        'generatorList': document.getElementById('selectG2'),
        'randomPrivateKeyBtn': document.getElementById('getRandomPrivateKey2'),
        'tempKeyFieldId': 'encryptPrivate2',
        'messageFieldId': 'message2',
        'encryptMsgBtn': document.getElementById('encrypt2'),
        'randomKeyBtn': document.getElementById('getRandomEncyptKey2')
    },
    g, p, x, eg;

    bind(sender2.getGeneratorBtn, 'click', function (e) {

        p = parseInt(document.getElementById(sender2.primeFieldId).getElementsByTagName('input')[0].value, 10);
        document.getElementById(sender2.primeFieldId).className = document.getElementById(sender2.primeFieldId).className.replace(/error/, "");

        var roots = [];

        sender2.generatorInfo.style.display = "none";
        try {
            sender2.generatorList.innerHTML = '<select id="generatorSelect2"></select>';
            generatorListEl = document.getElementById('generatorSelect2');
            ElGamal.getAllRootsAsync(p, function (roots) {
                generatorListEl.innerHTML += roots.map(function (r) {
                    return '<option value="' + r + '">' + r + '</option>';
                }).join('');
            });

        } catch (e) {
            document.getElementById(sender2.primeFieldId).className += " error";
            sender2.generatorInfo.style.display = "block";
            sender2.generatorList.innerHTML = "";
        }

        findElementsByClass(document.getElementById('messageDisplay2'), 'inbox-empty')[0].style.display = 'block';
        findElementsByClass(document.getElementById('messageDisplay2'), 'inbox-has-message')[0].style.display = 'none';
        findElementsByClass(document.getElementById('messageDisplay2'), 'data')[0].innerHTML = "";

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(sender2.getPublicKeyBtn, 'click', function (e) {

        var errorFields = findElementsByClass(sender2.el, 'error'), i = 0, publicKey;

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        function getG() {
            var gSelect = sender2.generatorList.getElementsByTagName('select')[0];

            return parseInt(gSelect.options[gSelect.selectedIndex].value, 10);

        }

        g = getG();
        p = parseInt(document.getElementById(sender2.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        x = parseInt(document.getElementById(sender2.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);


        sender2.privateKey = x;

        eg = new ElGamal(p, g, x);
        try {
            sender2.publicKey = eg.getPublicKey();
            wire2.publicKey = sender2.publicKey;
            wire2.render();
            wire2.publish(wire2.MESSAGES.KEY, wire2.publicKey);
        }
        catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'NOT_PRIME':
                    document.getElementById('prime2').className = 'error';
                    break;
                  case 'NOT_ROOT':
                    document.getElementById('generator2').className = 'error';
                    break;
                  case 'INVALID_KEY':
                    document.getElementById('privateKey2').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(sender2.randomPrivateKeyBtn, 'click', function (e) {
        var p = parseInt(document.getElementById(sender2.primeFieldId).getElementsByTagName('input')[0].value, 10);
        var key = Math.ceil(Math.random() * p);

        document.getElementById(sender2.privateKeyFieldId).getElementsByTagName('input')[0].value = key;
    });

    bind(sender2.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(sender2.encryptMsgBtn, 'click', function (e) {

        if (!wire2.publicKey) {
            alert('Для начала вам нужно получить публичный ключ, чтоб отправить сообщение');
            return false;
        }

        var errorFields = findElementsByClass(sender2.el, 'error'), i = 0,
            message = parseInt(document.getElementById( sender2.messageFieldId ).getElementsByTagName('input')[0].value, 10),
            privateKey = parseInt(document.getElementById( sender2.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);
            tempKey = parseInt(document.getElementById( sender2.tempKeyFieldId ).getElementsByTagName('input')[0].value, 10);

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        try {
            wire2.message = ElGamal.sign(message, tempKey, privateKey, wire2.publicKey);
            wire2.render();
            wire2.publish(wire2.MESSAGES.MESSAGE, wire2.message);
        } catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'INVALID_ENC_KEY':
                    document.getElementById('encryptPrivate2').className = 'error';
                    break;
                  case 'INVALID_MSG':
                    document.getElementById('message2').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(sender2.randomKeyBtn, 'click', function (e) {
        var p = wire2.publicKey.g;
        var key = Math.ceil(Math.random() * g);

        document.getElementById(sender2.tempKeyFieldId).getElementsByTagName('input')[0].value = key;
    });

}());
