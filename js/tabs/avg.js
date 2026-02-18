// ============================================================
// CS AVG STATS TAB — FULL VERSION
// Overall + Vs Opponent + Player Cards + Team Logos
// + Overtime Toggle (JS-only)
// + Correct OT Opponent Summary (deduped maps)
// + ACTIVE ROSTER FILTER (NEW)
// ============================================================

window.matchData = [];

function norm(v){ return String(v).toLowerCase().trim(); }
function cap(v){ return String(v).toUpperCase(); }

function buildModeTabs(_, teamsJSON){

    const root=document.getElementById("tab-avg");
    if(!root) return;

    const teams=teamsJSON.teams;
    const maps=teamsJSON.maps;

    root.innerHTML=`
        <div class="modes-container">
            <div class="gm-view-toggle">
                <button id="view-overall" class="gm-view-btn active">Overall Avg</button>
                <button id="view-vs" class="gm-view-btn">Vs Opponent</button>
            </div>

            <h2 class="bp-title">MAPS:</h2>
            <div id="map-grid" class="gm-map-grid"></div>

            <h2 class="bp-title">TEAMS:</h2>

            <div id="vs-controls">
                <select id="team-dd"></select>
                <span class="vs-text">VS</span>
                <select id="opp-dd"></select>
            </div>

            <div id="team-toggle-wrapper" class="team-toggle-wrapper"></div>
            <div id="gm-results"></div>
        </div>
    `;

    const results=document.getElementById("gm-results");
    const mapGrid=document.getElementById("map-grid");
    const teamWrapper=document.getElementById("team-toggle-wrapper");

    const vsControls=document.getElementById("vs-controls");
    const teamDD=document.getElementById("team-dd");
    const oppDD=document.getElementById("opp-dd");

    const btnOverall=document.getElementById("view-overall");
    const btnVs=document.getElementById("view-vs");

    let VIEW="overall";
    let GM_TEAM=null, GM_MAP=null, GM_OPP=null;
    let OT_MODE="include";

    // ================= VIEW SWITCH =================
    btnOverall.onclick=()=>{
        VIEW="overall";
        btnOverall.classList.add("active");
        btnVs.classList.remove("active");
        teamWrapper.style.display="grid";
        vsControls.classList.remove("show");
        results.innerHTML="";
    };

    btnVs.onclick=()=>{
        VIEW="vs";
        btnVs.classList.add("active");
        btnOverall.classList.remove("active");
        teamWrapper.style.display="none";
        vsControls.classList.add("show");
        results.innerHTML="";
    };

    // ================= MAP GRID =================
    function loadMapGrid(){
        mapGrid.innerHTML="";
        maps.filter(m=>m.active!==false)
        .forEach(mapObj=>{
            const card=document.createElement("div");
            card.className="gm-map-card";

            card.innerHTML=`
                <img src="${mapObj.image}" class="map-thumb">
                <div>${cap(mapObj.name)}</div>
            `;

            card.onclick=()=>{
                GM_MAP=mapObj.id;
                document.querySelectorAll(".gm-map-card")
                    .forEach(c=>c.classList.remove("active"));
                card.classList.add("active");
                render();
            };

            mapGrid.appendChild(card);
        });
    }
    loadMapGrid();

    // ================= TEAM BUTTONS =================
    function loadTeamButtons(){
        teamWrapper.innerHTML="";
        Object.entries(teams)
        .filter(([k,t])=>t.active!==false)
        .forEach(([team,t])=>{
            const btn=document.createElement("div");
            btn.className="team-toggle-btn";

            btn.innerHTML=`
                <img src="teams/${team}.webp"
                     class="team-toggle-logo"
                     onerror="this.onerror=null;this.src='teams/${team}.svg'">
                <div class="team-toggle-name">${cap(t.name)}</div>
            `;

            btn.onclick=()=>{
                GM_TEAM=team;
                document.querySelectorAll(".team-toggle-btn")
                    .forEach(b=>b.classList.remove("active"));
                btn.classList.add("active");
                render();
            };

            teamWrapper.appendChild(btn);
        });
    }
    loadTeamButtons();

    // ================= OT TOGGLE =================
    const otWrap=document.createElement("div");
    otWrap.style.display="flex";
    otWrap.style.justifyContent="center";
    otWrap.style.gap="12px";
    otWrap.style.margin="15px 0";

    const otInc=document.createElement("button");
    otInc.textContent="Overtime Included";
    otInc.className="gm-view-btn active";

    const otNo=document.createElement("button");
    otNo.textContent="No Overtime";
    otNo.className="gm-view-btn";

    otWrap.appendChild(otInc);
    otWrap.appendChild(otNo);
    teamWrapper.after(otWrap);

    otInc.onclick=()=>{
        OT_MODE="include";
        otInc.classList.add("active");
        otNo.classList.remove("active");
        render();
    };

    otNo.onclick=()=>{
        OT_MODE="no";
        otNo.classList.add("active");
        otInc.classList.remove("active");
        render();
    };

    // ================= VS DROPDOWNS =================
    Object.entries(teams)
    .filter(([k,t])=>t.active!==false)
    .forEach(([k,t])=>{
        teamDD.innerHTML+=`<option value="${k}">${cap(t.name)}</option>`;
        oppDD.innerHTML+=`<option value="${k}">${cap(t.name)}</option>`;
    });

    teamDD.onchange=()=>{GM_TEAM=teamDD.value;render();};
    oppDD.onchange=()=>{GM_OPP=oppDD.value;render();};

    // ================= RENDER =================
    function render(){

        if(!GM_MAP||!GM_TEAM) return;
        if(VIEW==="vs"&&!GM_OPP) return;

        let rows=window.matchData.filter(m=>{
            const base=
                norm(m.map)===norm(GM_MAP)&&
                norm(m.team)===norm(GM_TEAM)&&
                (VIEW==="overall"||norm(m.opponent)===norm(GM_OPP));

            if(!base) return false;

            if(OT_MODE==="no"){
                const ts=Number(m.teamScore)||0;
                const os=Number(m.oppScore)||0;
                if(ts+os>24) return false;
            }

            return true;
        });

        if(!rows.length){
            results.innerHTML="<p>No data</p>";
            return;
        }

        // ===== OT SUMMARY =====
        const otRows=rows.filter(r=>{
            const ts=Number(r.teamScore)||0;
            const os=Number(r.oppScore)||0;
            return ts+os>24;
        });

        const seen=new Set();
        const uniqueOT=[];

        otRows.forEach(r=>{
            const key=r.matchID+"-"+r.mapNumber;
            if(!seen.has(key)){
                seen.add(key);
                uniqueOT.push(r);
            }
        });

        const otCount={};
        uniqueOT.forEach(r=>{
            const o=norm(r.opponent);
            otCount[o]=(otCount[o]||0)+1;
        });

        const otSummary=Object.entries(otCount)
            .map(([o,c])=>`${o} x${c}`)
            .join(", ");

        let html="";

        if(OT_MODE==="include" && otSummary){
            html+=`
                <div style="text-align:center;font-weight:bold;margin-bottom:10px;">
                    OT vs: ${otSummary}
                </div>
            `;
        }

        // ===== ACTIVE ROSTER FILTER (NEW) =====
        const teamRoster = teams[GM_TEAM]?.players || [];
        const activeRoster = teamRoster.map(p => norm(p));

        const players = [...new Set(rows.map(r => r.player))]
            .filter(p => activeRoster.includes(norm(p)));

        html+=`<div class="player-cards">`;

        players.forEach(p=>{
            const pr=rows.filter(r=>norm(r.player)===norm(p));
            const g=pr.length;

            const avg=(key)=>{
                const total=pr.reduce((a,b)=>a+(Number(b[key])||0),0);
                return (total/g).toFixed(2);
            };

            html+=`
            <div class="player-card">
                <h3>${cap(p)}</h3>
                <div class="stat-grid">
                    <div>Kills: <b>${avg("kills")}</b></div>
                    <div>Deaths: <b>${avg("deaths")}</b></div>
                    <div>Assists: <b>${avg("assists")}</b></div>
                    <div>ADR: <b>${avg("adr")}</b></div>
                    <div>Rating: <b>${avg("rating")}</b></div>
                    <div>HS Kills: <b>${avg("headshotKills")}</b></div>
                    <div>Opening K: <b>${avg("openingKills")}</b></div>
                    <div>Opening D: <b>${avg("openingDeaths")}</b></div>
                    <div>Clutches: <b>${avg("clutches")}</b></div>
                </div>
                <div class="stat-footer">
                    Maps Played: ${g}
                </div>
            </div>`;
        });

        html+="</div>";
        results.innerHTML=html;
    }
}

window.buildModeTabs=buildModeTabs;
