// NUMBER? — The Guessing Game. Plain JavaScript, no libraries.
// Note: secrets live in this page's memory, so anyone who opens dev tools could peek.
// That is fine for a friendly pass-and-play game.

// ---------- Data ----------
const QUESTIONS = [
  { name: "a cup of chai", price: 10 },
  { name: "a samosa", price: 20 },
  { name: "an ice cream", price: 50 },
  { name: "10 chocolates", price: 100 },
  { name: "a burger", price: 120 },
  { name: "a movie ticket", price: 150 },
  { name: "a pizza", price: 300 },
  { name: "a trip to the hills", price: 600 },
  { name: "a new phone", price: 900 },
  { name: "a gaming PC", price: 1000 },
];

// ---------- State ----------
let state;
function freshState() {
  return { mode: "pass", me: 0, names: ["", ""], secrets: [0, 0], current: 0, pending: null, picked: null, history: [], questions: QUESTIONS.slice(), setupIndex: 0, ready: [false, false], guessing: null, helloDone: false };
}
state = freshState();
let peer = null, conn = null; // online mode only
const online = () => state.mode === "online";

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const rupee = (n) => "₹" + n;
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== id));
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}
function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}
function parseNumber(text) {
  const v = String(text).trim();
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= 1000 ? n : null;
}
function showPass(who, text, buttonText, next) {
  $("passTitle").textContent = "Pass the device to " + state.names[who];
  $("passText").textContent = text;
  $("passBtn").textContent = buttonText;
  $("passBtn").onclick = next;
  show("pass");
}

// ---------- Welcome and setup ----------
document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));
function setMode(m) {
  state.mode = m === "friend" || m === "online" ? "online" : "pass";
  document.querySelectorAll(".mode").forEach((x) => x.classList.toggle("on", (x.dataset.mode === "friend") === online()));
  $("online").hidden = !online();
  $("toSecrets").hidden = online();
  $("name2Wrap").hidden = online();
  $("name1Label").textContent = online() ? "Your name" : "Player 1 name";
}
document.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
$("toSecrets").addEventListener("click", () => {
  const a = $("name1").value.trim() || "Player 1";
  let b = $("name2").value.trim() || "Player 2";
  if (a.toLowerCase() === b.toLowerCase()) b += " (2)";
  state.names = [a, b];
  state.setupIndex = 0;
  openSecret();
});

// ---------- Secret numbers ----------
function openSecret() {
  const who = state.setupIndex;
  $("secretTitle").textContent = state.names[who] + ", pick your secret number";
  $("secretInput").value = "";
  $("secretErr").textContent = "";
  show("secret");
  $("secretInput").focus();
}
$("lockSecret").addEventListener("click", () => {
  const n = parseNumber($("secretInput").value);
  if (n === null) {
    $("secretErr").textContent = "Enter a whole number from 1 to 1000.";
    shake($("secretInput"));
    return;
  }
  const who = state.setupIndex;
  state.secrets[who] = n;
  $("secretInput").value = "";
  if (online()) {
    state.ready[state.me] = true;
    send({ t: "ready" });
    checkStart();
    return;
  }
  if (who === 0) {
    state.setupIndex = 1;
    showPass(1, "Player 1's number is locked away. Look away, " + state.names[0] + "!", "I'm " + state.names[1], openSecret);
  } else {
    state.current = 0;
    showPass(0, "Both numbers are locked. Time to guess!", "I'm " + state.names[0], startTurn);
  }
});

