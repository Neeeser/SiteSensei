import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const projectRoot = process.cwd();
const require = createRequire(import.meta.url);

const { ALLOWED_REACT_MODULES } = await import('./src/utils/react-allowed-modules.mjs');

const ADDITIONAL_RUNTIME_SPECIFIERS = [
  'react',
  'react-dom',
  'react-dom/client'
];

const RUNTIME_DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripPlaceholderSpecifier(specifier = '') {
  if (!specifier.includes('<')) {
    return specifier;
  }

  const placeholderIndex = specifier.indexOf('<');
  if (placeholderIndex === -1) {
    return specifier;
  }

  const lastSlashBeforePlaceholder = specifier.lastIndexOf('/', placeholderIndex);
  if (lastSlashBeforePlaceholder === -1) {
    return specifier.slice(0, placeholderIndex);
  }

  return specifier.slice(0, lastSlashBeforePlaceholder);
}

function getBasePackageName(specifier = '') {
  const cleaned = stripPlaceholderSpecifier(specifier).trim();
  if (!cleaned || cleaned.startsWith('.') || cleaned.startsWith('/')) {
    return null;
  }

  if (cleaned.startsWith('@site-sensei/')) {
    return null;
  }

  if (cleaned.startsWith('@')) {
    const [scope, name] = cleaned.split('/').slice(0, 2);
    if (!scope || !name) {
      return null;
    }
    return `${scope}/${name}`;
  }

  return cleaned.split('/')[0];
}

function getPackageRoot(packageName) {
  try {
    const manifestPath = require.resolve(`${packageName}/package.json`, { paths: [projectRoot] });
    return path.dirname(manifestPath);
  } catch (error) {
    return null;
  }
}

function readPackageManifest(packageName) {
  const packageRoot = getPackageRoot(packageName);
  if (!packageRoot) {
    return null;
  }

  try {
    const manifestPath = path.join(packageRoot, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return { manifest, packageRoot };
  } catch (error) {
    return null;
  }
}

function collectRuntimePackages(basePackages) {
  const collected = new Set();
  const visited = new Set();

  function walkPackage(packageName) {
    if (!packageName || visited.has(packageName)) {
      return;
    }
    visited.add(packageName);

    const result = readPackageManifest(packageName);
    if (!result) {
      return;
    }

    collected.add(packageName);

    RUNTIME_DEPENDENCY_FIELDS.forEach((field) => {
      const dependencies = result.manifest?.[field];
      if (!dependencies) {
        return;
      }
      Object.keys(dependencies).forEach((depName) => {
        if (!depName || depName.startsWith('@types/')) {
          return;
        }

        walkPackage(depName);
      });
    });
  }

  basePackages.forEach((packageName) => walkPackage(packageName));
  return collected;
}

function buildRuntimeTraceGlobs(specifiers) {
  const basePackages = new Set();
  specifiers.forEach((specifier) => {
    const packageName = getBasePackageName(specifier);
    if (packageName) {
      basePackages.add(packageName);
    }
  });

  const allPackages = collectRuntimePackages(basePackages);
  const globs = new Set();

  allPackages.forEach((packageName) => {
    const packageRoot = getPackageRoot(packageName);
    if (!packageRoot) {
      return;
    }

    const relativeRoot = path.relative(projectRoot, packageRoot).split(path.sep).join('/');
    if (relativeRoot.startsWith('..')) {
      return;
    }

    globs.add(`./${relativeRoot}/**`);
  });

  return Array.from(globs).sort();
}

const reactRuntimeTraceGlobs = buildRuntimeTraceGlobs([
  ...ALLOWED_REACT_MODULES,
  ...ADDITIONAL_RUNTIME_SPECIFIERS
]);

if (!reactRuntimeTraceGlobs.includes('./node_modules/**')) {
  reactRuntimeTraceGlobs.push('./node_modules/**');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '*.auth0.com',
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/compile-react': reactRuntimeTraceGlobs,
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const external = 'esbuild';

      if (Array.isArray(config.externals)) {
        config.externals.push(external);
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = async (context, request, callback) => {
          if (request === external) {
            return callback(null, `commonjs ${external}`);
          }
          if (originalExternals) {
            return originalExternals(context, request, callback);
          }
          return callback();
        };
      } else {
        config.externals = [external];
      }
    }

    return config;
  },
};

export default nextConfig;
