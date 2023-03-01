declare var require: any;

const pkg = require('../../package.json');

export const environment = {
    appVersion: pkg.version,
    appName: pkg.name,
    appStoragePrefix: pkg.name.replace(/ /g, '_'),
    production: false,
    staging: true,
    development: false,
    extension: true,
    gaia_company_token: '',
    serverUrl: 'http://localhost:8000/',
    google_client_id: '687079247846-8e8lhl2k88pfm6nbd36e5higdndq0vck.apps.googleusercontent.com',
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
