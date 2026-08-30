import {describe,expect,it} from "vitest";
import {registerSchema} from "../lib/validation";

describe("registratievalidatie",()=>{
  it("accepteert een sterk overeenkomend wachtwoord",()=>expect(registerSchema.safeParse({name:"Marijn",email:"TEST@EXAMPLE.COM",password:"SterkWachtwoord123",confirmPassword:"SterkWachtwoord123"}).success).toBe(true));
  it("weigert zwakke of verschillende wachtwoorden",()=>{expect(registerSchema.safeParse({name:"Marijn",email:"test@example.com",password:"zwak",confirmPassword:"zwak"}).success).toBe(false);expect(registerSchema.safeParse({name:"Marijn",email:"test@example.com",password:"SterkWachtwoord123",confirmPassword:"AnderWachtwoord123"}).success).toBe(false)});
});
