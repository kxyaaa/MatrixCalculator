let lastResult = null; 
let useFraction = true; 

window.onload = buildMatrices;

function buildMatrices() {
    createGrid('A', 'rowsA', 'colsA');
    createGrid('B', 'rowsB', 'colsB');
    document.getElementById('resultDisplay').innerHTML = "Ready_";
}

function handleKeyNav(e, matrixName, r, c, maxR, maxC) {
    let nextR = r, nextC = c;
    if (e.key === "ArrowRight") nextC++;
    else if (e.key === "ArrowLeft") nextC--;
    else if (e.key === "ArrowDown") nextR++;
    else if (e.key === "ArrowUp") nextR--;
    else return; 
    e.preventDefault(); 
    if (nextC >= maxC) { nextC = 0; nextR++; } 
    if (nextC < 0) { nextC = maxC - 1; nextR--; } 
    if (nextR >= 0 && nextR < maxR) {
        let nextInput = document.getElementById(`val${matrixName}_${nextR}_${nextC}`);
        if (nextInput) { nextInput.focus(); nextInput.select(); }
    }
}

function createGrid(matrixName, rowId, colId) {
    let rows = parseInt(document.getElementById(rowId).value);
    let cols = parseInt(document.getElementById(colId).value);
    let grid = document.getElementById('grid' + matrixName);
    grid.style.gridTemplateColumns = `repeat(${cols}, 50px)`;
    grid.innerHTML = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let input = document.createElement('input');
            input.type = 'text';
            input.setAttribute('inputmode', 'decimal'); 
            input.id = `val${matrixName}_${r}_${c}`;
            input.placeholder = '0';
            input.addEventListener('input', function() {
                this.value = this.value.replace(/\.\./g, '/');
                this.value = this.value.replace(/ /g, '/'); 
                this.value = this.value.replace(/[^0-9./-]/g, '');
            });
            input.addEventListener('keydown', (e) => handleKeyNav(e, matrixName, r, c, rows, cols));
            grid.appendChild(input);
        }
    }
}

function parseFraction(str) {
    if (!str) return 0;
    str = str.toString().trim();
    if (str.includes('/')) {
        let parts = str.split('/');
        let num = parseFloat(parts[0]);
        let den = parseFloat(parts[1]);
        if (den === 0 || isNaN(num) || isNaN(den)) return 0;
        return num / den;
    }
    let val = parseFloat(str);
    return isNaN(val) ? 0 : val;
}

function getMatrix(matrixName, rowId, colId) {
    let rows = parseInt(document.getElementById(rowId).value);
    let cols = parseInt(document.getElementById(colId).value);
    let m = [];
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            let rawVal = document.getElementById(`val${matrixName}_${r}_${c}`).value;
            row.push(parseFraction(rawVal)); 
        }
        m.push(row);
    }
    return m;
}

function floatToFraction(x) {
    if (x === 0) return "0";
    if (Math.abs(Math.round(x) - x) < 1e-10) return Math.round(x).toString(); 
    let isNegative = x < 0;
    x = Math.abs(x);
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1, b = x;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        if (Math.abs(b - a) < 1e-10) break;
        b = 1 / (b - a);
    } while (Math.abs(x - h1 / k1) > 1e-10 && k1 < 100000);
    let sign = isNegative ? "-" : "";
    if (k1 >= 100000) return sign + parseFloat(x.toFixed(4));
    return k1 === 1 ? sign + h1 : sign + h1 + "/" + k1; 
}

function toggleFractionFormat() {
    useFraction = !useFraction;
    if (lastResult !== null) renderResult(lastResult, false); 
}

function copyResult() {
    if (lastResult === null) return;
    let str = "";
    if (lastResult.isEigenResult) {
        str = `Lambda 1: ${floatToFraction(lastResult.lambda1)}\nVector 1: [${lastResult.v1[0][0]}, ${lastResult.v1[1][0]}]\nLambda 2: ${floatToFraction(lastResult.lambda2)}\nVector 2: [${lastResult.v2[0][0]}, ${lastResult.v2[1][0]}]`;
    } else if (typeof lastResult === 'number') {
        str = useFraction ? floatToFraction(lastResult) : parseFloat(lastResult.toFixed(4));
    } else {
        str = lastResult.map(row => row.map(val => useFraction ? floatToFraction(val) : parseFloat(val.toFixed(4))).join("\t")).join("\n");
    }
    navigator.clipboard.writeText(str).then(() => {
        let display = document.getElementById('resultDisplay');
        let originalHtml = display.innerHTML;
        display.innerHTML = '<span style="color:#2ecc71; font-size:1rem; font-weight:bold;">Tersalin!</span>';
        setTimeout(() => display.innerHTML = originalHtml, 1500);
    });
}

