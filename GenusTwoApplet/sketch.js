// ============ p5.js interaction ======================================

let winWidth; // in setup function
let winHeight;

let font;
let fontBold;
let fontSize = 14;
let vertexToTextOffset = [-4,-4,0];
function preload() {
    font = loadFont(
        'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf'
    );
    fontBold = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

let lastMouseX, lastMouseY; //dragging variables
let dragging = false;
function mousePressed() {
    if(showAxes){ updateAxis4Gizmo(); }
    if (hoveringAxis4) {
        draggingAxis4 = true;
    }
    else{
        dragging = true;
    }
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}
function mouseReleased() {
    draggingAxis4 = false;
    dragging = false;
}

let panX = 0; //camera translation
let panY = 0;
let rotX = 0; //camera rotation
let rotY = 0;
function mouseDragged() {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
    if (draggingAxis4) {
        // screen-space → world-space heuristic
        axis4Dir = [axis4Dir[0]+dx*0.00005,axis4Dir[1]-dy*0.00005,axis4Dir[2]];
        axis4Dir = scaleVec(axisDirMagn/math.sqrt(axis4Dir[0]**2+axis4Dir[1]**2+axis4Dir[2]**2), axis4Dir);
        M = [
            [ProjectionMatrix[0][0],ProjectionMatrix[0][1],ProjectionMatrix[0][2],axis4Dir[0]],
            [ProjectionMatrix[1][0],ProjectionMatrix[1][1],ProjectionMatrix[1][2],axis4Dir[1]],
            [ProjectionMatrix[2][0],ProjectionMatrix[2][1],ProjectionMatrix[2][2],axis4Dir[2]]
        ];
        setProjectionMatrix(M);
        return; // swallow event
    }
    else if(dragging){
        if (keyIsDown(SHIFT)) {
            // ROTATE camera
            rotY += dx * 0.005;
            rotX += -dy * 0.005;
        } else {
            // PAN camera (move in camera plane)
            panX += dx;
            panY += dy;
        }
    }
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}



let scaleCamera = 1; 
let zoom = 1.0;
function mouseWheel(event) {
    zoom *= (1 - event.delta * 0.001);
    zoom = constrain(zoom, 0.2, 5);  // prevent inversion / disappearance
    return false; // prevent page scroll
}
function keyPressed() {
    if (key === 'r') {
        rotX = 0;
        rotY = 0;
        panX = 0;
        panY = 0;
        zoom = 1;
    }
}










// ============ Coordinate mappings ======================================

// mapping from Euclidean R^3 to screen pixel coordinates
let scaleFactor=40; // pixels per unit length
let ScreenMatrix = [
    [scaleFactor, 0, 0],
    [0, -scaleFactor, 0],
    [0, 0, -scaleFactor]
];
function updateScale(k){
    scaleFactor=k;
    ScreenMatrix =
    [[scaleFactor, 0, 0],
    [0, -scaleFactor, 0],
    [0, 0, -scaleFactor] ].map((arr)=>{ return arr.slice(); });
}
function fitScaleToSurface(surface){
    let k = winWidth/(surface.Bounds.Re1breadth);
    k = min(k, winHeight/(surface.Bounds.Im1breadth) );
    k = min(k, winWidth/(surface.Bounds.Re2breadth) );
    k = min(k, winHeight/(surface.Bounds.Im2breadth) );
    k*=0.8;
    updateScale(k);
}
function centerToSurface(surface){
    let center = screenMap(projectionMap([surface.Bounds.Re1center,surface.Bounds.Im1center,surface.Bounds.Re2center,surface.Bounds.Im2center]));
    panX = -center[0];
    panY = -center[1];
}
function screenMap(Z){
    let P = [];
    for (let i=0; i<3; i++){
        let sum = 0;
        for (let j=0; j<3; j++){
            sum = math.add(sum, math.multiply(ScreenMatrix[i][j], Z[j]));
        }
        P.push(sum);
    }
    return P;
}




// Unit vector in R^3 giving direction of 4th axis
let axis4Dir = [0,0.2,0.5];
const axisDirMagn = math.sqrt(axis4Dir[0]**2+axis4Dir[1]**2+axis4Dir[2]**2);
const axis4DirScale = 5;
const AXIS4_RADIUS = 20;
let hoveringAxis4 = false;
let draggingAxis4 = false;
function updateAxis4Gizmo() {
    let sp = screenPosition(multVec(ScreenMatrix,scaleVec(axis4DirScale,axis4Dir)));
    fill(255,0,0,200);
    let d = dist(mouseX-winWidth/2, mouseY-winHeight/2, sp.x, sp.y);
    hoveringAxis4 = d < AXIS4_RADIUS;
    if (hoveringAxis4) { cursor(HAND); }
    else { cursor(ARROW); }

    const p=multVec(ScreenMatrix,scaleVec(axis4DirScale,axis4Dir));
    push();
    noStroke(0);
    strokeWeight(3);
    line(0, 0, 0, ...p);

    noStroke();
    if (hoveringAxis4 || draggingAxis4) {
        fill(255, 100, 100);
    } else {
        fill(200, 50, 50);
    }
    translate(...p);
    sphere(5);
    pop();
}

// Projection C^2 = R^4 -> R^3 
const ProjectionTemplates = {
    mixed: [
        [1, 0, 0, axis4Dir[0]],
        [0, 1, 0, axis4Dir[1]],
        [0, 0, 1, axis4Dir[2]],
    ],
    C1: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
    ],
    C2: [
        [0, 0, 0, axis4Dir[0]],
        [0, 0, 0, axis4Dir[1]],
        [0, 0, 1, axis4Dir[2]],
    ],
};
// deep copy of template projection matrix
let ProjectionMatrix = ProjectionTemplates.mixed.map((arr)=>{ return arr.slice(); });
function projectionMap(z){
    let Z;
    if(z.length==4){ Z=z; } // if 4-real vector
    else if(z.length==2){ Z = [z[0].re,z[0].im,z[1].re,z[1].im]; } // if z 2-complex vector
    let P = [];
    for (let i=0; i<3; i++){
        let sum = 0;
        for (let j=0; j<4; j++){
            sum = math.add(sum, math.multiply(ProjectionMatrix[i][j], Z[j]));
        }
        P.push(sum);
    }
    return P;
}







