import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "KASIR";
      username: string;
    } & DefaultSession["user"];
  }
  interface User {
    role: "ADMIN" | "KASIR";
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "KASIR";
    username: string;
    id: string;
  }
}