function renderResult(result, saveToHist = true, opName = "") {
    let display = document.getElementById('resultDisplay');
    display.innerHTML = '';
    lastResult = result; 
    
    if (result && result.isEigenResult) {
        let l1Format = useFraction ? floatToFraction(result.lambda1) : parseFloat(result.lambda1.toFixed(4));
        let l2Format = useFraction ? floatToFraction(result.lambda2) : parseFloat(result.lambda2.toFixed(4));
        
        function createVectorGrid(v) {
            let v1Format = useFraction ? floatToFraction(v[0][0]) : parseFloat(v[0][0].toFixed(4));
            let v2Format = useFraction ? floatToFraction(v[1][0]) : parseFloat(v[1][0].toFixed(4));
            return `
            <div class="matrix-content" style="display: inline-flex; align-items: stretch; gap: 4px; vertical-align: middle; padding: 0;">
                <div class="bracket-dynamic left"></div>
                <div class="grid-input" style="grid-template-columns: 50px; background: transparent; gap: 2px; padding: 0;">
                    <input type="text" disabled style="background: rgba(0,0,0,0.1); color: #2d3436; text-align: center; border: 1px solid rgba(0,0,0,0.2); width: 100% !important; height: 30px !important; font-size: 0.95rem !important; margin: 0 !important;" value="${v1Format}">
                    <input type="text" disabled style="background: rgba(0,0,0,0.1); color: #2d3436; text-align: center; border: 1px solid rgba(0,0,0,0.2); width: 100% !important; height: 30px !important; font-size: 0.95rem !important; margin: 0 !important;" value="${v2Format}">
                </div>
                <div class="bracket-dynamic right"></div>
            </div>`;
        }

        let signTr = result.trace > 0 ? "-" : "+";
        let absTrFormat = useFraction ? floatToFraction(Math.abs(result.trace)) : parseFloat(Math.abs(result.trace).toFixed(4));
        let signDet = result.det >= 0 ? "+" : "-";
        let absDetFormat = useFraction ? floatToFraction(Math.abs(result.det)) : parseFloat(Math.abs(result.det).toFixed(4));
        let charEq = `λ² ${signTr} ${absTrFormat}λ ${signDet} ${absDetFormat} = 0`;

        let html = `
        <div style="display: flex; flex-direction: column; width: 100%; text-align: left; font-size: 1.05rem; gap: 15px; font-family: monospace; padding-left: 10px;">
            <div><span style="font-weight: bold; opacity: 0.8; display: inline-block; width: 160px;">Eigen Value (λ)</span> : &nbsp;&nbsp; λ₁ = ${l1Format} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; λ₂ = ${l2Format}</div>
            <div style="display: flex; align-items: center;"><span style="font-weight: bold; opacity: 0.8; display: inline-block; width: 160px;">Eigen Vector</span> : &nbsp;&nbsp; <span style="margin-right: 5px;">v₁ =</span> ${createVectorGrid(result.v1)} <span style="margin-left: 20px; margin-right: 5px;">v₂ =</span> ${createVectorGrid(result.v2)}</div>
            <div><span style="font-weight: bold; opacity: 0.8; display: inline-block; width: 160px;">Char. Equation</span> : &nbsp;&nbsp; ${charEq}</div>
        </div>`;
        
        display.innerHTML = html;
        if (saveToHist && opName !== "") addToHistory(opName, result, html);
        return;
    }

    if (typeof result === 'number') {
        let displayVal = useFraction ? floatToFraction(result) : parseFloat(result.toFixed(4));
        display.innerHTML = `<h2 style="margin:0;">${displayVal}</h2>`;
        if (saveToHist && opName !== "") addToHistory(opName, result, display.innerHTML);
        return;
    }
    
    let matrixContent = document.createElement('div');
    matrixContent.className = 'matrix-content';
    matrixContent.style.display = 'flex';
    matrixContent.style.alignItems = 'stretch';
    matrixContent.style.gap = '6px';
    matrixContent.style.padding = '5px 0'; 
    
    let openBracket = document.createElement('div');
    openBracket.className = 'bracket-dynamic left';
    let closeBracket = document.createElement('div');
    closeBracket.className = 'bracket-dynamic right';
    let grid = document.createElement('div');
    grid.className = 'grid-input';
    grid.style.gridTemplateColumns = `repeat(${result[0].length}, 70px)`;
    grid.style.background = 'transparent'; 
    
    for (let r = 0; r < result.length; r++) {
        for (let c = 0; c < result[0].length; c++) {
            let cell = document.createElement('input');
            cell.type = 'text';
            cell.disabled = true;
            cell.style.background = 'rgba(0,0,0,0.1)';
            cell.style.color = '#2d3436';
            cell.style.border = '1px solid rgba(0,0,0,0.2)';
            
            let valFormat = useFraction ? floatToFraction(result[r][c]) : parseFloat(result[r][c].toFixed(4));
            cell.setAttribute('value', valFormat);
            cell.value = valFormat; 
            
            grid.appendChild(cell);
        }
    }
    matrixContent.appendChild(openBracket);
    matrixContent.appendChild(grid);
    matrixContent.appendChild(closeBracket);
    display.appendChild(matrixContent);
    
    if (saveToHist && opName !== "") addToHistory(opName, result, display.innerHTML);
}

