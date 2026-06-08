/**
 * Minimal type declaration for `tls-sig-api-v2`, Tencent's official Node
 * UserSig signing library, which ships without TypeScript types.
 *
 * Verified against the package source (TLSSigAPIv2.js):
 *   new Api(sdkAppId, key).genSig(userId, expire, userBuf?) -> string
 *   genUserSig(userId, expire) is a convenience for genSig(userId, expire, null)
 */
declare module 'tls-sig-api-v2' {
  export class Api {
    constructor(sdkAppId: number, key: string);
    genSig(userId: string, expire: number, userBuf?: Buffer | null): string;
    genUserSig(userId: string, expire: number): string;
  }
}
