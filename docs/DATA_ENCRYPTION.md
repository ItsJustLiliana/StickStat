# Encryptie van StickStat-data

## Status en bereik

`deploy/backup.sh` versleutelt database-exports en uploads met GnuPG (AES-256,
publieke ontvangersleutel). Er worden geen leesbare tijdelijke exports gemaakt.
Zonder een publieke sleutel faalt de back-up; er is geen plaintext-terugval.

`deploy/encrypted-storage.sh` is een **handmatige servermigratie**, geen onderdeel
van automatische deployment. Alleen het toevoegen van deze code versleutelt de
bestaande database dus niet. Het script maakt een nieuw LUKS2-containerbestand
van 10 GiB, met daarin PostgreSQL (inclusief WAL), uploads en `.env`.
De HTTP/Tailscale-configuratie verandert niet.

Dit beschermt bestanden wanneer de versleutelde opslag vergrendeld is.
Een draaiende app en een beheerder met servertoegang kunnen nog steeds gegevens
lezen. Het is geen end-to-end-encryptie. Bestaande snapshots, historische
plaintext-back-ups, logbestanden en oude schijfblokken worden niet automatisch
door deze migratie versleuteld. De huidige server gebruikt zram voor swap.

## Herstelsleutel voor back-ups

De server heeft alleen de publieke sleutel nodig:
`/home/marijn/.config/stickstat/backup-public.asc`.
`STICKSTAT_BACKUP_PUBLIC_KEY` kan een ander absoluut pad aanwijzen.
Bewaar de private herstelsleutel buiten de server, buiten Git en buiten de
back-upmap, met beperkte toegangsrechten en een afzonderlijke veilige kopie.
De LUKS-wachtwoordzin en de back-upherstelsleutel zijn verschillend.

Voor een nieuwe installatie kan een herstelbeheerder op een vertrouwde computer
een GnuPG encryptiesleutel maken en uitsluitend de publieke sleutel exporteren:

```bash
gpg --quick-generate-key 'StickStat backup recovery' rsa3072 encrypt 0
gpg --armor --export 'StickStat backup recovery' > backup-public.asc
```

De interactieve opdracht vraagt om bescherming van de sleutel. Zet nooit een
wachtwoordzin in Git, shellhistorie, een script of deze handleiding.

## Back-up controleren en herstellen

Installeer GnuPG en PostgreSQL-clienttools. Importeer de private sleutel op de
vertrouwde herstelcomputer in een afgeschermde GnuPG-keyring. Controleer:

```bash
sha256sum -c SHA256SUMS
set -o pipefail
gpg --decrypt database.dump.gpg | pg_restore --list
gpg --decrypt uploads.tar.gz.gpg | tar -tzf -
```

Test vervolgens een **echte restore naar een lege testdatabase**, nooit direct
naar productie. Een lijsttest alleen bewijst geen volledige herstelbaarheid:

```bash
gpg --decrypt database.dump.gpg | pg_restore --exit-on-error --no-owner --no-privileges --dbname=stickstat_restore_test
```

Controleer aantallen per tabel, accountnamen, relaties en de aanwezigheid van
foto's. Pak foto's alleen uit in een lege, afgeschermde herstelmap. Sluit na
afloop de tijdelijke database en verwijder testdata volgens het lokale beleid.
Controlesommen herkennen beschadiging, maar zijn geen digitale handtekening.
GnuPG controleert ook de integriteit van de versleutelde inhoud.

## Actieve opslag migreren (sudo nodig)

Serverprofiel: Arch Linux, app-gebruiker `marijn` (UID 1000), PostgreSQL 18,
project `/projects/StickStat`, bestaande cluster `/var/lib/postgres/data`.
Het script weigert afwijkende paden, externe tablespaces, symlinks in de cluster,
andere applicatiedatabases en een te grote dataset. Het formatteert uitsluitend
een **nieuw regulier bestand** `/projects/StickStat-storage.luks`, geen schijf.
Flummi, zijn bestanden en services worden niet aangepast.

1. Bewaar en test de afzonderlijke back-upherstelsleutel. Maak en restore-test
   een actuele versleutelde back-up voordat je begint.
2. Voer `sudo bash deploy/encrypted-storage.sh check` uit. Beoordeel de gevonden
   databases en controleer dat geen andere app PostgreSQL gebruikt (ook niet
   via schemas buiten `public` in de `postgres` database).
3. Plan een korte onderbreking en stop eventuele andere StickStat-schrijvers,
   losse sync-processen en deployments. Voer daarna uit:

   ```bash
   sudo bash /projects/StickStat/deploy/encrypted-storage.sh migrate --verified-backup
   ```

4. Voer bij `cryptsetup` een sterke, unieke wachtwoordzin in. Bewaar die in je
   wachtwoordmanager. Het script schrijft die nergens naar schijf. Verlies van
   deze wachtwoordzin betekent dat het volume niet meer kan worden geopend.
5. Controleer `SHOW data_directory`, aanmeldingen, aanwezigheid, opstellingen,
   foto's, synchronisatie en een nieuwe back-up. Test ontgrendeling en een
   herstart voordat je de oorspronkelijke kopieën opruimt.

Na een herstart is de opslag bewust vergrendeld. De app kan dan niet starten.
Er wordt geen automatische ontgrendelsleutel op dezelfde onversleutelde schijf
opgeslagen. Ontgrendel met:

```bash
sudo bash /projects/StickStat/deploy/encrypted-storage.sh unlock
```

Houd de capaciteit van `/srv/stickstat-secure` in de gaten; de 10 GiB-container
groeit niet vanzelf. Maak afzonderlijk een LUKS-headerback-up en bewaar die
veilig, buiten deze server, bij het herstelplan.

## Terugval en resterende plaintext

Bij een mislukte migratie blijven de oorspronkelijke bestanden aanwezig. Het
script stopt bij fouten en kan services gestopt laten. Draai het niet blind
opnieuw en verwijder geen van beide kopieën voordat de oorzaak bekend is.

Na activering kunnen de twee databases uiteenlopen. De oorspronkelijke cluster
mag dus niet als terugval worden gestart nadat nieuwe productiegegevens naar
de versleutelde cluster zijn geschreven; herstel dan eerst de nieuwste data.

De oude kopieën zijn:

- `/var/lib/postgres/data` (de nieuwe cluster staat onder de encrypted mount);
- `/projects/StickStat-migration-originals/uploads` (alleen root, buiten de webroot);
- `/projects/StickStat-migration-originals/environment` (alleen root);
- bestaande back-upmappen met `database.dump` en `uploads.tar.gz`.

Deze kopieën blijven leesbaar totdat een beheerder na de herstel- en reboottest
ze versleuteld archiveert en de plaintext-bestanden opruimt. Doe dit alleen voor
deze gecontroleerde paden. Houd rekening met VM-snapshots, externe back-ups en
filesystem/SSD-restdata: verwijderen of `shred` garandeert daar geen fysieke
uitwissing. Voor die bescherming moet ook de onderliggende opslag worden
versleuteld of volgens het platformbeleid worden gesaneerd.

## Bronnen

- [PostgreSQL encryption options](https://www.postgresql.org/docs/current/encryption-options.html)
- [GnuPG encryption commands](https://gnupg.org/documentation/manuals/gnupg/Operational-GPG-Commands.html)
