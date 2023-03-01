declare var require: any;

const pkg = require('../../package.json');

export const environment = {
    appVersion: pkg.version,
    appName: pkg.name,
    appStoragePrefix: `dev_${pkg.name.replace(/ /g, '_')}`,
    production: false,
    development: true,
    gaia_company_token: '52a072a8c0d89236e4ed183f948143d845e43099e2e8d2cd16fd6dabd18a',
    serverUrl: 'http://localhost:8000/',
    // google_client_id: '687079247846-3e3hpr04psma738bc7eftq465t8hqoa0.apps.googleusercontent.com'
    google_client_id: '',
    firebaseConfig: {
        apiKey: "AIzaSyBAvzWjJfPxGWpHXVPrQzPNJp7LcLaavgg",
        authDomain: "gaia-web-b4fc2.firebaseapp.com",
        projectId: "gaia-web-b4fc2",
        storageBucket: "gaia-web-b4fc2.appspot.com",
        messagingSenderId: "421914773681",
        appId: "1:421914773681:web:a251fd6517c3b49d953a90",
        measurementId: "G-WR698VGJ0Q"
    }
};