function renderError(msg) {
    document.getElementById('resultDisplay').innerHTML = `<span class="error-text">❌ ${msg}</span>`;
    lastResult = null;
}

function clearAll() {
    document.getElementById('rowsA').value = 2;
    document.getElementById('colsA').value = 2;
    document.getElementById('rowsB').value = 2;
    document.getElementById('colsB').value = 2;
    buildMatrices();
    document.getElementById('resultDisplay').innerHTML = "Ready_";
    lastResult = null;
    document.querySelector('.result-display').classList.remove('success', 'error-glow');
}

function clearMatrix(matrixName) {
    let rows = parseInt(document.getElementById('rows' + matrixName).value);
    let cols = parseInt(document.getElementById('cols' + matrixName).value);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let input = document.getElementById(`val${matrixName}_${r}_${c}`);
            if (input) input.value = '';
        }
    }
}

function swapMatrices() {
    let rowsA = document.getElementById('rowsA').value;
    let colsA = document.getElementById('colsA').value;
    let rowsB = document.getElementById('rowsB').value;
    let colsB = document.getElementById('colsB').value;
    let valA = getMatrix('A', 'rowsA', 'colsA');
    let valB = getMatrix('B', 'rowsB', 'colsB');
    document.getElementById('rowsA').value = rowsB;
    document.getElementById('colsA').value = colsB;
    document.getElementById('rowsB').value = rowsA;
    document.getElementById('colsB').value = colsA;
    createGrid('A', 'rowsA', 'colsA');
    createGrid('B', 'rowsB', 'colsB');
    for (let r = 0; r < rowsB; r++) {
        for (let c = 0; c < colsB; c++) {
            document.getElementById(`valA_${r}_${c}`).value = floatToFraction(valB[r][c]);
        }
    }
    for (let r = 0; r < rowsA; r++) {
        for (let c = 0; c < colsA; c++) {
            document.getElementById(`valB_${r}_${c}`).value = floatToFraction(valA[r][c]);
        }
    }
}

function storeTo(matrixName) {
    if (!lastResult) { renderError("Belum ada hasil!"); return; }
    if (typeof lastResult === 'number' || lastResult.isEigenResult) { renderError("Hanya matriks biasa yang bisa di-STO!"); return; }
    let rows = lastResult.length;
    let cols = lastResult[0].length;
    document.getElementById('rows' + matrixName).value = rows;
    document.getElementById('cols' + matrixName).value = cols;
    createGrid(matrixName, 'rows' + matrixName, 'cols' + matrixName);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            document.getElementById(`val${matrixName}_${r}_${c}`).value = floatToFraction(lastResult[r][c]);
        }
    }
    document.getElementById('resultDisplay').innerHTML = `<span style="color: #2d3436; font-size: 1rem;">Saved to [${matrixName}] !</span>`;
}

function transpose(M) { return M[0].map((_, colIndex) => M.map(row => row[colIndex])); }

function determinant(M) {
    if(M.length !== M[0].length) throw "Bukan Persegi!";
    let n = M.length;
    if(n === 1) return M[0][0];
    if(n === 2) return (M[0][0] * M[1][1]) - (M[0][1] * M[1][0]);
    let det = 0;
    for(let c = 0; c < n; c++) {
        let sub = M.slice(1).map(row => row.filter((_, col) => col !== c));
        det += (c % 2 === 0 ? 1 : -1) * M[0][c] * determinant(sub);
    }
    return det;
}