const MatMinusId = [
    [-1, 0],
    [0, -1],
];
const MatFlip2 = [
    [1, 0],
    [0, -1],
];

// complex 2-vector addition
function addVec(v,w){
    return [math.add(v[0],w[0]), math.add(v[1],w[1])];
}
function subVec(v,w){
    return [math.add(v[0],math.multiply(-1,w[0])), math.add(v[1],math.multiply(-1,w[1]))];
}
function scaleVec(k,v){
    return [k*v[0],k*v[1],k*v[2]];
}
function multVec(M, v) {
    if (M.length === 0) return [];

    const rows = M.length;
    const cols = M[0].length;

    if (v.length !== cols) {
        throw new Error("Matrix/vector size mismatch");
    }

    let result = new Array(rows);

    for (let i = 0; i < rows; i++) {
        let sum = 0;
        for (let j = 0; j < cols; j++) {
            sum = math.add(sum, math.multiply(M[i][j], v[j]));
        }
        result[i] = sum;
    }

    return result;
}










// ==================== p5.js EXECUTION =============================

let integralsArray;

let surface;
let surfaceTensor;
function surfaceTensorIter(func){
    for(let i1=0; i1<surfaceTensor.length; i1++){
        for(let i2=0; i2<surfaceTensor[i1].length; i2++){
            for(let i3=0; i3<surfaceTensor[i1][i2].length; i3++){
                for(let i4=0; i4<surfaceTensor[i1][i2][i3].length; i4++){
                    func(surfaceTensor[i1][i2][i3][i4]);
                }
            }
        }
    }
}

let projectionAnimation = true;
let showAxes = false;
let showVertexLabels = false;

