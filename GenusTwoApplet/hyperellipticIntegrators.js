
// the polynomial in Legendre normal form
function MyPolynomial(x, k1, k2) {
    return (1-x*x) * (1-k1*k1*x*x) * (1-k2*k2*x*x);
}

function MyPolynomialReduced(x,k1,k2,zeroRemoved){
    // return (MyPolynomial(x) / (z[i]-x) ), where z[i] is one of the 6 zeros
    // zeroRemoved is an integer 1-6 indicating which zero has been removed
    switch(zeroRemoved){
        case(1): // 1-x
            return (1+x) * (1-k1*k1*x*x) * (1-k2*k2*x*x);
        case(2): // 1/k1 - x
            return (1-x*x) * k1*(1+k1*x) * (1-k2*k2*x*x);
        case(3): // 1/k2 - x
            return (1-x*x) * (1-k1*k1*x*x) * k2*(1+k2*x);
        // case(4):
        //     return (1-x-1) * (k1*k1*x*x-1) * (k2*k2*x*x-1);
        // case(5):
        //     return (x*x-1) * k1*(k1*x-1) * (k2*k2*x*x-1);
        // case(6):
        //     return (x*x-1) * (k1*k1*x*x-1) * k2*(k2*x-1);
    }
}


const GL16_X = [
  -0.9894009349, -0.9445750231, -0.8656312024, -0.7554044083,
  -0.6178762444, -0.4580167777, -0.2816035508, -0.0950125098,
   0.0950125098,  0.2816035508,  0.4580167777,  0.6178762444,
   0.7554044083,  0.8656312024,  0.9445750231,  0.9894009349
];
const GL16_W = [
  0.0271524594, 0.0622535239, 0.0951585117, 0.1246289713,
  0.1495959888, 0.1691565194, 0.1826034150, 0.1894506105,
  0.1894506105, 0.1826034150, 0.1691565194, 0.1495959888,
  0.1246289713, 0.0951585117, 0.0622535239, 0.0271524594
];

// const GL32_X = [
//   -0.9972638618, -0.9856115115, -0.9647622556, -0.9349060759,
//   -0.8963211558, -0.8493676137, -0.7944837959, -0.7321821187,
//   -0.6630442669, -0.5877157572, -0.5068999089, -0.4213512761,
//   -0.3318686023, -0.2392873623, -0.1444719616, -0.0483076657,
//    0.0483076657,  0.1444719616,  0.2392873623,  0.3318686023,
//    0.4213512761,  0.5068999089,  0.5877157572,  0.6630442669,
//    0.7321821187,  0.7944837959,  0.8493676137,  0.8963211558,
//    0.9349060759,  0.9647622556,  0.9856115115,  0.9972638618
// ];
// const GL32_W = [
//   0.0070186100, 0.0162743947, 0.0253920653, 0.0342738629,
//   0.0428358980, 0.0509980593, 0.0586840935, 0.0658222228,
//   0.0723457941, 0.0781938958, 0.0833119242, 0.0876520930,
//   0.0911738787, 0.0938443991, 0.0956387201, 0.0965400885,
//   0.0965400885, 0.0956387201, 0.0938443991, 0.0911738787,
//   0.0876520930, 0.0833119242, 0.0781938958, 0.0723457941,
//   0.0658222228, 0.0586840935, 0.0509980593, 0.0428358980,
//   0.0342738629, 0.0253920653, 0.0162743947, 0.0070186100
// ];

function gaussLegendre16(a,b,f) {
  const c = 0.5 * (b - a);
  const d = 0.5 * (b + a);

  let sum = 0;
  for (let i = 0; i < 16; i++) {
    const t = c * GL16_X[i] + d;
    sum += GL16_W[i] * f(t);
  }

  return c * sum;
}
// function gaussLegendre32(a,b,f) {
//   const c = 0.5 * (b - a);
//   const d = 0.5 * (b + a);

