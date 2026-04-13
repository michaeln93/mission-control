// ─────────────────────────────────────────────────────────────────────────────
// MACEMARK INTELLIGENCE GRAPH — Redesigned by Claude
// Visual language: Deep space ops centre. Cold precision. Quiet authority.
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = {
  bg:          '#030508',
  navy:        '#253D60',
  navyMid:     '#1e3352',
  navyLight:   '#2d4d78',
  ice:         '#C8D8DB',
  iceDim:      'rgba(200,216,219,0.6)',
  accent:      '#4eb8d0',
  accentGlow:  'rgba(78,184,208,0.35)',
  // Node types
  meeting:     '#4eb8d0',   // ice blue — meetings
  person:      '#7ec8a0',   // sage green — people  
  project:     '#f0a855',   // amber — projects
  concept:     '#8899cc',   // soft indigo — concepts
  decision:    '#e06b6b',   // coral — decisions
};

const TYPE_META = {
  meeting:  { color: PALETTE.meeting,  label: 'Meetings',  icon: '◉' },
  person:   { color: PALETTE.person,   label: 'People',    icon: '◎' },
  project:  { color: PALETTE.project,  label: 'Projects',  icon: '⬡' },
  concept:  { color: PALETTE.concept,  label: 'Concepts',  icon: '◈' },
  decision: { color: PALETTE.decision, label: 'Decisions', icon: '⚡' },
};

// ── STATE
let Graph, graphData = null, focusedNode = null, activeFilters = new Set();
let particleAnimFrame, lastHovered = null;
let conceptOnlyMode = false;

// ── INIT
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  buildShell();
  loadGraph();
  animateParticles();
});

