# الأبطال

A modern, modular fitness tracker web app for daily logging, progress tracking, and community competition.

## Features
- Daily logging: weight, training, meal prep, cardio, protein, water, sleep, mood/energy, carbs, fats, calories
- Streaks, points, and creative stats (consistency, best streak, days active)
- Profile card with weekly average weight, BMI, protein target, and editable info
- Live leaderboard with all registered users and stats
- Squad chat with online user avatars
- Password reset functionality
- Modern, responsive UI

## Getting Started

### Prerequisites
- Node.js (for local server, optional)
- Firebase project (Realtime Database & Auth enabled)

### Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd FitTrack
   ```
2. **Firebase Setup:**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable **Authentication** (Email/Password)
   - Enable **Realtime Database** (start in test mode for development)
   - In `index.html` or a separate `firebaseConfig.js`, add your Firebase config:
     ```js
     var firebaseConfig = {
       apiKey: "...",
       authDomain: "...",
       databaseURL: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "..."
     };
     firebase.initializeApp(firebaseConfig);
     ```
3. **Run locally:**
   - Open `index.html` directly in your browser, or
   - Use a local server (recommended for Firebase Auth):
     ```bash
     npx serve .
     # or
     python -m http.server
     ```

## Usage
- Register or sign in with your email and password
- Log your daily fitness metrics
- View your progress, streaks, and stats on your profile
- See all users on the leaderboard
- Chat with your squad
- Reset your password via the login screen if needed

## Code Structure
- `index.html` — Main HTML, modularized for maintainability
- `styles.css` — All app styles, modern and responsive
- `app.js` — All app logic: authentication, logging, leaderboard, chat, etc.
- `README.md` — Project documentation

## Firebase Security
- For development, you may use open rules:
  ```json
  {
    "rules": {
      ".read": true,
      ".write": true
    }
  }
  ```
- For production, restrict rules to authenticated users only.

## Contributing
- Fork the repo and create a feature branch
- Write clear, documented code (see below)
- Submit a pull request with a description of your changes

## Code Documentation Guidelines
- Use clear, descriptive function and variable names
- Add JSDoc-style comments for all major functions and modules
- Keep UI and logic modular and separated
- See `app.js` for examples

---

**FitTrack** — Built for community, progress, and fun! 
