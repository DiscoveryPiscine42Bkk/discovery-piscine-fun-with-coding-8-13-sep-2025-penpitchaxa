// ===== Minimal cookie helpers =====
function setCookie(name, value, days) {
    const expires = (() => {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      return "expires=" + d.toUTCString();
    })();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=/`;
  }
  
  function getCookie(name) {
    const target = encodeURIComponent(name) + "=";
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      if (part.indexOf(target) === 0) {
        return decodeURIComponent(part.substring(target.length));
      }
    }
    return null;
  }
  
  // ===== App state & persistence =====
  const COOKIE_NAME = "todos";           // spec requires cookies (not localStorage)
  const COOKIE_LIFETIME_DAYS = 365;      // keep for a year
  
  let todos = []; // [{id: string, text: string}]
  
  // Load from cookie on first run
  function loadTodos() {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) { todos = []; return; }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // sanitize to objects with id/text strings
        todos = parsed.filter(
          (t) => t && typeof t.id === "string" && typeof t.text === "string"
        );
      } else {
        todos = [];
      }
    } catch {
      todos = [];
    }
  }
  
  function saveTodos() {
    setCookie(COOKIE_NAME, JSON.stringify(todos), COOKIE_LIFETIME_DAYS);
  }
  
  // ===== DOM helpers =====
  const listEl = document.getElementById("ft_list");
  const newBtn = document.getElementById("newBtn");
  
  function makeTodoEl(todo) {
    const el = document.createElement("div");
    el.className = "todo";
    el.textContent = todo.text;
    el.dataset.id = todo.id;
    el.title = "Click to remove";
    el.addEventListener("click", onTodoClick);
    return el;
  }
  
  function renderAll() {
    listEl.innerHTML = "";
    // latest created should appear at the TOP of the list
    for (const todo of todos) {
      const el = makeTodoEl(todo);
      // we prepend to keep newest on top (also safe when rerendering)
      listEl.prepend(el);
    }
  }
  
  function addTodo(text) {
    // Place new item at the top: we'll unshift in state then prepend in DOM
    const todo = { id: cryptoRandomId(), text };
    todos.unshift(todo);
    const el = makeTodoEl(todo);
    listEl.prepend(el);
    saveTodos();
  }
  
  function removeTodoById(id) {
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return;
    todos.splice(idx, 1);
    const el = listEl.querySelector(`.todo[data-id="${CSS.escape(id)}"]`);
    if (el) el.remove(); // must disappear from DOM (not hidden)
    saveTodos();
  }
  
  function onTodoClick(e) {
    const id = e.currentTarget.dataset.id;
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const ok = window.confirm(`Remove this TO DO?\n\n- ${todo.text}`);
    if (ok) removeTodoById(id);
  }
  
  // Simple unique id (no external libs)
  function cryptoRandomId() {
    if (window.crypto && crypto.getRandomValues) {
      const arr = new Uint32Array(4);
      crypto.getRandomValues(arr);
      return Array.from(arr, n => n.toString(16).padStart(8, "0")).join("");
    }
    // Fallback if crypto unavailable
    return "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  
  // ===== Wire up "New" button (uses prompt per spec) =====
  newBtn.addEventListener("click", () => {
    const input = window.prompt("Enter a new TO DO:");
    if (input === null) return; // user cancelled
    const text = input.trim();
    if (text.length === 0) return; // ignore empty
    addTodo(text);
  });
  
  // ===== Init =====
  loadTodos();
  renderAll();
  