function setup() {
    winWidth = windowWidth*0.8;
    winHeight = windowHeight*0.9;
    let canvas = createCanvas(winWidth, winHeight, WEBGL);
    canvas.parent('canvas-container');
    frameRate(30);

    addScreenPositionFunction();

    textFont(font);
    textSize(fontSize);

    integralsArray = new IntegralsArray();
    
    surfaceTensor = [];
    let surfaceTensorDims = [2,2,2,2];
    for(let i1=0; i1<surfaceTensorDims[0]; i1++){
        surfaceTensor.push([]);
        for(let i2=0; i2<surfaceTensorDims[1]; i2++){
            surfaceTensor[i1].push([]);
            for(let i3=0; i3<surfaceTensorDims[2]; i3++){
                surfaceTensor[i1][i2].push([]);
                for(let i4=0; i4<surfaceTensorDims[3]; i4++){
                    let S = new Surface(integralsArray,[i1,i2,i3,i4]);
                    surfaceTensor[i1][i2][i3].push(S);
                }
            }
        }
    }
    console.log(surfaceTensor);
    surface = surfaceTensor[0][0][0][0];
    fitScaleToSurface(surface);
    centerToSurface(surface);
    fitAxesToSurface(surface);
    
    buildProjectionMatrixTable();
    setProjectionMatrix(ProjectionTemplates.mixed);
    
    setupProjectionMatrixButtons();

    buildPeriodMatrix();
}

function draw() {
    background(255);

    // camera transforms
    translate(panX, panY, 0);
    scale(scaleCamera*zoom);
    rotateX(rotX);
    rotateY(rotY);

    if(showAxes && !projectionAnimation){ updateAxis4Gizmo(); }
    else if(projectionAnimation){
        ProjectionMatrix[0][3] = 0.5*math.sin(frameCount/50);
        ProjectionMatrix[1][3] = 0.2+0.5*math.cos(frameCount/50);
        ProjectionMatrix[2][3] = 0.5+0.3*math.sin(frameCount/40);
        setProjectionMatrix();
    }

    surfaceTensorIter((surface)=>{surface.displayTriangles();})
    surfaceTensorIter((surface)=>{
        surface.displayEdges(2);
        surface.displayVertices(3,showVertexLabels);
    })

    if(showAxes){ drawAxes(true); }
}













// ===== CLASSES =====
class IntegralsArray {
    constructor() {
        this.A1 = [math.complex(2,0), math.complex(1.376, 0)];
        this.At1 = [math.complex(2,0), math.multiply(-1,this.A1[1])];
        this.B1 = [math.multiply(-1,this.A1[0]), math.complex(3.313,0)];
        this.Bt1 = [this.B1[0], math.multiply(-1, this.B1[1])];
        this.C1 = [math.complex(0, -2.34), math.complex(0, 2.83)];
        this.Ct1 = [math.multiply(-1, this.C1[0]), this.C1[1]];
        this.D1 = [math.complex(0, -0.973), math.multiply(-1, this.C1[1])];
        this.Dt1 = [math.multiply(-1, this.D1[0]), math.multiply(-1, this.C1[1])];
        
        this.PeriodMatrix = [
            [math.multiply(4, this.A1[0]), math.multiply(2, this.B1[0]), math.multiply(2, this.C1[0]), 0],
            [0, math.multiply(2, this.B1[1]), math.multiply(2, this.C1[1]), math.multiply(4, this.D1[1])],
        ];
    }
}


const colors = {
        O:   "#ff9300",
        Z1: "#ff2600",
        Zm1: "#ff2600",
        Zk1: "#669c35",
        Zmk1: "#669c35",
        Zk2: "#38571a",
        Zmk2: "#38571a",
        Inf: "#6b1cfd",
        Z1__: "#669c3520",
        Zk1__: "#38571a20",
        Inf__: "#6b1cfd20",
        '++': "#aedf8590",
        '-+': "#78d12a90",
        '+-': "#59d5ff90",
        '--': "#4688fb90",
};

// array of pairs of vertex names, and vertex name of desired color
const sectionLineMesh = [
    ['Zm1', 'O', 'O'],
    ['Zmk1', 'Zm1', 'Zm1'],
    ['Zmk2', 'Zmk1', 'Zmk1'],
    ['Inf', 'Zmk2', 'Zmk2'],
    ['O', 'Z1', 'O'],
    ['Z1', 'Zk1', 'Z1__'],
    ['Zk1', 'Zk2', 'Zk1__'],
    ['Zk2', 'Inf', 'Zk2'],

    ['O', 'Inf', 'Inf__'],
    ['Zm1', 'Inf', 'Inf__'],
    ['Z1', 'Inf', 'Inf__'],
    ['Zk1', 'Inf', 'Inf__'],
    ['Zmk1', 'Inf', 'Inf__'],
];
const sectionTriangleMesh = [
    ['O', 'Z1', 'Inf'],
    ['Z1', 'Zk1', 'Inf'],
    ['Zk1', 'Zk2', 'Inf'],
    ['O', 'Zm1', 'Inf'],
    ['Zm1', 'Zmk1', 'Inf'],
    ['Zmk1', 'Zmk2', 'Inf'],
];

