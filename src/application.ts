import {BootMixin} from '@loopback/boot';
import {addExtension, ApplicationConfig, CoreTags, createBindingFromClass} from '@loopback/core';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {
  AuthenticationBindings,
  AuthenticationComponent,
} from '@loopback/authentication';
import {jwtAuthStrategy, JWTSpecEnhancer} from './auth/jwt.strategy';
import {JWT_DEFAULT_OPTIONS, JWTAuthenticationStrategyBindings} from './auth/jwt.options';
import {localAuthStrategy} from './auth/local.strategy';
import express from 'express';
import cookieParser from 'cookie-parser';
import {OpenIdConnectProvider, OpenIdSpecEnhancer} from './auth/open-id-connect.strategy';
import {
  AuthorizationBindings,
  AuthorizationComponent,
  AuthorizationDecision,
  AuthorizationOptions, AuthorizationTags,
} from '@loopback/authorization';
import {AuthorizationProvider} from './auth/authorizator.provider';

export {ApplicationConfig};

export class BackplaneApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    this.add(createBindingFromClass(JWTSpecEnhancer));
    this.add(createBindingFromClass(OpenIdSpecEnhancer));

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.expressMiddleware(express.json);
    this.expressMiddleware(express.urlencoded);
    this.expressMiddleware(cookieParser);

    // AUTH
    this.component(AuthenticationComponent);
    this.bind(JWTAuthenticationStrategyBindings.DEFAULT_OPTIONS).to(JWT_DEFAULT_OPTIONS);
    this
      .bind('authentication.strategies.basicAuthStrategy')
      .to(localAuthStrategy)
      .tag({
        [CoreTags.EXTENSION_FOR]:
        AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      });
    this
      .bind('authentication.strategies.jwtAuthStrategy')
      .to(jwtAuthStrategy)
      .tag({
        [CoreTags.EXTENSION_FOR]:
        AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      });

    // Keycloak WellKnown configuration url
    const wellKnownUrl = 'https://localhost:8080/auth/realms/i3-Market/.well-known/openid-configuration';
    this.bind('authentication.oidc.well-known-url').to(wellKnownUrl);
    addExtension(
      this,
      AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      OpenIdConnectProvider,
      {
        namespace:
        AuthenticationBindings.AUTHENTICATION_STRATEGY_EXTENSION_POINT_NAME,
      },
    );

    const authorizationOptions: AuthorizationOptions = {
      precedence: AuthorizationDecision.DENY,
      defaultDecision: AuthorizationDecision.DENY,
    };

    this.configure(AuthorizationBindings.COMPONENT).to(authorizationOptions);
    this.component(AuthorizationComponent);

    this.bind('authorizationProviders.authorization-provider')
      .toProvider(AuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);


    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
