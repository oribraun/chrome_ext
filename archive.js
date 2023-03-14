const archiver = require('archiver');
const fs = require('fs');
const packageJson = require('./src/manifest.json');

// Get the package version
const packageVersion = packageJson.version;

// Name of the archive file
const archiveName = `gaia-ext-${packageVersion}.zip`;

// Create a write stream to the archive file
const output = fs.createWriteStream(archiveName);

// Create a new archive object
const archive = archiver('zip', {
  zlib: { level: 9 } // Set the compression level
});

// Add the contents of the dist folder to the archive
archive.directory('dist/', false);

// Pipe the archive data to the file
archive.pipe(output);

// Wait for the archive to finish writing to the file
output.on('close', () => {
  console.log(`Archive created: ${archiveName}`);
});

// Start the archive process
archive.finalize();
