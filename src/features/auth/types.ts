import type { NextRequest } from "next/server";
import type { AuthContext } from "./context";

export type AuthedRequest = NextRequest & { authCtx: AuthContext };
