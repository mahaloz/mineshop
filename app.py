from flask import Flask, request, jsonify, session, render_template, redirect, url_for

app = Flask(__name__)
app.secret_key = "fake-secret-key"

FLAGS = {
    1: "flag{fake_flag_1}",
    2: "flag{fake_flag_2}",
}

PLAYERS = {}
SUBMITTED = {}

SHOP_ITEMS = {
    1: {"id": 1, "name": "Wooden Sword", "price": 10, "damage": 5,
        "description": "A basic weapon. Gets the job done... barely."},
    2: {"id": 2, "name": "Potion of Healing", "price": 15, "damage": 0,
        "description": "Brewed with Nether Wart and Glistering Melon."},
    3: {"id": 3, "name": "Diamond Sword", "price": 80, "damage": 25,
        "description": "A veteran's weapon of choice."},
    4: {"id": 4, "name": "Enchanted Netherite Sword", "price": 99999, "damage": 500,
        "description": "Sharpness V, Fire Aspect II. The only weapon that can defeat the Ender Dragon."},
}


def get_player():
    pid = session.get("player_id")
    return PLAYERS.get(pid) if pid is not None else None


@app.route("/")
def index():
    return redirect(url_for("game")) if "player_id" in session else render_template("login.html")


@app.route("/game")
def game():
    return render_template("game.html") if "player_id" in session else redirect(url_for("index"))


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if data.get("username") == "steve" and data.get("password") == "craft123":
        PLAYERS[1] = {
            "id": 1, "display_name": "Steve", "role": "player",
            "emeralds": 50, "permissions": ["basic"], "inventory": [],
        }
        SUBMITTED[1] = set()
        session["player_id"] = 1
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid credentials."}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/me")
def me():
    player = get_player()
    return jsonify(player) if player else (jsonify({"error": "Not logged in"}), 401)


@app.route("/api/shop")
def shop():
    return jsonify(list(SHOP_ITEMS.values())) if get_player() else (jsonify({"error": "Not logged in"}), 401)


@app.route("/api/shop/buy", methods=["POST"])
def buy():
    player = get_player()
    if not player:
        return jsonify({"error": "Not logged in"}), 401
    data = request.json
    item_id, price = data.get("item_id"), data.get("price")
    item = SHOP_ITEMS.get(item_id)
    if not item:
        return jsonify({"error": "Item not found."}), 404
    if item_id in player["inventory"]:
        return jsonify({"error": f"You already own {item['name']}."}), 400
    if player["emeralds"] < price:
        return jsonify({"error": f"Not enough emeralds! You have {player['emeralds']} but need {price}."}), 400
    player["emeralds"] -= int(price)
    player["inventory"].append(item_id)
    return jsonify({"success": True, "message": f"Traded for {item['name']}!", "emeralds": player["emeralds"]})


@app.route("/api/battle", methods=["POST"])
def battle():
    player = get_player()
    if not player:
        return jsonify({"error": "Not logged in"}), 401
    if 4 in player["inventory"]:
        return jsonify({
            "victory": True,
            "message": "The Enchanted Netherite Sword cleaves through the Ender Dragon! It disintegrates in a shower of XP orbs. Among the loot, you find a mysterious encoded book...",
            "flag": FLAGS[1],
        })
    dmg = sum(SHOP_ITEMS[i]["damage"] for i in player["inventory"] if i in SHOP_ITEMS)
    return jsonify({
        "victory": False,
        "message": f"Your gear deals {dmg} damage against 200 HP. The dragon knocks you into the void. You need something more powerful...",
    })


@app.route("/api/trial_chamber/enter", methods=["POST"])
def trial_chamber():
    if not get_player():
        return jsonify({"error": "Not logged in"}), 401
    data = request.json
    if "trial_key" not in data.get("permissions", []):
        return jsonify({"error": "Locked. You do not have the right Trial Key."}), 403
    return jsonify({"success": True, "flag": FLAGS[2],
                    "message": "The Trial Chamber door swings open with a grinding of copper gears. Inside, among the loot of defeated mobs, you find a hidden command block..."})


@app.route("/api/submit_flag", methods=["POST"])
def submit_flag():
    if "player_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    flag = request.json.get("flag", "").strip()
    pid = session["player_id"]
    for num, f in FLAGS.items():
        if flag == f:
            SUBMITTED[pid].add(num)
            return jsonify({"success": True, "quest": num, "found": len(SUBMITTED[pid]), "total": len(FLAGS)})
    return jsonify({"success": False, "message": "Invalid flag."}), 400


@app.route("/api/progress")
def progress():
    pid = session.get("player_id")
    s = SUBMITTED.get(pid, set())
    return jsonify({"found": sorted(s), "total": len(FLAGS)})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=1337)
