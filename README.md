# 💧 RainWatch Montgomery

A community-driven flood monitoring and predictive water management platform for Montgomery County. RainWatch empowers residents to report water issues in real time, while an intelligent Micro-Terrain Runoff Module analyzes elevation and slope data to recommend optimal locations for water barrels and rain gardens.

---
## Live Demo
- [RainWatch](https://rainwatch-fzww.onrender.com/)

## 🌟 Features

- **Live Interactive Map** — View all community-submitted flood and runoff reports plotted on a real-time map centered on Montgomery County
- **Report Water Issues** — Submit flooding, runoff, or drainage complaints with location, type, and description
- **Real-Time Updates** — WebSocket-powered live sync: new reports and recommendations appear instantly across all connected users
- **Micro-Terrain Runoff Analysis** — Automatically analyzes terrain slope and elevation from citizen reports to recommend water barrel or rain garden placements
- **Community Dashboard** — Live stats showing total reports and infrastructure recommendations
- **Weather Alerts** — Live storm warnings powered by the Open-Meteo weather API
- **Post-Storm Reminders** — Prompts users to submit reports after storm events are detected
- **User Authentication** — Secure sign up, login, email verification, and password reset
- **User History** — View your personal report history and login history in your profile
- **Multilingual Support** — Interface available in English, Chinese, Spanish, Vietnamese, Korean, and African languages
- **Responsive Design** — Fully functional on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Map | Leaflet, React-Leaflet |
| Animations | Motion (Framer Motion) |
| Charts | Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Real-Time | WebSockets (ws) |
| Auth | JWT (jsonwebtoken), bcryptjs, HTTP-only cookies |
| Weather API | Open-Meteo (free, no API key required) |
| Runtime | tsx (TypeScript execution) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [Git](https://git-scm.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/rainwatch.git
cd rainwatch

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

### Running Locally

```bash
npm run dev
```

Then open your browser and go to:
```
http://localhost:3000
```

---

## 📁 Project Structure

```
rainwatch/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # Interactive Leaflet map
│   │   ├── Dashboard.tsx        # Community stats dashboard
│   │   ├── ReportForm.tsx       # Water issue report modal
│   │   ├── WeatherAlert.tsx     # Storm warning banner
│   │   ├── AuthModal.tsx        # Login / Sign up modal
│   │   └── UserSettings.tsx     # User profile, history & settings
│   ├── context/
│   │   └── AuthContext.tsx      # Global authentication state
│   ├── services/
│   │   └── api.ts               # API calls, WebSocket, state hooks
│   ├── constants/
│   │   └── translations.ts      # Multilingual string constants
│   └── App.tsx                  # Root app component
├── server.ts                    # Express + WebSocket backend server
├── .env.example                 # Environment variable template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```
---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Open-Meteo](https://open-meteo.com/) for the free weather API
- [OpenStreetMap](https://www.openstreetmap.org/) & [Leaflet](https://leafletjs.com/) for map tiles and rendering
- Montgomery County community providing the open source
