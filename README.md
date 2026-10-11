# NUMBER? — The Guessing Game

Each player picks a secret number from 1 to 1000. Take turns asking "Can I buy X with your number?" (every item has a visible price in ₹). YES means the secret number is at least the price. Guess the other player's number to win. A wrong guess ends your turn.

## Modes
- **Pass and play:** one device, handed back and forth. Always works.
- **Play with a friend:** one player creates a room and shares the 5-character code, the other joins with it. Each secret number stays on its owner's device until a correct guess. Rooms use the free public PeerJS matchmaking service (loaded from a CDN), so both devices need internet. It can fail on strict networks; use pass and play then.

## Run locally
Open `index.html` in a browser. Pass and play works offline; rooms need internet.

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
Create the empty `number-game` repository on github.com first.

## Enable GitHub Pages
Settings, then Pages, then Source "Deploy from a branch", branch `main`, folder `/ (root)`, Save. Your link: `https://YOUR-USERNAME.github.io/number-game/`

## Play online with a friend
Both open your link, choose "Play with a friend". One taps "Create a room" and sends the code; the other enters it and taps "Join room". Anyone with browser developer tools could inspect their own device, so play fair!
