let playerData = null;
let shopData = [];
let flagProgress = { found: [], total: 2 };

async function api(endpoint, method = "GET", body = null) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    return (await fetch(endpoint, opts)).json();
}

function showToast(msg, type = "info") {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
            if (btn.dataset.tab === "trades") loadShop();
            if (btn.dataset.tab === "inventory") renderInventory();
            if (btn.dataset.tab === "quests") loadProgress();
        });
    });
}

async function loadPlayer() {
    playerData = await api("/api/me");
    document.getElementById("player-emeralds").textContent = playerData.emeralds;
}

// ── Villager Trades ──

async function loadShop() {
    shopData = await api("/api/shop");
    await loadPlayer();
    renderShop();
}

function renderShop() {
    const panel = document.getElementById("panel-trades");
    panel.innerHTML = `
        <h2 class="section-title">Villager Trades</h2>
        <div class="lore-box">
            <span class="npc-name">Villager</span>
            "Hmmm... Everything here costs emeralds. I trust whatever you say
            you'll pay. That's the honor system! Hmmm..."
        </div>
        <div class="shop-grid">
            ${shopData.map(item => {
                const owned = playerData.inventory.includes(item.id);
                const legendary = item.id === 4;
                return `
                <div class="card shop-item ${legendary ? 'legendary' : ''}">
                    <div class="card-header">
                        <span class="card-title">${item.name}</span>
                        <span class="card-price">${item.price.toLocaleString()} emeralds</span>
                    </div>
                    <p class="card-desc">${item.description}</p>
                    ${item.damage ? `<p class="item-damage">Damage: ${item.damage}</p>` : ""}
                    ${owned
                        ? '<p class="item-owned">Owned</p>'
                        : `<button class="btn btn-emerald" onclick="buyItem(${item.id}, ${item.price})">Trade</button>`}
                </div>`;
            }).join("")}
        </div>`;
}

async function buyItem(itemId, price) {
    const result = await api("/api/shop/buy", "POST", {
        item_id: itemId,
        price: price,
        quantity: 1,
    });
    if (result.success) {
        showToast(result.message, "success");
        await loadPlayer();
        renderShop();
    } else {
        showToast(result.error, "error");
    }
}

// ── Inventory ──

function renderInventory() {
    const panel = document.getElementById("panel-inventory");
    const items = playerData.inventory.map(id => shopData.find(i => i.id === id)).filter(Boolean);
    if (!items.length) {
        panel.innerHTML = `<h2 class="section-title">Inventory</h2>
            <p class="empty">Your inventory is empty. Visit Villager Trades.</p>`;
        return;
    }
    panel.innerHTML = `<h2 class="section-title">Inventory</h2>
        ${items.map(item => `
            <div class="card inventory-item">
                <div>
                    <span class="card-title">${item.name}</span>
                    <p class="card-desc">${item.description}</p>
                    ${item.id === 4 ? '<p class="text-emerald" style="font-style:italic">The Ender Dragon awaits in The End.</p>' : ""}
                </div>
                ${item.damage ? `<span class="item-damage">DMG: ${item.damage}</span>` : ""}
            </div>`).join("")}`;
}

// ── The End ──

function renderTheEnd() {
    document.getElementById("panel-end").innerHTML = `
        <h2 class="section-title">The End</h2>
        <div class="dragon-img-container">
            <img src="/static/ender_dragon.gif" alt="Ender Dragon" class="dragon-gif">
        </div>
        <div class="card text-center">
            <p>The Ender Dragon circles the obsidian pillars. Only the strongest weapon can defeat it.</p>
            <button class="btn btn-danger" onclick="fightDragon()">Fight the Ender Dragon</button>
            <div id="battle-result"></div>
        </div>`;
}

async function fightDragon() {
    const r = await api("/api/battle", "POST", {});
    const div = document.getElementById("battle-result");
    div.className = `battle-result ${r.victory ? "victory" : "defeat"}`;
    div.innerHTML = `<p>${r.message}</p>${r.flag ? `<div class="flag-display">${r.flag}</div>` : ""}`;
}

// ── Trial Chamber ──

