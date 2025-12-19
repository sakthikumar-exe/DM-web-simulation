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
        const RC = parseFloat(document.getElementById('RC').value);
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


document.addEventListener('DOMContentLoaded', function() {
      simulateDM();
})
 

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