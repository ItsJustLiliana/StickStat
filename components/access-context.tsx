"use client";
import {createContext,useContext} from "react";

const PlatformAdminContext=createContext(false);
export const PlatformAdminProvider=PlatformAdminContext.Provider;
export const usePlatformAdmin=()=>useContext(PlatformAdminContext);
