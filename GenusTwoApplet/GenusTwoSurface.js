let DomainSketch = function(p) {

    let surfacePlaneModel = {
        S1_Y: 0,
        S2_Y: -5,
        Vertices:{'++':{}, '-+':{}, '+-':{}, '--':{} },
        ScreenVertices: {}
    }


    // array of pairs of vertex names, and vertex name of desired color
    const sectionLineMesh = [
        ['Zm1', 'O', 'O'],
        // ['Zmk1', 'Zm1', 'Zm1'],
        ['Zmk2', 'Zmk1', 'Zmk1'],
        // ['Inf-X', 'Zmk2', 'Zmk2'],
        ['O', 'Z1', 'O'],
        ['Z1', 'Zk1', 'Z1__'],
        ['Zk1', 'Zk2', 'Zk1__'],
        // ['Zk2', 'InfX', 'Zk2'],
    ];
    const sectionTriangleMesh = [
        ['O', 'Z1', 'Inf'],
        ['Z1', 'Zk1', 'Inf'],
        ['Zk1', 'Zk2', 'Inf'],
        ['Zk2', 'InfX', 'Inf'],
        ['InfX', 'InfXZ', 'Inf'],
        ['O', 'Zm1', 'Inf'],
        ['Zm1', 'Zmk1', 'Inf'],
        ['Zmk1', 'Zmk2', 'Inf'],
        ['Zmk2', 'Inf-X', 'Inf'],
        ['Inf-X', 'Inf-XZ', 'Inf'],
    ];

        
    let k1 = 0.5; // surfacesTensor.integrals.k1;
    let k2 = 0.35; // surfacesTensor.integrals.k2;
    let Inf = 4.5;
    let S1_Y = 0; let S2_Y=2;

    // p.fontSize = 10;
    // p.preload = function() {
    //     // p.font = loadFont(
    //     //     'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf'
    //     // );
    // }


    p.setup = function() {
        p.winWidth = windowWidth*0.8;
        p.winHeight = math.min(0.75*p.winWidth,windowHeight*0.7);
        p.createCanvas(p.winWidth, p.winHeight,WEBGL).parent('domain-canvas');
        p.drawingContext.disable(p.drawingContext.DEPTH_TEST);

        p.scaleCamera = 0.9*p.winWidth/(1/k2);

        p.font = font;
        p.fontSize = 50/p.scaleCamera;
        p.vertexToTextOffset = [-20/p.scaleCamera,-20/p.scaleCamera,0];

        // p.textureMode(NORMAL); // important for correct uv texture coordinate 0<u,v<1
        p.textFont(font);
        p.textSize(60/p.scaleCamera);


        surfacePlaneModel.Vertices['++']['O'] = [0, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Z1'] = [1, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Zm1'] = [-1, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Zk1'] = [1/k1, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Zmk1'] = [-1/k1, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Zk2'] = [1/k2, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Zmk2'] = [-1/k2, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['InfX'] = [Inf, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['Inf-X'] = [-Inf, S1_Y, 0];
        surfacePlaneModel.Vertices['++']['InfXZ'] = [Inf, S1_Y, -Inf];
        surfacePlaneModel.Vertices['++']['Inf-XZ'] = [-Inf, S1_Y, -Inf];
        surfacePlaneModel.Vertices['++']['Inf'] = [0, S1_Y, -Inf];

        surfacePlaneModel.Vertices['-+']['O'] = [0, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Z1'] = [1, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Zm1'] = [-1, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Zk1'] = [1/k1, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Zmk1'] = [-1/k1, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Zk2'] = [1/k2, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Zmk2'] = [-1/k2, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['InfX'] = [Inf, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['Inf-X'] = [-Inf, S1_Y, 0];
        surfacePlaneModel.Vertices['-+']['InfXZ'] = [Inf, S1_Y, Inf];
        surfacePlaneModel.Vertices['-+']['Inf-XZ'] = [-Inf, S1_Y, Inf];
        surfacePlaneModel.Vertices['-+']['Inf'] = [0, S1_Y, Inf];

        surfacePlaneModel.Vertices['--']['O'] = [0, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Z1'] = [1, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Zm1'] = [-1, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Zk1'] = [1/k1, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Zmk1'] = [-1/k1, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Zk2'] = [1/k2, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Zmk2'] = [-1/k2, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['InfX'] = [Inf, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['Inf-X'] = [-Inf, S2_Y, 0];
        surfacePlaneModel.Vertices['--']['InfXZ'] = [Inf, S2_Y, Inf];
        surfacePlaneModel.Vertices['--']['Inf-XZ'] = [-Inf, S2_Y, Inf];
        surfacePlaneModel.Vertices['--']['Inf'] = [0, S2_Y, Inf];

        surfacePlaneModel.Vertices['+-']['O'] = [0, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Z1'] = [1, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Zm1'] = [-1, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Zk1'] = [1/k1, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Zmk1'] = [-1/k1, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Zk2'] = [1/k2, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Zmk2'] = [-1/k2, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['InfX'] = [Inf, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['Inf-X'] = [-Inf, S2_Y, 0];
        surfacePlaneModel.Vertices['+-']['InfXZ'] = [Inf, S2_Y, -Inf];
        surfacePlaneModel.Vertices['+-']['Inf-XZ'] = [-Inf, S2_Y, -Inf];
        surfacePlaneModel.Vertices['+-']['Inf'] = [0, S2_Y, -Inf];

        surfacePlaneModel.ScreenVertices ={

        };
    };

    p.draw = function() {
        p.background(255);

        p.rotateX(-0.55);
        // p.rotateY(-0.1);
        p.scale(p.scaleCamera);
        p.translate(0,-S2_Y/2+S2_Y*1.2,-6);
        
        p.push();
        p.noStroke();
        for (const section in surfacePlaneModel.Vertices){
            p.fill(colors[section+"_"]);
            p.beginShape(TRIANGLES);
            for (const tri of sectionTriangleMesh) {
                for (const vtx of tri) {
                    let v = surfacePlaneModel.Vertices[section][vtx];
                    p.vertex(v[0], v[1], v[2]);
                }
            }
            p.endShape();
        }
        p.pop();

        // branching horizontal indicators
        const B = 15;
        const dy = (S2_Y-S1_Y)/B;
        p.push();
        p.stroke(140,150);
        p.strokeWeight(7);
        p.line(...surfacePlaneModel.Vertices['++']['Zk1'], ...surfacePlaneModel.Vertices['--']['Zk1']);
        p.line(...surfacePlaneModel.Vertices['++']['Zk2'], ...surfacePlaneModel.Vertices['--']['Zk2']);
        p.strokeWeight(5);
        for (let y=S1_Y+dy; y<S2_Y-0.01; y+=dy){
            console.log(dy);
            p.translate(0,+dy,0);
            p.line(...surfacePlaneModel.Vertices['++']['Inf-X'], ...surfacePlaneModel.Vertices['++']['Zmk2']);
            p.line(...surfacePlaneModel.Vertices['++']['InfX'], ...surfacePlaneModel.Vertices['++']['Zk2']);
            p.line(...surfacePlaneModel.Vertices['++']['Zmk1'], ...surfacePlaneModel.Vertices['++']['Zm1']);
            p.line(...surfacePlaneModel.Vertices['++']['Zk1'], ...surfacePlaneModel.Vertices['++']['Z1']);
        }
        p.pop();
        // vertical connections
        p.push();
        p.strokeWeight(12);
        p.stroke(colors['O']);
        p.line(...surfacePlaneModel.Vertices['++']['Z1'], ...surfacePlaneModel.Vertices['--']['Z1']);
        p.line(...surfacePlaneModel.Vertices['++']['Zm1'], ...surfacePlaneModel.Vertices['--']['Zm1']);
        p.stroke(colors['Zmk1']);
        p.line(...surfacePlaneModel.Vertices['++']['Zmk1'], ...surfacePlaneModel.Vertices['--']['Zmk1']);
        p.line(...surfacePlaneModel.Vertices['++']['Zmk2'], ...surfacePlaneModel.Vertices['--']['Zmk2']);
        p.pop();
        // curved cycles
        p.push();
        p.rotateX(PI / 2);
        p.fill(255,150);
        p.strokeWeight(12);
        p.stroke(colors['Zm1']);
        p.arc(-((1/k1-1)/2 + 1), 0, (1/k1-1),1.5, 0, 2*PI);
        p.stroke(colors['Zmk2']);
        p.arc(-Inf,0, (Inf-1/k2)*2, 1.5, -PI/2, PI/2);
        p.arc(Inf,0, (Inf-1/k2)*2, 1.5, PI/2, 3*PI/2);
        p.pop();
        // VERTICES
        for (const section in surfacePlaneModel.Vertices){
            for (const vtx in surfacePlaneModel.Vertices[section]) {
                if(vtx[0]=='I'&& vtx.length!=3){ continue; }
                p.push();
                p.noStroke();
                p.fill(colors[vtx]);
                let v = surfacePlaneModel.Vertices[section][vtx];
                p.translate(v[0], v[1], v[2])
                p.sphere(15/p.scaleCamera);
                p.fill(0);
                p.stroke(0);
                p.translate(...p.vertexToTextOffset);
                p.text(vtx, 0,0,0);
                p.pop();
            }
        }
        // straight horizontal connections
        for (const section in surfacePlaneModel.Vertices){
            for (const [a, b, col] of sectionLineMesh) {
                p.push();
                p.stroke(colors[col]);
                p.strokeWeight(12);
                p.line(...surfacePlaneModel.Vertices[section][a], ...surfacePlaneModel.Vertices[section][b]);
                p.pop();
            }
        }
        

        p.noLoop();
    };
};

const DomainCanvas = new p5(DomainSketch);