function inverse(M) {
    let det = determinant(M);
    if(Math.abs(det) < 1e-10) throw "Matriks Singular (Det = 0)!";
    let n = M.length;
    if(n === 1) return [[1 / M[0][0]]];
    let adj = [];
    for(let i = 0; i < n; i++) {
        let adjRow = [];
        for(let j = 0; j < n; j++) {
            let sub = M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
            adjRow.push(((i + j) % 2 === 0 ? 1 : -1) * determinant(sub));
        }
        adj.push(adjRow);
    }
    adj = transpose(adj);
    return adj.map(row => row.map(val => val / det));
}

function multiplyMatrices(A, B) {
    if(A[0].length !== B.length) throw "Kolom A ≠ Baris B!";
    let res = [];
    for(let i = 0; i < A.length; i++) {
        res[i] = [];
        for(let j = 0; j < B[0].length; j++) {
            let sum = 0;
            for(let k = 0; k < A[0].length; k++) sum += A[i][k] * B[k][j];
            res[i][j] = sum;
        }
    }
    return res;
}

function traceMatrix(M) {
    if (M.length !== M[0].length) throw "Bukan Persegi!";
    let sum = 0;
    for(let i = 0; i < M.length; i++) sum += M[i][i];
    return sum;
}

function matrixPower(M, p) {
    if (M.length !== M[0].length) throw "Bukan Persegi!";
    if (p < 1) throw "Pangkat harus >= 1";
    let res = M;
    for (let i = 1; i < p; i++) res = multiplyMatrices(res, M);
    return res;
}

function getEigen2x2(M) {
    if (M.length !== 2 || M[0].length !== 2) throw "Fitur Eigen saat ini dibatasi matriks 2x2!";
    let a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
    let trace = a + d;
    let det = a*d - b*c;
    let discriminant = trace*trace - 4*det;
    if (discriminant < 0) throw "Hasil Eigen Imajiner (Kompleks)!";
    let l1 = (trace + Math.sqrt(discriminant)) / 2;
    let l2 = (trace - Math.sqrt(discriminant)) / 2;
    function getVector(lambda) {
        let m11 = a - lambda, m12 = b;
        let m21 = c, m22 = d - lambda;
        if (Math.abs(m11) > 1e-10 || Math.abs(m12) > 1e-10) return (Math.abs(m12) > 1e-10) ? [[1], [-m11 / m12]] : [[-m12 / m11], [1]];
        if (Math.abs(m21) > 1e-10 || Math.abs(m22) > 1e-10) return (Math.abs(m22) > 1e-10) ? [[1], [-m21 / m22]] : [[-m22 / m21], [1]];
        return [[1], [0]]; 
    }
    return { isEigenResult: true, trace: trace, det: det, lambda1: l1, lambda2: l2, v1: getVector(l1), v2: getVector(l2) };
}

function getMinorMatrix(M) {
    if(M.length !== M[0].length) throw "Bukan Persegi!";
    let n = M.length;
    let minor = [];
    for(let i = 0; i < n; i++) {
        let minorRow = [];
        for(let j = 0; j < n; j++) {
            let sub = M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
            minorRow.push(determinant(sub));
        }
        minor.push(minorRow);
    }
    return minor;
}

function getCofactorMatrix(M) {
    let minor = getMinorMatrix(M);
    return minor.map((row, i) => row.map((val, j) => ((i + j) % 2 === 0 ? 1 : -1) * val));
}

function getRank(M) {
    let r = 0;
    let mat = M.map(row => [...row]);
    let rowCount = mat.length;
    let colCount = mat[0].length;
    for (let c = 0; c < colCount && r < rowCount; c++) {
        let pivot = r;
        for (let i = r + 1; i < rowCount; i++) {
            if (Math.abs(mat[i][c]) > Math.abs(mat[pivot][c])) pivot = i;
        }
        if (Math.abs(mat[pivot][c]) < 1e-10) continue;
        let temp = mat[r];
        mat[r] = mat[pivot];
        mat[pivot] = temp;
        let pivotVal = mat[r][c];
        for (let j = c; j < colCount; j++) mat[r][j] /= pivotVal;
        for (let i = 0; i < rowCount; i++) {
            if (i !== r) {
                let factor = mat[i][c];
                for (let j = c; j < colCount; j++) mat[i][j] -= factor * mat[r][j];
            }
        }
        r++;
    }
    return r;
}

