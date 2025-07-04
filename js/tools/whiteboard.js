// js/tools/whiteboard.js

import { playSound } from '../utils.js';

export function initWhiteboard() {
    const canvas = document.getElementById('whiteboard-canvas');
    const ctx = canvas.getContext('2d');
    const wbColorPicker = document.getElementById('wb-color');
    const wbWidthSlider = document.getElementById('wb-width');
    const wbClearBtn = document.getElementById('wb-clear-btn');
    const wbPenBtn = document.getElementById('wb-pen-btn');
    const wbEraserBtn = document.getElementById('wb-eraser-btn');
    const wbUndoBtn = document.getElementById('wb-undo-btn');
    const wbSaveBtn = document.getElementById('wb-save-btn');

    let isDrawing = false;
    let isErasing = false;
    let wbHistory = [];

    function getEventPosition(event) {
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches && event.touches[0];
        return {
            x: (touch ? touch.clientX : event.clientX) - rect.left,
            y: (touch ? touch.clientY : event.clientY) - rect.top
        };
    }

    function startDrawing(e) {
        isDrawing = true;
        const { x, y } = getEventPosition(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 
        const { x, y } = getEventPosition(e);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isErasing ? 'white' : wbColorPicker.value;
        ctx.lineWidth = wbWidthSlider.value;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.closePath();
        saveWbState();
    }

    function saveWbState() {
        if (wbHistory.length > 20) {
            wbHistory.shift();
        }
        wbHistory.push(canvas.toDataURL());
        wbUndoBtn.disabled = wbHistory.length <= 1;
    }

    wbClearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveWbState();
    });

    wbUndoBtn.addEventListener('click', () => {
        if (wbHistory.length > 1) {
            wbHistory.pop();
            const lastStateUrl = wbHistory[wbHistory.length - 1];
            const img = new Image();
            img.src = lastStateUrl;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
            };
            wbUndoBtn.disabled = wbHistory.length <= 1;
        }
    });

    wbPenBtn.addEventListener('click', () => {
        isErasing = false;
        wbPenBtn.classList.add('active');
        wbEraserBtn.classList.remove('active');
    });

    wbEraserBtn.addEventListener('click', () => {
        isErasing = true;
        wbEraserBtn.classList.add('active');
        wbPenBtn.classList.remove('active');
    });

    wbSaveBtn.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        tempCtx.drawImage(canvas, 0, 0);

        const link = document.createElement('a');
        link.download = 'whiteboard-drawing.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        playSound('sounds/reveal.mp3');
    });

    ['mousedown', 'touchstart'].forEach(evt => canvas.addEventListener(evt, startDrawing));
    ['mousemove', 'touchmove'].forEach(evt => canvas.addEventListener(evt, draw));
    ['mouseup', 'mouseleave', 'touchend'].forEach(evt => canvas.addEventListener(evt, stopDrawing));

    const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        const lastStateUrl = wbHistory.length > 0 ? wbHistory[wbHistory.length - 1] : null;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        
        if (lastStateUrl) {
            const img = new Image();
            img.src = lastStateUrl;
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            };
        }
    });
    observer.observe(canvas);
    saveWbState(); // Save initial blank state
}