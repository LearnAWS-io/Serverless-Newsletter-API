import { jwtVerify, SignJWT } from "jose";
import { envSchema } from "./schema";

const { JWT_SECRET } = envSchema.parse(process.env);

const textEncoder = new TextEncoder();
export const jwtKey = textEncoder.encode(JWT_SECRET);

export const createJwt = async (email: string) => {
  const jwt = await new SignJWT({
    email,
  })
    .setExpirationTime("24h")
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("LearnAWS.io")
    .sign(jwtKey);

  return jwt;
};

type Payload = {
  email: string;
  iss: string;
  exp: number;
};

export const verifyJwt = async (token: string) => {
  const { payload } = await jwtVerify(token, jwtKey);
  return payload as Payload;
};

/* verifyJwt(
  "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImhpQGNyZWF0aXZlc2hpLmNvbSIsImV4cCI6MTY3NjU2NzI1NywiaXNzIjoiTGVhcm5BV1MuaW8ifQ.tJGpsNL8pHJCcOIe0orxywH3gkUyUJm4eVRUagEnupU"
).then((res) => console.log(res.email)); */
