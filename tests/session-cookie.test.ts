import {afterEach,describe,expect,it} from "vitest";
import {useSecureSessionCookie} from "../lib/session-cookie";

const originalNodeEnv=process.env.NODE_ENV;
const originalSetting=process.env.SESSION_COOKIE_SECURE;

afterEach(()=>{
  if(originalNodeEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=originalNodeEnv;
  if(originalSetting===undefined)delete process.env.SESSION_COOKIE_SECURE;else process.env.SESSION_COOKIE_SECURE=originalSetting;
});

describe("sessiecookiebeveiliging",()=>{
  it("staat een expliciete HTTP-configuratie toe voor de versleutelde Tailscale-verbinding",()=>{
    process.env.NODE_ENV="production";
    process.env.SESSION_COOKIE_SECURE="false";
    expect(useSecureSessionCookie()).toBe(false);
  });

  it("blijft standaard secure in productie",()=>{
    process.env.NODE_ENV="production";
    delete process.env.SESSION_COOKIE_SECURE;
    expect(useSecureSessionCookie()).toBe(true);
  });
});
