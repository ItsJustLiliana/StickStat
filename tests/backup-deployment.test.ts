import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const backup=readFileSync("deploy/backup.sh","utf8"),timer=readFileSync("deploy/stickstat-backup.timer","utf8"),deploy=readFileSync("deploy/auto-update.sh","utf8");

describe("dagelijkse back-up",()=>{
  it("bewaart database, uploads en controlesommen",()=>{
    expect(backup).toContain("/usr/bin/pg_dump --format=custom");
    expect(backup).toContain("uploads.tar.gz");
    expect(backup).toContain("SHA256SUMS");
  });
  it("verwijdert alleen verlopen gedateerde back-upmappen",()=>{
    expect(backup).toContain("STICKSTAT_BACKUP_RETENTION_DAYS");
    expect(backup).toContain("-type d -name '20*'");
  });
  it("installeert en activeert een persistente dagelijkse timer",()=>{
    expect(timer).toContain("OnCalendar=*-*-* 03:15:00");
    expect(timer).toContain("Persistent=true");
    expect(deploy).toContain("enable --now stickstat-backup.timer");
  });
});
