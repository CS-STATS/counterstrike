// ============================================================
// INIT SYSTEM
// ============================================================

async function loadJSON(path){
    const res = await fetch(path + "?v=" + Date.now());
    if(!res.ok) throw new Error("Failed to load " + path);
    return await res.json();
}

async function initPage(){
    try{
        const teamsJSON  = await loadJSON("json/TeamsMaps.json");
        const matches    = await loadJSON("json/matches.json");

        window.teamsMapsData = teamsJSON;  // crucial for mapvetos
        window.matchData = matches.matches || matches;

        console.log("Loaded TeamsMaps:", teamsJSON);
        console.log("Loaded Matches:", window.matchData.length);

        if(window.buildModeTabs) buildModeTabs(null, teamsJSON);
        setupTabs();

    } catch(err){ console.error("INIT ERROR:", err); }
}

// ============================================================
// TAB SYSTEM
// ============================================================
function setupTabs(){
    const tabs = document.querySelectorAll(".tab");
    const underline = document.getElementById("tab-underline");

    tabs.forEach(tab=>{
        tab.onclick = () => {
            tabs.forEach(t=>t.classList.remove("active"));
            tab.classList.add("active");

            document.querySelectorAll(".tab-content")
                .forEach(c=>c.classList.remove("activeTab"));

            const activeContent =
                document.getElementById("tab-" + tab.dataset.tab);

            if(activeContent)
                activeContent.classList.add("activeTab");

            // Load Map Veto Tab
            if(tab.dataset.tab === "veto" && window.loadMapVetoPage)
                window.loadMapVetoPage();

            if(underline){
                underline.style.width = tab.offsetWidth+"px";
                underline.style.left  = tab.offsetLeft+"px";
            }
        };
    });

    // Initial underline position
    const active = document.querySelector(".tab.active");
    if(active && underline){
        underline.style.width = active.offsetWidth+"px";
        underline.style.left  = active.offsetLeft+"px";
    }
}

window.onload = initPage;
