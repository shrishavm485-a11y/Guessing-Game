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
  return { names: ["", ""], secrets: [0, 0], current: 0, pending: null, picked: null, history: [], questions: QUESTIONS.slice(), setupIndex: 0 };
}
state = freshState();

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
document.querySelectorAll(".mode").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((m) => m.classList.toggle("on", m === b));
    $("friendNote").hidden = b.dataset.mode !== "friend";
  })
);
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
  const ol = $("history");
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
}

// ---------- Ask and answer ----------
$("askBtn").addEventListener("click", () => {
  if (!state.picked) return;
  state.pending = state.picked;
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
  $("winReveal").textContent = state.names[0] + "'s number: " + state.secrets[0] + ". " + state.names[1] + "'s number: " + state.secrets[1] + ".";
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
  state = freshState();
  $("name1").value = "";
  $("name2").value = "";
  show("welcome");
});

// Enter key submits number inputs
$("secretInput").addEventListener("keydown", (e) => e.key === "Enter" && $("lockSecret").click());
$("guessInput").addEventListener("keydown", (e) => e.key === "Enter" && $("guessBtn").click());
