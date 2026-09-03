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

## APK met één commando

Start vanuit de repository-root:

```powershell
.\build-apk.cmd
```

Het script detecteert de Flutter-SDK van DartMeister, Android SDK en Java 17,
voert `pub get`, analyse en tests uit en bouwt daarna de APK. Het resultaat staat
altijd op:

```text
mobile\dist\StickStat.apk
```

Voor een snelle debugbuild of om tests bewust over te slaan:

```powershell
.\build-apk.cmd -Configuration debug
.\build-apk.cmd -SkipTests
```

De app opent standaard de complete StickStat-webapp op
`http://archlinux.tail50bfa9.ts.net:4000`. Zorg dat Tailscale op de telefoon
verbonden is voordat je de app opent. Voor een andere server bouw je met:

```powershell
.\build-apk.cmd -AppUrl http://192.168.1.20:4000
```

De huidige releasebuild gebruikt nog de lokale debug-signingconfiguratie. Hij is
geschikt om zelf te installeren en testen, maar nog niet voor publicatie in de
Play Store.

Cleartext HTTP staat voorlopig aan voor toegang tot de Tailscale-server. Schakel
dit uit zodra de backend via HTTPS bereikbaar is. De app toont dezelfde mobiele
webinterface en gebruikt daardoor dezelfde login, sessie en gegevens als de
browserapp.
