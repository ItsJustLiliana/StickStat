import {describe,expect,it} from "vitest";
import {imageExtension,validImageBytes} from "../lib/image-upload";
import {readFileSync} from "node:fs";

const editor=readFileSync("components/profile-photo-editor.tsx","utf8");
const photoRoute=readFileSync("app/uploads/users/[filename]/route.ts","utf8");

describe("profielfoto-upload",()=>{
  it("controleert het echte bestandstype en niet alleen de browserheader",()=>{
    expect(validImageBytes("image/jpeg",new Uint8Array([0xff,0xd8,0xff,0x00]))).toBe(true);
    expect(validImageBytes("image/jpeg",new TextEncoder().encode("geen afbeelding"))).toBe(false);
  });

  it("ondersteunt alleen de toegestane afbeeldingsformaten",()=>{
    expect(imageExtension("image/png")).toBe("png");
    expect(imageExtension("image/svg+xml")).toBeNull();
  });

  it("serveert nieuwe uploads via een dynamische route",()=>{
    expect(photoRoute).toContain('path.join(process.cwd(),"public","uploads","users",filename)');
    expect(photoRoute).toContain('"cache-control":"public, max-age=31536000, immutable"');
  });

  it("laat de uitsnede slepen en houdt alleen de zoomslider",()=>{
    expect(editor).toContain("onPointerMove={moveDrag}");
    expect(editor).toContain("Sleep de foto");
    expect(editor).not.toContain("Horizontaal");
    expect(editor).not.toContain("Verticaal");
  });
});
