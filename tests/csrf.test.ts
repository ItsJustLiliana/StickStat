import {describe,expect,it} from "vitest";
import {isSameOriginHost} from "../lib/csrf";

describe("CSRF hostvergelijking",()=>{
  it("accepteert hetzelfde Tailscale host en poort",()=>expect(isSameOriginHost("http://100.111.62.126:4000","100.111.62.126:4000")).toBe(true));
  it("weigert externe en ongeldige origins",()=>{expect(isSameOriginHost("https://example.com","100.111.62.126:4000")).toBe(false);expect(isSameOriginHost("ongeldig","100.111.62.126:4000")).toBe(false)});
});
