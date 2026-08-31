import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const script=readFileSync(new URL("../deploy/auto-update.sh",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/deploy.yml",import.meta.url),"utf8");

describe("automatische deployment",()=>{
  it("serialiseert deploys en herstart pas na alle controles",()=>{
    expect(script).toContain("flock -n 9");
    expect(script).toContain("DBUS_SESSION_BUS_ADDRESS");
    expect(script).toContain("merge --ff-only origin/main");
    expect(script.indexOf("run build")).toBeLessThan(script.indexOf("run prisma:deploy"));
    expect(script.indexOf("run prisma:deploy")).toBeLessThan(script.indexOf("restart stickstat.service"));
    expect(script).toContain("systemctl --user daemon-reload");
    expect(script).toContain("Dependencies unchanged; keeping existing node_modules.");
    expect(script).toContain("No production application files changed; skipping tests and build.");
    expect(script).toContain("deployed-commit");
    expect(script.match(/restore --worktree --source=HEAD -- generated\/prisma/g)).toHaveLength(2);
    expect(script.indexOf("restart stickstat.service")).toBeLessThan(script.lastIndexOf("deployed_commit_file"));
    expect(script).not.toContain('run lint');
    expect(script).not.toContain('run typecheck');
  });
  it("reageert op main-pushes via Tailscale SSH",()=>{
    expect(workflow).toMatch(/push:[\s\S]*branches:[\s\S]*- main/);
    expect(workflow).toContain("tailscale/github-action@v4");
    expect(workflow).toContain("TS_OAUTH_CLIENT_ID");
    expect(workflow).toContain("TS_OAUTH_SECRET");
    expect(workflow).toContain("git -C /projects/StickStat show origin/main:deploy/auto-update.sh");
    expect(workflow).toContain("cancel-in-progress: false");
  });
});