class Surface {
    constructor(integrals,counts) {
        this.Integrals = integrals;
        
        // tuples of complex numbers, grouped by the four sections of the genus 2 surface
        this.Vertices = {
            '++': {},
            '-+': {},
            '+-': {},
            '--': {}
        }
        this.Vertices['++']['O'] = [math.complex(0, 0), math.complex(0, 0)];
        this.Vertices['++']['Z1'] = addVec(this.Vertices['++']['O'], integrals.A1);
        this.Vertices['++']['Zm1'] = subVec(this.Vertices['++']['O'], integrals.At1);
        this.Vertices['++']['Zk1'] = addVec(this.Vertices['++']['Z1'], integrals.Ct1);
        this.Vertices['++']['Zmk1'] = subVec(this.Vertices['++']['Zm1'], integrals.C1);
        this.Vertices['++']['Zk2'] = addVec(this.Vertices['++']['Zk1'], integrals.Bt1);
        this.Vertices['++']['Zmk2'] = subVec(this.Vertices['++']['Zmk1'], integrals.B1);
        this.Vertices['++']['Inf'] = subVec(this.Vertices['++']['Zmk2'], integrals.Dt1);


        this.Vertices['-+']['Zk1'] = this.Vertices['++']['Zk1'];
        this.Vertices['-+']['Zk2'] = this.Vertices['++']['Zk2'];
        this.Vertices['-+']['Z1'] = addVec(this.Vertices['-+']['Zk1'], integrals.Ct1);
        this.Vertices['-+']['O'] = subVec(this.Vertices['-+']['Z1'], integrals.A1);
        this.Vertices['-+']['Zm1'] = subVec(this.Vertices['-+']['O'], integrals.At1);
        this.Vertices['-+']['Zmk1'] = addVec(this.Vertices['-+']['Zm1'], integrals.C1);
        this.Vertices['-+']['Zmk2'] = subVec(this.Vertices['-+']['Zmk1'], integrals.B1);
        this.Vertices['-+']['Inf'] = addVec(this.Vertices['-+']['Zmk2'], integrals.Dt1);

        this.Vertices['--']['Z1'] = this.Vertices['++']['Z1'];
        this.Vertices['--']['Zk1'] = this.Vertices['++']['Zk1'];
        this.Vertices['--']['Zk2'] = subVec(this.Vertices['--']['Zk1'], integrals.Bt1);
        this.Vertices['--']['O'] = addVec(this.Vertices['--']['Z1'], integrals.A1);
        this.Vertices['--']['Zm1'] = addVec(this.Vertices['--']['O'], integrals.At1);
        this.Vertices['--']['Zmk1'] = subVec(this.Vertices['--']['Zm1'], integrals.C1);
        this.Vertices['--']['Zmk2'] = addVec(this.Vertices['--']['Zmk1'], integrals.B1);
        this.Vertices['--']['Inf'] = subVec(this.Vertices['--']['Zmk2'], integrals.Dt1);

        this.Vertices['+-']['Zk1'] = this.Vertices['--']['Zk1'];
        this.Vertices['+-']['Zk2'] = this.Vertices['--']['Zk2'];
        this.Vertices['+-']['Z1'] = addVec(this.Vertices['+-']['Zk1'], integrals.Ct1);
        this.Vertices['+-']['O'] = addVec(this.Vertices['+-']['Z1'], integrals.A1);
        this.Vertices['+-']['Zm1'] = addVec(this.Vertices['+-']['O'], integrals.At1);
        this.Vertices['+-']['Zmk1'] = addVec(this.Vertices['+-']['Zm1'], integrals.C1);
        this.Vertices['+-']['Zmk2'] = addVec(this.Vertices['+-']['Zmk1'], integrals.B1);
        this.Vertices['+-']['Inf'] = addVec(this.Vertices['+-']['Zmk2'], integrals.Dt1);

        this.Bounds = {
            Re1range: [0,0],
            Re1breadth: 0,
            Re1center: 0,
            Im1range: [0,0],
            Im1breadth: 0,
            Im1center: 0,
            Re2range: [0,0],
            Re2breadth: 0,
            Re2center: 0,
            Im2range: [0,0],
            Im2breadth: 0,
            Im2center: 0,
        }
        this.ProjectedVertices = {};
        for(const section in this.Vertices){ this.ProjectedVertices[section]={};}
        this.ScreenVertices = {};
        for(const section in this.Vertices){ this.ScreenVertices[section]={};}

        // integers of the four periods by which the surface is translated in C^2
        this.PeriodCounts = [0,0,0,0];
        if(counts){
            this.updatePeriodCounts(counts);
        }
        else{
            this.updateBounds();
            this.updateProjection();
            this.updateScreen();
        }
    }

