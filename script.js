// =======================
// FINNHUB API KEY
// =======================
const FINNHUB_API_KEY = "d4jli71r01qgcb0u1bs0d4jli71r01qgcb0u1bsg"; // Replace with your key

// =======================
// Track current stocks
// =======================
let currentStocks = {
  graph1: 'NVDA',
  graph2: 'SPY'
};

// =======================
// Fetch Stock Data
// =======================
async function fetchStockData(symbol) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 7 * 24 * 60 * 60; // last 7 days
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${start}&to=${end}&token=${FINNHUB_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.s !== 'ok') throw new Error('Failed to fetch stock data');

    return {
      x: data.t.map(t => new Date(t * 1000).toISOString().split('T')[0]),
      open: data.o,
      high: data.h,
      low: data.l,
      close: data.c
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

// =======================
// Update Candlestick Chart
// =======================
async function updateCandlestick(stockId, symbol) {
  try {
    const stockData = await fetchStockData(symbol);
    if (!stockData) return;

    document.getElementById(stockId + '-name').innerText = symbol;

    Plotly.react(stockId, [{
      x: stockData.x,
      open: stockData.open,
      high: stockData.high,
      low: stockData.low,
      close: stockData.close,
      type: 'candlestick',
      increasing: { line: { color: 'lime' }, fillcolor: 'lime', opacity: 0.6 },
      decreasing: { line: { color: 'red' }, fillcolor: 'red', opacity: 0.6 },
      name: symbol
    }], {
      margin: { t: 20, b: 40, l: 40, r: 20 },
      xaxis: { title: 'Date' },
      yaxis: { title: 'Price ($)' },
      dragmode: 'zoom'
    }, { responsive: true });
  } catch (err) {
    console.error("Failed to draw chart for " + symbol, err);
  }
}


// =======================
// Update Live Price
// =======================
async function updateLivePrice(stockId, priceId, symbol) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const data = await res.json();
    document.getElementById(priceId).innerText = `$${data.c.toFixed(2)}`;
  } catch (err) {
    console.error(err);
    document.getElementById(priceId).innerText = 'Error';
  }
}

// =======================
// Dropdown Setup
// =======================
function setupDropdown(dropdownIndex, targetGraphId) {
  const links = document.querySelectorAll(`.dropdown:nth-child(${dropdownIndex}) .dropdown-content a`);

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      // Highlight active link
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const symbol = link.textContent.trim().toUpperCase();
      currentStocks[targetGraphId] = symbol;

      updateCandlestick(targetGraphId, symbol);
      updateLivePrice(targetGraphId, targetGraphId === 'graph1' ? 'price1' : 'price2', symbol);
    });
  });
}

// =======================
// Refresh Charts & Prices
// =======================
async function refreshCharts() {
  // Graph 1
  let stock1Data = await fetchStockData(currentStocks.graph1);
  if (stock1Data) {
    const n1 = stock1Data.x.length - 1;
    Plotly.extendTraces('graph1', {
      x: [[stock1Data.x[n1]]],
      open: [[stock1Data.open[n1]]],
      high: [[stock1Data.high[n1]]],
      low: [[stock1Data.low[n1]]],
      close: [[stock1Data.close[n1]]]
    }, [0]);
    Plotly.relayout('graph1', { xaxis: { range: stock1Data.x.slice(-7) } });
    updateLivePrice('graph1', 'price1', currentStocks.graph1);
  }

  // Graph 2
  let stock2Data = await fetchStockData(currentStocks.graph2);
  if (stock2Data) {
    const n2 = stock2Data.x.length - 1;
    Plotly.extendTraces('graph2', {
      x: [[stock2Data.x[n2]]],
      open: [[stock2Data.open[n2]]],
      high: [[stock2Data.high[n2]]],
      low: [[stock2Data.low[n2]]],
      close: [[stock2Data.close[n2]]]
    }, [0]);
    Plotly.relayout('graph2', { xaxis: { range: stock2Data.x.slice(-7) } });
    updateLivePrice('graph2', 'price2', currentStocks.graph2);
  }
}

// =======================
// Initialize Dropdowns
// =======================
setupDropdown(1, 'graph1'); // Jadon's Top Picks
setupDropdown(2, 'graph2'); // Trending Stocks

// =======================
// Initial Load
// =======================
window.addEventListener('DOMContentLoaded', () => {
  // Fade-in welcome text
  const welcomeText = document.querySelector('.fade-text');
  if (welcomeText) {
    welcomeText.style.opacity = 0;
    setTimeout(() => welcomeText.style.transition = 'opacity 2s', 50);
    setTimeout(() => welcomeText.style.opacity = 1, 100);
  }

  // Initialize charts after a small delay
  setTimeout(() => {
    updateCandlestick('graph1', currentStocks.graph1);
    updateCandlestick('graph2', currentStocks.graph2);

    updateLivePrice('graph1', 'price1', currentStocks.graph1);
    updateLivePrice('graph2', 'price2', currentStocks.graph2);

    document.querySelectorAll('.graph').forEach(g => g.classList.add('visible'));
  }, 200);
});


// =======================
// Auto-refresh every 60 seconds
// =======================
setInterval(refreshCharts, 60000);
