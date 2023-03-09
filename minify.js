const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

const inputDir = './dist/extension/';  // directory containing JavaScript files to minify
const outputDir = './dist/extension/';  // directory to write minified files to

// Recursively get a list of all JavaScript files in the input directory
function getJsFiles(dir, fileList) {
  const files = fs.readdirSync(dir);

  fileList = fileList || [];

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      fileList = getJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Minify all JavaScript files in the input directory and its subdirectories
const jsFiles = getJsFiles(inputDir);

jsFiles.forEach(file => {
  const relativePath = path.relative(inputDir, file);
  const outputFile = path.join(outputDir, relativePath);
  const fileContents = fs.readFileSync(file, 'utf8');
  const minified = UglifyJS.minify(fileContents, {
    mangle: { toplevel: true }
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, minified.code);
});

console.log('Minification complete.');
