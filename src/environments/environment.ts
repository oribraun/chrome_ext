declare var require: any;

const pkg = require('../../package.json');

export const environment = {
    appVersion: pkg.version,
    appName: pkg.name,
    appStoragePrefix: `dev_${pkg.name.replace(/ /g, '_')}`,
    production: false,
    development: true,
    gaia_company_token: '52a072a8c0d89236e4ed183f948143d845e43099e2e8d2cd16fd6dabd18a'
};
