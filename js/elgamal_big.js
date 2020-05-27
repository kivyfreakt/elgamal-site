define(["BigInt"], function(BigInt) {

    // MathJax.Hub.Startup.onload();
    // $('body').html("$$ a = b + c $$");
    // MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    // mathjax.init();
    // console.log(mathjax);

    // window.console = {log: function() {return true;}};

  function async(func, callback) {
      setTimeout(function() {
          func();
          if (callback !== undefined) {
            callback();
          }
      }, 0);
  }

  function findY(g,p,privateKey) { // All big ints. private key is x | 1 <= x <= n-1
    var x = privateKey.x;
    return BigInt.powMod(g,x,p);
  }

  function encrypt(m, publicKey, k) { // All big ints. k is randomly chosen in [1,n-1] each encryption
    var p = publicKey.p;
    var g = publicKey.g;
    var y = publicKey.y;
    return {
      u: BigInt.powMod(g,k,p)
    , v: BigInt.multMod(m,BigInt.powMod(y,k,p),p)
    };
  }

  function decrypt(cipherText, publicKey, privateKey) {
    var p = publicKey.p;
    var g = publicKey.g;
    var y = publicKey.y;
    var x = privateKey.x;
    var u = cipherText.u;
    var v = cipherText.v;

    return BigInt.multMod(BigInt.powMod(BigInt.inverseMod(u,p),x,p),v,p);
  }

  function test() {
    var privateKey = {
      x: BigInt.int2bigInt(3,1,1) // can be 1,2,3 since g = 5 and n = 4
    };
    var g = BigInt.int2bigInt(5,1,1);
    var p = BigInt.int2bigInt(13,1,1);

    var publicKey = {
      p: p
    , g: g
    , y: findY(g,p,privateKey)
    };

    var m = BigInt.int2bigInt(12,1,1); // Has to be between 1 and p-1

    var k = BigInt.int2bigInt(2,1,1); // k is randomly chosen in [1,n-1] each encryption
    var cipherText = encrypt(m, publicKey, k);

    console.log(privateKey);
    console.log(publicKey);
    console.log(cipherText);

    var plainText = decrypt(cipherText, publicKey, privateKey);

    console.log(BigInt.bigInt2str(plainText,10));
  }

//Based on http://blog.renzuocheng.com/2012/11/generate-cyclic-group-of-prime-order-and-one-of-its-generator/
function findAGeneratorForAPrimeWithBitsAndRounds(k,n) {
  var p,q,g;
  var two = BigInt.int2bigInt(2,k,0), one = BigInt.int2bigInt(1,k,0);
  var i, divisible, B, primes, rpprb;
  B=30000;  //B is largest prime to use in trial division
  p=BigInt.int2bigInt(0,k,0);

  primes=BigInt.findPrimes(30000);  //check for divisibility by primes <=30000

  rpprb = BigInt.dup(p);

  for (;;) { //keep trying random values for ans until one appears to be prime
    //optimization: pick a random number times L=2*3*5*...*p, plus a
    //   random element of the list of all numbers in [0,L) not divisible by any prime up to p.
    //   This can reduce the amount of random number generation.

    q = BigInt.randTruePrime(k - 1);
    p = BigInt.add(one,BigInt.mult(two,q));
    divisible=false;

    //check p for divisibility by small primes up to B
    for (i=0; (i<primes.length) && (primes[i]<=B); i++) {
      if (BigInt.modInt(p,primes[i])==0 && !BigInt.equalsInt(p,primes[i])) {
        divisible=true;
        break;
      }
    }

    //optimization: change millerRabin so the base can be bigger than the number being checked, then eliminate the while here.

    //do n rounds of Miller Rabin, with random bases less than ans
    for (i=0; i<n && !divisible; i++) {
      BigInt.randBigInt_(rpprb,k,0);
      while(!BigInt.greater(p,rpprb)) //pick a random rpprb that's < ans
        BigInt.randBigInt_(rpprb,k,0);
      if (!BigInt.millerRabin(p,rpprb))
        divisible=true;
    }

    if(!divisible)
      // p is probably prime
      for (;;) {
        g = BigInt.randBigInt(k,0);
        if (BigInt.greater(two,g) || BigInt.greater(g,BigInt.sub(p,one))) {
          continue;
        }
        if (BigInt.equals(BigInt.powMod(g,two,p), one)) {
          continue;
        }
        if (!BigInt.equals(BigInt.powMod(g,q,p), one)) {
          continue;
        }
        return {
          p: BigInt.bigInt2str(p,10)
        , order: BigInt.bigInt2str(q,10)
        , generator: BigInt.bigInt2str(g,10)
        , pBI: p
        , orderBI: q
        , generatorBI: g
        }
      }
  }
}

function findAFactor(big) {
  var someNum = BigInt.randBigInt(BigInt.bitSize(big),0);

  var one = BigInt.int2bigInt(1,1,big.length);
  var two = BigInt.int2bigInt(2,1,big.length);
  function f (x) {
    return BigInt.mod(BigInt.add(BigInt.powMod(x,two,big),someNum),big);
  }

  function absSub(a,b) {
    if (BigInt.greater(a,b)) {
      return BigInt.sub(a,b);
    }
    return BigInt.sub(b,a);
  }

  var a = two;
  var b = two;
  var sub;
  var d = one;
  while ( BigInt.equals(d,one) ) {
    a = f(a); // a runs once
    b = f(f(b)); // b runs twice as fast.
    sub = absSub(b,a);
    if (sub.length <= big.length) {
      sub = BigInt.elementExpand(sub,big.length);
      // big = BigInt.elementExpand(big,sub.length);
    } else {
      big = BigInt.elementExpand(big,sub.length);
      // sub = BigInt.elementExpand(sub,big.length);
    }
    d = BigInt.GCD(big, sub); // GCD must have the larger value first
  }
  if (!BigInt.equals(d,big))
       return d;
  return false;
 }

function factor(n,seconds) {
  var startTime = new Date();
  var primes=BigInt.findPrimes(30000);  //check for divisibility by primes <=30000
  var bitSize = BigInt.bitSize(n);

  function _factor(big) {
    var factors = [];
    var curr = BigInt.dup(big);

    var zero = BigInt.int2bigInt(0,0,big.length);
    var quotient = BigInt.int2bigInt(0,0,big.length);
    var remainder = BigInt.int2bigInt(0,0,big.length);

    var B=30000;  //B is largest prime to use in trial division
    var i;
    for (i=0; (i<primes.length) && (primes[i]<=B); i++) {
      if (BigInt.modInt(curr,primes[i])==0) {
        var bigI = BigInt.int2bigInt(primes[i],bitSize,curr.length);
        if (BigInt.equalsInt(curr,primes[i])) {
          factors.push(bigI);
          return factors;
        }
        factors.push(bigI);
        BigInt.divide_(curr,bigI,quotient,remainder);
        if (!BigInt.equals(remainder,zero)) {
          console.log(curr);
          console.log(bigI);
          throw "Serious problem factoring!";
        }
        curr = BigInt.dup(quotient);
        i = -1; continue; // restart the loop
      }
    }

    for(;;) {
      if ((new Date()) - startTime > seconds * 1000) {
        console.log("Aborting factor for time reasons");
        return false;
      }

      if (isProbablyPrime(curr,40)) {
        factors.push(curr);
        return factors;
      }

      var f = findAFactor(curr);
      if (f !== false) {
        if (!isProbablyPrime(f,40)) {
          factors.push.apply(factors, _factor(f));
        } else {
          factors.push(f);
        }
        BigInt.divide_(curr,f,quotient,remainder);
        if (!BigInt.equals(remainder,zero)) {
          console.log(curr);
          console.log(f);
          throw "Serious problem factoring!";
        }
        curr = BigInt.dup(quotient);
      } else {
        factors.push(curr);
        break;
      }
    }
    return factors;
  }
  return _factor(n);
}

function findGeneratorFor(p,order,seconds) {
  var startTime = new Date();
  var g, k;
  var one = BigInt.int2bigInt(1,0,p.length);
  var two = BigInt.int2bigInt(2,0,p.length);
  var pMinusOne = BigInt.sub(p,one);
  k = BigInt.bitSize(p);
  for (;;) {
    if ((new Date()) - startTime > seconds * 1000) {
      console.log("Aborting findGeneratorFor -- ran out of time");
      return false;
    }
    g = BigInt.randBigInt(k,0);
    if (BigInt.greater(two,g) || BigInt.greater(g,pMinusOne)) {
      continue;
    }
    if (!BigInt.equals(BigInt.powMod(g,order,p), one)) {
      continue;
    }
    return {
      p: BigInt.bigInt2str(p,10)
    , order: BigInt.bigInt2str(order,10)
    , generator: BigInt.bigInt2str(g,10)
    , pBI: p
    , orderBI: order
    , generatorBI: g
    }
  }
}

function isProbablyPrime(big,n) {
  var k = BigInt.bitSize(big);
  var two = BigInt.int2bigInt(2,k,0), one = BigInt.int2bigInt(1,k,0);
  var i, divisible, B, primes, rpprb;

  var B=30000;  //B is largest prime to use in trial division

  primes=BigInt.findPrimes(30000);  //check for divisibility by primes <=30000

  rpprb = BigInt.dup(big);

    divisible=false;

    //check big for divisibility by small primes up to B
    for (i=0; (i<primes.length) && (primes[i]<=B); i++) {
      if (BigInt.modInt(big,primes[i])==0 && !BigInt.equalsInt(big,primes[i])) {
        divisible=true;
        break;
      }
    }

    //optimization: change millerRabin so the base can be bigger than the number being checked, then eliminate the while here.

    //do n rounds of Miller Rabin, with random bases less than ans
    for (i=0; i<n && !divisible; i++) {
      BigInt.randBigInt_(rpprb,k,0);
      while(!BigInt.greater(big,rpprb)) //pick a random rpprb that's < ans
        BigInt.randBigInt_(rpprb,k,0);
      if (!BigInt.millerRabin(big,rpprb))
        divisible=true;
    }

    return !divisible;
}


  // function findAGeneratorFor(big, options) {
  //   var passedOptions = options || {};
  //   var doList = passedOptions['list'] || false;

  //   var i, j;
  //   var one = BigInt.int2bigInt(1,10,10);
  //   var two = BigInt.int2bigInt(2,10,10);
  //   var bigMinusOne = BigInt.sub(big, one);
  //   var list;
  //   for (i = two; !BigInt.equals(i, bigMinusOne); i = BigInt.add(i, one)) {
  //     var order = BigInt.int2bigInt(0,10,10);
  //     list = [];
  //     for (j = one; !BigInt.equals(j,big); j = BigInt.add(j, one)) {
  //       var raised = BigInt.powMod(i,j,big);
  //       if (doList) {
  //         list.push(raised);
  //       }
  //       order = BigInt.add(order, one);
  //       if (BigInt.equals(one,raised)) {
  //         return {
  //           generator: BigInt.bigInt2str(i,10)
  //         , order: BigInt.bigInt2str(order,10)
  //         , generatorBI: i
  //         , orderBI: order
  //         , list: list
  //         };
  //         // console.log( {
  //         //             generator: BigInt.bigInt2str(i,10)
  //         //           , order: BigInt.bigInt2str(order,10)
  //         //           , generatorBI: i
  //         //           , orderBI: order
  //         //           , list: list
  //         //           });
  //         break;
  //       }
  //     }
  //   }
  // }

  function findAGeneratorFor(big, options) {
    var passedOptions = options || {};
    var doList = passedOptions['list'] || false;

    var bigIntBits = BigInt.bitSize(big);
    var orderTooHigh = bigIntBits/3;

    var i, j;
    var one = BigInt.int2bigInt(1,10,10);
    var two = BigInt.int2bigInt(2,10,10);
    var bigMinusOne = BigInt.sub(big, one);
    var list;

    //for (i = two; !BigInt.equals(i, bigMinusOne); i = BigInt.add(i, one)) {
    for (var tries = 0; tries < 10000; tries++) {
      i = BigInt.randBigInt(bigIntBits,0);
      if (BigInt.greater(two,i) || BigInt.greater(i,BigInt.sub(big, one))) {
        continue;
      }
      var order = BigInt.int2bigInt(0,10,10);
      list = [];
      for (j = one; !BigInt.equals(j,big); j = BigInt.add(j, one)) {
        var raised = BigInt.powMod(i,j,big);
        if (doList) {
          list.push(raised);
        }
        order = BigInt.add(order, one);
        if (BigInt.bitSize(order) > orderTooHigh) {
          break;
        }
        if (BigInt.equals(one,raised)) {
          return {
            generator: BigInt.bigInt2str(i,10)
          , order: BigInt.bigInt2str(order,10)
          , generatorBI: i
          , orderBI: order
          , list: list
          };
        }
      }
    }
    throw "Unable to find a valid generator!";
  }

  function testBrute() {
    var k = 16;
    var res = findAGeneratorForAPrimeWithBitsAndRounds(k,40);
    var pBI = res.pBI;
    var gBI = res.generatorBI;
    var nBI = res.orderBI;

    // var foundGenerator = findAGeneratorFor(pBI, {list: true});

    var oneBI = BigInt.int2bigInt(1,0,0);
    var twoBI = BigInt.int2bigInt(2,0,0);

    var xBI = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,xBI) || BigInt.greater(xBI,BigInt.sub(nBI,oneBI))) {
      xBI = BigInt.randBigInt(k-1,0);
    }

    var privateKey = {
      x: xBI // can be 1...n-1
    };
    console.log("x: "+BigInt.bigInt2str(xBI,10));

    var yBI = findY(gBI,pBI,privateKey);
    var publicKey = {
      p: pBI
    , g: gBI
    , y: yBI
    };
    console.log("p: "+BigInt.bigInt2str(pBI,10));
    console.log("g: "+BigInt.bigInt2str(gBI,10));
    console.log("y: "+BigInt.bigInt2str(yBI,10));
    console.log("order n: "+BigInt.bigInt2str(nBI,10));


    var zeroBI = BigInt.int2bigInt(0,0,0);
    var m = BigInt.int2bigInt(0,0,0);
    var halfM = BigInt.int2bigInt(0,0,0);
    var halfM2 = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,m) ||
      BigInt.greater(m,BigInt.sub(pBI,oneBI)) ||
      (BigInt.equals(BigInt.powMod(m,nBI,pBI),oneBI))) {
      halfM = BigInt.randBigInt(k/4,1);
      halfM2 = BigInt.randBigInt(k/4,1);
      m = BigInt.mult(halfM,halfM2);
    }
    console.log("factor1:" + BigInt.bigInt2str(halfM,10));
    console.log("factor2:" + BigInt.bigInt2str(halfM2,10));

    // var m = BigInt.int2bigInt(3602, 0, 0); // Has to be between 1 and p-1
    console.log("chosen m:" + BigInt.bigInt2str(m,10));

    var b = BigInt.bitSize(m);
    var m1nToM1 = {};
    var b1 = b/2;

    console.log("b:" + b);



    var k = BigInt.int2bigInt(2,1,1); // k is randomly chosen in [1,n-1] each encryption
    var cipherText = encrypt(m, publicKey, k);
    console.log("u: "+BigInt.bigInt2str(cipherText.u,10));
    console.log("v: "+BigInt.bigInt2str(cipherText.v,10));

    console.log("v to n:" + BigInt.bigInt2str(BigInt.powMod(cipherText.v,nBI,pBI),10));

    var vBI = cipherText.v;

    var b1BI = BigInt.int2bigInt(b1,10,10);
    var ultimateBI = BigInt.powMod(twoBI, b1BI, pBI);
    console.log(b);
    console.log(b1);
    console.log(BigInt.bigInt2str(pBI,10));
    console.log(BigInt.bigInt2str(b1BI,10));
    console.log(BigInt.bigInt2str(ultimateBI,10));

    console.log("Starting to populate Dict");
    console.log("Going from 1 to "+BigInt.bigInt2str(ultimateBI,10));
    for (var m1BI = oneBI; !BigInt.equals(m1BI,ultimateBI); m1BI = BigInt.add(m1BI, oneBI)) {
      var m1nBI = BigInt.powMod(m1BI,nBI,pBI);
      m1nToM1[BigInt.bigInt2str(m1nBI,10)] = m1BI;
    }

    console.log("Done populating Dict");
    for (var m2BI = oneBI; !BigInt.equals(m2BI,ultimateBI); m2BI = BigInt.add(m2BI, oneBI)) {
      var vnBI = BigInt.powMod(cipherText.v,nBI,pBI);
      var m2negnBI = BigInt.powMod(BigInt.inverseMod(m2BI,pBI),nBI,pBI);
      var vnm2negnBI = BigInt.multMod(vnBI,m2negnBI,pBI);
      var vnm2negn = BigInt.bigInt2str(vnm2negnBI,10);
      var m1BI = m1nToM1[vnm2negn];
      if (m1BI !== undefined) {
        console.log("Cracked it!");
        var originalM = BigInt.multMod(m1BI,m2BI,pBI);
        console.log("m1: " + BigInt.bigInt2str(m1BI,10));
        console.log("m2: " + BigInt.bigInt2str(m2BI,10));
        // console.log("Lookup: " + vnm2negn);
        console.log("Guess: " + BigInt.bigInt2str(originalM,10));

        var vnBI = BigInt.powMod(cipherText.v, nBI, pBI);
        var mguessednBI = BigInt.powMod(originalM, nBI, pBI);
        var mnBI = BigInt.powMod(m, nBI, pBI);
        console.log("v^n: "+BigInt.bigInt2str(vnBI,10));
        console.log("m_guess^n: "+BigInt.bigInt2str(mguessednBI,10));
        console.log("m_actual^n: "+BigInt.bigInt2str(mnBI,10));

        var encr = encrypt(originalM, publicKey, k);
        console.log("u: "+BigInt.bigInt2str(encr.u,10));
        console.log("v: "+BigInt.bigInt2str(encr.v,10));
        // break;
      }
    }
    console.log("Done.");
  }

  function testBrute2() {
    var k = 24;
    var pBI = BigInt.randTruePrime(k);
    var foundGenerator = findAGeneratorFor(pBI);
    var gBI = foundGenerator.generatorBI;
    var nBI = foundGenerator.orderBI;
    console.log("g: "+BigInt.bigInt2str(gBI,10));
    console.log("order n: "+BigInt.bigInt2str(nBI,10));

    var oneBI = BigInt.int2bigInt(1,0,0);
    var twoBI = BigInt.int2bigInt(2,0,0);

    var xBI = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,xBI) || BigInt.greater(xBI,BigInt.sub(nBI,oneBI))) {
      xBI = BigInt.randBigInt(k-1,0);
    }

    var privateKey = {
      x: xBI // can be 1...n-1
    };
    console.log("x: "+BigInt.bigInt2str(xBI,10));

    var yBI = findY(gBI,pBI,privateKey);
    var publicKey = {
      p: pBI
    , g: gBI
    , y: yBI
    };
    console.log("p: "+BigInt.bigInt2str(pBI,10));
    console.log("y: "+BigInt.bigInt2str(yBI,10));



    var zeroBI = BigInt.int2bigInt(0,0,0);
    var m = BigInt.int2bigInt(0,0,0);
    var halfM = BigInt.int2bigInt(0,0,0);
    var halfM2 = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,m) ||
      BigInt.greater(m,BigInt.sub(pBI,oneBI)) ||
      (BigInt.equals(BigInt.powMod(m,nBI,pBI),oneBI))) {
      halfM = BigInt.randBigInt(k/4,1);
      halfM2 = BigInt.randBigInt(k/4,1);
      m = BigInt.mult(halfM,halfM2);
    }
    console.log("factor1:" + BigInt.bigInt2str(halfM,10));
    console.log("factor2:" + BigInt.bigInt2str(halfM2,10));

    // var m = BigInt.int2bigInt(3602, 0, 0); // Has to be between 1 and p-1
    console.log("chosen m:" + BigInt.bigInt2str(m,10));

    var b = BigInt.bitSize(m);
    var m1nToM1 = {};
    var b1 = b/2;

    console.log("b:" + b);



    var k = BigInt.int2bigInt(2,1,1); // k is randomly chosen in [1,n-1] each encryption
    var cipherText = encrypt(m, publicKey, k);
    console.log("u: "+BigInt.bigInt2str(cipherText.u,10));
    console.log("v: "+BigInt.bigInt2str(cipherText.v,10));

    console.log("v to n:" + BigInt.bigInt2str(BigInt.powMod(cipherText.v,nBI,pBI),10));

    var vBI = cipherText.v;

    var b1BI = BigInt.int2bigInt(b1,10,10);
    var ultimateBI = BigInt.powMod(twoBI, b1BI, pBI);
    console.log(b);
    console.log(b1);
    console.log(BigInt.bigInt2str(pBI,10));
    console.log(BigInt.bigInt2str(b1BI,10));
    console.log(BigInt.bigInt2str(ultimateBI,10));

    console.log("Starting to populate Dict");
    console.log("Going from 1 to "+BigInt.bigInt2str(ultimateBI,10));
    for (var m1BI = oneBI; !BigInt.equals(m1BI,ultimateBI); m1BI = BigInt.add(m1BI, oneBI)) {
      var m1nBI = BigInt.powMod(m1BI,nBI,pBI);
      m1nToM1[BigInt.bigInt2str(m1nBI,10)] = m1BI;
    }

    console.log("Done populating Dict");
    for (var m2BI = oneBI; !BigInt.equals(m2BI,ultimateBI); m2BI = BigInt.add(m2BI, oneBI)) {
      var vnBI = BigInt.powMod(cipherText.v,nBI,pBI);
      var m2negnBI = BigInt.powMod(BigInt.inverseMod(m2BI,pBI),nBI,pBI);
      var vnm2negnBI = BigInt.multMod(vnBI,m2negnBI,pBI);
      var vnm2negn = BigInt.bigInt2str(vnm2negnBI,10);
      var m1BI = m1nToM1[vnm2negn];
      if (m1BI !== undefined) {
        console.log("Cracked it!");
        var originalM = BigInt.multMod(m1BI,m2BI,pBI);
        console.log("m1: " + BigInt.bigInt2str(m1BI,10));
        console.log("m2: " + BigInt.bigInt2str(m2BI,10));
        // console.log("Lookup: " + vnm2negn);
        console.log("Guess: " + BigInt.bigInt2str(originalM,10));

        var vnBI = BigInt.powMod(cipherText.v, nBI, pBI);
        var mguessednBI = BigInt.powMod(originalM, nBI, pBI);
        var mnBI = BigInt.powMod(m, nBI, pBI);
        console.log("v^n: "+BigInt.bigInt2str(vnBI,10));
        console.log("m_guess^n: "+BigInt.bigInt2str(mguessednBI,10));
        console.log("m_actual^n: "+BigInt.bigInt2str(mnBI,10));

        var encr = encrypt(originalM, publicKey, k);
        console.log("u: "+BigInt.bigInt2str(encr.u,10));
        console.log("v: "+BigInt.bigInt2str(encr.v,10));
        // break;
      }
    }
    console.log("Done.");
  }

  function findPrimeAndGenerator(k,secondsPerAttempt,totalTime) {
    var startTime = new Date();
    var oneBI = BigInt.int2bigInt(1,0,0);
    var twoBI = BigInt.int2bigInt(2,0,0);
    var pBI = BigInt.randTruePrime(k);
    while ((new Date()) - startTime < totalTime * 1000) {
      console.log("Try to factor");
      var factors = factor(BigInt.sub(pBI,oneBI), secondsPerAttempt/2);
      if (factors === false) {
        continue;
      }
      console.log("Try to foundGenerator");
      var foundGenerator = findGeneratorFor(pBI,factors[factors.length-1], secondsPerAttempt/2);
      if (foundGenerator === false) {
        continue;
      }
      return foundGenerator;
    }
    console.log("Aborting findPrimeAndGenerator for time reasons");
    return false;
  }

  function testBrute3() {
    var k = 32;
    var oneBI = BigInt.int2bigInt(1,0,0);
    var twoBI = BigInt.int2bigInt(2,0,0);

    var foundGenerator = findPrimeAndGenerator(k,10,10);
    if (foundGenerator === false) {
      throw "Unable to proceed because of time!";
    }
    var pBI = foundGenerator.pBI;
    var gBI = foundGenerator.generatorBI;
    var nBI = foundGenerator.orderBI;
    console.log("g: "+BigInt.bigInt2str(gBI,10));
    console.log("order n: "+BigInt.bigInt2str(nBI,10));
    console.log("p: "+BigInt.bigInt2str(pBI,10));

    var xBI = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,xBI) || BigInt.greater(xBI,BigInt.sub(nBI,oneBI))) {
      xBI = BigInt.randBigInt(k-1,0);
    }

    var privateKey = {
      x: xBI // can be 1...n-1
    };
    console.log("x: "+BigInt.bigInt2str(xBI,10));

    var yBI = findY(gBI,pBI,privateKey);
    var publicKey = {
      p: pBI
    , g: gBI
    , y: yBI
    };
    console.log("y: "+BigInt.bigInt2str(yBI,10));



    var zeroBI = BigInt.int2bigInt(0,0,0);
    var m = BigInt.int2bigInt(0,0,0);
    var halfM = BigInt.int2bigInt(0,0,0);
    var halfM2 = BigInt.int2bigInt(0,0,0);
    while (BigInt.greater(oneBI,m) ||
      BigInt.greater(m,BigInt.sub(pBI,oneBI)) ||
      (BigInt.equals(BigInt.powMod(m,nBI,pBI),oneBI))) {
      halfM = BigInt.randBigInt(k/4,1);
      halfM2 = BigInt.randBigInt(k/4,1);
      m = BigInt.mult(halfM,halfM2);
    }
    console.log("factor1:" + BigInt.bigInt2str(halfM,10));
    console.log("factor2:" + BigInt.bigInt2str(halfM2,10));

    // var m = BigInt.int2bigInt(3602, 0, 0); // Has to be between 1 and p-1
    console.log("chosen m:" + BigInt.bigInt2str(m,10));

    var b = BigInt.bitSize(m);
    var m1nToM1 = {};
    var b1 = b/2;

    console.log("b:" + b);



    var k = BigInt.int2bigInt(2,1,1); // k is randomly chosen in [1,n-1] each encryption
    var cipherText = encrypt(m, publicKey, k);
    console.log("u: "+BigInt.bigInt2str(cipherText.u,10));
    console.log("v: "+BigInt.bigInt2str(cipherText.v,10));

    console.log("v to n:" + BigInt.bigInt2str(BigInt.powMod(cipherText.v,nBI,pBI),10));

    var vBI = cipherText.v;

    var b1BI = BigInt.int2bigInt(b1,10,10);
    var ultimateBI = BigInt.powMod(twoBI, b1BI, pBI);
    console.log(b);
    console.log(b1);
    console.log(BigInt.bigInt2str(pBI,10));
    console.log(BigInt.bigInt2str(b1BI,10));
    console.log(BigInt.bigInt2str(ultimateBI,10));

    console.log("Starting to populate Dict");
    console.log("Going from 1 to "+BigInt.bigInt2str(ultimateBI,10));
    for (var m1BI = oneBI; !BigInt.equals(m1BI,ultimateBI); m1BI = BigInt.add(m1BI, oneBI)) {
      var m1nBI = BigInt.powMod(m1BI,nBI,pBI);
      m1nToM1[BigInt.bigInt2str(m1nBI,10)] = m1BI;
    }

    console.log("Done populating Dict");
    for (var m2BI = oneBI; !BigInt.equals(m2BI,ultimateBI); m2BI = BigInt.add(m2BI, oneBI)) {
      var vnBI = BigInt.powMod(cipherText.v,nBI,pBI);
      var m2negnBI = BigInt.powMod(BigInt.inverseMod(m2BI,pBI),nBI,pBI);
      var vnm2negnBI = BigInt.multMod(vnBI,m2negnBI,pBI);
      var vnm2negn = BigInt.bigInt2str(vnm2negnBI,10);
      var m1BI = m1nToM1[vnm2negn];
      if (m1BI !== undefined) {
        console.log("Cracked it!");
        var originalM = BigInt.multMod(m1BI,m2BI,pBI);
        console.log("m1: " + BigInt.bigInt2str(m1BI,10));
        console.log("m2: " + BigInt.bigInt2str(m2BI,10));
        // console.log("Lookup: " + vnm2negn);
        console.log("Guess: " + BigInt.bigInt2str(originalM,10));

        var vnBI = BigInt.powMod(cipherText.v, nBI, pBI);
        var mguessednBI = BigInt.powMod(originalM, nBI, pBI);
        var mnBI = BigInt.powMod(m, nBI, pBI);
        console.log("v^n: "+BigInt.bigInt2str(vnBI,10));
        console.log("m_guess^n: "+BigInt.bigInt2str(mguessednBI,10));
        console.log("m_actual^n: "+BigInt.bigInt2str(mnBI,10));

        var encr = encrypt(originalM, publicKey, k);
        console.log("u: "+BigInt.bigInt2str(encr.u,10));
        console.log("v: "+BigInt.bigInt2str(encr.v,10));
        break;
      }
    }
    console.log("Done.");
  }

  window.findAGeneratorFor = findAGeneratorFor;
  window.int2bigInt = BigInt.int2bigInt;
  window.sub = BigInt.sub;
  window.randTruePrime = BigInt.randTruePrime;
  window.test = test;
  window.findAGeneratorForAPrimeWithBitsAndRounds = findAGeneratorForAPrimeWithBitsAndRounds;
  window.GCD = BigInt.GCD
  window.BigInt = BigInt
  window.factor = factor;
  window.isProbablyPrime = isProbablyPrime;
  window.findGeneratorFor = findGeneratorFor;
  window.findPrimeAndGenerator = findPrimeAndGenerator;

  //findAGeneratorForAPrimeWithBitsAndRounds(5,40);
  // testBrute2();
  // testBrute3();

  return { factor: factor
         , stringifyBI: function (x) {return BigInt.bigInt2str(x,10);}
         , findPrimeAndGenerator: findPrimeAndGenerator
         , findY: findY
         , encrypt: encrypt
         };

});
