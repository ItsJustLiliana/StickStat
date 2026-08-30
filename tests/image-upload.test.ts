import {describe,expect,it} from "vitest";
import {imageExtension,validImageBytes} from "../lib/image-upload";

describe("profielfoto-upload",()=>{
  it("controleert het echte bestandstype en niet alleen de browserheader",()=>{
    expect(validImageBytes("image/jpeg",new Uint8Array([0xff,0xd8,0xff,0x00]))).toBe(true);
    expect(validImageBytes("image/jpeg",new TextEncoder().encode("geen afbeelding"))).toBe(false);
  });

  it("ondersteunt alleen de toegestane afbeeldingsformaten",()=>{
    expect(imageExtension("image/png")).toBe("png");
    expect(imageExtension("image/svg+xml")).toBeNull();
  });
});
