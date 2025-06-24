# Testing V3RA on Android Emulator

## Quick Start

The development server is running at:
- Local: http://localhost:3002
- Network: http://192.168.1.227:3002

## Steps to Test on Android Emulator

### 1. Open your Android Emulator
If not already running, start it with:
```bash
emulator -avd <your_avd_name>
```

### 2. Access V3RA in the Emulator Browser

**Option A: Using localhost (recommended)**
1. Open Chrome in the emulator
2. Navigate to: `http://10.0.2.2:3002`
   (10.0.2.2 is the special alias for localhost on Android emulator)

**Option B: Using your network IP**
1. Open Chrome in the emulator
2. Navigate to: `http://192.168.1.227:3002`

### 3. Test PWA Installation
1. Once the site loads, Chrome should show an "Install" prompt
2. Or tap the 3-dot menu → "Add to Home screen"
3. The app will install with the V3RA icon

### 4. Test Mobile Features
- **Wallet Connection**: Tap the wallet button in navbar
- **Touch Gestures**: Try the swipe gestures in Refine mode
- **Responsive Layout**: Rotate device to test orientation
- **Offline Mode**: Turn on airplane mode and test cached pages

### 5. Test Solana Wallet
- Install Phantom or Solflare wallet app from Play Store
- Connect wallet through the mobile adapter
- Test token transactions

## Debugging Tips

### View Console Logs
1. On your host machine, open Chrome
2. Navigate to: `chrome://inspect/#devices`
3. Find your emulator and click "inspect"

### Common Issues

**Site not loading?**
- Check firewall settings
- Try using adb reverse:
  ```bash
  adb reverse tcp:3002 tcp:3002
  ```
  Then use http://localhost:3002 in emulator

**PWA not installing?**
- Ensure you're using HTTPS or localhost
- Check manifest.json is loading correctly

**Wallet not connecting?**
- Install a Solana wallet app first
- Ensure wallet app is set as default

## Performance Testing
- Open Chrome DevTools (chrome://inspect)
- Run Lighthouse audit for PWA score
- Check Performance tab for FPS and responsiveness
- Monitor Network tab for caching behavior

## Next Steps
After testing, you can:
1. Deploy to Vercel for real device testing
2. Build APK using Capacitor for native features
3. Submit to Solana dApp Store


Key Things to Test Right Now:

  1. PWA Installation
    - Look for an install banner at the top of Chrome
    - Or tap the 3-dot menu → "Add to Home screen"
    - Check if the app icon appears on your home screen
  2. Mobile UI
    - Does everything fit on the screen properly?
    - Are buttons easy to tap?
    - Does the navbar look good?
  3. Core Features
    - Tap between Ask and Refine in the navigation
    - In Ask mode, try selecting different presets
    - In Refine mode, test the swipe gestures on cards
  4. Wallet Connection
    - Tap the "Connect" button in the navbar
    - See if the wallet modal appears
  5. Responsive Design
    - Rotate the emulator (Ctrl+F11 or Ctrl+F12)
    - Check if the layout adapts properly

  Let me know what's working well and what needs improvement! Would you like me to add any
   specific mobile features like haptic feedback or better touch animations?