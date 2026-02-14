// ============================================================
// CS AVG STATS TAB — FULL VERSION
// Overall + Vs Opponent + Player Cards + Team Logos
// ============================================================

window.matchData = [];

function norm(v){ return String(v).toLowerCase().trim(); }
function cap(v){ return String(v).toUpperCase(); } // FULL uppercase

function buildModeTabs(_, teamsJSON){

    const root = document.getElementById("tab-avg");
    if(!root) return;

    const teams = teamsJSON.teams;
    const maps = teamsJSON.maps;

    root.innerHTML = `
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

    const results = document.getElementById("gm-results");
    const mapGrid = document.getElementById("map-grid");
    const teamWrapper = document.getElementById("team-toggle-wrapper");

    const vsControls = document.getElementById("vs-controls");
    const teamDD = document.getElementById("team-dd");
    const oppDD = document.getElementById("opp-dd");

    const btnOverall = document.getElementById("view-overall");
    const btnVs = document.getElementById("view-vs");

    let VIEW="overall";
    let GM_TEAM=null, GM_MAP=null, GM_OPP=null;

    // ================= VIEW SWITCH =================
    btnOverall.onclick = () => {
        VIEW = "overall";
        btnOverall.classList.add("active");
        btnVs.classList.remove("active");

        teamWrapper.style.display = "grid";     // show team buttons
        vsControls.classList.remove("show");    // hide VS dropdowns
        results.innerHTML = "";
    };

    btnVs.onclick = () => {
        VIEW = "vs";
        btnVs.classList.add("active");
        btnOverall.classList.remove("active");

        teamWrapper.style.display = "none";     // hide team buttons
        vsControls.classList.add("show");       // show VS dropdowns
        results.innerHTML = "";
    };

    // ================= MAP GRID =================
    function loadMapGrid(){
        mapGrid.innerHTML="";
        if(!maps || !Array.isArray(maps)){
            console.error("Maps missing!");
            return;
        }

        maps
          .filter(m => m.active !== false)
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
          .filter(([key,t]) => t.active !== false)
          .forEach(([team,t])=>{
    
            const btn=document.createElement("div");
            btn.className="team-toggle-btn";
    
            btn.innerHTML=`
                <img 
                    src="teams/${team}.webp"
                    class="team-toggle-logo"
                    onerror="this.onerror=null;this.src='teams/${team}.svg'"
                >
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

    // ================= VS DROPDOWNS =================
    Object.entries(teams)
      .filter(([k,t]) => t.active !== false)
      .forEach(([k,t])=>{
          teamDD.innerHTML += `<option value="${k}">${cap(t.name)}</option>`;
          oppDD.innerHTML += `<option value="${k}">${cap(t.name)}</option>`;
      });

    teamDD.onchange = () => { GM_TEAM = teamDD.value; render(); };
    oppDD.onchange = () => { GM_OPP = oppDD.value; render(); };

    // ================= RENDER PLAYER CARDS =================
    function render(){

        if(!GM_MAP || !GM_TEAM) return;
        if(VIEW==="vs" && !GM_OPP) return;

        let rows = window.matchData.filter(m=>{
            return norm(m.map) === norm(GM_MAP)
                && norm(m.team) === norm(GM_TEAM)
                && (VIEW==="overall" || norm(m.opponent) === norm(GM_OPP));
        });

        if(!rows.length){
            results.innerHTML="<p>No data</p>";
            return;
        }

        const players=[...new Set(rows.map(r=>r.player))];

        let html=`<div class="player-cards">`;

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
            </div>
            `;
        });

        html+="</div>";
        results.innerHTML=html;
    }
}

window.buildModeTabs = buildModeTabs;