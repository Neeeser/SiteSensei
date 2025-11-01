export const ALLOWED_REACT_MODULES = [
  'react',
  'react-dom/client',
  'react-dom',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@mui/material/styles',
  '@mui/material/colors',
  '@mui/icons-material/<IconName>',
  '@site-sensei/ui',
  'framer-motion',
  'lucide-react',
  'clsx',
  'class-variance-authority',
  'tailwind-merge',
  '@radix-ui/react-slot',
  'react-infinite-scroll-component',
  '@react-three/fiber',
  '@react-three/drei',
  'three',
  'uuid',
  'jszip'
];

export function formatReactModuleAllowlist() {
  return ALLOWED_REACT_MODULES
    .map((entry) => `- ${entry}`)
    .join('\n');
}
