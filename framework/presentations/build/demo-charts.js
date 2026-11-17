  function points(host) { hbars(host, [], 1, function () { return ''; }); }
  var charts = {
    acts: function (h) { hbars(h, [{ label: 'Opening', value: 1 }, { label: 'Command Center', value: 2 }, { label: 'Operations', value: 5 }, { label: 'People and records', value: 4 }, { label: 'Procurement', value: 3 }, { label: 'Security and trust', value: 3.5 }, { label: 'Audit trail', value: 1 }, { label: 'Close', value: 0.5 }], 5, function (r) { return r.value + ' min'; }); },
    rehearsal: function (h) { hbars(h, [{ label: 'Command Center', value: 1.2 }, { label: 'Operations', value: 17.6 }, { label: 'People and records', value: 24.2 }, { label: 'Procurement', value: 16.4 }, { label: 'Security and trust', value: 23.8 }, { label: 'Audit trail', value: 3.8 }], 25, function (r) { return r.value.toFixed(1) + ' s'; }); }
  };
