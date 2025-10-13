const fs = require('fs');
const path = require('path');

const excludingPackages = ['hexabot'];

// File paths for package.json and package.extra.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageExtraJsonPath = path.join(__dirname, 'package.extra.json');

// Helper function to read and parse JSON files
function readJsonFile(filePath) {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  throw new Error(`File not found: ${filePath}`);
}

// Helper function to write JSON data to a file
function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

try {
  // Load package.json and package.extra.json
  const packageJson = readJsonFile(packageJsonPath);
  const packageExtraJson = readJsonFile(packageExtraJsonPath);

  // Get dependencies from package.extra.json (excluding hexabot and typescript)
  const extraDeps = packageExtraJson.dependencies || {};
  const filteredDeps = Object.keys(extraDeps).reduce((acc, dep) => {
    if (!excludingPackages.includes(dep)) {
      acc[dep] = extraDeps[dep];
    }
    return acc;
  }, {});

  // Merge the filtered dependencies into the package.json dependencies
  packageJson.dependencies = {
    ...filteredDeps,
    ...packageJson.dependencies,
  };

  // Write the updated package.json back to the file
  writeJsonFile(packageJsonPath, packageJson);

  console.log(
    'Dependencies from package.extra.json have been added to package.json.',
  );
} catch (error) {
  console.error(`Error: ${error.message}`);
}