//   let sum = 0;
//   for (let i = 0; i < 32; i++) {
//     const t = c * GL32_X[i] + d;
//     sum += GL32_W[i] * f(t);
//   }

//   return c * sum;
// }




function updateModuli() {
    let k1 = parseFloat(k1Slider.value);
    let k2 = parseFloat(k2Slider.value);

    // Ensure k2 <= k1 dynamically
    if (k2 > k1*0.95) {
        k2 = k1*0.95;
        k2Slider.value = k2;
    }
    k2Slider.max = k1*0.95;

    // Update slider labels
    k1Value.textContent = k1.toFixed(3);
    k2Value.textContent = k2.toFixed(3);

    if(surfacesTensor) surfacesTensor.updateModuli(k1,k2,true);
}

function setupHyperellipticIntegrators(){
    k1Slider = document.getElementById('k1Slider');
    k2Slider = document.getElementById('k2Slider');

    k1Slider.addEventListener('input', updateModuli);
    k2Slider.addEventListener('input', updateModuli);

    updateModuli();
}






class IntegralsArray {
    constructor(k1,k2,display=false) {
        if(k1 && k2) this.updateModuli(k1,k2,display);

        // this.A1 = [math.complex(2,0), math.complex(1.376, 0)];
        // this.At1 = [this.A1[0], math.multiply(-1,this.A1[1])];
        // this.B1 = [math.multiply(-1,this.A1[0]), math.complex(3.313,0)];
        // this.Bt1 = [this.B1[0], math.multiply(-1, this.B1[1])];
        // this.C1 = [math.complex(0, -2.34), math.complex(0, 2.83)];
        // this.Ct1 = [math.multiply(-1, this.C1[0]), this.C1[1]];
        // this.D1 = [math.complex(0, -0.973), math.multiply(-1, this.C1[1])];
        // this.Dt1 = [math.multiply(-1, this.D1[0]), math.multiply(-1, this.C1[1])];
        
        // this.PeriodMatrix = [
        //     [math.multiply(4, this.A1[0]), math.multiply(2, this.B1[0]), math.multiply(2, this.C1[0]), 0],
        //     [0, math.multiply(2, this.B1[1]), math.multiply(2, this.C1[1]), math.multiply(4, this.D1[1])],
        // ];
    }

