declare var require: any;

const pkg = require('../../package.json');

export const environment = {
    appVersion: pkg.version,
    appName: pkg.name,
    appStoragePrefix: pkg.name.replace(/ /g, '_'),
    production: true,
    development: false,
    gaia_company_token: '',
    serverUrl: 'http://13.230.184.34/'
};