    updateBounds(){
        for(const section in this.Vertices){
            for(const vertex in this.Vertices[section]){
                this.Bounds.Re1range[0] = math.min(this.Bounds.Re1range[0],this.Vertices[section][vertex][0].re);
                this.Bounds.Re1range[1] = math.max(this.Bounds.Re1range[1],this.Vertices[section][vertex][0].re);
                this.Bounds.Im1range[0] = math.min(this.Bounds.Im1range[0],this.Vertices[section][vertex][0].im);
                this.Bounds.Im1range[1] = math.max(this.Bounds.Im1range[1],this.Vertices[section][vertex][0].im);
                this.Bounds.Re2range[0] = math.min(this.Bounds.Re2range[0],this.Vertices[section][vertex][1].re);
                this.Bounds.Re2range[1] = math.max(this.Bounds.Re2range[1],this.Vertices[section][vertex][1].re);
                this.Bounds.Im2range[0] = math.min(this.Bounds.Im2range[0],this.Vertices[section][vertex][1].im);
                this.Bounds.Im2range[1] = math.max(this.Bounds.Im2range[1],this.Vertices[section][vertex][1].im);
            }
        }
        this.Bounds.Re1breadth = this.Bounds.Re1range[1]-this.Bounds.Re1range[0];
        this.Bounds.Im1breadth = this.Bounds.Im1range[1]-this.Bounds.Im1range[0];
        this.Bounds.Re2breadth = this.Bounds.Re2range[1]-this.Bounds.Re2range[0];
        this.Bounds.Im2breadth = this.Bounds.Im2range[1]-this.Bounds.Im2range[0];
        this.Bounds.Re1center = this.Bounds.Re1range[0]+0.5*this.Bounds.Re1breadth;
        this.Bounds.Im1center = this.Bounds.Im1range[0]+0.5*this.Bounds.Im1breadth;
        this.Bounds.Re2center = this.Bounds.Re2range[0]+0.5*this.Bounds.Re2breadth;
        this.Bounds.Im2center = this.Bounds.Im2range[0]+0.5*this.Bounds.Im2breadth;
    }

    updateProjection(){
        for (const section in this.Vertices) {
            for (const vertex in this.Vertices[section]) {
                this.ProjectedVertices[section][vertex] = projectionMap(this.Vertices[section][vertex]);
            }
        }
    }
    updateScreen(){
        for (let section in this.Vertices) {
            for (let vertex in this.Vertices[section]) {
                this.ScreenVertices[section][vertex] = screenMap(this.ProjectedVertices[section][vertex]);
            }
        }
    }

    displayVertices(size, labels){
        noStroke();
        //textSize(2);
        for (const section in this.ScreenVertices){
            for (const [name, p] of Object.entries(this.ScreenVertices[section])) {
                displayVertex(p, size, colors[name], (labels? name : null) );
            }
        }
    }


    displayEdges(size){
        for (const section in this.ScreenVertices){
            for (const [a, b, col] of sectionLineMesh) {
                if(this.ScreenVertices[section][a] && this.ScreenVertices[section][b]){
                    displayEdge(this.ScreenVertices[section][a], this.ScreenVertices[section][b], size, colors[col]);
                }
            }
        }
    }
    
    displayTriangles() {
        push();
        noStroke();
        for (const section in this.ScreenVertices){
            fill(colors[section]);
            beginShape(TRIANGLES);
            for (const tri of sectionTriangleMesh) {
                for (const vtx of tri) {
                    if(this.ScreenVertices[section][vtx]){
                        const p = this.ScreenVertices[section][vtx];
                        vertex(p[0], p[1], p[2]);
                    }
                }
            }
            endShape();
        }
        pop();
    }

