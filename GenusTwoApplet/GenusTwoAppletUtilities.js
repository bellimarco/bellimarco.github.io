

class PerformanceMonitor {
    constructor(targetFPS = 30, smoothing = 0.9, tierRange = 10, holdTime = 3000) {
        this.targetFPS = targetFPS;
        this.smoothing = smoothing;
        this.smoothedFPS = targetFPS;
        this.lastTime = millis();

        this.performanceTierRange = tierRange;
        this.performanceTier = math.ceil(tierRange*0.8);
        this.holdTime = holdTime; // hysteresis
        this.lastHoldTime = millis();
    }
    getFPS() {
        return this.smoothedFPS;
    }
    getFPSRatio() {
        return this.smoothedFPS / this.targetFPS;
    }
    getTier() {
        return this.performanceTier;
    }
    getTierRatio() {
        return this.performanceTier / this.performanceTierRange;
    }
    update() {
        const now = millis();
        const delta = now - this.lastTime;
        this.lastTime = now;

        const currentFPS = 1000 / max(delta, 1);
        this.smoothedFPS =
        this.smoothedFPS * this.smoothing +
        currentFPS * (1 - this.smoothing);

        // Update performance tier with hysteresis
        if (now - this.lastHoldTime > this.holdTime) {
            let newTier = this.performanceTier;
            if (this.getFPSRatio() < this.performanceTier / this.performanceTierRange) {
                newTier = max(0, this.performanceTier - 1);
            } else{
                newTier = min(this.performanceTierRange, this.performanceTier + 1);
            }
            if (newTier !== this.performanceTier) {
                this.performanceTier = newTier;
                if (this.tierCallback) this.tierCallback(this.getTierRatio()); 
            }
            this.lastHoldTime = now;
        }
    }
}



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
function tofixedVec(v, n){
    return [math.complex(v[0].re.toFixed(n), v[0].im.toFixed(n)), math.complex(v[1].re.toFixed(n), v[1].im.toFixed(n))];
}