// ---------- Turn: choose question ----------
function startTurn() {
  if (online() && state.current !== state.me) {
    showWait(state.names[state.current] + "'s turn", "Waiting for " + state.names[state.current] + " to ask a question or guess.");
    return;
  }
  const me = state.current, other = 1 - me;
  state.picked = null;
  $("turnTitle").textContent = state.names[me] + "'s turn";
  $("turnSub").textContent = "Ask about " + state.names[other] + "'s number.";
  renderQuestions();
  renderHistory();
  $("picked").textContent = "Nothing picked yet.";
  $("askBtn").disabled = true;
  show("game");
}
function renderQuestions() {
  const box = $("questions");
  box.innerHTML = "";
  state.questions.forEach((q, i) => {
    const b = document.createElement("button");
    b.className = "qbtn";
    b.textContent = "Can I buy " + q.name + "?";
    const p = document.createElement("b");
    p.textContent = rupee(q.price);
    b.appendChild(p);
    b.addEventListener("click", () => {
      state.picked = q;
      box.querySelectorAll(".qbtn").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      $("picked").textContent = "Selected: Can I buy " + q.name + " for " + rupee(q.price) + "?";
      $("askBtn").disabled = false;
    });
    box.appendChild(b);
  });
}
$("cAdd").addEventListener("click", () => {
  const name = $("cName").value.trim();
  const price = Number($("cPrice").value);
  if (!name || !Number.isInteger(price) || price < 1 || price > 1000) {
    $("cErr").textContent = "Give the item a name and a whole price from 1 to 1000.";
    return;
  }
  $("cErr").textContent = "";
  state.questions.push({ name, price });
  $("cName").value = "";
  $("cPrice").value = "";
  renderQuestions();
  toast("Question added to the list!");
});
function renderHistory() {
  ["history", "history2"].forEach((id) => {
    const ol = $(id);
    ol.innerHTML = "";
    if (!state.history.length) {
      ol.innerHTML = '<li class="empty">No questions yet. Be brave.</li>';
      return;
    }
    state.history.slice().reverse().forEach((h) => {
      const li = document.createElement("li");
      li.textContent = h.text + " ";
      const tag = document.createElement("span");
      tag.className = "tag " + h.kind;
      tag.textContent = h.result;
      li.appendChild(tag);
      ol.appendChild(li);
    });
  });
}
function showWait(title, text) {
  $("waitTitle").textContent = title;
  $("waitText").textContent = text;
  renderHistory();
  show("wait");
}

// ---------- Ask and answer ----------
$("askBtn").addEventListener("click", () => {
  if (!state.picked) return;
  state.pending = state.picked;
  if (online()) {
    send({ t: "ask", name: state.pending.name, price: state.pending.price });
    showWait("Question sent!", "Waiting for " + state.names[1 - state.me] + " to answer.");
    return;
  }
  const asker = state.current, answerer = 1 - asker;
  showPass(answerer, state.names[asker] + " has a question for you.", "I'm " + state.names[answerer], openAnswer);
});
function openAnswer() {
  const q = state.pending, asker = state.current, answerer = 1 - asker;
  $("ansTitle").textContent = state.names[answerer] + ", your answer?";
  $("ansQ").textContent = "";
  $("ansQ").append(state.names[asker] + " asks: Can I buy " + q.name + " with your number?");
  const s = document.createElement("small");
  s.textContent = "Price: " + rupee(q.price);
  $("ansQ").appendChild(s);
  $("ansErr").textContent = "";
  $("peekOut").textContent = "";
  show("answer");
}
const peek = $("peek");
const peekOn = (e) => { e.preventDefault(); $("peekOut").textContent = rupee(state.secrets[1 - state.current]); };
const peekOff = () => ($("peekOut").textContent = "");
["mousedown", "touchstart"].forEach((ev) => peek.addEventListener(ev, peekOn));
["mouseup", "mouseleave", "touchend", "touchcancel", "blur"].forEach((ev) => peek.addEventListener(ev, peekOff));
peek.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") peekOn(e); });
peek.addEventListener("keyup", peekOff);

document.querySelectorAll("[data-ans]").forEach((b) =>
  b.addEventListener("click", () => {
    const q = state.pending, asker = state.current, answerer = 1 - asker;
    const truth = state.secrets[answerer] >= q.price;
    const said = b.dataset.ans === "yes";
    if (said !== truth) {
      $("ansErr").textContent = "That's not true for your number. No lying!";
      shake($("ansQ"));
      return;
    }
    state.history.push({
      kind: truth ? "yes" : "no",
      result: truth ? "YES" : "NO",
      text: state.names[asker] + ": Can I buy " + q.name + " (" + rupee(q.price) + ")?",
    });
    if (online()) send({ t: "ans", yes: truth });
    state.pending = null;
    state.current = answerer; // device is already with the answerer, who now asks
    startTurn();
  })
);

