# Android Emulator Setup for V3RA Testing

## Quick Start Guide

This guide helps you run and test V3RA on your Android emulator.

## Prerequisites

- Android SDK installed at `~/Android/Sdk/`
- Android emulator (AVD) created
- Node.js and npm installed

## Step-by-Step Instructions

### 1. Start the Development Server

```bash
npm run dev
```

Note the port number (usually 3000, 3001, or 3002 if others are in use).

### 2. Start the Android Emulator

```bash
~/Android/Sdk/emulator/emulator -avd Medium_Phone_API_36.0 &
```

Replace `Medium_Phone_API_36.0` with your AVD name. To list available AVDs:
```bash
~/Android/Sdk/emulator/emulator -list-avds
```

### 3. Set Up Port Forwarding

Once the emulator is running, set up adb reverse to access localhost:

```bash
# Check if emulator is detected
~/Android/Sdk/platform-tools/adb devices

# Set up port forwarding (replace 3002 with your actual port)
~/Android/Sdk/platform-tools/adb reverse tcp:3002 tcp:3002
```

### 4. Access V3RA in the Emulator

1. Open Chrome in the emulator
2. Navigate to: `http://localhost:3002` (use your actual port number)

Alternative URLs if localhost doesn't work:
- `http://10.0.2.2:3002` (Android emulator's special address for host machine)
- `http://YOUR_MACHINE_IP:3002` (find with `ip addr show`)

## Testing Checklist

### PWA Features
- [ ] Site loads with mobile-optimized layout
- [ ] Install prompt appears or use Chrome menu → "Add to Home screen"
- [ ] App installs with V3RA icon on home screen
- [ ] App launches in standalone mode (no browser UI)

### Core Functionality
- [ ] Token display shows in navbar
- [ ] Ask mode loads with 3 preset options
- [ ] Refine mode shows swipeable cards
- [ ] Navigation between Ask/Refine works
- [ ] Dark/light theme toggle works

### Wallet Integration
- [ ] Wallet connect button appears in navbar
- [ ] Clicking opens wallet selection modal
- [ ] Can connect to Phantom/Solflare (if installed)

### Mobile Optimizations
- [ ] Touch targets are large enough (44px minimum)
- [ ] No horizontal scrolling
- [ ] Text is readable without zooming
- [ ] Landscape orientation works properly

## Debugging

### Remote Debugging with Chrome DevTools

1. On your Linux machine, open Chrome
2. Navigate to: `chrome://inspect/#devices`
3. Your emulator should appear - click "inspect"
4. Use DevTools to:
   - View console logs
   - Inspect elements
   - Monitor network requests
   - Run Lighthouse audit

### Common Issues & Solutions

**Emulator not detected by adb:**
```bash
# Restart adb server
~/Android/Sdk/platform-tools/adb kill-server
~/Android/Sdk/platform-tools/adb start-server
```

**Port forwarding not working:**
```bash
# Remove existing reverse
~/Android/Sdk/platform-tools/adb reverse --remove-all
# Re-add port forwarding
~/Android/Sdk/platform-tools/adb reverse tcp:3002 tcp:3002
```

**Dev server crashes:**
```bash
# Kill any processes on the port
lsof -ti:3002 | xargs kill -9
# Restart dev server
npm run dev
```

## Useful Commands

```bash
# Take a screenshot
~/Android/Sdk/platform-tools/adb shell screencap -p /sdcard/screenshot.png
~/Android/Sdk/platform-tools/adb pull /sdcard/screenshot.png

# View device logs
~/Android/Sdk/platform-tools/adb logcat | grep -i chrome

# Install APK (if you build one)
~/Android/Sdk/platform-tools/adb install path/to/app.apk

# Clear app data
~/Android/Sdk/platform-tools/adb shell pm clear com.android.chrome
```

## Performance Testing

1. Open Chrome DevTools via remote debugging
2. Go to Performance tab
3. Record while interacting with the app
4. Check for:
   - Frame rate (should be 60fps)
   - Touch response time
   - Memory usage
   - Network performance

## Next Steps

After successful testing:
1. Deploy to staging environment for real device testing
2. Test on actual Solana Saga/Seeker devices
3. Submit to Solana dApp Store
4. Consider native app with React Native for enhanced features