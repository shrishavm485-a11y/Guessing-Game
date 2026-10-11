# NUMBER? — The Guessing Game

Two players each pick a secret number from 1 to 1000. Take turns asking "Can I buy X with your number?" (every item has a visible price in ₹). YES means the secret number is at least the price. Guess the other player's number to win. A wrong guess ends your turn.

## Run locally
Open `index.html` in a browser. No install or server needed.

## Upload to GitHub
```bash
cd number-game
git init
git add index.html style.css script.js README.md
git commit -m "Add NUMBER? guessing game"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/number-game.git
git push -u origin main
```
Create the empty `number-game` repository on github.com first (no README or license).

## Enable GitHub Pages
1. Open the repository, then Settings, then Pages.
2. Under "Build and deployment", set Source to "Deploy from a branch".
3. Pick branch `main` and folder `/ (root)`, then Save.
4. After about a minute your link appears: `https://YOUR-USERNAME.github.io/number-game/`

## Playing with a friend
GitHub Pages serves static files only, so two separate devices cannot sync in real time. Play pass-and-play: sit together and hand the device over when the game says so, or share one screen on a video call. Secrets are never put in links, and they are only held in the page's memory, so someone opening the browser's developer tools could still find them. Play fair!
