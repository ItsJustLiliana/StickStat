import {describe,expect,it} from "vitest";
import {hasAnyTeamRole,teamManagementRoles,teamRoleLabels,teamWriteRoles} from "../lib/team-roles";

describe("meervoudige teamrollen",()=>{
  it("ondersteunt speler en trainer tegelijk",()=>{
    expect(hasAnyTeamRole(["player","trainer"],teamWriteRoles)).toBe(true);
    expect(teamRoleLabels.trainer).toBe("Trainer");
  });

  it("laat trainers niet automatisch leden beheren",()=>{
    expect(hasAnyTeamRole(["trainer"],teamManagementRoles)).toBe(false);
    expect(hasAnyTeamRole(["coach","player"],teamManagementRoles)).toBe(true);
  });
});