// ── STYLES
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background: ${PALETTE.bg};
      font-family: 'DM Sans', sans-serif;
      color: ${PALETTE.ice};
    }

    /* CANVAS WRAPPER */
    #graph-mount {
      position: fixed; inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,61,96,0.4) 0%, transparent 60%),
                  radial-gradient(ellipse 50% 40% at 80% 80%, rgba(37,61,96,0.15) 0%, transparent 50%),
                  ${PALETTE.bg};
    }

    /* PARTICLE CANVAS */
    #particle-canvas {
      position: fixed; inset: 0; pointer-events: none; z-index: 1;
      opacity: 0.4;
    }

    /* HEADER */
    #mc-header {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: 54px;
      background: rgba(3,5,8,0.75);
      backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(200,216,219,0.06);
      display: flex; align-items: center; gap: 1.5rem; padding: 0 1.5rem;
    }

    .mc-logo {
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .mc-logo-mark {
      width: 28px; height: 28px;
      background: ${PALETTE.navy};
      border: 1px solid ${PALETTE.navyLight};
      border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Space Mono', monospace;
      font-size: 8px; font-weight: 700;
      color: ${PALETTE.ice};
      letter-spacing: 0.05em;
    }
    .mc-title {
      font-family: 'Space Mono', monospace;
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(200,216,219,0.6);
    }
    .mc-title span { color: ${PALETTE.accent}; }

    /* SEARCH */
    #search-wrap {
      flex: 1; max-width: 340px; position: relative;
    }
    #search-input {
      width: 100%; padding: 6px 12px 6px 32px;
      background: rgba(13,20,32,0.8);
      border: 1px solid rgba(200,216,219,0.08);
      border-radius: 6px;
      font-family: 'Space Mono', monospace;
      font-size: 10px; color: ${PALETTE.ice};
      outline: none; transition: border-color 0.2s;
    }
    #search-input:focus { border-color: rgba(78,184,208,0.4); }
    #search-input::placeholder { color: rgba(200,216,219,0.25); }
    .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      font-size: 11px; color: rgba(200,216,219,0.3); pointer-events: none;
    }

    /* STATS */
    .mc-stats {
      display: flex; gap: 1.5rem; margin-left: auto;
    }
    .mc-stat {
      display: flex; flex-direction: column; align-items: flex-end;
    }
    .mc-stat-val {
      font-family: 'Space Mono', monospace;
      font-size: 14px; font-weight: 700;
      color: ${PALETTE.accent}; line-height: 1;
    }
    .mc-stat-label {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase;
      color: rgba(200,216,219,0.35); margin-top: 2px;
    }
    .mc-divider {
      width: 1px; height: 28px;
      background: rgba(200,216,219,0.07);
      align-self: center;
    }

    /* LEGEND PANEL */
    #legend {
      position: fixed; bottom: 2rem; left: 1.5rem; z-index: 100;
      background: rgba(9,14,24,0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(200,216,219,0.07);
      border-radius: 10px;
      padding: 14px 16px;
      min-width: 160px;
    }
    .legend-title {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
      color: rgba(200,216,219,0.35);
      margin-bottom: 10px;
    }
    .legend-item {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0; cursor: pointer;
      transition: opacity 0.2s;
    }
    .legend-item:hover { opacity: 0.8; }
    .legend-item.dimmed { opacity: 0.3; }
    .legend-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      box-shadow: 0 0 6px currentColor;
    }
    .legend-label {
      font-family: 'Space Mono', monospace;
      font-size: 9px; letter-spacing: 0.08em;
      color: rgba(200,216,219,0.7);
    }
    .legend-count {
      margin-left: auto;
      font-family: 'Space Mono', monospace;
      font-size: 9px;
      color: rgba(200,216,219,0.3);
    }

    /* NODE DETAIL PANEL */
    #node-panel {
      position: fixed; right: 1.5rem; top: 70px; z-index: 100;
      width: 280px;
      background: rgba(9,14,24,0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(200,216,219,0.08);
      border-radius: 10px;
      overflow: hidden;
      transform: translateX(320px);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    #node-panel.visible { transform: translateX(0); }
    .np-header {
      padding: 12px 14px;
      border-bottom: 1px solid rgba(200,216,219,0.06);
      display: flex; align-items: center; justify-content: space-between;
    }
    .np-type {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase;
    }
    .np-close {
      width: 22px; height: 22px;
      background: transparent;
      border: 1px solid rgba(200,216,219,0.1);
      border-radius: 4px;
      color: rgba(200,216,219,0.4);
      cursor: pointer; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .np-close:hover { border-color: rgba(200,216,219,0.25); color: ${PALETTE.ice}; }
    .np-body { padding: 14px; }
    .np-name {
      font-size: 15px; font-weight: 500;
      color: ${PALETTE.ice}; margin-bottom: 10px;
      line-height: 1.3;
    }
    .np-meta {
      display: flex; flex-direction: column; gap: 6px;
    }
    .np-row {
      display: flex; justify-content: space-between; align-items: center;
    }
    .np-key {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(200,216,219,0.3);
    }
    .np-val {
      font-family: 'Space Mono', monospace;
      font-size: 10px; color: rgba(200,216,219,0.8);
      text-align: right; max-width: 160px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .np-meetings {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(200,216,219,0.06);
    }
    .np-meetings-title {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase;
      color: rgba(200,216,219,0.3); margin-bottom: 6px;
    }
    .np-meeting-tag {
      display: inline-block;
      padding: 2px 7px; margin: 2px;
      background: rgba(37,61,96,0.5);
      border: 1px solid rgba(78,184,208,0.2);
      border-radius: 3px;
      font-family: 'Space Mono', monospace;
      font-size: 8px; color: rgba(200,216,219,0.6);
    }

    /* CONTROLS */
    #controls {
      position: fixed; right: 1.5rem; bottom: 2rem; z-index: 100;
      display: flex; flex-direction: column; gap: 6px;
    }
    .ctrl-btn {
      width: 36px; height: 36px;
      background: rgba(9,14,24,0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(200,216,219,0.08);
      border-radius: 6px;
      color: rgba(200,216,219,0.4);
      cursor: pointer; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .ctrl-btn:hover {
      border-color: rgba(78,184,208,0.35);
      color: ${PALETTE.accent};
      background: rgba(78,184,208,0.08);
    }
    .ctrl-btn.active {
      border-color: ${PALETTE.accent};
      color: ${PALETTE.accent};
      background: rgba(78,184,208,0.15);
      box-shadow: 0 0 12px rgba(78,184,208,0.3);
    }

    /* TOOLTIP */
    #tooltip {
      position: fixed; z-index: 200;
      background: rgba(9,14,24,0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(200,216,219,0.1);
      border-radius: 6px;
      padding: 7px 10px;
      pointer-events: none;
      opacity: 0; transition: opacity 0.15s;
      max-width: 200px;
    }
    #tooltip.visible { opacity: 1; }
    .tt-name {
      font-size: 12px; font-weight: 500; color: ${PALETTE.ice};
      margin-bottom: 2px;
    }
    .tt-type {
      font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(200,216,219,0.4);
    }
    .tt-conns {
      font-family: 'Space Mono', monospace;
      font-size: 9px; color: ${PALETTE.accent};
      margin-top: 3px;
    }

    /* LOADING */
    #loading {
      position: fixed; inset: 0; z-index: 300;
      background: ${PALETTE.bg};
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
    }
    .loading-mark {
      width: 48px; height: 48px;
      border: 2px solid rgba(200,216,219,0.08);
      border-top-color: ${PALETTE.accent};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      font-family: 'Space Mono', monospace;
      font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
      color: rgba(200,216,219,0.3);
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* SEARCH RESULTS */
    #search-results {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: rgba(9,14,24,0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(200,216,219,0.08);
      border-radius: 6px;
      max-height: 220px; overflow-y: auto;
      display: none;
    }
    #search-results.open { display: block; }
    .sr-item {
      padding: 8px 12px; cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: background 0.1s;
    }
    .sr-item:hover { background: rgba(78,184,208,0.06); }
    .sr-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .sr-label { font-size: 12px; color: ${PALETTE.ice}; }
    .sr-type {
      margin-left: auto; font-family: 'Space Mono', monospace;
      font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase;
      color: rgba(200,216,219,0.3);
    }
  `;
  document.head.appendChild(s);
}

// ── BUILD SHELL
function buildShell() {
  document.body.innerHTML = `
    <canvas id="particle-canvas"></canvas>
    <div id="graph-mount"></div>

    <header id="mc-header">
      <div class="mc-logo">
        <div class="mc-logo-mark">MC</div>
        <span class="mc-title">MACEMARK <span>//</span> INTELLIGENCE</span>
      </div>
      <div id="search-wrap">
        <span class="search-icon">⌕</span>
        <input id="search-input" type="text" placeholder="Search entities...">
        <div id="search-results"></div>
      </div>
      <div class="mc-stats">
        <div class="mc-stat">
          <div class="mc-stat-val" id="stat-nodes">—</div>
          <div class="mc-stat-label">Nodes</div>
        </div>
        <div class="mc-divider"></div>
        <div class="mc-stat">
          <div class="mc-stat-val" id="stat-links">—</div>
          <div class="mc-stat-label">Links</div>
        </div>
        <div class="mc-divider"></div>
        <div class="mc-stat">
          <div class="mc-stat-val" id="stat-meetings">—</div>
          <div class="mc-stat-label">Meetings</div>
        </div>
      </div>
    </header>

    <div id="legend">
      <div class="legend-title">Node Types</div>
      <div id="legend-items"></div>
    </div>

    <div id="node-panel">
      <div class="np-header">
        <span class="np-type" id="np-type">—</span>
        <button class="np-close" id="np-close">✕</button>
      </div>
      <div class="np-body">
        <div class="np-name" id="np-name"></div>
        <div class="np-meta" id="np-meta"></div>
      </div>
    </div>

    <div id="controls">
      <button class="ctrl-btn" id="btn-reset" title="Reset view">↺</button>
      <button class="ctrl-btn" id="btn-focus" title="Focus selected">◎</button>
      <button class="ctrl-btn" id="btn-concepts" title="Concepts only">◈</button>
    </div>

    <div id="tooltip">
      <div class="tt-name" id="tt-name"></div>
      <div class="tt-type" id="tt-type"></div>
      <div class="tt-conns" id="tt-conns"></div>
    </div>

    <div id="loading">
      <div class="loading-mark"></div>
      <div class="loading-text">Loading Intelligence Graph...</div>
    </div>
  `;

  document.getElementById('np-close').addEventListener('click', closeNodePanel);
  document.getElementById('btn-reset').addEventListener('click', resetView);
  document.getElementById('btn-focus').addEventListener('click', focusSelected);
  document.getElementById('btn-concepts').addEventListener('click', toggleConceptsOnly);
  document.getElementById('search-input').addEventListener('input', onSearch);
  document.getElementById('search-input').addEventListener('blur', () => {
    setTimeout(() => document.getElementById('search-results').classList.remove('open'), 150);
  });
}

// ── LOAD GRAPH
function loadGraph() {
  fetch('graph-data.json')
    .then(r => r.json())
    .then(data => {
      // Transform edges → links for compatibility
      if (data.edges && !data.links) {
        data.links = data.edges;
      }
      graphData = data;
      buildLegend(data);
      updateStats(data);
      initGraph(data);
    })
    .catch(err => {
      console.error('Graph load error:', err);
      document.querySelector('.loading-text').textContent = 'Failed to load graph data';
    });
}

// ── BUILD LEGEND
function buildLegend(data) {
  const counts = {};
  data.nodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1; });
  const container = document.getElementById('legend-items');
  Object.entries(TYPE_META).forEach(([type, meta]) => {
    if (!counts[type]) return;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.dataset.type = type;
    item.innerHTML = `
      <div class="legend-dot" style="background:${meta.color};color:${meta.color}"></div>
      <span class="legend-label">${meta.label}</span>
      <span class="legend-count">${counts[type]}</span>
    `;
    item.addEventListener('click', () => toggleFilter(type, item));
    container.appendChild(item);
  });
}

// ── UPDATE STATS
function updateStats(data) {
  const meetings = data.nodes.filter(n => n.type === 'meeting').length;
  document.getElementById('stat-nodes').textContent = data.nodes.length;
  document.getElementById('stat-links').textContent = data.links.length;
  document.getElementById('stat-meetings').textContent = meetings;
}

// ── INIT GRAPH
function initGraph(data) {
  // Count connections per node
  const connCount = {};
  data.nodes.forEach(n => { connCount[n.id] = 0; });
  data.links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    connCount[s] = (connCount[s] || 0) + 1;
    connCount[t] = (connCount[t] || 0) + 1;
  });

  // Calculate meeting count for concepts (business intelligence metric)
  const meetingCount = {};
  data.nodes.forEach(n => {
    if (n.type === 'concept' && n.properties && n.properties.meetings) {
      meetingCount[n.id] = Array.isArray(n.properties.meetings) ? n.properties.meetings.length : 0;
    }
  });

  const elem = document.getElementById('graph-mount');

  Graph = ForceGraph3D()(elem)
    .backgroundColor('rgba(0,0,0,0)')
    .graphData(data)
    .nodeLabel(() => '')
    .nodeColor(n => {
      const meta = TYPE_META[n.type];
      return meta ? meta.color : PALETTE.ice;
    })
    .nodeVal(n => {
      // Concept nodes sized by meeting count (business intelligence)
      if (n.type === 'concept') {
        const meetings = meetingCount[n.id] || 0;
        return Math.max(2, 3 + (meetings * 2.5)); // Base 3, +2.5 per meeting
      }
      const c = connCount[n.id] || 1;
      return Math.max(1, Math.min(c * 1.8, 12));
    })
    .nodeThreeObject(n => {
      const meta = TYPE_META[n.type] || { color: PALETTE.ice };
      
      // Calculate size based on node type
      let size, glowIntensity = 0.4;
      if (n.type === 'concept') {
        const meetings = meetingCount[n.id] || 0;
        size = Math.max(3, 3 + (meetings * 2)); // Bigger concepts = more meetings
        
        // Visual hierarchy by trend
        const trend = n.properties?.trend || 'stable';
        if (trend === 'rising') {
          glowIntensity = 0.7; // Brighter for rising concepts
        } else if (trend === 'falling') {
          glowIntensity = 0.2; // Dimmer for falling
        }
      } else {
        const c = connCount[n.id] || 1;
        size = Math.max(3, Math.min(c * 1.5, 10));
      }
      const group = new THREE.Group();

      // Core sphere with dynamic glow
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(meta.color),
        emissive: new THREE.Color(meta.color),
        emissiveIntensity: glowIntensity,
        transparent: true,
        opacity: 0.9,
        shininess: 80,
      });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.userData = { node: n, glowIntensity };
      group.add(sphere);

      // Outer glow ring - stronger for important concepts
      let showRing = false;
      let ringOpacity = 0.07;
      
      if (n.type === 'concept') {
        const meetings = meetingCount[n.id] || 0;
        if (meetings >= 2) {
          showRing = true;
          ringOpacity = Math.min(0.15, 0.05 + (meetings * 0.03)); // Brighter = more meetings
        }
      } else if (connCount[n.id] >= 3) {
        showRing = true;
      }
      
      if (showRing) {
        const ringGeo = new THREE.SphereGeometry(size * 1.6, 12, 12);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(meta.color),
          transparent: true,
          opacity: ringOpacity,
          side: THREE.BackSide,
        });
        group.add(new THREE.Mesh(ringGeo, ringMat));
      }

      // Label sprite for named nodes
      if (n.label) {
        const sprite = new SpriteText(n.label);
        sprite.color = 'rgba(200,216,219,0.85)';
        sprite.textHeight = Math.max(2.5, Math.min(size * 0.8, 4));
        sprite.fontFace = 'DM Sans';
        sprite.fontWeight = '400';
        sprite.backgroundColor = 'rgba(3,5,8,0.55)';
        sprite.padding = 1.5;
        sprite.borderRadius = 2;
        sprite.position.y = size + 4;
        group.add(sprite);
      }

      return group;
    })
    .nodeThreeObjectExtend(false)
    .linkColor(() => 'rgba(78,184,208,0.12)')
    .linkWidth(0.4)
    .linkOpacity(0.6)
    .linkDirectionalParticles(n => {
      const s = typeof n.source === 'object' ? n.source.id : n.source;
      const t = typeof n.target === 'object' ? n.target.id : n.target;
      const sc = connCount[s] || 0;
      const tc = connCount[t] || 0;
      return sc + tc >= 6 ? 2 : 1;
    })
    .linkDirectionalParticleWidth(1.2)
    .linkDirectionalParticleSpeed(0.004)
    .linkDirectionalParticleColor(() => PALETTE.accent)
    .onNodeHover(node => {
      document.body.style.cursor = node ? 'pointer' : 'default';
      lastHovered = node;
      if (node) showTooltip(node, connCount[node.id] || 0);
      else hideTooltip();
    })
    .onNodeClick(node => {
      showNodePanel(node, connCount[node.id] || 0, data);
    })
    .onBackgroundClick(() => {
      closeNodePanel();
    });

  // Lighting
  const scene = Graph.scene();
  scene.add(new THREE.AmbientLight(0x253D60, 0.8));
  const pointLight = new THREE.PointLight(0x4eb8d0, 1.5, 800);
  pointLight.position.set(0, 200, 0);
  scene.add(pointLight);
  const pointLight2 = new THREE.PointLight(0xC8D8DB, 0.6, 600);
  pointLight2.position.set(-200, -100, 100);
  scene.add(pointLight2);

  // Mouse move for tooltip positioning
  elem.addEventListener('mousemove', e => {
    const tt = document.getElementById('tooltip');
    tt.style.left = (e.clientX + 14) + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  });

  // Hide loading
  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
  }, 800);
}

// ── TOOLTIP
function showTooltip(node, conns) {
  const tt = document.getElementById('tooltip');
  const meta = TYPE_META[node.type] || {};
  document.getElementById('tt-name').textContent = node.label || node.id;
  document.getElementById('tt-type').textContent = meta.label || node.type;
  document.getElementById('tt-conns').textContent = conns + ' connection' + (conns !== 1 ? 's' : '');
  document.getElementById('tt-type').style.color = meta.color || PALETTE.ice;
  tt.classList.add('visible');
}
function hideTooltip() {
  document.getElementById('tooltip').classList.remove('visible');
}

// ── NODE PANEL
function showNodePanel(node, conns, data) {
  focusedNode = node;
  const meta = TYPE_META[node.type] || { color: PALETTE.ice, label: node.type };
  const panel = document.getElementById('node-panel');
  
  document.getElementById('np-type').textContent = meta.label;
  document.getElementById('np-type').style.color = meta.color;
  document.getElementById('np-name').textContent = node.label || node.id;

  const metaEl = document.getElementById('np-meta');
  metaEl.innerHTML = '';

  // Connections
  addMetaRow(metaEl, 'Connections', conns);

  // Concept-specific: Meeting presence (business intelligence metric)
  if (node.type === 'concept' && node.properties?.meetings) {
    const meetingCount = Array.isArray(node.properties.meetings) ? node.properties.meetings.length : 0;
    const trend = node.properties.trend || 'stable';
    const trendIcon = trend === 'rising' ? '📈' : trend === 'falling' ? '📉' : '➡️';
    addMetaRow(metaEl, 'Meeting Presence', `${meetingCount} meetings ${trendIcon} ${trend}`);
  }

  // Properties
  if (node.properties) {
    if (node.properties.date) addMetaRow(metaEl, 'Date', node.properties.date);
    if (node.properties.mentions) addMetaRow(metaEl, 'Mentions', node.properties.mentions);
    if (node.properties.context) addMetaRow(metaEl, 'Context', node.properties.context);
  }

  // Linked meetings
  const linkedMeetings = node.properties?.meetings;
  if (linkedMeetings && linkedMeetings.length > 0) {
    const div = document.createElement('div');
    div.className = 'np-meetings';
    div.innerHTML = '<div class="np-meetings-title">Appears in</div>';
    linkedMeetings.slice(0, 6).forEach(mid => {
      const meeting = data.nodes.find(n => n.id === mid);
      const tag = document.createElement('span');
      tag.className = 'np-meeting-tag';
      tag.textContent = meeting ? meeting.label : mid;
      div.appendChild(tag);
    });
    metaEl.appendChild(div);
  }

  panel.classList.add('visible');

  // Fly to node
  if (Graph && node.x !== undefined) {
    const dist = 120;
    Graph.cameraPosition(
      { x: node.x + dist * 0.5, y: node.y + dist * 0.3, z: node.z + dist },
      { x: node.x, y: node.y, z: node.z },
      800
    );
  }
}

function addMetaRow(parent, key, val) {
  const row = document.createElement('div');
  row.className = 'np-row';
  row.innerHTML = `<span class="np-key">${key}</span><span class="np-val">${val}</span>`;
  parent.appendChild(row);
}

function closeNodePanel() {
  document.getElementById('node-panel').classList.remove('visible');
  focusedNode = null;
}

// ── FILTER
function toggleFilter(type, item) {
  if (activeFilters.has(type)) {
    activeFilters.delete(type);
    item.classList.remove('dimmed');
  } else {
    activeFilters.add(type);
    item.classList.add('dimmed');
  }
  applyFilters();
}

function applyFilters() {
  if (!Graph || !graphData) return;
  if (activeFilters.size === 0) {
    Graph.graphData(graphData);
    return;
  }
  const filtered = {
    nodes: graphData.nodes.filter(n => !activeFilters.has(n.type)),
    links: graphData.links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      const sNode = graphData.nodes.find(n => n.id === s);
      const tNode = graphData.nodes.find(n => n.id === t);
      return sNode && !activeFilters.has(sNode.type) && tNode && !activeFilters.has(tNode.type);
    })
  };
  Graph.graphData(filtered);
}

// ── SEARCH
function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  const results = document.getElementById('search-results');
  if (!q || !graphData) { results.classList.remove('open'); return; }

  const matches = graphData.nodes
    .filter(n => (n.label || n.id).toLowerCase().includes(q))
    .slice(0, 8);

  if (!matches.length) { results.classList.remove('open'); return; }

  results.innerHTML = matches.map(n => {
    const meta = TYPE_META[n.type] || { color: PALETTE.ice, label: n.type };
    return `<div class="sr-item" data-id="${n.id}">
      <div class="sr-dot" style="background:${meta.color}"></div>
      <span class="sr-label">${n.label || n.id}</span>
      <span class="sr-type">${meta.label}</span>
    </div>`;
  }).join('');

  results.querySelectorAll('.sr-item').forEach(item => {
    item.addEventListener('click', () => {
      const node = graphData.nodes.find(n => n.id === item.dataset.id);
      if (node) {
        showNodePanel(node, 0, graphData);
        results.classList.remove('open');
        e.target.value = node.label || node.id;
      }
    });
  });

  results.classList.add('open');
}

// ── CONTROLS
function resetView() {
  if (Graph) Graph.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 800);
}

function focusSelected() {
  if (focusedNode && Graph) {
    const dist = 80;
    Graph.cameraPosition(
      { x: focusedNode.x + dist, y: focusedNode.y + dist * 0.5, z: focusedNode.z + dist },
      { x: focusedNode.x, y: focusedNode.y, z: focusedNode.z },
      600
    );
  }
}

function toggleConceptsOnly() {
  conceptOnlyMode = !conceptOnlyMode;
  const btn = document.getElementById('btn-concepts');
  
  if (conceptOnlyMode) {
    btn.classList.add('active');
    btn.title = 'Show all nodes';
    
    // Hide all non-concept nodes
    if (Graph && graphData) {
      Graph.nodeVisibility(node => node.type === 'concept');
      Graph.linkVisibility(link => {
        const s = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
        const t = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
        return s?.type === 'concept' && t?.type === 'concept';
      });
    }
  } else {
    btn.classList.remove('active');
    btn.title = 'Concepts only';
    
    // Show all nodes
    if (Graph) {
      Graph.nodeVisibility(true);
      Graph.linkVisibility(true);
    }
  }
}

// ── PARTICLE BACKGROUND
function animateParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.2 + 0.3,
    dx: (Math.random() - 0.5) * 0.2,
    dy: (Math.random() - 0.5) * 0.2,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(78,184,208,${p.opacity})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
}
