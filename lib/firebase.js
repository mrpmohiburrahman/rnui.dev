// lib/firebase.js
//
// The single place this site's Firebase client is initialised.
//
// sign-in-to-save ticket 06: this was Firestore only (`db`). It now also owns
// Auth — `auth`, and the two social providers — because Firebase's own rule is
// one `initializeApp` per app, and two modules each calling it is how a second
// default app gets created by accident. Nothing else in the repo calls
// `initializeApp`; everything reads `auth` or `db` from here.
//
// Identity is **base Firebase Auth, social providers only** (ADR-0013, map
// decisions 1–2):
//
//   - Google and GitHub. Never Email/Password — that provider stays off in the
//     console, and nothing here references `EmailAuthProvider`, so there is no
//     code path that could use it even if it were turned on by accident.
//   - Never Identity Platform. The toggle sits in the Firebase console and
//     nothing warns before it drops Spark to 3,000 daily active users.
//   - No `addScope` calls, ever. Ticket 01 established that Firebase requests
//     only `openid`/`email`/`profile` — non-sensitive scopes, so Google shows no
//     unverified-app warning. Requesting a sensitive scope would trigger the
//     warning ticket 01 cleared us of, so a scope added here for convenience
//     would be a consent-screen regression, not a feature.
import { getApps, initializeApp } from "firebase/app"
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase — once. `getApps()` is the guard: this module is the only
// caller, but a second default app is silent until Auth starts rejecting tokens
// against the wrong project id, which is exactly the failure ticket 02's
// audience pin would then report as "invalid session" on every request.
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

// The Reader's way in. One `Auth` for the one app above — `getAuth(app)`, never
// a bare `getAuth()`, so a second app elsewhere cannot silently become the one
// sign-in writes to.
//
// `null` when this environment has no API key (a fresh clone without the
// values in `.env.example`): `getAuth` throws `auth/invalid-api-key` on such an
// app, and throwing at import would take the whole header — and with it every
// page — down for want of a sign-in button. Instead sign-in is unavailable and
// everything else renders; `hooks/use-reader.ts` says so on the control rather
// than crashing. With the dummy CI values this branch is not taken — a
// non-empty string passes — so the build still exercises the real path.
/** @type {import("firebase/auth").Auth | null} */
let auth = null
try {
  auth = getAuth(app)
} catch {
  // No API key here; see above.
}

// The two providers, constructed once beside the app. No custom parameters and
// no added scopes (see the note at the top of this file).
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

export { auth, db, githubProvider, googleProvider }
export default app