    // translate all vertices by a vector of 2 complex coordinates
    translate(v){
        for(const section in this.Vertices){
            for(const vertex in this.Vertices[section]){
                this.Vertices[section][vertex] = addVec(v, this.Vertices[section][vertex]);
            }
        }
        this.updateBounds();
        this.updateProjection();
        this.updateScreen();
    }

    updatePeriodCounts(counts){
        let relativeIncrease = [0,0,0,0];
        for(let i=0; i<this.PeriodCounts.length; i++){
            relativeIncrease[i] = counts[i]-this.PeriodCounts[i];
            this.PeriodCounts[i] = counts[i];
        }
        this.translate(multVec(this.Integrals.PeriodMatrix, relativeIncrease));
    }
}









// ==================== GRAPHICS =================================

function displayVertex(position, size, color, label){
    push();
    const c = color || [120, 120, 120];
    fill(c);
    translate(position[0], position[1], position[2]);
    sphere(size);
    if (label){
        fill(0);
        translate(...vertexToTextOffset);
        text(label, 0,0,0);
    }
    pop();
}
function displayEdge(start, end, size, color){
    push();
    const c = color || [120, 120, 120];
    stroke(c);
    strokeWeight(size);
    line(start[0], start[1], start[2], end[0], end[1], end[2]);
    pop();
}

// range of axes in the 2 complex coordinates, fitted to a surface
let fitAxes = {
    Re1range : [-1,1],
    Im1range : [-1,1],
    Re2range : [-1,1],
    Im2range : [-1,1],
}
function fitAxesToSurface(surface){
    let mult = 2;
    fitAxes.Re1range[0] = mult * surface.Bounds.Re1range[0];
    fitAxes.Re1range[1] = mult * surface.Bounds.Re1range[1];
    fitAxes.Im1range[0] = mult * surface.Bounds.Im1range[0];
    fitAxes.Im1range[1] = mult * surface.Bounds.Im1range[1];
    fitAxes.Re2range[0] = mult * surface.Bounds.Re2range[0];
    fitAxes.Re2range[1] = mult * surface.Bounds.Re2range[1];
    fitAxes.Im2range[0] = mult * surface.Bounds.Im2range[0];
    fitAxes.Im2range[1] = mult * surface.Bounds.Im2range[1];
}
function drawAxes(fit = false) {
    let Re1range = [-0.5*winWidth/scaleFactor, 0.5*winWidth/scaleFactor];
    let Im1range = [-0.5*winHeight/scaleFactor, 0.5*winHeight/scaleFactor];
    let Re2range = [-0.5*winHeight/scaleFactor, 0.5*winHeight/scaleFactor];
    let Im2range = [-0.5*winHeight/scaleFactor, 0.5*winHeight/scaleFactor];
    if(fit){
        Re1range = fitAxes.Re1range;
        Im1range = fitAxes.Im1range;
        Re2range = fitAxes.Re2range;
        Im2range = fitAxes.Im2range;
    }
    let Re1min = screenMap(projectionMap([math.complex(Re1range[0],0), math.complex(0,0)]));
    let Re1max = screenMap(projectionMap([math.complex(Re1range[1],0), math.complex(0,0)]));
    let Im1min = screenMap(projectionMap([math.complex(0,Im1range[0]), math.complex(0,0)]));
    let Im1max = screenMap(projectionMap([math.complex(0,Im1range[1]), math.complex(0,0)]));
    let Re2min = screenMap(projectionMap([math.complex(0,0), math.complex(Re2range[0],0)]));
    let Re2max = screenMap(projectionMap([math.complex(0,0), math.complex(Re2range[1],0)]));
    let Im2min = screenMap(projectionMap([math.complex(0,0), math.complex(0,Im2range[0])]));
    let Im2max = screenMap(projectionMap([math.complex(0,0), math.complex(0,Im2range[1])]));

    push();
    textFont(fontBold);
    fill(0);
    strokeWeight(1);
    
    stroke("#ffa57d");
    line(Re1min[0], Re1min[1], Re1min[2], Re1max[0], Re1max[1], Re1max[2]);
    push();
    translate(  Re1max[0]/2, -4+Re1max[1]/2, Re1max[2]/2);
    text("Re1",0,0,0);
    pop();

    
    stroke("#b1dd8c");
    line(Im1min[0], Im1min[1], Im1min[2], Im1max[0], Im1max[1], Im1max[2]);
    push();
    translate(  Im1max[0]/2, -4+Im1max[1]/2, Im1max[2]/2);
    text("Im1",0,0,0);
    pop();

    stroke("#94e3fe");
    line(Re2min[0], Re2min[1], Re2min[2], Re2max[0], Re2max[1], Re2max[2]);
    push();
    translate(  Re2max[0]/2, -4+Re2max[1]/2, Re2max[2]/2);
    text("Re2", 0,0,0);
    pop();

    stroke("#e392fe");
    line(Im2min[0], Im2min[1], Im2min[2], Im2max[0], Im2max[1], Im2max[2]);
    push();
    translate(  Im2max[0]/2, -4+Im2max[1]/2, Im2max[2]/2);
    text("Im2", 0,0,0);
    pop();
    pop();
}













