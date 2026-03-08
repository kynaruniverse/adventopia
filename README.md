# 🗺️ Adventopia

**Adventopia** is a story-driven educational adventure game designed for all ages, with a strong focus on SEN (Special Educational Needs) accessibility. Inspired by ClueFinders and Jump Ahead, players explore magical worlds, talk to characters, and solve puzzles to progress.

---

## 🎮 How to Play

- **Click or tap** characters and objects in each scene to interact
- **Solve puzzles** to earn golden key pieces
- **Collect all 3 key pieces** in World 1 to unlock the Town Gate and complete the world
- Use the 💡 **Hint button** anytime — before or during a puzzle — to get help from Lumie
- Use the 🔊 **Audio button** to toggle background music on or off

---

## 🌍 World 1 — The Learning Village

| Scene | Character | Puzzle | Reward |
|---|---|---|---|
| Village Square | Benny the Baker | The Bread Sort | ⭐ Super Sorter badge + Key Piece 1 |
| The Library | Mara the Librarian | The Story Pages | ⭐ Story Keeper badge + Key Piece 2 |
| The Town Gate | Gus the Gatekeeper | The Gate Pattern | ⭐ Village Hero badge + World Complete |

---

## ♿ Accessibility & SEN Design

- No timers or time pressure on any puzzle
- Wrong answers never produce negative sounds or harsh feedback
- Hints (Lumie) appear **only on player request** or after 2 incorrect attempts
- All audio is fully toggleable
- Short, warm dialogue — never overwhelming amounts of text
- Shell the tortoise mirrors emotions visually (bounces on success, droops on failure)
- Colour is never the only differentiator — symbols always accompany colour

---

## 🛠️ Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** — no frameworks
- **Canvas API** for scene rendering
- **JSON** for all scene and puzzle data (easy to extend)
- **PWA** — installable on all devices (mobile, tablet, desktop)
- **Service Worker** — offline play supported
- **localStorage** — progress saved automatically

---

## 📁 Project Structure

```
adventopia/
├── index.html              # Main entry point
├── style.css               # All styles
├── main.js                 # Core game engine
├── puzzles.js              # Puzzle rendering and logic
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── assets/
│   ├── backgrounds/        # Scene background images
│   ├── characters/         # Character sprites
│   ├── objects/            # Interactive object images
│   ├── audio/              # Music and sound effects
│   └── icons/              # PWA app icons (192 + 512)
├── data/
│   ├── world1.json
│   ├── scene1_village_square.json
│   ├── scene2_library.json
│   ├── scene3_town_gate.json
│   ├── puzzle1_bread_sort.json
│   ├── puzzle2_story_pages.json
│   └── puzzle3_gate_pattern.json
├── scenes/                 # Reserved for future scene modules
└── puzzles/                # Reserved for future puzzle modules
```

---

## 🚀 Running Locally

Because the game loads JSON via `fetch()`, it needs to be served over HTTP (not opened directly as a file).

**Option 1 — VS Code Live Server**
Install the Live Server extension, right-click `index.html`, and select *Open with Live Server*.

**Option 2 — Python**
```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

**Option 3 — GitHub Pages**
Push the repo to GitHub and enable Pages in the repository settings.

---

## 📋 Development Roadmap

See `Adventopia_Full_MVP_Roadmap___Checklist.docx` for the full 21-day build plan.

**Current phase:** Phase 6 — Art & Animation

---

## 📝 Credits

Game design, story, and development by the Adventopia team.

Built with ♥ for curious minds everywhere.