// ---------- Guessing ----------
$("toGuess").addEventListener("click", () => {
  $("guessTitle").textContent = state.names[state.current] + ", what's the number?";
  $("guessInput").value = "";
  $("guessErr").textContent = "";
  show("guess");
  $("guessInput").focus();
});
$("guessBack").addEventListener("click", () => show("game"));
$("guessBtn").addEventListener("click", () => {
  const n = parseNumber($("guessInput").value);
  if (n === null) {
    $("guessErr").textContent = "Guess a whole number from 1 to 1000.";
    shake($("guessInput"));
    return;
  }
  const me = state.current, other = 1 - me;
  if (online()) {
    state.guessing = n;
    send({ t: "guess", n });
    showWait("Guess sent!", "Checking " + n + " against " + state.names[other] + "'s number…");
    return;
  }
  if (n === state.secrets[other]) return win(me);
  state.history.push({ kind: "miss", result: "WRONG", text: state.names[me] + " guessed " + n + "." });
  const jokes = ["Not even close to correct!", "Wrong! Your confidence was lovely though.", "Nope! Try again next turn.", "Swing and a miss!"];
  toast(jokes[Math.floor(Math.random() * jokes.length)]);
  state.current = other;
  showPass(other, state.names[me] + " guessed wrong. Your turn!", "I'm " + state.names[other], startTurn);
});

// ---------- Winner ----------
function win(who) {
  $("winName").textContent = state.names[who];
  const lose = 1 - who;
  $("winTitle").textContent = online() && who !== state.me ? "NOT THIS TIME" : "YOU WON!";
  $("winReveal").textContent = online()
    ? state.names[lose] + "'s number was " + state.secrets[lose] + "."
    : state.names[0] + "'s number: " + state.secrets[0] + ". " + state.names[1] + "'s number: " + state.secrets[1] + ".";
  const box = $("confetti");
  box.innerHTML = "";
  const colors = ["#ffe500", "#2d5bff", "#ff3b30", "#ffffff"];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("i");
    c.style.left = Math.random() * 100 + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 2.5 + "s";
    c.style.animationDelay = Math.random() * 1.2 + "s";
    box.appendChild(c);
  }
  show("winner");
}
$("again").addEventListener("click", () => {
  if (online()) {
    send({ t: "again" });
    return resetRound();
  }
  state = freshState();
  setMode("pass");
  $("name1").value = "";
  $("name2").value = "";
  show("welcome");
});

// Enter key submits number inputs
$("secretInput").addEventListener("keydown", (e) => e.key === "Enter" && $("lockSecret").click());
$("guessInput").addEventListener("keydown", (e) => e.key === "Enter" && $("guessBtn").click());

