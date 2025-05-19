/**
 * Interface representing the structure of an OAuth token.
 *
 * @interface
 */
export interface OAuthTokenInterface {
  /**
   * The access token issued by the authorization server.
   *
   * @type {string}
   */
  access_token: string;

  /**
   * The type of the token issued. Typically just "Bearer".
   *
   * @type {string}
   */
  token_type: string;

  /**
   * The lifetime in seconds of the access token.
   * Optional as not all servers will include this information.
   *
   * @type {number}
   */
  expires_in?: number;

  /**
   * The refresh token which can be used to obtain new access tokens using the same authorization grant.
   * Optional as not all servers will include this information.
   *
   * @type {string}
   */
  refresh_token?: string;

  /**
   * The scope of the access request.
   * Optional as not all servers will include this information.
   *
   * @type {string}
   */
  scope?: string;

  /**
   * The JSON Web Token ID claim is a unique identifier for a JWT.
   * Optional as not all servers will include this information.
   *
   * @type {string}
   */
  jti?: string;
}
