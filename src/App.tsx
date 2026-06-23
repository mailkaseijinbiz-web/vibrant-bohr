import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Booth } from './components/Booth'

function App() {
  const [showDimensions, setShowDimensions] = useState(false);
  const [posterImages, setPosterImages] = useState<Record<string, string>>({
    'a2--1.5': '/posters/poster_takoyaki_1782184842429.png',
    'a2--0.5': '/posters/poster_negidako_1782184913396.png',
    'a2-0.5': '/posters/poster_mentai_1782184922839.png',
    'a2-1.5': '/posters/poster_takosen_1782184868897.png',
    'a1-left': '/posters/poster_drinks_1782184880492.png',
    'a1-middle': '/posters/poster_kakigori_1782184890220.png',
  });
  const [activePosterId, setActivePosterId] = useState<string | null>(null);

  const handlePosterClick = (id: string) => {
    setActivePosterId(id);
    // Removed programmatic click to support mobile Safari which blocks it.
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePosterId) {
      const url = URL.createObjectURL(file);
      setPosterImages(prev => ({ ...prev, [activePosterId]: url }));
    }
    setActivePosterId(null);
  };

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
            <Booth 
              showDimensions={showDimensions} 
              posterImages={posterImages}
              onPosterClick={handlePosterClick}
            />
            
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

      {/* Upload Modal (Required for Mobile Safari support) */}
      {activePosterId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm flex flex-col items-center gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">画像を選択</h3>
              <p className="text-sm text-gray-500 mt-1">ポスターに表示する画像をアップロードします</p>
            </div>
            
            <label className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
              <span>写真を選ぶ</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </label>

            <button 
              onClick={() => setActivePosterId(null)}
              className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
