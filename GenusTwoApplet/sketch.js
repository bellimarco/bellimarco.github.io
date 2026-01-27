// ============ p5.js interaction ======================================

let canvas;
let winWidth; // in setup function
let winHeight;
const FPS = 30;

let font;
let fontBold;
let fontSize = 12;
let TextureImage;
function preload() {
    font = loadFont(
        'https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf'
    );
    fontBold = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');

    //TextureImage = loadImage('/resources/Aguadeno.png');
}

let lastMouseX, lastMouseY; //dragging variables
let dragging = false;
function CanvasMousePressed() {
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
let panZ = 0;
let rotX = 0; //camera rotation
let rotY = 0;
let rotZ = 0;
function mouseDragged() {
    let dx = mouseX - lastMouseX;
    let dy = mouseY - lastMouseY;
    if (draggingAxis4) {
        // screen-space → world-space heuristic
        axis4Dir = [axis4Dir[0]+dx*0.00005,axis4Dir[1]-dy*0.00005,axis4Dir[2]];
        axis4Dir = scaleVec(axisDirMagn/math.sqrt(axis4Dir[0]**2+axis4Dir[1]**2+axis4Dir[2]**2), axis4Dir);
        // axis4Dir[0] = axis4Dir[0].toPrecision(3);
        // axis4Dir[1] = axis4Dir[1].toPrecision(3);
        // axis4Dir[2] = axis4Dir[2].toPrecision(3);
        M = [
            [ProjectionMatrix[0][0],ProjectionMatrix[0][1],ProjectionMatrix[0][2],axis4Dir[0]],
            [ProjectionMatrix[1][0],ProjectionMatrix[1][1],ProjectionMatrix[1][2],axis4Dir[1]],
            [ProjectionMatrix[2][0],ProjectionMatrix[2][1],ProjectionMatrix[2][2],axis4Dir[2]]
        ];
        updateProjectionMatrix(M);
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
function CanvasMouseWheel(event) {
    zoom *= (1 - event.deltaY * 0.001);
    zoom = constrain(zoom, 0.2, 5);  // prevent inversion / disappearance
    event.preventDefault(); // prevent page scroll
    return false; // prevent page scroll
}

const translationControlsSpeed = 8;
const rotationControlsSpeed = 0.08;
function updateKeyIsDown(){
    if (keyIsDown(65)){ // 'a'
        panX+=translationControlsSpeed;
    }
    else if(keyIsDown(68)){ // 'd'
        panX-=translationControlsSpeed;
    }
    if(keyIsDown(87)){ // 'w'
        panY+=translationControlsSpeed;
    }
    else if(keyIsDown(83)){ // 's'
        panY-=translationControlsSpeed;
    }
    if(keyIsDown(81)){ // 'q'
        panZ+=translationControlsSpeed;
    }
    else if(keyIsDown(69)){ // 'e'
        panZ-=translationControlsSpeed;
    }
    if(keyIsDown(89)){ // 'y'
        rotY-=rotationControlsSpeed;
    }
    else if(keyIsDown(88)){ // 'x'
        rotY+=rotationControlsSpeed;
    }
    if(keyIsDown(82)){ // 'r'
        rotX+=rotationControlsSpeed;
    }
    else if(keyIsDown(70)){ // 'f'
        rotX-=rotationControlsSpeed;
    }
}
function keyPressed() {
    if (keyIsDown(67)) {
        zoom = 1;
        rotX = 0;
        rotY = 0;
        rotZ = 0;
        panX = 0;
        panY = 0;
        panZ = 0;

        if(surfacesTensor){
            centerToSurface(surfacesTensor);
            if(strollCentering){
                panX = centerX;
                panY = centerY;
            }
        }
    }
}












// ============ Coordinate mappings ======================================

// complex 2-vector operations
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
function fitScaleToSurface(S){
    // S either a Surface or a SurfacesTensor
    let surface = (S instanceof SurfacesTensor)?S.Surfaces[0][0][0][0]:S;
    let k = winWidth/(surface.Bounds.Re1breadth);
    k = min(k, winHeight/(surface.Bounds.Im1breadth) );
    k = min(k, winWidth/(surface.Bounds.Re2breadth) );
    k = min(k, winHeight/(surface.Bounds.Im2breadth) );
    if(S instanceof SurfacesTensor) k/= math.max(...S.periodicityCounts);
    k*=2.0; // heuristic
    updateScale(k);
}

let centerX = 0;
let centerY = 0;
let strollCentering = true; // wether centerToSurface() should not directly affect panX,panY, but stroll to it smoothly
let strollCenteringDamping = 0.05;

function centerToSurface(S){
    let center;
    if(S instanceof Surface){
        const surface = S;
        center = screenMap(projectionMap([surface.Bounds.Re1center,surface.Bounds.Im1center,surface.Bounds.Re2center,surface.Bounds.Im2center]));
    }
    if(S instanceof SurfacesTensor){
        let d1 = [math.floor((S.periodicityCounts[0]-1)/2), math.floor((S.periodicityCounts[1]-1)/2), math.floor((S.periodicityCounts[2]-1)/2), math.floor((S.periodicityCounts[3]-1)/2)];
        let d2 = [math.ceil((S.periodicityCounts[0]-1)/2), math.ceil((S.periodicityCounts[1]-1)/2), math.ceil((S.periodicityCounts[2]-1)/2), math.ceil((S.periodicityCounts[3]-1)/2)];

        const surface1 = S.Surfaces[d1[0]][d1[1]][d1[2]][d1[3]];
        const surface2 = S.Surfaces[d2[0]][d2[1]][d2[2]][d2[3]];
        const c1 =  screenMap(projectionMap([surface1.Bounds.Re1center,surface1.Bounds.Im1center,surface1.Bounds.Re2center,surface1.Bounds.Im2center]));
        const c2 =  screenMap(projectionMap([surface2.Bounds.Re1center,surface2.Bounds.Im1center,surface2.Bounds.Re2center,surface2.Bounds.Im2center]));
        center = [0.5*(c1[0]+c2[0]), 0.5*(c1[1]+c2[1])];
    }
    if(strollCentering){ centerX = -center[0]; centerY = -center[1]; }
    else{ panX = -center[0]; panY = -center[1]; }
}
function updateStrollCentering(k = strollCenteringDamping){
    panX += (centerX-panX)*k;
    panY += (centerY-panY)*k;
}

function screenMap(Z){
    // Z vector in R^3
    // let P = [];
    // for (let i=0; i<3; i++){
    //     let sum = 0;
    //     for (let j=0; j<3; j++){
    //         sum = math.add(sum, math.multiply(ScreenMatrix[i][j], Z[j]));
    //     }
    //     P.push(sum);
    // }
    // return P;

    //assuming ScreenMatrix is diagonal
    return [Z[0]*ScreenMatrix[0][0],Z[1]*ScreenMatrix[1][1], Z[2]*ScreenMatrix[2][2]];
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
    ]
};
// deep copy of template projection matrix
let ProjectionMatrix = ProjectionTemplates.mixed.map((arr)=>{ return arr.slice(); });
function projectionMap(z){
    // z vector in C^2 or in R^4
    let Z = z;
    if(z.length==2){ Z = [z[0].re,z[0].im,z[1].re,z[1].im]; }
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










// ============= ANIMATION =============================


// oscillates between 0 and mag
function OSCILLATOR(mag,freq,t){
    return mag*0.5*(1+math.sin(freq*t*6.28)).toPrecision(3);
}
function STEP(delta,epsilon,t){
    if(t<0) return 0;
    else if(0<=t && t<delta) return t/delta*epsilon;
    else return epsilon;
}
const animation_TEMPLATE = {
    fps: 30, //update rate of animation, indipendent of sketch
    frameFrequency: 1, // canvas FPS divided by desired fps of animation
    precision: 4, // used in .toPrecision()
    period: 25, // time in seconds of a period of the cyclic animation
    t0: 0, // start time
    setup:  ()=>{
        animation_TEMPLATE.frameFrequency = FPS/animation_TEMPLATE.fps;
    },
    // input time in seconds
    draw: (t)=>{
        const project = animation_TEMPLATE;

        let k = (-0.0 + OSCILLATOR(0.3,1/project.period,t-project.t0)) *  STEP(1,1,t-project.t0);

        let x = (-0.2 + OSCILLATOR(0.5,1/project.period,t-project.t0)) *  STEP(1,1,t-project.t0);
        let y = (-0.2 + OSCILLATOR(0.5,1/project.period,t-project.t0+project.period/4)) *  STEP(1,1,t-project.t0);

        k1Slider.value = ( 0.5 + k ).toFixed(project.precision);
        k2Slider.value = (0.2 + OSCILLATOR(k*0.95,1/project.period,t-project.t0) ).toFixed(project.precision);

        updateModuli();

        let M = [
            [1, 0, 0, x.toPrecision(project.precision)],
            [0, 1, 0, (0.2+y).toPrecision(project.precision)],
            [0, 0, 1, 0.5],
        ]
        updateProjectionMatrix(M);

        if(autoFocus || t<2.5) centerToSurface(surfacesTensor);
    }
}

const animation_MYSELF = {
    precision: 3,
    period: 10,
    t0: 5,
    t1: 15,
    t2: 17.5,
    OLDSCALE: 1,
    OLDPANY: 1,
    setup: ()=>{
        updateScale(scaleFactor*2); //============================================
        animation_MYSELF.OLDSCALE = scaleFactor;
        
        animation_MYSELF.draw(0); // set state at time 0
        centerToSurface(surfacesTensor);
        animation_MYSELF.OLDPANY = panY;
    },
    // input time in seconds
    draw: (t)=>{
        const project = animation_MYSELF;

        let x = (-0.4+OSCILLATOR(0.8,1/project.period,t-project.t0)) *  STEP(3,1,t-project.t0-1);
        let y = (-0.4+OSCILLATOR(0.8,1/project.period,t-project.t0+project.period/4)) *  STEP(3,1,t-project.t0-1);
        let z = (0.01+OSCILLATOR(0.8,1/project.period,t-project.t0)) *  STEP(3,1,t-project.t0-1);
        let w = (0.01+OSCILLATOR(0.4,1/project.period,t-project.t0)) *  STEP(3,1,t-project.t0-1);
        //x=y=z=w=0;
        let M = [
            [1, 0, 0, x.toPrecision(project.precision)],
            [0, 2.5, 0, y.toPrecision(project.precision)],
            [z.toPrecision(project.precision), 0, -w.toPrecision(project.precision), z.toPrecision(project.precision)],
        ]
        updateProjectionMatrix(M);

        scaleFactor = project.OLDSCALE-STEP(project.period/2,3,t-project.t1)-STEP(project.period/2,3,t-project.t0);
        rotX = -STEP(project.period/2,0.42,t-project.t2);
        
        updateScale(scaleFactor);
        centerToSurface(surfacesTensor);

        panY = project.OLDPANY+STEP(project.period/2,50,t-project.t2);
    }
};

















// ==================== p5.js EXECUTION =============================

let surfacesTensor;
const surfacesTensorPeriodStart = [0,0,0,0];
const surfacesTensorPeriodicityStart = [3,1,2,2];

const vertexToTextOffset = [-4,-4,0];

let runAnimation = true;
let autoFocus = false;
const projectAnimation = animation_TEMPLATE; // make up your own animation !
let animationLastFrameCount = 0; // tracker for rendering animation at its own fps

let showAxes = true;
let showVertexLabels = false;
let showLineMeshes = false;
let smoothingLevel = 2;

function setup() {
    winWidth = windowWidth*0.8;
    winHeight = math.min(0.75*winWidth,windowHeight*0.7);
    let canvas = createCanvas(winWidth, winHeight, WEBGL);
    canvas.parent('canvas-container');

    textureMode(NORMAL); // important for correct uv texture coordinate 0<u,v<1
    frameRate(FPS);
    textFont(font);
    textSize(fontSize);

    addScreenPositionFunction();

    // mouse events captured only when mouse is hovering the canvas:
    canvas.mousePressed(CanvasMousePressed);
    // canvas.mouseReleased(CanvasMouseReleased); //this is set globally
    canvas.mouseWheel(CanvasMouseWheel);
    // canvas.mouseDragged(CanvasMouseDragged); // this is set globally
    //canvas.keyIsDown(CanvasKeyPressed);

    setupDOM();

    setupHyperellipticIntegrators();
    integralsArray = new IntegralsArray(parseFloat(k1Slider.value), parseFloat(k2Slider.value),true);

    updateProjectionMatrix(ProjectionTemplates.mixed);
        
    surfacesTensor = new SurfacesTensor(integralsArray,surfacesTensorPeriodStart,surfacesTensorPeriodicityStart, smoothingLevel);
    surfacesTensor.updateProjection();  // computes projection vertices of newly generated surfaces
    surfacesTensor.print();
    console.log(surfacesTensor.Surfaces[0][0][0][0]);
    
    fitScaleToSurface(surfacesTensor); // changes the ScreenMatrix
    surfacesTensor.updateScreen(); // computes screen vertices of newly generated surfaces
    
    centerToSurface(surfacesTensor); // changes camera position 
    fitAxesToSurface(surfacesTensor);
    
    // if surfacesTensorPeriodStart are different from html at start
    for(let i=0; i<4; i++){ updatePeriodCounter(i); updatePeriodicityCounter(i); }
    

    // surfacesTensor.updateTexture(true, TextureImage);

    if(runAnimation) projectAnimation.setup();
}

function draw() {
    background(255);

    updateKeyIsDown();

    if(strollCentering) updateStrollCentering(0.5/FPS);

    // camera transforms
    translate(panX, panY, panZ);
    scale(scaleCamera*zoom);
    rotateX(rotX);
    rotateY(rotY);
    rotateZ(rotZ);

    if(showAxes && !runAnimation){ updateAxis4Gizmo(); }
    else if(runAnimation && ( animationLastFrameCount + projectAnimation.frameFrequency < frameCount )){
        animationLastFrameCount = frameCount;
        projectAnimation.draw(frameCount/FPS);
    }

    surfacesTensor.display();
    surfacesTensor.displayEdges(scaleFactor*0.065);
    if(showLineMeshes) surfacesTensor.displayMesh(scaleFactor*0.05,showVertexLabels);

    if(showAxes){ drawAxes(true); }
}













// ===== CLASSES =====


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
        Inf__: "#6b1cfd10",
        '++': "#aedf85D0",
        '-+': "#78d12aD0",
        '+-': "#59d5ffD0",
        '--': "#4688fbD0",
};

// array of pairs of vertex names, and vertex name of desired color
const sectionLineMesh = [
    ['Zm1', 'O', 'O'], // needs smoothing
    ['Zmk1', 'Zm1', 'Zm1'],
    ['Zmk2', 'Zmk1', 'Zmk1'],
    ['Inf', 'Zmk2', 'Zmk2'], // needs smoothing
    ['O', 'Z1', 'O'], // needs smoothing
    ['Z1', 'Zk1', 'Z1__'],
    ['Zk1', 'Zk2', 'Zk1__'],
    ['Zk2', 'Inf', 'Zk2'], // needs smoothing

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
// these are constructed in the Surface class constructors when the meshes of a smoothing pattern are needed
let sectionLineMeshSmoothing = {};
let sectionTriangleMeshSmoothing = {};

class Surface {
    constructor(integrals,smoothing=0) {
        this.integrals = integrals;
        this.periodCounts = [0,0,0,0];

        // wether to update uvVertices alongside the ScreenVertices, include them in the 3d shape generation, and use a given texture for rendering
        this.showTexture = false;
        this.textureFile;

        // 0 if no smoothing at the 'O' and 'Inf' points should be applied
        // integer n>0 for how many interpolation points should be added from the parabola
        this.smoothing = smoothing;
        // even if has been initialized with a smoothing level, the display of smoothed structures can be disabled by this boolean
        this.showSmoothing = (this.smoothing>0);

        // --------- initialize objects and build later ---------
        
        // tuples of complex numbers, grouped by the four sections of the genus 2 surface
        this.Vertices = {
            '++': {},
            '-+': {},
            '+-': {},
            '--': {}
        }

        // bounds in R^4 of the vertices of the surface
        this.Bounds = {}

        this.ProjectedVertices = {}; // this.Vertices projected to R^3
        this.ScreenVertices = {}; // R^3 vectors transformed to 3d pixel coordinates
        this.UVVertices = {}; // R^3 vectors transformed to 2d uv coordinates for textures
        for(const section in this.Vertices){
            this.ProjectedVertices[section]={};
            this.ScreenVertices[section]={};
            this.UVVertices[section]={};
        }

        // points added instead of 'O' and 'Inf' along two parabolas to show a more faithful approximation of the curve
        this.VerticesSmoothed = {};
        this.ProjectedVerticesSmoothed = {}; // as above but for this.Vertices Smoothed
        this.ScreenVerticesSmoothed = {};
        this.UVVerticesSmoothed = {};

        this.buildVertices();
    }

    updateBounds(){
        // reset base values so that max and min functions start at 0
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

    uvMap(z){
        // translate C^2 vector to fundamental period
        let Z = subVec(z,multVec(this.integrals.PeriodMatrix,this.periodCounts));
        // normalize 1st complex coordinate to the square [0,1]xi[0,1]
        let Z1 = math.add(Z[0],this.integrals.At1[0]);
        let uv = [
            Z1.re/(this.integrals.PeriodMatrix[0][0].re) * 7/8,  // 7/8 factor to center the Aguadeno image
            1 - Z1.im/(-this.integrals.PeriodMatrix[0][2].im) ]; // v coordinate is inverted
        //console.log(Z1.re, Z1.im, this.integrals.PeriodMatrix[0][0].re,this.integrals.PeriodMatrix[0][2].im,uv);
        return uv;
    }
    
    updateUV(){
        // this should be called only if the vertices of the surface change C^2 coordinates, i.e. only if the integrals change and the vertices are rebuildt
        // this is called automatically from BuildVertices or from updateTexture (if it turns on showTexture)
        for (const section in this.Vertices) {
            for (const vertex in this.Vertices[section]) {
                this.UVVertices[section][vertex] = this.uvMap(this.Vertices[section][vertex]);
            }
            if(this.showSmoothing){
                for (const vertex in this.VerticesSmoothed[section]) {
                    this.UVVerticesSmoothed[section][vertex] = this.uvMap(this.VerticesSmoothed[section][vertex]);
                }
            }
        }
    }

    buildVertices(){
        // reset period counts, as vertices are constructed anew at the origin
        this.periodCounts = [0,0,0,0];

        this.Vertices['++']['O'] = [math.complex(0, 0), math.complex(0, 0)];
        this.Vertices['++']['Z1'] = addVec(this.Vertices['++']['O'], this.integrals.A1);
        this.Vertices['++']['Zm1'] = subVec(this.Vertices['++']['O'], this.integrals.At1);
        this.Vertices['++']['Zk1'] = addVec(this.Vertices['++']['Z1'], this.integrals.Ct1);
        this.Vertices['++']['Zmk1'] = subVec(this.Vertices['++']['Zm1'], this.integrals.C1);
        this.Vertices['++']['Zk2'] = addVec(this.Vertices['++']['Zk1'], this.integrals.Bt1);
        this.Vertices['++']['Zmk2'] = subVec(this.Vertices['++']['Zmk1'], this.integrals.B1);
        this.Vertices['++']['Inf'] = subVec(this.Vertices['++']['Zmk2'], this.integrals.Dt1);

        this.Vertices['-+']['Zk1'] = this.Vertices['++']['Zk1'];
        this.Vertices['-+']['Zk2'] = this.Vertices['++']['Zk2'];
        this.Vertices['-+']['Z1'] = addVec(this.Vertices['-+']['Zk1'], this.integrals.Ct1);
        this.Vertices['-+']['O'] = subVec(this.Vertices['-+']['Z1'], this.integrals.A1);
        this.Vertices['-+']['Zm1'] = subVec(this.Vertices['-+']['O'], this.integrals.At1);
        this.Vertices['-+']['Zmk1'] = addVec(this.Vertices['-+']['Zm1'], this.integrals.C1);
        this.Vertices['-+']['Zmk2'] = subVec(this.Vertices['-+']['Zmk1'], this.integrals.B1);
        this.Vertices['-+']['Inf'] = addVec(this.Vertices['-+']['Zmk2'], this.integrals.Dt1);

        this.Vertices['--']['Z1'] = this.Vertices['++']['Z1'];
        this.Vertices['--']['Zk1'] = this.Vertices['++']['Zk1'];
        this.Vertices['--']['Zk2'] = subVec(this.Vertices['--']['Zk1'], this.integrals.Bt1);
        this.Vertices['--']['O'] = addVec(this.Vertices['--']['Z1'], this.integrals.A1);
        this.Vertices['--']['Zm1'] = addVec(this.Vertices['--']['O'], this.integrals.At1);
        this.Vertices['--']['Zmk1'] = subVec(this.Vertices['--']['Zm1'], this.integrals.C1);
        this.Vertices['--']['Zmk2'] = addVec(this.Vertices['--']['Zmk1'], this.integrals.B1);
        this.Vertices['--']['Inf'] = subVec(this.Vertices['--']['Zmk2'], this.integrals.Dt1);

        this.Vertices['+-']['Zk1'] = this.Vertices['--']['Zk1'];
        this.Vertices['+-']['Zk2'] = this.Vertices['--']['Zk2'];
        this.Vertices['+-']['Z1'] = addVec(this.Vertices['+-']['Zk1'], this.integrals.Ct1);
        this.Vertices['+-']['O'] = addVec(this.Vertices['+-']['Z1'], this.integrals.A1);
        this.Vertices['+-']['Zm1'] = addVec(this.Vertices['+-']['O'], this.integrals.At1);
        this.Vertices['+-']['Zmk1'] = addVec(this.Vertices['+-']['Zm1'], this.integrals.C1);
        this.Vertices['+-']['Zmk2'] = addVec(this.Vertices['+-']['Zmk1'], this.integrals.B1);
        this.Vertices['+-']['Inf'] = addVec(this.Vertices['+-']['Zmk2'], this.integrals.Dt1);

        this.updateBounds();

        if(this.smoothing!=0){
            for(let section in this.Vertices){
                this.VerticesSmoothed[section] = {};
                
                const interpol = []; 
                const dt = 1/(this.smoothing+1);
                for(let i=-this.smoothing; i<this.smoothing+1; i++){
                    interpol.push((i<0?-1:1)*(i*dt)**2);
                }
                
                let VO = subVec(this.Vertices[section]['Z1'], this.Vertices[section]['O']);
                // array of points on the parabola, t spaced evenly in -1<t<1, x=sgn(t)t^2*|VO[0]|, y = |VO[1]| * (x / |VO[0]| )^2
                // at O, x is the first complex coordinate and y the second
                for(let i=-this.smoothing; i<this.smoothing+1; i++){
                    this.VerticesSmoothed[section]['O'+i] = addVec(this.Vertices[section]['O'], [math.multiply(interpol[i+this.smoothing],VO[0]), math.multiply((interpol[i+this.smoothing])**2,VO[1])]);
                }

                VO = subVec(this.Vertices[section]['Zmk2'], this.Vertices[section]['Inf']);
                // array of points on the parabola, t spaced evenly in -1<t<1, x=sgn(t)t^2*|VO[0]|, y = |VO[1]| * (x / |VO[0]| )^2
                // at Inf, x is the second complex coordinate and y the first
                for(let i=-this.smoothing; i<this.smoothing+1; i++){
                    this.VerticesSmoothed[section]['Inf'+i] = addVec(this.Vertices[section]['Inf'], [math.multiply(interpol[i+this.smoothing]**2,VO[0]), math.multiply(interpol[i+this.smoothing],VO[1])]);
                }

                this.ProjectedVerticesSmoothed[section] = {};
                this.ScreenVerticesSmoothed[section] = {};
                this.UVVerticesSmoothed[section] = {};
            }

            // generate line and triangle meshes needed for this smoothing pattern
            if(!sectionLineMeshSmoothing[this.smoothing]){
                // array like sectionLineMesh
                sectionLineMeshSmoothing[this.smoothing] = [];
                for(const [a, b, col] of sectionLineMesh){
                    // don't keep the ones touching 'O' or 'Inf'
                    if( (col=='Inf__' && false) || (
                        (a!='O') && (a!='Inf') && (b!='O') && (b!='Inf') ) ){
                        sectionLineMeshSmoothing[this.smoothing].push([a,b,col]);
                    }
                }
                // 'O' parabola
                let lastVertex = 'Zm1';
                for(const vertex in this.VerticesSmoothed['++']){
                    if(vertex[0]=='O'){
                        sectionLineMeshSmoothing[this.smoothing].push([lastVertex,vertex,'O']);
                        lastVertex=vertex;
                    }
                }
                sectionLineMeshSmoothing[this.smoothing].push([lastVertex,'Z1','O']);
                // 'Inf' parabola
                lastVertex = 'Zk2';
                for(const vertex in this.VerticesSmoothed['++']){
                    if(vertex[0]=='I'){
                        sectionLineMeshSmoothing[this.smoothing].push([lastVertex,vertex,'Zmk2']);
                        lastVertex=vertex;
                    }
                }
                sectionLineMeshSmoothing[this.smoothing].push([lastVertex,'Zmk2','Zmk2']);
                // support lines
                sectionLineMeshSmoothing[this.smoothing].push(['O0','Inf0','Inf__']);
                for(const vertex in this.VerticesSmoothed['++']){
                    if(vertex[0]=='O'){
                        if(vertex[1]=='-' || vertex[1]=='0'){
                            sectionLineMeshSmoothing[this.smoothing].push(['Zmk1',vertex,'Inf__']);
                        }else{
                            sectionLineMeshSmoothing[this.smoothing].push(['Zk1',vertex,'Inf__']);
                        }
                    }
                    if(vertex[0]=='I'){
                        if(vertex[3]=='-' || vertex[3]=='0'){
                            sectionLineMeshSmoothing[this.smoothing].push(['Zk1',vertex,'Inf__']);
                        }else{
                            sectionLineMeshSmoothing[this.smoothing].push(['Zmk1',vertex,'Inf__']);
                        }
                    }
                }
                console.log("Generated sectionLineMeshSmoothing, pattern "+this.smoothing);
            }
            if(!sectionTriangleMeshSmoothing[this.smoothing]){
                sectionTriangleMeshSmoothing[this.smoothing] = [];
                // 'O' parabola
                let lastVertex='Zm1';
                for(const vertex in this.VerticesSmoothed['++']){
                    if(vertex[0]=='O'){
                        if(vertex[1]=='-' || vertex[1]=='0'){
                            sectionTriangleMeshSmoothing[this.smoothing].push(['Zmk1',lastVertex,vertex]);
                        }else{
                            sectionTriangleMeshSmoothing[this.smoothing].push(['Zk1',lastVertex,vertex]);
                        }
                        lastVertex=vertex;
                    }
                }
                sectionTriangleMeshSmoothing[this.smoothing].push([lastVertex,'Z1','Zk1']);
                // 'Inf' parabola
                lastVertex = 'Zk2';
                for(const vertex in this.VerticesSmoothed['++']){
                    if(vertex[0]=='I'){
                        if(vertex[3]=='-' || vertex[3]=='0'){
                            sectionTriangleMeshSmoothing[this.smoothing].push(['Zk1',lastVertex,vertex]);
                        }else{
                            sectionTriangleMeshSmoothing[this.smoothing].push(['Zmk1',lastVertex,vertex]);
                        }
                        lastVertex=vertex;
                    }
                }
                sectionTriangleMeshSmoothing[this.smoothing].push(['Zmk1',lastVertex,'Zmk2']);
                // missing pieces
                sectionTriangleMeshSmoothing[this.smoothing].push(['Zmk1','O0','Inf0']);
                sectionTriangleMeshSmoothing[this.smoothing].push(['Inf0','O0','Zk1']);
                console.log("Generated sectionTriangleMeshSmoothing, pattern "+this.smoothing);
            } 
        }

        if(this.showTexture) this.updateUV();
    }

    updateProjection(){
        for (const section in this.Vertices) {
            for (const vertex in this.Vertices[section]) {
                this.ProjectedVertices[section][vertex] = projectionMap(this.Vertices[section][vertex]);
            }
            if(this.showSmoothing){
                for (const vertex in this.VerticesSmoothed[section]) {
                    this.ProjectedVerticesSmoothed[section][vertex] = projectionMap(this.VerticesSmoothed[section][vertex]);
                }
            }
        }
    }
    
    updateScreen(){
        for (const section in this.Vertices) {
            for (const vertex in this.Vertices[section]) {
                this.ScreenVertices[section][vertex] = screenMap(this.ProjectedVertices[section][vertex]);
            }
            if(this.showSmoothing){
                for (const vertex in this.VerticesSmoothed[section]) {
                    this.ScreenVerticesSmoothed[section][vertex] = screenMap(this.ProjectedVerticesSmoothed[section][vertex]);
                }
            }
        }
        if(this.showTexture) this.updateUV();
    }

    updateSmoothing(value){
        if(value && !this.showSmoothing){
            // if switching on, recompute geometry in case something changed
            this.showSmoothing = (value?true:false);
            this.updateProjection();
            this.updateScreen();
            if(this.showTexture) this.updateUV();
        }
        this.showSmoothing = (value?true:false);
    }

    updateTexture(value, file){
        if(value && !this.showTexture){
            // if switching on, recompute uv in case something changed
            this.showTexture = (value?true:false);
            this.updateUV();
        }
        if(file){this.textureFile = file; }
        this.showTexture = (value?true:false);
    }

    displayVertices(size, labels){
        noStroke();
        if(this.showSmoothing){
            for (const section in this.ScreenVertices){
                for (const [name,p] of Object.entries(this.ScreenVerticesSmoothed[section])) {
                    displayVertex(p, size, (name[0]=='O'?colors['O']:colors['Inf']), (labels? name : null) );
                }
            }
        }
        for (const section in this.ScreenVertices){
            for (const [name, p] of Object.entries(this.ScreenVertices[section])) {
                displayVertex(p, size, colors[name], (labels? name : null) );
            }
        }
    }

    displayMesh(size){
        if(this.showSmoothing){
            for (const section in this.ScreenVertices){
                for (const [a, b, col] of sectionLineMeshSmoothing[this.smoothing]) {
                    if(col=='Inf__'){
                        displayEdge(
                            (this.ScreenVertices[section][a]?this.ScreenVertices[section][a]:this.ScreenVerticesSmoothed[section][a]),
                            (this.ScreenVertices[section][b]?this.ScreenVertices[section][b]:this.ScreenVerticesSmoothed[section][b]),
                            size, colors[col]);
                    }
                }
            }
        }else{
            for (const section in this.ScreenVertices){
                for (const [a, b, col] of sectionLineMesh) {
                    if(col=='Inf__'){
                        displayEdge(this.ScreenVertices[section][a], this.ScreenVertices[section][b], size, colors[col]);
                    }
                }
            }
        } 
    }

    displayEdges(size){
        if(this.showSmoothing){
            for (const section in this.ScreenVertices){
                for (const [a, b, col] of sectionLineMeshSmoothing[this.smoothing]) {
                    if(col!='Inf__'){
                        displayEdge(
                            (this.ScreenVertices[section][a]?this.ScreenVertices[section][a]:this.ScreenVerticesSmoothed[section][a]),
                            (this.ScreenVertices[section][b]?this.ScreenVertices[section][b]:this.ScreenVerticesSmoothed[section][b]),
                            size, colors[col]);
                    }
                }
            }
        }else{
            for (const section in this.ScreenVertices){
                for (const [a, b, col] of sectionLineMesh) {
                    if(col!='Inf__'){
                        displayEdge(this.ScreenVertices[section][a], this.ScreenVertices[section][b], size, colors[col]);
                    }
                }
            }
        } 
    }
    
    display() {
        push();
        noStroke();
        beginShape(TRIANGLES);
        // it's more efficient to avoid checking these conditions repeatedly inside the loops
        if(this.showSmoothing && !this.showTexture){
            for (const section in this.ScreenVertices){
                fill(colors[section]);
                for (const tri of sectionTriangleMeshSmoothing[this.smoothing]) {
                    for (const vtx of tri) {
                        let p = (this.ScreenVertices[section][vtx]?this.ScreenVertices[section][vtx]:this.ScreenVerticesSmoothed[section][vtx]);
                        vertex(p[0], p[1], p[2]);
                    }
                }
            }
        }else if(this.showSmoothing && this.showTexture){
            texture(this.textureFile);
            for (const section in this.ScreenVertices){
                // no fill !
                for (const tri of sectionTriangleMeshSmoothing[this.smoothing]) {
                    for (const vtx of tri) {
                        let p = (this.ScreenVertices[section][vtx]?this.ScreenVertices[section][vtx]:this.ScreenVerticesSmoothed[section][vtx]);
                        let uv = (this.UVVertices[section][vtx]?this.UVVertices[section][vtx]:this.UVVerticesSmoothed[section][vtx]);
                        vertex(p[0], p[1], p[2], uv[0], uv[1]);
                    }
                }
            }
        }else if(!this.showSmoothing && !this.showTexture){
            for (const section in this.ScreenVertices){
                fill(colors[section]);
                for (const tri of sectionTriangleMesh) {
                    for (const vtx of tri) {
                        let p = this.ScreenVertices[section][vtx];
                        vertex(p[0], p[1], p[2]);
                    }
                }
            }
        }else{
            texture(this.textureFile);
            for (const section in this.ScreenVertices){
                // no fill !
                for (const tri of sectionTriangleMesh) {
                    for (const vtx of tri) {
                        let p = this.ScreenVertices[section][vtx];
                        let uv = this.UVVertices[section][vtx];
                        vertex(p[0], p[1], p[2], uv[0], uv[1]);
                    }
                }
            }
        }
        endShape();
        pop();
    }

    // translate all vertices by a vector of 2 complex coordinates
    translate(v){
        for(const section in this.Vertices){
            for(const vertex in this.Vertices[section]){
                this.Vertices[section][vertex] = addVec(v, this.Vertices[section][vertex]);
            }
            for(const vertex in this.VerticesSmoothed[section]){
                this.VerticesSmoothed[section][vertex] = addVec(v, this.VerticesSmoothed[section][vertex]);
            }
        }

        for(const section in this.Vertices){
            for(const vertex in this.Vertices[section]){
                this.Bounds.Re1range[0] += v[0].re; this.Bounds.Re1range[1] += v[0].re;
                this.Bounds.Im1range[0] += v[0].im; this.Bounds.Im1range[1] += v[0].im;
                this.Bounds.Re2range[0] += v[1].re; this.Bounds.Re2range[1] += v[1].re;
                this.Bounds.Im2range[0] += v[1].im; this.Bounds.Im2range[1] += v[1].im;
            }
        }
        this.Bounds.Re1center += v[0].re; this.Bounds.Re2center += v[1].re;
        this.Bounds.Im1center += v[0].im; this.Bounds.Im2center += v[1].im;
        // this.updateProjection();
        // this.updateScreen();
    }

    updatePeriodCounts(counts){
        let relativeIncrease = [0,0,0,0];
        for(let i=0; i<this.periodCounts.length; i++){
            relativeIncrease[i] = counts[i]-this.periodCounts[i];
            this.periodCounts[i] = counts[i];
        }
        this.translate(multVec(this.integrals.PeriodMatrix, relativeIncrease));
    }
}

class SurfacesTensor {
    constructor(integrals, periodCounts, periodicityCounts, smoothing=0){
        // careful not to mess these up with the global variables
        this.integrals = integrals;
        this.periodCounts = [0,0,0,0]; // updated below
        this.periodicityCounts = [0,0,0,0]; // updated below

        this.smoothing = smoothing;
        // even if surfaces have been initialized with a smoothing level, the display of smoothed structures can be disabled by this boolean
        this.showSmoothing = (this.smoothing>0);

        this.showTexture = false;
        this.textureFile;

        // 4-tensor
        this.Surfaces = [];

        this.updatePeriodCounts(periodCounts);
        this.updatePeriodicityCounts(periodicityCounts);
    }

    print(){ console.log(this); }
    
    iterate(func){
        for(let i1=0; i1<this.periodicityCounts[0]; i1++){
            if(this.Surfaces.length)
            for(let i2=0; i2<this.periodicityCounts[1]; i2++){
                for(let i3=0; i3<this.periodicityCounts[2]; i3++){
                    for(let i4=0; i4<this.periodicityCounts[3]; i4++){
                        func(this.Surfaces[i1][i2][i3][i4]);
                    }
                }
            }
        }
    }

    reduce(){
        // remove extra surfaces from tensor outside of range of periodicityCounts
        this.Surfaces = this.Surfaces.slice(0,this.periodicityCounts[0]);
        for(let i1=0; i1<this.periodicityCounts[0]; i1++){
            this.Surfaces[i1] = this.Surfaces[i1].slice(0,this.periodicityCounts[1]);
            for(let i2=0; i2<this.periodicityCounts[1]; i2++){
                this.Surfaces[i1][i2] = this.Surfaces[i1][i2].slice(0,this.periodicityCounts[2]);
                for(let i3=0; i3<this.periodicityCounts[2]; i3++){
                    this.Surfaces[i1][i2][i3] = this.Surfaces[i1][i2][i3].slice(0,this.periodicityCounts[3]);
                }
            }
        }
    }

    updateSmoothing(value){
        // if(value && !this.showSmoothing){
        //     this.showSmoothing = (value?true:false);

        // }
        this.iterate((surface)=>{
            surface.updateSmoothing(value);
        });
        this.showSmoothing = (value?true:false);
    }

    updateTexture(value, file){
        // if(value && !this.showSmoothing){
        //     this.showSmoothing = (value?true:false);

        // }
        this.iterate((surface)=>{
            surface.updateTexture(value,file);
        });
        this.showTexture = (value?true:false);
        if(file){ this.textureFile = file; }
    }

    updateProjection(){
        this.iterate((surface)=>{
            surface.updateProjection();
        })
    }
    updateScreen(){
        this.iterate((surface)=>{
            surface.updateScreen();
        })
    }

    updateUV(){
        this.iterate((surface)=>{
            surface.updateUV();
        })
    }

    updateModuli(k1,k2,display=false){
        this.integrals.updateModuli(k1,k2,display);
         // throw away old surfaces which might have different moduli, so that if new are created they will have updated moduli
        this.reduce();
        this.iterate((surface)=>{
            // this rebuilds vertices, resets period counts of the surfaces, then updates bounds and UVVertices if showTexture
            surface.buildVertices();
        });
        this.updatePeriodCounts(this.periodCounts,true);
    }

    display(){
        this.iterate((surface)=>{
            surface.display();
        });
    }

    displayEdges(size){
        this.iterate((surface)=>{
            surface.displayEdges(size);
        });
    }

    displayMesh(size,showVertexLabels){
        this.iterate((surface)=>{
            surface.displayMesh(size);
            surface.displayVertices(size,showVertexLabels);
        });
    }

    translate(v){

    }

    updatePeriodCounts(counts, updateGraphics=false){
        this.periodCounts = [counts[0],counts[1],counts[2],counts[3]];
        for(let i1=0; i1<this.periodicityCounts[0]; i1++){
            for(let i2=0; i2<this.periodicityCounts[1]; i2++){
                for(let i3=0; i3<this.periodicityCounts[2]; i3++){
                    for(let i4=0; i4<this.periodicityCounts[3]; i4++){
                        let S = this.Surfaces[i1][i2][i3][i4];
                        S.updatePeriodCounts([i1+this.periodCounts[0],i2+this.periodCounts[1],i3+this.periodCounts[2],i4+this.periodCounts[3]]);
                        if(updateGraphics) S.updateProjection();
                        //if(this.showTexture) S.updateTexture(this.showTexture,this.textureFile);
                    }
                }
            }
        }
        if(updateGraphics){
            fitScaleToSurface(this);
            this.updateScreen();
            //centerToSurface(this); //don't center, to see the effect
            fitAxesToSurface(this);
        }
    }
    updatePeriodicityCounts(counts, updateGraphics=false){
        // when periodicity is reduced, the extra surfaces stay in the tensor
        // the periodicityCounts only control the indices over which other methods of the surfaces tensor range
        this.periodicityCounts = [counts[0],counts[1],counts[2],counts[3]];
        for(let i1=0; i1<counts[0]; i1++){
            if(this.Surfaces.length-1<i1){ this.Surfaces.push([]); }
            for(let i2=0; i2<counts[1]; i2++){
                if(this.Surfaces[i1].length-1<i2){ this.Surfaces[i1].push([]); }
                for(let i3=0; i3<counts[2]; i3++){
                    if(this.Surfaces[i1][i2].length-1<i3){ this.Surfaces[i1][i2].push([]); }
                    for(let i4=0; i4<counts[3]; i4++){
                        if(this.Surfaces[i1][i2][i3].length-1<i4){
                            let S = new Surface(this.integrals,this.smoothing);
                            S.updatePeriodCounts([i1+this.periodCounts[0],i2+this.periodCounts[1],i3+this.periodCounts[2],i4+this.periodCounts[3]]);
                            if(updateGraphics) S.updateProjection();
                            if(this.showTexture) S.updateTexture(this.showTexture,this.textureFile);
                            this.Surfaces[i1][i2][i3].push(S);
                        }
                    }
                }
            }
        }
        if(updateGraphics){
            fitScaleToSurface(this);
            this.updateScreen();
            centerToSurface(this);
            fitAxesToSurface(this);
        }
    }
}







// ==================== GRAPHICS =================================

function displayVertex(position, size, color = [120,120,120], label){
    push();
    fill(color);
    translate(position[0], position[1], position[2]);
    sphere(size);
    if (label){
        fill(0);
        translate(...vertexToTextOffset);
        text(label, 0,0,0);
    }
    pop();
}
function displayEdge(start, end, size, color = [120,120,120]){
    push();
    stroke(color);
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
function fitAxesToSurface(S){
    let surface = S;
    let mult = 1.8;
    if(S instanceof SurfacesTensor){
        surface = S.Surfaces[0][0][0][0];
        mult *= math.max(...S.periodicityCounts);
    }
    let displaced = multVec(S.integrals.PeriodMatrix, S.periodCounts);
    fitAxes.Re1range[0] = math.min(-1,mult * (surface.Bounds.Re1range[0] - displaced[0].re) + displaced[0].re);
    fitAxes.Re1range[1] = math.max(1,mult * (surface.Bounds.Re1range[1] - displaced[0].re) + displaced[0].re );
    fitAxes.Im1range[0] = math.min(-1,mult * (surface.Bounds.Im1range[0] - displaced[0].im) + displaced[0].im );
    fitAxes.Im1range[1] = math.max(1,mult * (surface.Bounds.Im1range[1] - displaced[0].im) + displaced[0].im );
    fitAxes.Re2range[0] = math.min(-1,mult * (surface.Bounds.Re2range[0] - displaced[1].re) + displaced[1].re );
    fitAxes.Re2range[1] = math.max(1,mult * (surface.Bounds.Re2range[1] - displaced[1].re) + displaced[1].re );
    fitAxes.Im2range[0] = math.min(-1,mult * (surface.Bounds.Im2range[0] - displaced[1].im) + displaced[1].im );
    fitAxes.Im2range[1] = math.max(1,mult * (surface.Bounds.Im2range[1] - displaced[1].im) + displaced[1].im );
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


function setupDOM() {

    document.getElementById("btn-animation")
        .classList.toggle("is-on", runAnimation);
    document.getElementById("btn-autofocus")
        .classList.toggle("is-on", autoFocus);
    document.getElementById("btn-linemesh")
        .classList.toggle("is-on", showLineMeshes);
    document.getElementById("btn-vertexlabels")
        .classList.toggle("is-on", showVertexLabels);
    document.getElementById("btn-axes")
        .classList.toggle("is-on", showAxes);


    // building Projection Matrix
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
            input.max = '2.5'; input.min = '-2.5';
            input.value = ProjectionMatrix[i][j];
            input.style.width = '70px';
            input.addEventListener('input', () => {
                ProjectionMatrix[i][j] = parseFloat(input.value) || 0;
                updateProjectionMatrix()
            });
            td.appendChild(input);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    document.getElementById('projMixed')
        .addEventListener('click', () =>
            updateProjectionMatrix(ProjectionTemplates.mixed)
        );

    document.getElementById('projC1')
        .addEventListener('click', () =>
            updateProjectionMatrix(ProjectionTemplates.C1)
        );

    document.getElementById('projC2')
        .addEventListener('click', () =>
            updateProjectionMatrix(ProjectionTemplates.C2)
        ); 
}

function toggleAnimation() {
    runAnimation = !runAnimation;
    document
        .getElementById("btn-animation")
        .classList.toggle("is-on", runAnimation);
}
function toggleAutofocus() {
    autoFocus = !autoFocus;
    document
        .getElementById("btn-autofocus")
        .classList.toggle("is-on", autoFocus);
}
function toggleLineMesh() {
    showLineMeshes = !showLineMeshes;
    document
        .getElementById("btn-linemesh")
        .classList.toggle("is-on", showLineMeshes);
}
function toggleVertexLabels() {
    showVertexLabels = !showVertexLabels;
    if(!showLineMeshes) toggleLineMesh();
    document
        .getElementById("btn-vertexlabels")
        .classList.toggle("is-on", showVertexLabels);
}
function toggleAxes() {
    showAxes = !showAxes;
    document
        .getElementById("btn-axes")
        .classList.toggle("is-on", showAxes);
}

function updateProjectionMatrix(newMatrix) {
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

    if(surfacesTensor){
        surfacesTensor.updateProjection();
        surfacesTensor.updateScreen();
    }
}


let periodCounts = surfacesTensorPeriodStart;
function periodPlus(i) {
    periodCounts[i]++;
    updatePeriodCounter(i);
    if(surfacesTensor) surfacesTensor.updatePeriodCounts(periodCounts,true);
}
function periodMinus(i) {
    periodCounts[i]--;
    updatePeriodCounter(i);
    if(surfacesTensor) surfacesTensor.updatePeriodCounts(periodCounts,true);
}
function updatePeriodCounter(i) {
    document.getElementById(`periodCount${i}`).innerText = periodCounts[i];
}

let periodicityCounts = surfacesTensorPeriodicityStart;
let periodicityWarning = false;
function periodicityPlus(i) {
    if(!periodicityWarning &&
        periodicityCounts[0]*periodicityCounts[1]*periodicityCounts[2]*periodicityCounts[3]>15){
        if(confirm("Rendering too many surfaces will require a lot memory and might slow your browser.\n Do you want to continue ?") ){
            periodicityWarning = true;
        }else{
            return
        }
    }
    periodicityCounts[i]++;
    updatePeriodicityCounter(i);
    if(surfacesTensor) surfacesTensor.updatePeriodicityCounts(periodicityCounts,true);
}
function periodicityMinus(i) {
    if(periodicityCounts[i]<2) return
    periodicityCounts[i]--;
    updatePeriodicityCounter(i);
    if(surfacesTensor) surfacesTensor.updatePeriodicityCounts(periodicityCounts,true);
}
function updatePeriodicityCounter(i) {
    document.getElementById(`periodicityCount${i}`).innerText = periodicityCounts[i];
}

