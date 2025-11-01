export const ALLOWED_REACT_MODULES = [
  'react',
  'react-dom/client',
  'react-dom',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  '@mui/icons-material/<IconName>',
  '@site-sensei/ui',
  '@react-three/fiber',
  '@react-three/drei',
  'three'
];

export function formatReactModuleAllowlist() {
  return ALLOWED_REACT_MODULES
    .map((entry) => `- ${entry}`)
    .join('\n');
}