    updateModuli(k1,k2, display=false){
        this.k1=k1; this.k2=k2;
        // integrals on the real edge of the upper half plane
        // magnitude of integrals of w_j between: 0--1, 1--1/k1, 1/k1--1/k2, 1/k2--inf
        let I11, I12, I13, I14, I21, I22, I23, I24;

        // Trigonometric substitution
        // let substitution;
        // substitution = (theta,k1,k2)=>{
        //     const s = Math.sin(theta);
        //     return 1/Math.sqrt( (1 - k1*k1*s*s) * (1 - k2*k2*s*s) ); }
        // I11 = gaussLegendre32(0,Math.PI / 2,
        //     theta => substitution(theta, k1, k2)
        // );
        
        // substitution = (theta,k1,k2)=>{
        //     const s = Math.sin(theta);
        //     return s/Math.sqrt( (1 - k1*k1*s*s) * (1 - k2*k2*s*s) ); }
        // I21 = gaussLegendre32(0,Math.PI / 2,
        //     theta => substitution(theta,k1,k2)
        // );
            
        //  y=sqrt(x) substitutions

        // 0 -------- 1
        I11 = 2 * gaussLegendre16(0, 1,
            y => { return 1/Math.sqrt(MyPolynomialReduced(1-y**2,k1,k2,1)); }
        );

        I21 = 2 * gaussLegendre16(0, 1,
            y => { return (1-y**2)/Math.sqrt(MyPolynomialReduced(1-y**2,k1,k2,1)); }
        );

        // 1 -------- 1/k1
        let m = (1+1/k1)/2;
        I12 = (2 * gaussLegendre16(0, Math.sqrt(m-1),
            y => { return 1/Math.sqrt(MyPolynomialReduced(y**2+1,k1,k2,1)); }
        ) + 2 * gaussLegendre16(0, Math.sqrt(1/k1-m),
            y => { return 1/Math.sqrt(-MyPolynomialReduced(1/k1-y**2,k1,k2,2)); }
        ));
        I22 = (2 * gaussLegendre16(0, Math.sqrt(m-1),
            y => { return (y**2+1)/Math.sqrt(MyPolynomialReduced(y**2+1,k1,k2,1)); }
        ) + 2 * gaussLegendre16(0, Math.sqrt(1/k1-m),
            y => { return (1/k1-y**2)/Math.sqrt(-MyPolynomialReduced(1/k1-y**2,k1,k2,2)); }
        ));

        // 1/k1 -------- 1/k2
        m = (1/k1+1/k2)/2;
        I13 = (2 * gaussLegendre16(0, Math.sqrt(m-1/k1),
            y => { return 1/Math.sqrt(-MyPolynomialReduced(y**2+1/k1,k1,k2,2)); }
        ) + 2 * gaussLegendre16(0, Math.sqrt(1/k2-m),
            y => { return 1/Math.sqrt(MyPolynomialReduced(1/k2-y**2,k1,k2,3)); }
        ));
        I23 = (2 * gaussLegendre16(0, Math.sqrt(m-1/k1),
            y => { return (y**2+1/k1)/Math.sqrt(-MyPolynomialReduced(y**2+1/k1,k1,k2,2)); }
        ) + 2 * gaussLegendre16(0, Math.sqrt(1/k2-m),
            y => { return (1/k2-y**2)/Math.sqrt(MyPolynomialReduced(1/k2-y**2,k1,k2,3)); }
        ));

        // 1/k2 -------- inf
        I14 = (2 * gaussLegendre16(0, 50,
            y => { return 1/Math.sqrt(MyPolynomialReduced(y**2+1/k2,k1,k2,3)); }
        ));
        I24 = (2 * gaussLegendre16(0, 50,
            y => { return (y**2+1/k2)/Math.sqrt(MyPolynomialReduced(y**2+1/k2,k1,k2,3)); }
        ));

        this.A1 = [ math.complex(I11,0), math.complex(I21,0) ];
        this.At1 = [this.A1[0], math.multiply(-1,this.A1[1])];

        this.B1 = [math.multiply(-1,this.A1[0]), math.complex(I23,0)];
        this.Bt1 = [this.B1[0], math.multiply(-1, this.B1[1])];

        this.C1 = [math.complex(0, -I12), math.complex(0, I22)];
        this.Ct1 = [math.multiply(-1, this.C1[0]), this.C1[1]];

        this.D1 = [math.complex(0, -I14), math.multiply(-1, this.C1[1])];
        this.Dt1 = [math.multiply(-1, this.D1[0]), math.multiply(-1, this.C1[1])];
        
        this.PeriodMatrix = [
            [math.multiply(4, tofixedVec(this.A1, 2)[0]), math.multiply(2, tofixedVec(this.B1, 2)[0]), math.multiply(2, tofixedVec(this.C1, 2)[0]), 0],
            [0, math.multiply(2, tofixedVec(this.B1, 2)[1]), math.multiply(2, tofixedVec(this.C1, 2)[1]), math.multiply(4, tofixedVec(this.D1, 2)[1])],
        ];

        if(display) this.displayMatrix();
    }

    displayMatrix(){
        document.getElementById("I11").textContent = this.PeriodMatrix[0][0];
        document.getElementById("I12").textContent = this.PeriodMatrix[0][1];
        document.getElementById("I13").textContent = this.PeriodMatrix[0][2];
        document.getElementById("I14").textContent = this.PeriodMatrix[0][3];
        
        document.getElementById("I21").textContent = this.PeriodMatrix[1][0];
        document.getElementById("I22").textContent = this.PeriodMatrix[1][1];
        document.getElementById("I23").textContent = this.PeriodMatrix[1][2];
        document.getElementById("I24").textContent = this.PeriodMatrix[1][3];
    }
}