function calculate(operation) {
    let lcdScreen = document.querySelector('.result-display');
    lcdScreen.classList.remove('success', 'error-glow');
    document.getElementById('resultDisplay').innerHTML = `<span class="loading-text">Processing_</span>`;
    setTimeout(() => {
        let A = getMatrix('A', 'rowsA', 'colsA');
        let B = getMatrix('B', 'rowsB', 'colsB');
        let res;
        try {
            switch(operation) {
                case 'add': if(A.length !== B.length || A[0].length !== B[0].length) throw "Ordo harus sama!"; res = A.map((row, i) => row.map((val, j) => val + B[i][j])); break;
                case 'sub': if(A.length !== B.length || A[0].length !== B[0].length) throw "Ordo harus sama!"; res = A.map((row, i) => row.map((val, j) => val - B[i][j])); break;
                case 'mul': res = multiplyMatrices(A, B); break;
                case 'transA': res = transpose(A); break;
                case 'transB': res = transpose(B); break;
                case 'detA': res = determinant(A); break;
                case 'detB': res = determinant(B); break;
                case 'invA': res = inverse(A); break;
                case 'invB': res = inverse(B); break;
            }
            renderResult(res, true, operation); 
            lcdScreen.classList.add('success');
        } catch (error) { renderError(error); lcdScreen.classList.add('error-glow'); }
    }, 300);
}

function calculateAdvanced(op) {
    let lcdScreen = document.querySelector('.result-display');
    lcdScreen.classList.remove('success', 'error-glow');
    document.getElementById('resultDisplay').innerHTML = `<span class="loading-text">Processing_</span>`;
    setTimeout(() => {
        let A = getMatrix('A', 'rowsA', 'colsA');
        let B = getMatrix('B', 'rowsB', 'colsB');
        let res;
        try {
            switch(op) {
                case 'minA': res = getMinorMatrix(A); break;
                case 'minB': res = getMinorMatrix(B); break;
                case 'cofA': res = getCofactorMatrix(A); break;
                case 'cofB': res = getCofactorMatrix(B); break;
                case 'adjA': res = transpose(getCofactorMatrix(A)); break;
                case 'adjB': res = transpose(getCofactorMatrix(B)); break;
                case 'rankA': res = getRank(A); break;
                case 'rankB': res = getRank(B); break;
                case 'traceA': res = traceMatrix(A); break;
                case 'traceB': res = traceMatrix(B); break;
                case 'eigenA': res = getEigen2x2(A); break;
                case 'eigenB': res = getEigen2x2(B); break;
                case 'scalarA': 
                    let kA = prompt("Masukkan skalar (k) untuk k·A:", "2");
                    if (kA === null) { document.getElementById('resultDisplay').innerHTML = "Ready_"; return; }
                    res = A.map(row => row.map(v => v * parseFraction(kA))); break;
                case 'scalarB': 
                    let kB = prompt("Masukkan skalar (k) untuk k·B:", "2");
                    if (kB === null) { document.getElementById('resultDisplay').innerHTML = "Ready_"; return; }
                    res = B.map(row => row.map(v => v * parseFraction(kB))); break;
                case 'powA':
                    let pA = prompt("Masukkan pangkat (n) untuk Aⁿ:", "2");
                    if (pA === null) { document.getElementById('resultDisplay').innerHTML = "Ready_"; return; }
                    res = matrixPower(A, parseInt(pA)); break;
                case 'powB':
                    let pB = prompt("Masukkan pangkat (n) untuk Bⁿ:", "2");
                    if (pB === null) { document.getElementById('resultDisplay').innerHTML = "Ready_"; return; }
                    res = matrixPower(B, parseInt(pB)); break;
            }
            renderResult(res, true, op); 
            lcdScreen.classList.add('success');
        } catch (error) { renderError(error); lcdScreen.classList.add('error-glow'); }
    }, 300);
}

function solveSPL() {
    let lcdScreen = document.querySelector('.result-display');
    lcdScreen.classList.remove('success', 'error-glow');
    document.getElementById('resultDisplay').innerHTML = `<span class="loading-text">Processing_</span>`;
    setTimeout(() => {
        try {
            let A = getMatrix('A', 'rowsA', 'colsA');
            let B = getMatrix('B', 'rowsB', 'colsB');
            let invA = inverse(A);
            let res = multiplyMatrices(invA, B);
            renderResult(res, true, 'SPL'); 
            lcdScreen.classList.add('success');
        } catch (error) { renderError(error); lcdScreen.classList.add('error-glow'); }
    }, 300);
}

