import {Provider} from '@loopback/core';
import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata, Authorizer} from '@loopback/authorization';
import {BackplaneUserProfile} from './users';

export class AuthorizationProvider implements Provider<Authorizer> {
  /**
   * @returns an authorizer function
   *
   */
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    const user = context.principals[0] as BackplaneUserProfile;
    const scopes = metadata.scopes ?? [];
    const userScopes = user.scope.split(' ');
    for (const scope of scopes) {
      if (!userScopes.includes(scope))
        return AuthorizationDecision.DENY;
    }
    return AuthorizationDecision.ALLOW;
  }
}
