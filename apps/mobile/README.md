# Apex mobile app (Expo)

React Native app (iOS + Android) built with Expo SDK 58 and Expo Router. It uses the same server as the website: every screen calls `GET {EXPO_PUBLIC_API_URL}/api/v1/...`. There is no separate mobile backend.

Screens: Live (home), Fixtures (with format filter), Series (+ detail), Rankings (men/women, Test/ODI/T20I), News (+ article), Match detail (Live, Scorecard, Commentary, Info) with auto-refresh every 6 s while a match is live.

This app is **not** part of the root npm workspace (Expo needs its own dependency tree). Install and run it from this folder.

## Run it locally

```bash
cd apps/mobile
npm install
cp .env.example .env            # set EXPO_PUBLIC_API_URL (see below)
npx expo start                  # scan the QR code with Expo Go, or press a / i for an emulator
```

`EXPO_PUBLIC_API_URL` must be reachable from the phone:
- Real phone on the same Wi-Fi: `http://<your-computer-LAN-IP>:3000` (run the website with `npm run dev` from the repo root; for real data use `APEX_DATA_PROVIDER=database`, see the main README)
- Android emulator: `http://10.0.2.2:3000`   iOS simulator: `http://localhost:3000`
- Production: `https://your-domain.com`

Expo Go cannot use plain `http://` URLs on iOS for non-local hosts. For a real device use a development build or point at your HTTPS domain.

## Before you build for the stores

1. Create a free account at https://expo.dev and install the CLI: `npm i -g eas-cli`, then `eas login`.
2. In `app.json` replace `com.yourcompany.apex` (iOS `bundleIdentifier` and Android `package`) with your own reverse-domain id. **It cannot be changed after the first store release.**
3. Run `eas init` (writes your project id into `app.json`).
4. In `eas.json` replace `https://YOUR-DOMAIN` with your deployed site URL (profiles `preview` and `production`).
5. The Apex logo (an "A" with a cricket-ball crossbar) is already in `assets/` (icon 1024x1024, adaptive icon, splash, favicon); the vector source is `assets/src/logo.svg`. Replace the files only if the brand changes.
6. Store accounts: Apple Developer Program (about USD 99/year) and Google Play Console (USD 25 one-time).

## Build and publish

```bash
eas build --profile preview --platform all        # installable test builds (internal distribution)
eas build --profile production --platform all     # store builds
eas submit --platform ios                         # upload to App Store Connect / TestFlight
eas submit --platform android                     # upload to Google Play (needs a service account key the first time)
```

Over-the-air JS updates (no store review) once the app is live: `eas update --branch production`.

Store listing needs a privacy policy URL: use `https://your-domain.com/privacy-policy`. The app collects no personal data and has no analytics or ads. Update the policy if you add any.

## Checks

```bash
npx tsc --noEmit                      # typecheck
npx expo-doctor                       # dependency / config health
npx expo export --platform android    # proves the JS bundle builds
```