function renderTrialChamber() {
    document.getElementById("panel-trial").innerHTML = `
        <h2 class="section-title">Trial Chamber</h2>
        <div class="lore-box">
            <span class="npc-name">Ancient Sign</span>
            "This chamber does not care about your server rank — it only opens
            for those who carry the right key. Many have tried with the wrong
            items in hand."
        </div>
        <div class="card vault-container">
            <div class="trial-key-icon">&#x1F5DD;&#xFE0F;</div>
            <h3 class="card-title">Trial Chamber Door</h3>
            <p class="vault-status" id="trial-status">Locked. Only players with a Trial Key may enter.</p>
            <button class="btn btn-portal" id="trial-btn" disabled onclick="enterTrialChamber()">Use Trial Key</button>
            <div id="trial-result"></div>
        </div>`;
    checkTrialAccess();
}

function checkTrialAccess() {
    if (playerData.role === "admin") {
        document.getElementById("trial-btn").disabled = false;
        document.getElementById("trial-status").textContent = "Admin access recognized.";
    }
}

async function enterTrialChamber() {
    const result = await api("/api/trial_chamber/enter", "POST", {
        player_id: playerData.id,
        permissions: playerData.permissions,
    });
    const div = document.getElementById("trial-result");
    if (result.success) {
        div.innerHTML = `<div class="battle-result victory"><p>${result.message}</p><div class="flag-display">${result.flag}</div></div>`;
    } else {
        div.innerHTML = `<div class="battle-result defeat"><p>${result.error}</p></div>`;
    }
}

// ── Quests ──

const QUESTS = [
    { number: 1, name: "The Ender Slayer",
      hint: "The Enchanted Netherite Sword costs a fortune in emeralds. But the villager has been known to make... accounting errors." },
    { number: 2, name: "The Trial Chamber",
      hint: "The chamber doesn't care about your server rank — only about what key you carry. Who writes the whitelist?" },
];

async function loadProgress() {
    flagProgress = await api("/api/progress");
    renderQuests();
}

function renderQuests() {
    const pct = (flagProgress.found.length / flagProgress.total) * 100;
    document.getElementById("panel-quests").innerHTML = `
        <h2 class="section-title">Quest Log</h2>
        <div class="progress-bar">
            <div class="progress-label">Quests: ${flagProgress.found.length} / ${flagProgress.total}</div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${QUESTS.map(q => `
            <div class="card quest-card ${flagProgress.found.includes(q.number) ? 'completed' : ''}">
                <div class="quest-number">QUEST ${q.number}</div>
                <div class="quest-name">${q.name}</div>
                <div class="quest-hint">${q.hint}</div>
            </div>`).join("")}
        <div class="flag-form">
            <h3>Submit a Flag</h3>
            <div class="flag-input-row">
                <input type="text" id="flag-input" placeholder="FLAG{...}" autocomplete="off">
                <button class="btn btn-emerald" onclick="submitFlag()">Submit</button>
            </div>
            <div id="flag-message" class="flag-message"></div>
        </div>`;
    const tab = document.querySelector('[data-tab="quests"]');
    const rem = flagProgress.total - flagProgress.found.length;
    if (rem > 0) { tab.dataset.badge = rem; tab.classList.add("has-badge"); }
    else { tab.classList.remove("has-badge"); }
}

async function submitFlag() {
    const input = document.getElementById("flag-input");
    const msg = document.getElementById("flag-message");
    const flag = input.value.trim();
    if (!flag) return;
    const r = await api("/api/submit_flag", "POST", { flag });
    if (r.success) {
        msg.className = "flag-message success";
        msg.textContent = `Quest ${r.quest} complete!`;
        input.value = "";
        showToast(msg.textContent, "success");
        await loadProgress();
    } else {
        msg.className = "flag-message error";
        msg.textContent = r.message;
    }
}

// ── Init ──

async function init() {
    try {
        await loadPlayer();
        shopData = await api("/api/shop");
        initTabs();
        document.getElementById("logout-btn").onclick = async () => {
            await api("/api/logout", "POST");
            location.href = "/";
        };
        renderShop();
        renderTheEnd();
        renderTrialChamber();
        renderQuests();
    } catch (e) {
        location.href = "/";
    }
}

init();
