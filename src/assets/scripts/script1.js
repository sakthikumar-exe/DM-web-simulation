function simulateDM() {
    //getting user inputs
    const fm1 = parseFloat(document.getElementById('fm1').value);
    const Fd  = parseFloat(document.getElementById('Fd').value);
    const A   = parseFloat(document.getElementById('A').value);
    const autoSetEnabled = document.getElementById('autoSet').classList.contains('active');
    const stepApproxEnabled = document.getElementById('stepApprox').classList.contains('active');
    let delta;
    if (autoSetEnabled) {
        delta =  (2 * Math.PI * fm1 * A) / Fd;
    } else {
        RC = parseFloat(document.getElementById('RC').value);
        const Ts = 1 / Fd;
        delta =  Ts / RC;
    }

    //setting time window do that the plot appears clearly
    //the plot is set to show only 7 cycles
    let fmax = Math.max(fm1);
    if (fmax === 0) fmax = 1;
    const cyclesToShow = 2.5;
    const Tview = cyclesToShow / fmax;
    //computing sampling freq for plotting
    const Fs = 1e3 * fmax;

    //setting time-period array for plotting x axis and computing DM
    //t for message, td for delta
    const t = numericRange(0, Tview, 1/Fs);
    const td = numericRange(0, Tview, 1/Fd);

    //compute message signal with time period td and t
    const x = t.map(tv => A * Math.sin(2 * Math.PI * fm1 * tv));
    const xd = td.map(tv => A * Math.sin(2 * Math.PI * fm1 * tv));
    const samplingSignal = generateSamplingSignal(Fd, Tview);
    //const traces1 = getSamplingSignalTraces(Fd,Tview);
   
    //delta mod logic with staircase approximation
    let xr = [xd[0]];
    let y = [];
    let comp_op = [];
    for (let i = 0; i < xd.length - 1; i++) {
        if (xd[i] >= xr[i]) {
            y.push(1);
            xr.push(xr[i] + delta);
            comp_op.push(1);
        } else {
            y.push(0);
            xr.push(xr[i] - delta);
            comp_op.push(-1);
        }
    }
    y.push(y[y.length-1]); 
    
    //compute integrator op
    let x_recon = [0];
    for (let i = 0; i < y.length - 1; i++) {
        if (y[i] === 1) {
            x_recon.push(x_recon[i] + delta);
        }
        else {
            x_recon.push(x_recon[i] - delta);
        }
    }
    const x_recon1 = upsampleRampSignal(x_recon, td, 100);
    const comp_op1 = upsampleSquareWave(comp_op, td, 100);
    const deltop = upsampleSquareWave(y, td, 100);
    const delay = Math.ceil(0.70*Fd);
    const lpfOutput = butterworthLPF(x_recon1.signal, Fd,  fm1);

    //aligning signals with respect to each other and setting x and y limit
    let xr_aligned = xr.slice(1);
    let allY1 = x.concat(xr_aligned);
    let yMin = Math.min(...allY1);
    let yMax = Math.max(...allY1);
    let margin = 0.1 * (yMax - yMin);
    yMin -= margin;
    yMax += margin;

    //setting up plots
     const traces = [
      {
        //message
        x: t,
        y: x,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'red', width: 2 },
        name: 'Original Message',
        xaxis: 'x',
        yaxis: 'y',
        showlegend: false ,hoverinfo: 'x+y'
      },
      {
        //staircase
        x: td,
        y: xr_aligned,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'blue', width: 2, shape: 'hv' },
        name: 'Staircase Output',
        xaxis: 'x',
        yaxis: 'y',
        showlegend: false,hoverinfo: 'x+y'
      },
      {
        x: samplingSignal.time,
        y: samplingSignal.pulses,
        type: 'scatter',
        mode: 'lines',
        line: { width: 2, color: 'orange', shape: 'hv' },
        name: 'Sampling Signal (30% Duty Cycle)',
        xaxis: 'x2',
        yaxis: 'y2',
        showlegend: false,
        hoverinfo: 'x+y'
      },
      {
        //comparator
        x: comp_op1.time,
        y: comp_op1.signal,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'purple', width: 2, shape: 'hv' },
        name: 'Comparator Output',
        xaxis: 'x3',
        yaxis: 'y3',
        showlegend: false,hoverinfo: 'x+y'
      },
      {
        //delta bitstream
        x: deltop.time,
        y: deltop.signal,
        type: 'scatter',
        mode: 'lines',
        line: { width: 2, color: 'blue', shape: 'hv'  },
        name: 'Delta Impulse Lines',
        xaxis: 'x4',
        yaxis: 'y4',
        showlegend: false,hoverinfo: 'x+y'
      },
      {
        //integrator (modulator)
        x: x_recon1.time,
        y: x_recon1.signal,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'green', width: 2 },
        name: 'Integrator Output (Modulator)',
        xaxis: 'x5',
        yaxis: 'y5',
        showlegend: false,hoverinfo: 'x+y'
      },
      {
        //integrator (Demodulator)
        x: x_recon1.time,
        y: x_recon1.signal,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'grey', width: 2 },
        name: 'Integrator Output (DeModulator)',
        xaxis: 'x6',
        yaxis: 'y6',
        showlegend: false,hoverinfo: 'x+y'
      },
      {
        x: x_recon1.time,
        y: lpfOutput,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'brown', width: 2 },
        name: 'Reconstruction LPF Output',
        xaxis: 'x7',
        yaxis: 'y7',
        showlegend: false,
        hoverinfo: 'x+y'
}

    ];

    //layout of graph
    const layout = {
      grid: { rows: 7, columns: 1, pattern: 'independent' },
      showlegend: false,
      height: 1400,
      margin: { l: 100, r: 40, t: 60, b: 90},
      hovermode: 'closest',
      yaxis:  { title: 'Amplitude', range: [yMin, yMax], titlefont: { size: 12 },fixedrange: true  },
      yaxis2: { title: 'Amplitude', range: [-0.5, 1.5], titlefont: { size: 12 },fixedrange: true  },
      yaxis3: { title: 'Amplitude', range: [-1.5, 1.5], titlefont: { size: 12 },fixedrange: true   },
      yaxis4: { title: 'Amplitude', range: [-0.5, 1.5], titlefont: { size: 12 },fixedrange: true   },
      yaxis5: { title: 'Amplitude', range: [yMin, yMax], titlefont: { size: 12},fixedrange: true  },
      yaxis6: { title: 'Amplitude', range: [yMin, yMax], titlefont: { size: 12},fixedrange: true  },
      yaxis7: { title: 'Amplitude', range: [yMin, yMax], titlefont: { size: 12},fixedrange: true  },
      xaxis:  { title: 'Time (s)', showline: true, mirror: true },
      xaxis2: { title: 'Time (s)', showline: true, mirror: true },
      xaxis3: { title: 'Time (s)', showline: true, mirror: true },
      xaxis4: { title: 'Time (s)', showline: true, mirror: true },
      xaxis5: { title: 'Time (s)', showline: true, mirror: true },
      xaxis6: { title: 'Time (s)', showline: true, mirror: true },
      xaxis7: { title: 'Time (s)', showline: true, mirror: true },
      xaxis: { matches: 'x7' },
      xaxis2: { matches: 'x7' },
      xaxis3: { matches: 'x7' },
      xaxis4: { matches: 'x7' },
      xaxis5: { matches: 'x7' },
      xaxis6: { matches: 'x7' },
      xaxis7: { title: 'Time (s)' },
      annotations: [
        { text: 'Message Signal', x: 0.5, y: 1.02,  xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'red' } },
        { text: 'Sampling Signal', x: 0.5, y: 0.853,  xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'orange' } },
        { text: 'Comparator Output', x: 0.5, y: 0.71,  xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'purple' } },
        { text: 'Digital Sampler Output (Delta Modulated Bitstream)', x: 0.5, y: 0.545,  xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'blue' } },
        { text: 'Integrator Output', x: 0.5, y: 0.415,  xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'green' } },
        { text: 'Accumulator Output', x: 0.5, y: 0.257, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'dark grey' } },
        { text: 'Reconstruction Filter Output', x: 0.5, y: 0.107, xref: 'paper', yref: 'paper', showarrow: false, font: { size: 14, color: 'brown' } }
      ]
    };
    var config = {
      displaylogo: false,
      scrollZoom: false,
      responsive: true,
      modeBarButtonsToRemove: [
        'hoverCompareCartesian','toggleSpikelines',  
        'select2d', 'lasso2d', 'resetScale2d'
      ],
    };
    //plotting
    Plotly.newPlot('plot1', traces, layout,config);
    Plotly.restyle('plot1', { visible: stepApproxEnabled ? true : 'legendonly' }, [1]);
}