// ==================== DOM CONTROL =================================

function toggleVertexLabels() {
    showVertexLabels = !showVertexLabels;
}
function toggleAxes() {
    showAxes = !showAxes;
}
function toggleAnimation() {
    projectionAnimation = !projectionAnimation;
}

function buildProjectionMatrixTable() {
    const table = document.getElementById('projectionMatrixTable');
    table.innerHTML = '';

    for (let i = 0; i < ProjectionMatrix.length; i++) {
        const tr = document.createElement('tr');

        for (let j = 0; j < ProjectionMatrix[i].length; j++) {
            const td = document.createElement('td');

            const input = document.createElement('input');
            input.id = "inputProj"+i+j;
            input.type = 'number';
            input.step = '0.1';
            input.max = '2.5';
            input.min = '-2.5';
            input.value = ProjectionMatrix[i][j];

            input.style.width = '70px';

            input.addEventListener('input', () => {
                ProjectionMatrix[i][j] = parseFloat(input.value) || 0;
                setProjectionMatrix()
            });

            td.appendChild(input);
            tr.appendChild(td);
        }

        table.appendChild(tr);
    }
}
function setProjectionMatrix(newMatrix) {
    if(newMatrix){
        for (let i = 0; i < newMatrix.length; i++) {
            for (let j = 0; j < newMatrix[i].length; j++) {
                ProjectionMatrix[i][j] = newMatrix[i][j];
            }
        }
    }
    axis4Dir[0] = ProjectionMatrix[0][3];
    axis4Dir[1] = ProjectionMatrix[1][3];
    axis4Dir[2] = ProjectionMatrix[2][3];

    // rebuild table inputs so values update visually
    for (let i = 0; i < ProjectionMatrix.length; i++) {
        for (let j = 0; j < ProjectionMatrix[i].length; j++) {
            const input = document.getElementById('inputProj'+i+j);
            input.value = ProjectionMatrix[i][j];
        }
    }

    // recompute geometry
    surfaceTensorIter((surface)=>{
        surface.updateProjection();
        surface.updateScreen();
    })
}
function setupProjectionMatrixButtons() {
    document.getElementById('projMixed')
        .addEventListener('click', () =>
            setProjectionMatrix(ProjectionTemplates.mixed)
        );

    document.getElementById('projC1')
        .addEventListener('click', () =>
            setProjectionMatrix(ProjectionTemplates.C1)
        );

    document.getElementById('projC2')
        .addEventListener('click', () =>
            setProjectionMatrix(ProjectionTemplates.C2)
        );
}

function buildPeriodMatrix() {
    const container = document.getElementById('periodMatrix');
    const table = document.createElement('table');

    integralsArray.PeriodMatrix.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(val => {
            const td = document.createElement('td');
            td.innerText = math.format(val, { precision: 3 });
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    container.appendChild(table);
}



let periodCounts = [0, 0, 0, 0];
function periodPlus(i) {
    periodCounts[i]++;
    updatePeriodCounter(i);
    surface.updatePeriodCounts(periodCounts);
}
function periodMinus(i) {
    periodCounts[i]--;
    updatePeriodCounter(i);
    surface.updatePeriodCounts(periodCounts);
}
function updatePeriodCounter(i) {
    document.getElementById(`periodCount${i}`).innerText = periodCounts[i];
}
