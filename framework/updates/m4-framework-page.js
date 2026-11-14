// Update framework/PROJECT-FRAMEWORK.html (the framework artifact source) for Milestone 4: numbers, timeline,
// stories, criteria, milestones, screens, links and the OBI/OGE tour dialogue. Run once from the repo root:
//   node framework/updates/m4-framework-page.js
const fs = require('fs');
const f = 'framework/PROJECT-FRAMEWORK.html';
let h = fs.readFileSync(f, 'utf8');
const line = (re) => { const m = h.match(re); if (!m) throw new Error('no match ' + re); return m[0]; };
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor: ' + String(a).slice(0, 80)); h = h.replace(a, b); };
const P = 'https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/';

h = h.replace(/Last updated <strong>[^<]*<\/strong>/, 'Last updated <strong>14 November 2026</strong>');
rep(line(/<div><span class="k">Milestone 3<\/span>.*<\/div>/), '<div><span class="k">Milestone 4</span><span class="v">Verified</span><span class="n">STORY-011, 014 and 015 verified by the portal on 14 Nov through the push webhook, 150 points</span></div>');
rep(line(/<div><span class="k">Stories verified<\/span>.*<\/div>/), '<div><span class="k">Stories verified</span><span class="v">16 of 16</span><span class="n">The build is complete: all five releases, 50 of 50 criteria, 800 points</span></div>');
rep(line(/<div><span class="k">Checks<\/span>.*<\/div>/), '<div><span class="k">Checks</span><span class="v">73 + 5 walks</span><span class="n">73 unit tests; browser walks of the Command Center and the M1 to M4 workspace, all passing</span></div>');
rep(line(/<div><span class="k">Days to ship-by<\/span>.*<\/div>/), '<div><span class="k">Days to ship-by</span><span class="v">10</span><span class="n">Finished on 14 November; the demo is on 24 November</span></div>');
rep(line(/<li><div><strong>Next: Milestone 4<\/strong>.*<\/li>/), '<li><div><strong>Next: the demo on 24 November</strong><span>A rehearsed walk through all 16 stories. The build itself is complete.</span></div></li>');
rep('<rect class="bar-done" x="626" y="170" width="28" height="20"></rect><rect class="bar-todo" x="654" y="170" width="84" height="20"></rect>', '<rect class="bar-done" x="626" y="170" width="112" height="20"></rect>');
rep('<line class="today" x1="374" y1="14" x2="374" y2="200"></line>', '<line class="today" x1="430" y1="14" x2="430" y2="200"></line>');
rep('<text class="today-label" x="380" y="22">Today, 12 Nov</text>', '<text class="today-label" x="436" y="22">Today, 14 Nov</text>');
rep(line(/<tr class="is-active"><td class="id">r4<\/td>.*<\/tr>/), '<tr class="is-done"><td class="id">r4</td><td>010 Risk Assessment Tools · 011 Cybersecurity Compliance · 014 Performance and User-Error Risks · 015 Incident Reports and Risk Documentation</td><td>21 to 24 Nov</td><td><span class="pill ok">Verified</span> 010 on 12 Nov; 011, 014, 015 on 14 Nov</td></tr>');

const cs = h.indexOf('<h2 id="crit-h">');
const ce = h.indexOf('</section>', cs);
h = h.slice(0, cs) + `<h2 id="crit-h">Milestone 4 against its nine criteria</h2>
    <p class="sub">All three verified by the portal on 14 November through the push webhook, each against the commit that names it. With them, all 16 stories and all 50 criteria are verified.</p>
    <div class="scroll">
      <table>
        <thead><tr><th>Story</th><th>What passes</th><th>Proof</th></tr></thead>
        <tbody>
          <tr class="is-done"><td><strong>011</strong> Cybersecurity</td><td>Current cyber training clears vendor staff for protected work, enforced at the point of access; a breach is logged, contained, notified within 60 days when personal data is involved, and closed with its cause; completions archived</td><td><span class="pill ok">Verified</span> 341fd4c · 4 tests + walk</td></tr>
          <tr class="is-done"><td><strong>014</strong> Performance and errors</td><td>A response time far outside its own baseline raises an alert for investigation; every refused action is logged with "Try this" suggestions worked out from the data</td><td><span class="pill ok">Verified</span> 5a1a8d6 · 4 tests + walk</td></tr>
          <tr class="is-done"><td><strong>015</strong> Incident reports</td><td>A detailed report per incident, stored with its hash; each new report is a new version, all kept; documentation opens for authorised roles only, every opening and refusal logged</td><td><span class="pill ok">Verified</span> 15a6d44 · 3 tests + walk</td></tr>
        </tbody>
      </table>
    </div>
  ` + h.slice(ce);
h = h.replace(/data-tour="Milestone 3 checked line by line[^"]*"/, 'data-tour="Milestone 4 checked line by line: each story\'s three criteria, what proves it, and the commit the portal verified."');
rep(line(/<tr class="is-active"><td class="id">M4<\/td>.*<\/tr>/), '<tr class="is-done"><td class="id">M4</td><td>STORY-011, 014 and 015: security, performance and errors, incident reports</td><td>Done 14 Nov</td></tr>');