function upsampleRampSignal(signal, timeAxis, factor) {
  const upsampledSignal = [];
  const upsampledTime = [];
  for (let i = 0; i < signal.length - 1; i++) {
    const t0 = timeAxis[i];
    const t1 = timeAxis[i + 1];
    const dt = (t1 - t0) / factor;
    const y1 = signal[i];
    const y2 = signal[i + 1];
    upsampledSignal.push(y1);
    upsampledTime.push(t0);
    const slope = y2 - y1;
    const isFlat = Math.abs(slope) < 1e-10;
    for (let j = 1; j < factor; j++) {
      const t = j / factor;
      const newTime = t0 + j * dt;
      let interpolated;
      if (isFlat) {
        interpolated = y1;
      } else {
        interpolated = y1 + slope * t;
      }
      upsampledSignal.push(interpolated);
      upsampledTime.push(newTime);
    }
  }
  upsampledSignal.push(signal[signal.length - 1]);
  upsampledTime.push(timeAxis[timeAxis.length - 1]);
  return { time: upsampledTime, signal: upsampledSignal };
}


function upsampleSquareWave(signal, timeAxis, factor) {
  const upsampledSignal = [];
  const upsampledTime = [];
  for (let i = 0; i < signal.length - 1; i++) {
    const t0 = timeAxis[i];
    const t1 = timeAxis[i + 1];
    const dt = (t1 - t0) / factor;
    for (let j = 0; j < factor; j++) {
      upsampledSignal.push(signal[i]);
      upsampledTime.push(t0 + j * dt);
    }
  }
  upsampledSignal.push(signal[signal.length - 1]);
  upsampledTime.push(timeAxis[timeAxis.length - 1]);
  return { time: upsampledTime, signal: upsampledSignal };
}

