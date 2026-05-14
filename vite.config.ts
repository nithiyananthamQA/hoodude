import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Force every transitive import of `three` to share ONE module instance.
    // Without this, three-stdlib (used by drei's DecalGeometry) and
    // @react-three/fiber ended up with separate THREE namespaces, so
    // `instanceof THREE.Mesh` checks inside Decal's setup silently failed
    // for some decals — producing the symptom "Back decal renders, Front/
    // Sleeves don't". The `THREE.WARNING: Multiple instances of Three.js
    // being imported` console warning is the smoking gun.
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three', 'three-stdlib'],
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