// ---------- Online rooms (PeerJS: free public matchmaking, then a direct browser link) ----------
// Only room events travel between devices. Your secret number never leaves your device
// until a correct guess, when the loser's number is revealed to the winner.
const PREFIX = "numq-guess-";
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const myName = () => $("name1").value.trim() || "Player " + (state.me + 1);
function send(m) { if (conn && conn.open) conn.send(m); }
function closeNet() {
  const c = conn; conn = null;
  if (c) { try { c.close(); } catch (e) {} }
  if (peer) { try { peer.destroy(); } catch (e) {} peer = null; }
}
function leave(msg) {
  closeNet();
  state = freshState();
  setMode("pass");
  toast(msg);
  show("welcome");
}
function netError(e) {
  if (conn && conn.open) return;
  closeNet();
  $("onErr").textContent = e && e.type === "peer-unavailable"
    ? "No room with that code. Check it and try again."
    : "Could not connect (" + ((e && e.type) || "offline") + "). Check your internet or use pass and play.";
  show("setup");
}
function createRoom(tries) {
  if (typeof Peer === "undefined") return ($("onErr").textContent = "The connection library failed to load. Check your internet.");
  closeNet();
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const code = Array.from(bytes, (b) => ALPHA[b % ALPHA.length]).join("");
  $("onErr").textContent = "Opening room…";
  state.mode = "online"; state.me = 0;
  peer = new Peer(PREFIX + code);
  peer.on("open", () => { $("onErr").textContent = ""; $("roomCode").textContent = code; show("lobby"); });
  peer.on("connection", (c) => { if (conn) return c.close(); attach(c); });
  peer.on("error", (e) => (e.type === "unavailable-id" && (tries || 0) < 3 ? createRoom((tries || 0) + 1) : netError(e)));
}
function joinRoom() {
  if (typeof Peer === "undefined") return ($("onErr").textContent = "The connection library failed to load. Check your internet.");
  const code = $("joinCode").value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 5) return ($("onErr").textContent = "Room codes have 5 characters.");
  closeNet();
  $("onErr").textContent = "Connecting…";
  state.mode = "online"; state.me = 1;
  peer = new Peer();
  peer.on("open", () => attach(peer.connect(PREFIX + code, { reliable: true })));
  peer.on("error", netError);
}
function attach(c) {
  conn = c;
  const hello = () => c.send({ t: "hello", name: myName() });
  if (c.open) hello(); else c.on("open", hello);
  c.on("data", onData);
  c.on("close", () => { if (conn === c) leave("Your friend left the game."); });
}
function checkStart() {
  if (state.ready[0] && state.ready[1]) { state.current = 0; startTurn(); }
  else showWait("Number locked!", "Waiting for " + state.names[1 - state.me] + " to pick a number.");
}
function resetRound() {
  Object.assign(state, { secrets: [0, 0], current: 0, pending: null, picked: null, history: [], questions: QUESTIONS.slice(), ready: [false, false], guessing: null, setupIndex: state.me });
  openSecret();
}
const isNum = (n) => Number.isInteger(n) && n >= 1 && n <= 1000;
function onData(m) {
  if (!m || typeof m.t !== "string" || !online()) return;
  const me = state.me, opp = 1 - me;
  if (m.t === "hello" && !state.helloDone && typeof m.name === "string") {
    state.helloDone = true;
    state.names[me] = myName().slice(0, 14);
    state.names[opp] = m.name.trim().slice(0, 14) || "Friend";
    if (state.names[0].toLowerCase() === state.names[1].toLowerCase()) state.names[1] += " (2)";
    state.setupIndex = me;
    openSecret();
  } else if (m.t === "ready") {
    state.ready[opp] = true;
    if (state.ready[me]) checkStart();
  } else if (m.t === "ask" && state.current === opp && !state.pending && typeof m.name === "string" && isNum(m.price)) {
    state.pending = { name: m.name.slice(0, 24), price: m.price };
    openAnswer();
  } else if (m.t === "ans" && state.pending && state.current === me && typeof m.yes === "boolean") {
    const q = state.pending;
    state.history.push({ kind: m.yes ? "yes" : "no", result: m.yes ? "YES" : "NO", text: state.names[me] + ": Can I buy " + q.name + " (" + rupee(q.price) + ")?" });
    state.pending = null;
    state.current = opp;
    startTurn();
  } else if (m.t === "guess" && state.current === opp && isNum(m.n)) {
    const ok = m.n === state.secrets[me];
    send({ t: "gres", n: m.n, ok, secret: ok ? state.secrets[me] : undefined });
    if (ok) return win(opp);
    state.history.push({ kind: "miss", result: "WRONG", text: state.names[opp] + " guessed " + m.n + "." });
    toast(state.names[opp] + " guessed " + m.n + " and missed!");
    state.current = me;
    startTurn();
  } else if (m.t === "gres" && state.guessing !== null && m.n === state.guessing && typeof m.ok === "boolean") {
    state.guessing = null;
    if (m.ok && isNum(m.secret)) { state.secrets[opp] = m.secret; return win(me); }
    state.history.push({ kind: "miss", result: "WRONG", text: state.names[me] + " guessed " + m.n + "." });
    toast("Wrong! Nice try, " + state.names[me] + ".");
    state.current = opp;
    startTurn();
  } else if (m.t === "again") {
    toast("Rematch! Pick a new number.");
    resetRound();
  }
}
$("createBtn").addEventListener("click", () => createRoom(0));
$("joinBtn").addEventListener("click", joinRoom);
$("joinCode").addEventListener("keydown", (e) => e.key === "Enter" && joinRoom());
$("lobbyCancel").addEventListener("click", () => { closeNet(); state = freshState(); setMode("friend"); show("setup"); });
$("leaveBtn").addEventListener("click", () => leave("You left the room."));
$("copyBtn").addEventListener("click", () => {
  const text = "Join my NUMBER? game: " + location.origin + location.pathname + " (Play with a friend, room code " + $("roomCode").textContent + ")";
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Invite copied!"), () => toast("Copy failed. Share the code by hand."));
});
