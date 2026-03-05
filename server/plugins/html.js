import ejs from 'ejs';

import { getBasePath, getBaseUrl } from '../lib/tools/auth0-extension-hapi-tools-url-helpers';

import config from '../lib/config';
import template from '../views/index';

const assembleHtmlRoute = (link) => ({
  method: 'GET',
  path: link,
  options: {
    description: 'Render HTML',
    auth: false
  },
  handler: async (req, h) => {
    const cfg = {
      AUTH0_DOMAIN: config('AUTH0_DOMAIN'),
      AUTH0_CLIENT_ID: config('AUTH0_CLIENT_ID'),
      BASE_URL: getBaseUrl(req),
      API_BASE: getBaseUrl(req),
      BASE_PATH: getBasePath(req),
      EXTENSION_VERSION: process.env.CLIENT_VERSION,
      SEARCH_ENGINE: (
        (config('AUTH0_RTA').replace('https://', '') === 'auth0.auth0.com') ||
        config('IS_LAYER0_TEST_SPACE')
      )
        ? 'v3'
        : 'v2'
    };

    // Development.
    if (process.env.NODE_ENV === 'development') {
      return h.response(ejs.render(template, {
        config: {
          ...cfg,
          API_BASE: 'http://localhost:3000/'
        },
        assets: {
          app: '/app/bundle.js'
          // app: '/app/auth0-authz.ui.2.12.0.js'
        }
      }));
    }

    // Render from CDN.
    return h.response(ejs.render(template, {
      config: cfg,
      assets: { version: process.env.CLIENT_VERSION }
    }));
  }
});

const clientRoutes = [
  '/',
  '/api',
  '/configuration',
  '/configuration/rule',
  '/configuration/api',
  '/roles',
  '/roles/{id}',
  '/groups',
  '/groups/{id}',
  '/permissions',
  '/permissions/{id}',
  '/users',
  '/users/{id}',
  '/import-export'
];

export const register = async (server) => {
  clientRoutes.map(link => server.route(assembleHtmlRoute(link)));
};

export const htmlPlugin = {
  register,
  name: 'html'
};