document.getElementById('stepApprox').addEventListener('click', function() {
    setTimeout(() => simulateDM(), 0);
});

/* ── RC Slider Logic ────────────────────────────────── */
var syncRC; 
(function () {
    function getRCSlider()  { return document.getElementById('RC'); }
    function getRCDisplay() { return document.getElementById('RC-display'); }
    function getAutoSet()   { return document.getElementById('autoSet'); }

    // Update the gradient fill on the track
    function updateFill(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const pct = ((parseFloat(slider.value) - min) / (max - min)) * 100;
        slider.style.setProperty('--rc-pct', pct.toFixed(2) + '%');
    }

    // Update the digital display
    function updateDisplay(value) {
        const display = getRCDisplay();
        if (display) display.textContent = parseFloat(value).toFixed(6);
    }

    // Apply or remove disabled state on slider
    function setSliderDisabled(slider, disabled) {
        if (disabled) {
            slider.classList.add('rc-disabled');
            slider.disabled = true;
        } else {
            slider.classList.remove('rc-disabled');
            slider.disabled = false;
        }
    }

    // Compute the RC-equivalent when AutoSet is ON
    function getAutoSetRC() {
        const Fd  = parseFloat(document.getElementById('Fd').value);
        const fm1 = parseFloat(document.getElementById('fm1').value);
        const A   = parseFloat(document.getElementById('A').value);
        const delta = (2 * Math.PI * fm1 * A) / Fd;
        const RC_equiv = 1 / (Fd * delta);
        // Clamp within slider range
        const slider = getRCSlider();
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        return Math.min(Math.max(RC_equiv, min), max);
    }

    // Main sync function — call whenever state might have changed
    syncRC = function syncRC() {
        const slider   = getRCSlider();
        const autoSet  = getAutoSet();
        if (!slider || !autoSet) return;

        const isAuto = autoSet.classList.contains('active');
        setSliderDisabled(slider, isAuto);

        if (isAuto) {
            const rcEquiv = getAutoSetRC();
            slider.value = rcEquiv;
            updateDisplay(rcEquiv);
        } else {
            updateDisplay(slider.value);
        }

        updateFill(slider);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const slider  = getRCSlider();
        const autoSet = getAutoSet();

        // Live update while dragging
        if (slider) {
            slider.addEventListener('input', function () {
                updateFill(slider);
                updateDisplay(slider.value);
            });
        }

        // Sync when AutoSet is toggled
        if (autoSet) {
            autoSet.addEventListener('click', function () {
                // Let the toggle class update first, then sync
                setTimeout(syncRC, 0);
            });
        }

        // Re-sync RC when knob hidden inputs change (covers live drag while AutoSet ON)
        ['A', 'fm1', 'Fd'].forEach(function(id) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', syncRC);
        });

        // Initial state
        syncRC();
        simulateDM();
    });
})();

