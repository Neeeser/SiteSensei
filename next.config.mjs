const reactRuntimeTraceGlobs = [
  './node_modules/react/**',
  './node_modules/react-dom/**',
  './node_modules/@react-three/fiber/**',
  './node_modules/@react-three/drei/**',
  './node_modules/three/**'
];

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
