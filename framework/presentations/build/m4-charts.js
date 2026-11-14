  function points(host) {
    var data = [['Start', 0, 'Start'], ['M0', 50, 'M0: Command Center'], ['M1', 300, 'M1: help desk to features'], ['M2', 500, 'M2: training to compliance'], ['M3', 650, 'M3: submissions to risk'], ['M4', 800, 'M4: security to incident reports']];
    var w = 620, hgt = 260, l = 50, r = 20, t = 20, b = 50, max = 800;
    var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': host.getAttribute('aria-label') });
    var x = function (k) { return l + k * (w - l - r) / (data.length - 1); };
    var y = function (v) { return t + (hgt - t - b) * (1 - v / max); };
    [0, 200, 400, 600, 800].forEach(function (v) { svg.appendChild(el('line', { x1: l, x2: w - r, y1: y(v), y2: y(v), stroke: 'var(--rule)' })); svg.appendChild(el('text', { class: 'num muted', x: l - 8, y: y(v) + 4, 'text-anchor': 'end' }, String(v))); });
    var pts = data.map(function (p, k) { return x(k) + ',' + y(p[1]); }).join(' ');
    svg.appendChild(el('polygon', { points: l + ',' + y(0) + ' ' + pts + ' ' + x(data.length - 1) + ',' + y(0), fill: 'var(--s1)', opacity: '0.12' }));
    svg.appendChild(el('polyline', { points: pts, fill: 'none', stroke: 'var(--s1)', 'stroke-width': 2 }));
    data.forEach(function (p, k) {
      var c = el('circle', { cx: x(k), cy: y(p[1]), r: k === data.length - 1 ? 6 : 4, fill: 'var(--s1)', stroke: 'var(--panel)', 'stroke-width': 2 });
      c.addEventListener('mousemove', function (e) { showTip(e, p[2] + ': ' + p[1] + ' points'); });
      c.addEventListener('mouseleave', function () { tip.hidden = true; });
      svg.appendChild(c);
      if (k) svg.appendChild(el('text', { class: 'num', x: x(k), y: y(p[1]) - 12, 'text-anchor': 'middle' }, String(p[1])));
      svg.appendChild(el('text', { class: 'muted', x: x(k), y: hgt - 18, 'text-anchor': k === 0 ? 'start' : k === data.length - 1 ? 'end' : 'middle' }, p[0]));
    });
    host.appendChild(svg);
  }
  var charts = {
    points: points,
    releases: function (h) { hbars(h, [{ label: 'STORY-000 (first)', value: 1, total: 1 }, { label: 'r0 Setup and support', value: 4, total: 4 }, { label: 'r1 Enhancement, training', value: 2, total: 2 }, { label: 'r2 Reporting, compliance', value: 3, total: 3 }, { label: 'r3 Response management', value: 2, total: 2 }, { label: 'r4 Risk and security', value: 4, total: 4 }], 4, function (r) { return r.value + ' of ' + r.total; }); }
  };
