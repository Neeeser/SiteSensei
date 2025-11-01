const reactRuntimeTraceGlobs = [
  './node_modules/@babel/runtime/**',
  './node_modules/@emotion/**',
  './node_modules/@mediapipe/**',
  './node_modules/@monogrid/**',
  './node_modules/@mui/**',
  './node_modules/@radix-ui/**',
  './node_modules/@react-spring/**',
  './node_modules/@react-three/**',
  './node_modules/@use-gesture/**',
  './node_modules/camera-controls/**',
  './node_modules/class-variance-authority/**',
  './node_modules/clsx/**',
  './node_modules/detect-gpu/**',
  './node_modules/framer-motion/**',
  './node_modules/hls.js/**',
  './node_modules/its-fine/**',
  './node_modules/jszip/**',
  './node_modules/lucide-react/**',
  './node_modules/maath/**',
  './node_modules/meshline/**',
  './node_modules/react/**',
  './node_modules/react-composer/**',
  './node_modules/react-dom/**',
  './node_modules/react-infinite-scroll-component/**',
  './node_modules/react-reconciler/**',
  './node_modules/react-use-measure/**',
  './node_modules/scheduler/**',
  './node_modules/stats-gl/**',
  './node_modules/stats.js/**',
  './node_modules/suspend-react/**',
  './node_modules/tailwind-merge/**',
  './node_modules/three/**',
  './node_modules/three-mesh-bvh/**',
  './node_modules/three-stdlib/**',
  './node_modules/troika-three-text/**',
  './node_modules/troika-three-utils/**',
  './node_modules/troika-worker-utils/**',
  './node_modules/tunnel-rat/**',
  './node_modules/uuid/**',
  './node_modules/prop-types/**',
  './node_modules/potpack/**',
  './node_modules/webgl-sdf-generator/**',
  './node_modules/bidi-js/**',
  './node_modules/use-sync-external-store/**',
  './node_modules/zustand/**'
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
