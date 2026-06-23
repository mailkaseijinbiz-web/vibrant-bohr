import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Booth } from './components/Booth'

function App() {
  const [showDimensions, setShowDimensions] = useState(false);

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center">
      <header className="w-full p-4 sm:p-6 bg-white shadow-sm flex flex-col sm:flex-row items-center justify-between z-10 relative gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight text-center sm:text-left">3D Booth Preview</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base">
            <input 
              type="checkbox" 
              checked={showDimensions} 
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            寸法表示
          </label>
          <p className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 sm:px-4 py-2 rounded-full border border-gray-200 text-center">
            Drag to rotate • Scroll/Pinch to zoom
          </p>
        </div>
      </header>

      <main className="flex-1 w-full relative">
        <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          
          {/* Scene */}
          <group position={[0, -1, 1]}>
            <Booth showDimensions={showDimensions} />
            
            {/* Ground / Shadows */}
            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2} far={4} />
          </group>

          {/* Controls & Environment */}
          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 + 0.1} // Prevent going too far below ground
          />
          <Environment preset="city" />
        </Canvas>
      </main>
    </div>
  )
}

export default App
