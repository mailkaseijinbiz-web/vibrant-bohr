import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Booth } from './components/Booth'

const generatedTemplates = [
  '/posters/poster_takoyaki_1782184842429.png',
  '/posters/poster_negidako_1782184913396.png',
  '/posters/poster_mentai_1782184922839.png',
  '/posters/poster_takosen_1782184868897.png',
  '/posters/poster_drinks_1782184880492.png',
  '/posters/poster_kakigori_1782184890220.png',
];

type LayoutPreset = {
  id: string;
  name: string;
  images: Record<string, string>;
};

const resizeAndBase64 = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxDim) {
        height *= maxDim / width;
        width = maxDim;
      } else if (height > maxDim) {
        width *= maxDim / height;
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
};

function App() {
  const [showDimensions, setShowDimensions] = useState(false);
  const [posterImages, setPosterImages] = useState<Record<string, string>>({});
  const [activePosterId, setActivePosterId] = useState<string | null>(null);
  
  const [templateGallery, setTemplateGallery] = useState<string[]>([]);
  const [isTemplateSettingsOpen, setIsTemplateSettingsOpen] = useState(false);
  const [layoutPresets, setLayoutPresets] = useState<LayoutPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [presetsRes, galleryRes] = await Promise.all([
          fetch('/api/presets').catch(() => ({ ok: false, json: () => [] })),
          fetch('/api/gallery').catch(() => ({ ok: false, json: () => [] }))
        ]);

        if (presetsRes.ok) {
          const data = await presetsRes.json();
          if (data && data.length > 0) setLayoutPresets(data);
        } else {
          throw new Error("Presets API failed");
        }

        if (galleryRes.ok) {
          const data = await galleryRes.json();
          if (data && data.length > 0) setTemplateGallery(data);
        } else {
          throw new Error("Gallery API failed");
        }
      } catch (err) {
        console.log("Fallback to localStorage");
        const savedPresets = localStorage.getItem('vibrant-bohr-presets');
        if (savedPresets) setLayoutPresets(JSON.parse(savedPresets));
        else setLayoutPresets([{
          id: 'default',
          name: 'たこ焼き屋台セット',
          images: {
            'a2--1.5': '/posters/poster_takoyaki_1782184842429.png',
            'a2--0.5': '/posters/poster_negidako_1782184913396.png',
            'a2-0.5': '/posters/poster_mentai_1782184922839.png',
            'a2-1.5': '/posters/poster_takosen_1782184868897.png',
            'a1-left': '/posters/poster_drinks_1782184880492.png',
            'a1-middle': '/posters/poster_kakigori_1782184890220.png',
          }
        }]);

        const savedGallery = localStorage.getItem('vibrant-bohr-gallery');
        if (savedGallery) setTemplateGallery(JSON.parse(savedGallery));
        else setTemplateGallery(generatedTemplates);
      }
    };
    loadData();
  }, []);

  const savePresets = async (newPresets: LayoutPreset[]) => {
    setLayoutPresets(newPresets);
    try {
      localStorage.setItem('vibrant-bohr-presets', JSON.stringify(newPresets));
      await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPresets)
      });
    } catch (e) {
      console.warn("Failed to save presets to server", e);
    }
  };

  const saveGallery = async (newGallery: string[]) => {
    setTemplateGallery(newGallery);
    try {
      localStorage.setItem('vibrant-bohr-gallery', JSON.stringify(newGallery));
      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGallery)
      });
    } catch (e) {
      console.warn("Failed to save gallery to server", e);
    }
  };

  const handlePosterClick = (id: string) => {
    setActivePosterId(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePosterId) {
      resizeAndBase64(file, (base64) => {
        setPosterImages(prev => ({ ...prev, [activePosterId]: base64 }));
        saveGallery(templateGallery.includes(base64) ? templateGallery : [...templateGallery, base64]);
      });
    }
    setActivePosterId(null);
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center">
      <header className="w-full p-4 sm:p-6 bg-white shadow-sm flex flex-col sm:flex-row items-center justify-between z-10 relative gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight text-center sm:text-left">3D Booth Preview</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedPresetId(id);
                if (id) {
                  const preset = layoutPresets.find(p => p.id === id);
                  if (preset) setPosterImages(preset.images);
                } else {
                  setPosterImages({});
                }
              }}
              className="bg-transparent text-sm text-gray-700 outline-none cursor-pointer max-w-[120px] sm:max-w-none"
            >
              <option value="">初期状態</option>
              {layoutPresets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            {selectedPresetId && selectedPresetId !== 'default' && (
              <>
                <button 
                  onClick={() => {
                    if (confirm("現在の表示状態（ポスター・ロゴの組み合わせ）でこのテンプレートを上書き保存しますか？")) {
                      const updatedPresets = layoutPresets.map(p => 
                        p.id === selectedPresetId ? { ...p, images: { ...posterImages } } : p
                      );
                      savePresets(updatedPresets);
                    }
                  }}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  上書き
                </button>
                <button 
                  onClick={() => {
                    if (confirm("このテンプレートを削除しますか？")) {
                      const updatedPresets = layoutPresets.filter(p => p.id !== selectedPresetId);
                      savePresets(updatedPresets);
                      setSelectedPresetId('');
                      setPosterImages({});
                    }
                  }}
                  className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600 transition-colors whitespace-nowrap"
                >
                  削除
                </button>
              </>
            )}

            <button 
              onClick={() => {
                const name = prompt("新しいテンプレート名を入力してください", `設定 ${layoutPresets.length}`);
                if (name) {
                  const newPreset = { id: Date.now().toString(), name, images: { ...posterImages } };
                  savePresets([...layoutPresets, newPreset]);
                  setSelectedPresetId(newPreset.id);
                }
              }}
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              新規保存
            </button>
          </div>
          <button 
            onClick={() => setIsTemplateSettingsOpen(true)}
            className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200 text-purple-700 font-medium hover:bg-purple-100 transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            画像一覧
          </button>
          <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-medium hover:bg-blue-100 transition-colors text-sm sm:text-base">
            <input 
              type="checkbox" 
              checked={showDimensions} 
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            寸法表示
          </label>
        </div>
      </header>

      <main className="flex-1 w-full relative">
        <Canvas camera={{ position: [-5, 2, -1], fov: 45 }}>
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
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">画像を変更</h3>
              <p className="text-sm text-gray-500 mt-1">テンプレートから選ぶか、画像をアップロードしてください</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-48 p-1">
              {templateGallery.map((templateUrl) => (
                <button
                  key={templateUrl}
                  onClick={() => {
                    setPosterImages(prev => ({ ...prev, [activePosterId]: templateUrl }));
                    setActivePosterId(null);
                  }}
                  className="relative aspect-[1/1.4] rounded-lg overflow-hidden border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all active:scale-95 bg-gray-50"
                >
                  <img src={templateUrl} alt="template" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <label className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
                <span>自分の写真をアップロード</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </label>

              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setPosterImages(prev => {
                      const newImages = { ...prev };
                      if (activePosterId) {
                        delete newImages[activePosterId];
                      }
                      return newImages;
                    });
                    setActivePosterId(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors active:scale-95"
                >
                  初期状態に戻す
                </button>
                <button 
                  onClick={() => setActivePosterId(null)}
                  className="flex-1 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Settings Modal */}
      {isTemplateSettingsOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">テンプレート設定</h3>
              <p className="text-sm text-gray-500 mt-1">ポスターに使える画像を管理します</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-64 p-1">
              {templateGallery.map((templateUrl, idx) => (
                <div key={idx} className="relative aspect-[1/1.4] rounded-lg overflow-hidden border-2 border-gray-100 bg-gray-50 group">
                  <img src={templateUrl} alt="template" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => saveGallery(templateGallery.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <label className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
                <span>画像を追加</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      resizeAndBase64(file, (base64) => {
                        saveGallery(templateGallery.includes(base64) ? templateGallery : [...templateGallery, base64]);
                      });
                    }
                  }} 
                />
              </label>
              <button 
                onClick={() => setIsTemplateSettingsOpen(false)}
                className="w-full py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
