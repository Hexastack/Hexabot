// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

// Define the paths
const rootPackageJsonPath = path.join(__dirname, 'package.json');
const extensionsDir = path.join(__dirname, 'src', 'extensions');

// Helper function to merge dependencies
function mergeDependencies(rootDeps, pluginDeps) {
  return {
    ...rootDeps,
    ...Object.entries(pluginDeps).reduce((acc, [key, version]) => {
      if (!rootDeps[key]) {
        acc[key] = version;
      }
      return acc;
    }, {}),
  };
}

// Read the root package.json
const rootPackageJson = JSON.parse(
  fs.readFileSync(rootPackageJsonPath, 'utf-8'),
);

// Initialize dependencies if not already present
if (!rootPackageJson.dependencies) {
  rootPackageJson.dependencies = {};
}

// Iterate over extension directories
[...fs.readdirSync(extensionsDir)].forEach((folder) => {
  const packageJsonPath = path.join(extensionsDir, folder, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const pluginPackageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8'),
    );

    // Merge extension dependencies into root dependencies
    if (pluginPackageJson.dependencies) {
      rootPackageJson.dependencies = mergeDependencies(
        rootPackageJson.dependencies,
        pluginPackageJson.dependencies,
      );
    }

    // Merge extension devDependencies into root devDependencies
    if (pluginPackageJson.devDependencies) {
      rootPackageJson.devDependencies = mergeDependencies(
        rootPackageJson.devDependencies,
        pluginPackageJson.devDependencies,
      );
    }
  }
});

// Write the updated root package.json
fs.writeFileSync(
  rootPackageJsonPath,
  JSON.stringify(rootPackageJson, null, 2),
  'utf-8',
);

// eslint-disable-next-line no-console
console.log(
  'Dependencies from extensions have been merged into the root package.json',
);
