// ============================================================
// MAP VETO TAB
// ============================================================

window.loadMapVetoPage = function () {
    const vetoContainer = document.getElementById("tab-veto");
    if (!vetoContainer) return;

    vetoContainer.innerHTML = `
        <div id="mapveto-controls">
            <select id="teamA"><option value="">Select Team A</option></select>
            <select id="teamB"><option value="">Select Team B</option></select>
        </div>

        <div id="modeToggle">
            <button class="mode-btn active" data-mode="overall">Overall</button>
            <button class="mode-btn" data-mode="h2h">Head-to-Head</button>
        </div>

        <div id="vetoStats"></div>
    `;

    Promise.all([
        fetch("json/mapvetos.json?v=" + Date.now()).then(r => r.json()),
        fetch("json/matches.json?v=" + Date.now()).then(r => r.json())
    ]).then(([vetoData, matchesData]) => {
        initMapVetos(vetoData, matchesData);
    });
};

// ============================================================
// INIT
// ============================================================

function initMapVetos(vetoData, matchesData) {

    const teamA = document.getElementById("teamA");
    const teamB = document.getElementById("teamB");
    const statsDiv = document.getElementById("vetoStats");

    let mode = "overall";

    // ===== Collect teams =====
    const teams = new Set();
    vetoData.forEach(m => {
        Object.keys(m).forEach(k => {
            if (k !== "Decider" && k !== "Series")
                teams.add(k.toLowerCase());
        });
    });

    [...teams].sort().forEach(t => {
        teamA.add(new Option(t, t));
        teamB.add(new Option(t, t));
    });

    // ===== Toggle =====
    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".mode-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            mode = btn.dataset.mode;
            render();
        };
    });

    teamA.onchange = render;
    teamB.onchange = render;

    // ========================================================
    // RENDER
    // ========================================================

    function render() {

        statsDiv.innerHTML = "";

        const a = teamA.value;
        const b = teamB.value;
        if (!a || !b || a === b) return;

        let matchesA, matchesB;

        if (mode === "h2h") {
            matchesA = vetoData.filter(m => m[a] && m[b]);
            matchesB = matchesA;
        } else {
            matchesA = vetoData.filter(m => m[a]);
            matchesB = vetoData.filter(m => m[b]);
        }

        const maps = window.teamsMapsData.maps
            .filter(m => m.active)
            .map(m => m.id);

        // ===== TOP ROW =====
        const top = document.createElement("div");
        top.className = "logo-row";

        function teamBlock(t) {
            const d = document.createElement("div");
            d.className = "team-wrapper";

            const img = document.createElement("img");
            img.className = "team-logo";
            img.src = `teams/${t}.webp`;
            img.onerror = () => img.src = `teams/${t}.svg`;

            const name = document.createElement("div");
            name.className = "team-name";
            name.textContent = t;

            d.append(img, name);
            return d;
        }

        const vs = document.createElement("div");
        vs.textContent = "VS";
        vs.style.color = "#4caf50";
        vs.style.fontWeight = "bold";

        top.append(teamBlock(a), vs, teamBlock(b));
        statsDiv.appendChild(top);

        // ===== MAP ROWS =====
        maps.forEach(map => {

            const row = document.createElement("div");
            row.className = "veto-stats-row";

            const wlA = getMapWL(
                matchesData,
                a,
                map,
                mode === "h2h" ? b : null
            );

            const wlB = getMapWL(
                matchesData,
                b,
                map,
                mode === "h2h" ? a : null
            );

            // TEAM A
            const aStats = document.createElement("div");
            aStats.className = "team-stats";
            aStats.innerHTML = `
                Picks: ${countStat(matchesA,a,"pick",map)}<br>
                Bans: ${countStat(matchesA,a,"ban",map)}<br>
                Deciders: ${countStat(matchesA,a,"decider",map)}<br>
                W/L: ${wlA.wins} - ${wlA.losses}<br>
                WR: ${wlA.wr}%
            `;

            // MAP CENTER
            const center = document.createElement("div");
            center.style.textAlign = "center";

            const img = document.createElement("img");
            img.className = "map-img";
            img.src = `maps/${map}.png`;

            const name = document.createElement("div");
            name.textContent = map.toUpperCase();
            name.style.marginTop = "6px";
            name.style.fontWeight = "600";

            center.append(img, name);

            // TEAM B
            const bStats = document.createElement("div");
            bStats.className = "team-stats";
            bStats.innerHTML = `
                Picks: ${countStat(matchesB,b,"pick",map)}<br>
                Bans: ${countStat(matchesB,b,"ban",map)}<br>
                Deciders: ${countStat(matchesB,b,"decider",map)}<br>
                W/L: ${wlB.wins} - ${wlB.losses}<br>
                WR: ${wlB.wr}%
            `;

            row.append(aStats, center, bStats);
            statsDiv.appendChild(row);
            statsDiv.appendChild(document.createElement("hr"));
        });
    }
}

// ============================================================
// COUNT VETOS
// ============================================================

function countStat(matches, team, type, map) {
    let c = 0;

    matches.forEach(m => {

        if (type === "decider") {
            if (
                m.Decider &&
                m.Decider.toLowerCase() === map &&
                m[team]
            ) c++;
            return;
        }

        const arr = m[team];
        if (!arr) return;

        arr.forEach(v => {
            const s = v.toLowerCase();
            if (s.includes(type) && s.includes(map)) c++;
        });
    });

    return c;
}

// ============================================================
// WIN / LOSS (DEDUPED + H2H FILTER)
// ============================================================

function getMapWL(matchesData, team, map, opponent=null) {

    let wins = 0;
    let losses = 0;

    const seen = new Set();

    matchesData.forEach(m => {

        if (
            m.team.toLowerCase() !== team ||
            m.map.toLowerCase() !== map
        ) return;

        if (opponent &&
            m.opponent.toLowerCase() !== opponent)
            return;

        const key = m.matchID + "_" + m.map + "_" + m.team;
        if (seen.has(key)) return;

        seen.add(key);

        if (m.teamScore > m.oppScore) wins++;
        else losses++;
    });

    const total = wins + losses;
    const wr = total ? Math.round((wins/total)*100) : 0;

    return { wins, losses, wr };
}
