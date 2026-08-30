import {describe,expect,it} from "vitest";
import {shouldUseSecureSessionCookie} from "../lib/session-cookie";

describe("sessiecookiebeveiliging",()=>{
  it("staat een expliciete HTTP-configuratie toe voor de versleutelde Tailscale-verbinding",()=>{
    expect(shouldUseSecureSessionCookie({NODE_ENV:"production",SESSION_COOKIE_SECURE:"false"})).toBe(false);
  });

  it("blijft standaard secure in productie",()=>{
    expect(shouldUseSecureSessionCookie({NODE_ENV:"production"})).toBe(true);
  });
});