function numericRange(start, end, step) {
    let arr = [], cur = start;
    while (cur <= end + 1e-12) {
        arr.push(cur);
        cur += step;
    }
    return arr;
}

function generateSamplingSignal(Fd, duration, dutyCycle = 0.4) {
    const Ts = 1 / Fd;
    const Fs_plot = 200 * Fd;
    const dt = 1 / Fs_plot;

    const time = [];
    const signal = [];

    for (let t = 0; t <= duration + 1e-12; t += dt) {
        const phase = (t % Ts) / Ts;
        time.push(t);
        signal.push(phase < dutyCycle ? 1 : 0);
    }

    return {
        time: time,
        pulses: signal,
        Fd: Fd
    };
}

function butterworthLPF(input, Fd, fc) {
    fc=0.03*fc;
    const Ts = 1 / Fd;
    const wc = 2 * Math.PI * fc;
    const K = wc / Math.tan(wc * Ts / 2);
    const a0 = K**3 + 2*wc*K**2 + 2*wc**2*K + wc**3;
    const a1 = 3*wc**3 + 2*wc**2*K - 2*wc*K**2 - 3*K**3;
    const a2 = 3*K**3 - 2*wc*K**2 - 2*wc**2*K + 3*wc**3;
    const a3 = wc**3 - 2*wc**2*K + 2*wc*K**2 - K**3;
    const b0 = wc**3;
    const b1 = 3*wc**3;
    const b2 = 3*wc**3;
    const b3 = wc**3;
    const b0n = b0 / a0;
    const b1n = b1 / a0;
    const b2n = b2 / a0;
    const b3n = b3 / a0;
    const a1n = a1 / a0;
    const a2n = a2 / a0;
    const a3n = a3 / a0;
    const y = new Array(input.length).fill(0);
    for (let n = 3; n < input.length; n++) 
    {
      y[n] = b0n * input[n] + b1n * input[n - 1] + b2n * input[n - 2] + b3n * input[n - 3] - a1n * y[n - 1] - a2n * y[n - 2] - a3n * y[n - 3];
    }
    return y;
}

