# MineShop CTF Challenge
This is a webapp that has a virtual shop called MineShop.
It is implemented poorly and undertested.
Your job is to abuse this poor implementation to get two flags stored on the server that the website is hosted on.
You can find information on how to start a "quest" to get each of those flags in the quests tab.

1. Flag 1: kill the ender dragon
2. Flag 2: enter the trial chamber

You can find the live site here: [https://mineshop.mahaloz.re:5001](https://mineshop.mahaloz.re:5001). ALL of the source code of the site can be found in this repo (flags changed on server).

Your login is: `steve` / `craft123`.

## Hint 
Use your browser developer tools.

## Running Locally
```bash
pip install -r requirements.txt
python3 app.py
```

Open **http://localhost:1337** in your browser.

You can also use Docker:
```
 docker build -t mineshop . && docker run -p 1337:1337 mineshop
```


