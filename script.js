const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const sizeSelector = document.getElementById('gridSize');

let L = 30; 
let isRunning = false;
const MAX_CANVAS_WIDTH = 600;
let cellSize = MAX_CANVAS_WIDTH / L;

const API_URL = 'http://127.0.0.1:8000/gol';

async function updateGridSize() {
    L = parseInt(sizeSelector.value);
    cellSize = MAX_CANVAS_WIDTH / L;
    
    // Update Canvas pixel dimensions
    canvas.width = L * cellSize;
    canvas.height = L * cellSize;

    // Tell Backend to resize
    await fetch(`${API_URL}/resize?size=${L}`, { method: 'POST' });
    renderGrid();
}

// Listen for dropdown changes
sizeSelector.addEventListener('change', () => {
    isRunning = false;
    document.getElementById('playBtn').innerText = "Play";
    updateGridSize();
});

// Update renderGrid to use the dynamic cellSize
async function renderGrid() {
    try {
        const response = await fetch(`${API_URL}/state`);
        const data = await response.json();
        const grid = data.grid;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let x = 0; x < L; x++) {
            for (let y = 0; y < L; y++) {
                if (grid[x][y] === 1) {
                    ctx.fillStyle = '#00ff00';
                    // Subtracted 1 for a "grid line" effect
                    ctx.fillRect(y * cellSize, x * cellSize, cellSize - 1, cellSize - 1);
                }
            }
        }
    } catch (err) { console.error(err); }
}

// Initialize
updateGridSize();

// 2. Main loop
async function update() {
    if (isRunning) {
        await fetch(`${API_URL}/step`, { method: 'POST' });
        await renderGrid();
    }
}

// 3. User Interaction
canvas.addEventListener('mousedown', async (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = Math.floor((e.clientX - rect.left) / cellSize);
    const x = Math.floor((e.clientY - rect.top) / cellSize);
    
    await fetch(`${API_URL}/toggle?x=${x}&y=${y}`, { method: 'POST' });
    renderGrid();
});

playBtn.onclick = () => {
    isRunning = !isRunning;
    statusText.innerText = `Status: ${isRunning ? 'Running' : 'Paused'}`;
    playBtn.innerText = isRunning ? 'Pause' : 'Play';
};

clearBtn.onclick = async () => {
    await fetch(`${API_URL}/clear`, { method: 'POST' });
    isRunning = false;
    statusText.innerText = "Status: Paused";
    renderGrid();
};

// Start
renderGrid();
setInterval(update, 150); // Adjust speed here