define(['mootools', 'TangleKit', 'Tangle', 'BigInt', 'elgamal_big'], function($, _, Tangle, BigInt, elgamal) {

  var model = {
    initialize: function () {
      this.pBits = 32;
      this.bBits = 16;
      this.b1Bits = 8;
      // this.primeP = 11;
      // this.primes = BigInt.findPrimes(30000);
    }
    , update: function () {
        var k = this.pBits;
        var oneBI = BigInt.int2bigInt(1,0,0);
        var twoBI = BigInt.int2bigInt(2,0,0);

        var foundGenerator = elgamal.findPrimeAndGenerator(k,10,10);
        if (foundGenerator === false) {
          throw "Unable to proceed because of time!";
        }

        var pBI = foundGenerator.pBI;
        var gBI = foundGenerator.generatorBI;
        var nBI = foundGenerator.orderBI;

        this.primeP = BigInt.bigInt2str(pBI,10);
        this.generatorG = BigInt.bigInt2str(gBI,10);
        this.orderN = BigInt.bigInt2str(nBI,10);


        var xBI = BigInt.int2bigInt(0,0,0);
        while (BigInt.greater(oneBI,xBI) || BigInt.greater(xBI,BigInt.sub(nBI,oneBI))) {
          xBI = BigInt.randBigInt(k-1,0);
        }

        var privateKey = {
          x: xBI // can be 1...n-1
        };
        this.keyX = BigInt.bigInt2str(xBI,10);


        var yBI = elgamal.findY(gBI,pBI,privateKey);
        var publicKey = {
          p: pBI
        , g: gBI
        , y: yBI
        };
        this.valueY = BigInt.bigInt2str(yBI,10);

        this.b2Bits = this.bBits - this.b1Bits;


        var m = BigInt.randBigInt(this.bBits,1);
        this.messageM = BigInt.bigInt2str(m,10);

        this.eveGuessM = "unknown";

        // k is randomly chosen in [1,n-1] each encryption
        var kBI = BigInt.int2bigInt(0,0,0);
        while (BigInt.greater(oneBI,kBI) || BigInt.greater(kBI,BigInt.sub(nBI,oneBI))) {
          kBI = BigInt.randBigInt(k-1,0);
        }

        this.keyK = BigInt.bigInt2str(kBI,10);

        var cipherText = elgamal.encrypt(m, publicKey, kBI);

        this.ciphertextU = BigInt.bigInt2str(cipherText.u,10);
        this.ciphertextV = BigInt.bigInt2str(cipherText.v,10);

        var vBI = cipherText.v;

        var b1BI = BigInt.int2bigInt(this.b1Bits,10,10);
        var b2BI = BigInt.int2bigInt(this.b2Bits,10,10);
        var ultimate1BI = BigInt.powMod(twoBI, b1BI, pBI);
        var ultimate2BI = BigInt.powMod(twoBI, b2BI, pBI);

        var m1nToM1 = {};

        for (var m1BI = oneBI; !BigInt.equals(m1BI,ultimate1BI); m1BI = BigInt.add(m1BI, oneBI)) {
          var m1nBI = BigInt.powMod(m1BI,nBI,pBI);
          m1nToM1[BigInt.bigInt2str(m1nBI,10)] = m1BI;
        }

        console.log("Done populating Dict");
        for (var m2BI = oneBI; !BigInt.equals(m2BI,ultimate2BI); m2BI = BigInt.add(m2BI, oneBI)) {
          var vnBI = BigInt.powMod(cipherText.v,nBI,pBI);
          var m2negnBI = BigInt.powMod(BigInt.inverseMod(m2BI,pBI),nBI,pBI);
          var vnm2negnBI = BigInt.multMod(vnBI,m2negnBI,pBI);
          var vnm2negn = BigInt.bigInt2str(vnm2negnBI,10);
          var m1BI = m1nToM1[vnm2negn];
          if (m1BI !== undefined) {
            console.log("Cracked it!");
            var originalM = BigInt.multMod(m1BI,m2BI,pBI);
            // console.log("m1: " + BigInt.bigInt2str(m1BI,10));
            // console.log("m2: " + BigInt.bigInt2str(m2BI,10));

            this.eveGuessM = BigInt.bigInt2str(originalM,10);
            // console.log("Guess: " + BigInt.bigInt2str(originalM,10));

            // var vnBI = BigInt.powMod(cipherText.v, nBI, pBI);
            // var mguessednBI = BigInt.powMod(originalM, nBI, pBI);
            // var mnBI = BigInt.powMod(m, nBI, pBI);
            // console.log("v^n: "+BigInt.bigInt2str(vnBI,10));
            // console.log("m_guess^n: "+BigInt.bigInt2str(mguessednBI,10));
            // console.log("m_actual^n: "+BigInt.bigInt2str(mnBI,10));

            // var encr = elgamal.encrypt(originalM, publicKey, kBI);
            // console.log("u: "+BigInt.bigInt2str(encr.u,10));
            // console.log("v: "+BigInt.bigInt2str(encr.v,10));
            break;
          }
        }
        console.log("Done.");

      // this.pminusOne = this.primeP-1;

      // var pminusOne = BigInt.int2bigInt(this.pminusOne,10,10);
      // var p = BigInt.int2bigInt(this.primeP,10,10);

      // var factors = elgamal.factor(pminusOne,0.5);
      // var readableFactors = [" 1"];
      // for (var i = 0; i < factors.length; i++) {
      //   readableFactors.push(" "+elgamal.stringifyBI(factors[i]));
      // }
      // this.factors = readableFactors + " ";

      // var fullGen = findGeneratorOfOrder(p,{'list':true},pminusOne);

      // this.fullGenerator = fullGen.generator;
      // this.fullGeneratorList = fullGen.list;

      // var subgroupGen = findGeneratorFor(p,factors[factors.length-1],0.5);
      // if (subgroupGen !== false) {
      //   possiblyBroken.removeClass('hidden');
      //   this.subgroupList = makeList(subgroupGen.generatorBI,p,subgroupGen.orderBI);
      //   this.subgroupListOrder = subgroupGen.order;
      //   this.subgroupGenerator = this.subgroupList[0];

      //   var one = BigInt.int2bigInt(1,10,10);
      //   var subgroupGen2 = BigInt.powMod(subgroupGen.generatorBI,BigInt.sub(subgroupGen.orderBI,one),p);
      //   this.subgroupGenerator2 = BigInt.bigInt2str(subgroupGen2,10);
      //   this.subgroupList2 = makeList(subgroupGen2,p,subgroupGen.orderBI);
      // } else {
      //   possiblyBroken.addClass('hidden');
      // }
    }
  };

  var G = {
    init: function () {
      var rootElement = $('.js-attack-example')[0];
      var tangle = new Tangle(rootElement, model);
      $('.js-attack-example-pick-p').addEvent('click',function() {
        tangle.setValue('primeP',0); // Tell Tangle to recalc p
      });
      $('.js-attack-example-pick-m').addEvent('click',function() {
        tangle.setValue('messageM',0); // Tell Tangle to recalc p
      });
    }
  }

  return G;

});
