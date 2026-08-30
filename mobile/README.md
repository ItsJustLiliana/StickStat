# StickStat Android

Dit is de Flutter/Android-buildbasis voor StickStat. Hij hergebruikt de lokale tooling die al bij DartMeister staat; de circa 1 GB Flutter-SDK is bewust niet in deze repository gedupliceerd.

## Tooling op deze pc

- Flutter: `C:\Users\marij\Projects\DartMeister\.flutter`
- Android SDK: `C:\Users\marij\AppData\Local\Android\sdk`
- Application ID: `nl.stickstat.app`

`android/local.properties` bevat de lokale paden en wordt niet gecommit.

## Commands in PowerShell

```powershell
cd C:\Users\marij\Projects\StickStat\mobile
& 'C:\Users\marij\Projects\DartMeister\.flutter\bin\flutter.bat' pub get
& 'C:\Users\marij\Projects\DartMeister\.flutter\bin\flutter.bat' test
& 'C:\Users\marij\Projects\DartMeister\.flutter\bin\flutter.bat' build apk --debug
```

De APK komt in `mobile\build\app\outputs\flutter-apk\app-debug.apk`.

Cleartext HTTP staat voorlopig aan voor toegang tot `http://TAILSCALE_IP:4000`. Schakel dit uit zodra de backend via HTTPS bereikbaar is. De mobiele UI is nu een gecontroleerde buildbasis; API-authenticatie en echte schermen worden in een volgende implementatiefase gekoppeld.