function toggleDropdown() { document.getElementById('mainDropdown').classList.toggle('show'); }
window.onclick = function(e) {
    if (!e.target.matches('.guide-toggle') && !e.target.matches('.fa-ellipsis-vertical')) {
        let dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].classList.contains('show')) dropdowns[i].classList.remove('show');
        }
    }
}
function openGuide() { document.getElementById('guideModal').classList.add('active'); }
function closeGuide() { document.getElementById('guideModal').classList.remove('active'); }

let calcHistory = [];

function openHistory() { 
    renderHistory(); 
    document.getElementById('historyModal').classList.add('active'); 
}

function closeHistory() { 
    document.getElementById('historyModal').classList.remove('active'); 
}

const modeLabels = {
    'add': '+', 'sub': '−', 'mul': '×',
    'transA': 'Aᵀ', 'transB': 'Bᵀ',
    'detA': '|A|', 'detB': '|B|',
    'invA': 'A⁻¹', 'invB': 'B⁻¹',
    'powA': 'Aⁿ', 'powB': 'Bⁿ',
    'scalarA': 'k·A', 'scalarB': 'k·B',
    'minA': 'Minor (A)', 'minB': 'Minor (B)',
    'cofA': 'Kofaktor (A)', 'cofB': 'Kofaktor (B)',
    'adjA': 'Adjoin (A)', 'adjB': 'Adjoin (B)',
    'rankA': 'Rank (A)', 'rankB': 'Rank (B)',
    'traceA': 'Trace(A)', 'traceB': 'Trace(B)',
    'eigenA': 'Eigen A', 'eigenB': 'Eigen B',
    'SPL': 'SPL (A·X=B)'
};

function addToHistory(opName, rawResult, htmlContent) {
    let displayMode = modeLabels[opName] || opName.toUpperCase();
    
    calcHistory.unshift({ 
        operation: displayMode, 
        rawResult: JSON.parse(JSON.stringify(rawResult)), 
        html: htmlContent,
        time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) 
    });
    if (calcHistory.length > 15) calcHistory.pop();
}

function renderHistory() {
    let container = document.getElementById('historyContainer');
    if (calcHistory.length === 0) { 
        container.innerHTML = '<div class="empty-history">Belum ada riwayat.</div>'; 
        return; 
    }
    container.innerHTML = '';
    
    calcHistory.forEach((item) => {
        let card = document.createElement('div');
        card.className = 'history-card';
        card.style.cursor = 'pointer'; 
        card.title = "Klik untuk memuat kembali ke layar";
        
        card.onclick = function() {
            closeHistory();
            renderResult(item.rawResult, false); 
            let lcdScreen = document.querySelector('.result-display');
            lcdScreen.classList.remove('error-glow');
            lcdScreen.classList.add('success');
            setTimeout(() => lcdScreen.classList.remove('success'), 1000);
        };

        // KUNCI: Ganti teks jadi ikon panah melingkar di baris ini
        card.innerHTML = `
            <div class="op-name" style="display: flex; justify-content: space-between; align-items: center;">
                <span>🕒 ${item.time} | Mode: <strong>${item.operation}</strong></span>
                <i class="fa-solid fa-rotate-left" style="opacity: 0.6; font-size: 0.9rem;"></i>
            </div>
            <div class="result-box" style="pointer-events: none; margin-top: 10px;">${item.html}</div>`;
        
        container.appendChild(card);
    });
}

function clearHistory() { 
    calcHistory = []; 
    renderHistory(); 
}

function toggleMode() {
    let btn = document.getElementById('mode-btn');
    let basic = document.getElementById('basicControls');
    let adv = document.getElementById('advancedControls');
    if(btn.classList.contains('advanced')) {
        btn.classList.remove('advanced'); btn.innerHTML = '<i class="fa-solid fa-bolt"></i> BASIC MODE';
        basic.style.display = 'grid'; adv.style.display = 'none';
    } else {
        btn.classList.add('advanced'); btn.innerHTML = '<i class="fa-solid fa-microchip"></i> ADVANCED MODE';
        basic.style.display = 'none'; adv.style.display = 'grid';
    }
}