/* ── Rotary Knob Module ───────────────────────────── */
(function () {

    const MIN_ANGLE = -135;
    const MAX_ANGLE =  135;

    const knobConfigs = {
        A: {
            minVal: 1, maxVal: 10,
            step: 1,
            defaultVal: 1,
            inputId: 'A',
            displayId: 'display-A',
            ringId: 'knob-A-ring',
            bodyId: 'knob-A',
        },
        fm1: {
            
            minVal: 1, maxVal: 1000,
            step: 1,
            defaultVal: 10,
            inputId: 'fm1',
            displayId: 'display-fm1',
            ringId: 'knob-fm1-ring',
            bodyId: 'knob-fm1',
        },
        Fd: {
            minVal: 1,
            maxVal: 1000,
            step: 1,
            defaultVal: 300,
            inputId: 'Fd',
            displayId: 'display-Fd',
            ringId: 'knob-Fd-ring',
            bodyId: 'knob-Fd',
        }
    };

    const state = {
        A:   { angle: 0, value: 1 },

        fm1: { angle: 0, value: 10 },  
        freqUnit: 'hz',

        Fd:  { angle: 0, value: 300 },  
        FdUnit: 'hz'
    };

    /* ── Unit-aware effective range for fm1 ── */
    function getFreqEffective() {
        if (state.freqUnit === 'khz') {
            return { minVal: 1, maxVal: 100, step: 1 };   // display units (KHz)
        }
        return { minVal: 1, maxVal: 1000, step: 1 };       // display units (Hz)
    }

    function getFdEffective() {
        if (state.FdUnit === 'khz') {
            return { minVal: 1, maxVal: 100, step: 1 };
        }
        return { minVal: 1, maxVal: 1000, step: 1 };
    }

    function commitFdValue(displayVal) {
        const eff = getFdEffective();
        const snapped = clamp(snapToStep(displayVal, eff.step), eff.minVal, eff.maxVal);

        const hz = state.FdUnit === 'khz' ? snapped * 1000 : snapped;

        state.Fd.value = hz;
        document.getElementById('Fd').value = hz;
        document.getElementById('display-Fd').textContent =
            state.FdUnit === 'khz'
                ? `${Math.round(hz/1000)} KHz`
                : `${hz} Hz`;

        const angle = valueToAngle(snapped, eff.minVal, eff.maxVal);
        state.Fd.angle = angle;
        document.getElementById(knobConfigs.Fd.bodyId)
            .style.transform = `rotate(${angle}deg)`;
    }
    
    function clamp(val, lo, hi) {
        return Math.max(lo, Math.min(hi, val));
    }

    function angleToValue(angle, minVal, maxVal) {
        const t = (angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
        return minVal + t * (maxVal - minVal);
    }

    function valueToAngle(value, minVal, maxVal) {
        const t = (value - minVal) / (maxVal - minVal);
        return MIN_ANGLE + t * (MAX_ANGLE - MIN_ANGLE);
    }

    function snapToStep(value, step) {
        return Math.round(value / step) * step;
    }

    function normalizeAngle(deg) {
        let a = deg % 360;
        if (a > 180)  a -= 360;
        if (a <= -180) a += 360;
        return a;
    }

    /* ── Display formatter ── */
    function formatFreqDisplay(hz) {
        if (state.freqUnit === 'khz') {
            return `${Math.round(hz / 1000)} KHz`;
        }
        return `${hz} Hz`;
    }

    /* ── Write snapped display-unit value → hidden input + display + body angle ── */
    function commitFreqValue(displayVal) {
        const eff = getFreqEffective();
        const snapped = clamp(snapToStep(displayVal, eff.step), eff.minVal, eff.maxVal);

        // Convert display value → Hz for hidden input
        const hz = state.freqUnit === 'khz' ? snapped * 1000 : snapped;
        state.fm1.value = hz;
        document.getElementById('fm1').value = hz;
        document.getElementById('display-fm1').textContent = formatFreqDisplay(hz);

        const angle = valueToAngle(snapped, eff.minVal, eff.maxVal);
        state.fm1.angle = angle;
        document.getElementById(knobConfigs.fm1.bodyId).style.transform = `rotate(${angle}deg)`;
    }

    function commitAmpValue(rawVal) {
        const cfg = knobConfigs.A;
        const snapped = clamp(snapToStep(rawVal, cfg.step), cfg.minVal, cfg.maxVal);
        state.A.value = snapped;
        document.getElementById(cfg.inputId).value = snapped;
        document.getElementById(cfg.displayId).textContent = `${snapped} V`;

        const angle = valueToAngle(snapped, cfg.minVal, cfg.maxVal);
        state.A.angle = angle;
        document.getElementById(cfg.bodyId).style.transform = `rotate(${angle}deg)`;
    }

    /* ── True rotational drag ── */
    function attachKnob(key) {
        const ring = document.getElementById(knobConfigs[key].ringId);
        if (!ring) return;

        let prevMouseAngle = null;
        let accAngle = state[key].angle;

        function getMouseAngleDeg(e) {
            const rect = ring.getBoundingClientRect();
            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;
            return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        }

        function onMouseDown(e) {
            accAngle = state[key].angle;
            prevMouseAngle = getMouseAngleDeg(e);
            e.preventDefault();
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup',   onMouseUp);
        }

        function onMouseMove(e) {
            if (prevMouseAngle === null) return;

            const curr = getMouseAngleDeg(e);
            let delta = normalizeAngle(curr - prevMouseAngle);
            prevMouseAngle = curr;

            accAngle = clamp(accAngle + delta, MIN_ANGLE, MAX_ANGLE);

            if (key === 'A') {
                const cfg = knobConfigs.A;
                const raw = angleToValue(accAngle, cfg.minVal, cfg.maxVal);
                commitAmpValue(raw);

            } else if (key === 'fm1') {
                const eff = getFreqEffective();
                const raw = angleToValue(accAngle, eff.minVal, eff.maxVal);
                commitFreqValue(raw);

            } else if (key === 'Fd') {
                const eff = getFdEffective();
                const raw = angleToValue(accAngle, eff.minVal, eff.maxVal);
                commitFdValue(raw);
            }
        }

        function onMouseUp() {
            prevMouseAngle = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup',   onMouseUp);
            if (typeof syncRC === 'function') syncRC();
        }
        

        ring.addEventListener('mousedown', onMouseDown);
    }

    /* ── Unit switch ── */
   window.setFreqUnit = function (unit) {
    if (state.freqUnit === unit) return;

    const oldEff = getFreqEffective();
    const oldAngle = state.fm1.angle;

    state.freqUnit = unit;

    document.getElementById('unit-hz')
        .classList.toggle('active', unit === 'hz');
    document.getElementById('unit-khz')
        .classList.toggle('active', unit === 'khz');

    const newEff = getFreqEffective();

    // Convert angle directly into new range
    const newDisplayVal = angleToValue(
        oldAngle,
        newEff.minVal,
        newEff.maxVal
    );

   

    // Snap + clamp
    const snapped = clamp(
        snapToStep(newDisplayVal, newEff.step),
        newEff.minVal,
        newEff.maxVal
    );

    // Convert to Hz internally
    const hz = unit === 'khz'
        ? snapped * 1000
        : snapped;

    state.fm1.value = hz;
    document.getElementById('fm1').value = hz;
    document.getElementById('display-fm1')
        .textContent = formatFreqDisplay(hz);

    state.fm1.angle = oldAngle;
    document.getElementById(knobConfigs.fm1.bodyId)
        .style.transform = `rotate(${oldAngle}deg)`;
    };

     window.setFdUnit = function(unit) {
        if (state.FdUnit === unit) return;

        const oldAngle = state.Fd.angle;
        state.FdUnit = unit;

        document.getElementById('unit-Fd-hz')
            .classList.toggle('active', unit === 'hz');
        document.getElementById('unit-Fd-khz')
            .classList.toggle('active', unit === 'khz');

        const eff = getFdEffective();
        const newDisplayVal = angleToValue(oldAngle, eff.minVal, eff.maxVal);

        commitFdValue(newDisplayVal);
    };
    /* ── Init ── */
    function init() {
        // Amplitude
       const aCfg = knobConfigs.A;
        state.A.value = aCfg.defaultVal;
        document.getElementById(aCfg.inputId).value = aCfg.defaultVal;
        const aAngle = valueToAngle(
            aCfg.defaultVal,
            aCfg.minVal,
            aCfg.maxVal
        );

        state.A.angle = aAngle;
        document.getElementById(aCfg.bodyId)
            .style.transform = `rotate(${aAngle}deg)`;

        document.getElementById(aCfg.displayId)
            .textContent = `${aCfg.defaultVal} V`;

        // Frequency (Hz mode on init)
        state.freqUnit = 'hz';
        const fDefault = knobConfigs.fm1.defaultVal;
        state.fm1.value = fDefault;
        document.getElementById('fm1').value = fDefault;

        const fAngle = valueToAngle(
            fDefault,
            0,
            1000
        );

        state.fm1.angle = fAngle;
        document.getElementById(knobConfigs.fm1.bodyId)
            .style.transform = `rotate(${fAngle}deg)`;

        document.getElementById(knobConfigs.fm1.displayId)
            .textContent = `${fDefault} Hz`;
        const fdCfg = knobConfigs.Fd;

        state.FdUnit = 'hz';

        state.Fd.value = fdCfg.defaultVal;
        document.getElementById(fdCfg.inputId).value = fdCfg.defaultVal;

        const fdAngle = valueToAngle(
            fdCfg.defaultVal,
            0,
            1000
        );

        state.Fd.angle = fdAngle;

        document.getElementById(fdCfg.bodyId)
            .style.transform = `rotate(${fdAngle}deg)`;

        document.getElementById(fdCfg.displayId)
            .textContent = `${fdCfg.defaultVal} Hz`;
        attachKnob('A');
        attachKnob('fm1');
        attachKnob('Fd');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();