const ss = h.indexOf('<h2 id="shots-h">');
const se = h.indexOf('</section>', ss);
h = h.slice(0, ss) + `<h2 id="shots-h">Screens, 14 November: Milestone 4</h2>
    <div class="shots">
      <figure><img src="screens/m4-01-security-breach.png" width="1280" height="1600" alt="A breach logged, contained, notified and closed" loading="lazy"><figcaption><strong>Security (011)</strong>A breach from logging to close, with the 60-day clock.</figcaption></figure>
      <figure><img src="screens/m4-02-access-blocked.png" width="1280" height="900" alt="Access refused until the cyber course is completed" loading="lazy"><figcaption><strong>Compliance enforced (011)</strong>No current training, no access, and what to do about it.</figcaption></figure>
      <figure><img src="screens/m4-04-performance-anomaly.png" width="1280" height="1600" alt="Baselines per component and an anomaly alert" loading="lazy"><figcaption><strong>Anomalies (014)</strong>Abnormal measured against each component's own baseline.</figcaption></figure>
      <figure><img src="screens/m4-03-user-error-suggestion.png" width="1280" height="900" alt="A refused maintenance window with a suggestion" loading="lazy"><figcaption><strong>User errors (014)</strong>A mistake comes with the fix.</figcaption></figure>
      <figure><img src="screens/m4-05-incident-report.png" width="1280" height="1600" alt="An incident report with versions and its hash" loading="lazy"><figcaption><strong>Incident reports (015)</strong>Versioned, every version kept.</figcaption></figure>
      <figure><img src="screens/m4-06-incident-access-log.png" width="1280" height="1600" alt="The documentation access log" loading="lazy"><figcaption><strong>Access log (015)</strong>Openings and refusals, all on record.</figcaption></figure>
    </div>
  ` + h.slice(se);
h = h.replace(/data-tour="Current screenshots of the work: the Milestone 3 workspace[^"]*"/, 'data-tour="Current screenshots of the work: the Milestone 4 workspace. They are replaced at every milestone."');
rep(line(/<li>Portal: <a href="[^"]*STORY-010">.*<\/li>/), `<li>Portal: <a href="${P}STORY-015">STORY-015 in Project Studio</a> (all 16 stories verified)</li>`);
rep(line(/<li>Milestone 3 presentation:.*<\/li>/), '<li>Milestone 4 presentation: <a href="https://obianams04.github.io/cris-enhancement/framework/presentations/m4/">obianams04.github.io/cris-enhancement/framework/presentations/m4</a></li>');

const NEW = {
  2: 'OBI: Here is where the build stands, and it is finished. Milestone 4 is verified: stories 011, 014 and 015. || OGE: So all of it? || OBI: Sixteen of sixteen stories, fifty of fifty criteria, eight hundred points, with 73 unit tests and five browser walks passing, ten days before the 24 November demo.',
  3: "OBI: This list says who has to act. Next is the demo on 24 November. || OGE: And what does TxDOT still need to give us? || OBI: Through Ali: the solicitation's real scoring criteria, Euna access, TxDOT's risk matrix, the required reports, financial-system access, legal review of the compliance register, and the service levels.",
  4: 'OBI: The five releases on one timeline, with the dates the story brief gives them. || OGE: Which ones are finished? || OBI: All five, by 14 November, ahead of their dates.',
  5: 'OBI: Every story by release. STORY-000, the Command Center, came first on 11 November. || OGE: And the rest? || OBI: Every release is verified. The last three, cybersecurity, performance and user error, and incident reports, were verified on 14 November.',
  6: 'OBI: Milestone 4, checked line by line against its nine criteria. || OGE: Give me one example. || OBI: Cybersecurity: a vendor employee without current training is refused access to the bid documents, and is told to take the course. Pass it, and access comes back. || OGE: Compliance enforced, not just reported.',
  7: 'OBI: The plan of work: three to five stories at a time. || OGE: How did it go? || OBI: M0 to M4 are all done, five milestones in five days, each closed with a summary, new screenshots and a short presentation.',
  9: 'OBI: What could stop the ship-by date or mislead a reviewer. || OGE: Anything left? || OBI: The build is done, so the risks are about the demo: several values are demo proposals until TxDOT confirms them, and the page says so wherever they appear.',
  10: 'OBI: Finally, current screenshots of the Milestone 4 workspace. They are replaced at every milestone. || OGE: What do they show? || OBI: A breach from logging to close, access refused until training is done, an anomaly alert, a mistake that comes with its fix, and versioned incident reports. That is the tour. Thanks for listening.',
};
let i = 0;
h = h.replace(/data-tour-script="([^"]*)"/g, (m) => { i += 1; return NEW[i] ? `data-tour-script="${NEW[i].replace(/"/g, '&quot;')}"` : m; });
fs.writeFileSync(f, h);
console.log('framework page updated for M4; dialogues', i);
