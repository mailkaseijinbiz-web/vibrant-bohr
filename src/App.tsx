import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Booth } from './components/Booth'

type LayoutPreset = {
  id: string;
  name: string;
  images: Record<string, string>;
  posterCount?: 4 | 5;
  signPattern?: 'banner' | 'noren';
  showSignboard?: boolean;
  signboardX?: number;
  signboardZ?: number;
  signboardRotation?: number;
  leftPanelPattern?: 'corkboard' | 'poster';
  iceMachineX?: number;
  iceMachineZ?: number;
  iceMachineRotation?: number;
  showcaseX?: number;
  showcaseZ?: number;
  showcaseRotation?: number;
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
  
  const [templateGallery, setTemplateGallery] = useState<Record<string, string[]>>({});
  const [activeGalleryTab, setActiveGalleryTab] = useState<string>('');
  const [isTemplateSettingsOpen, setIsTemplateSettingsOpen] = useState(false);
  const [layoutPresets, setLayoutPresets] = useState<LayoutPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [posterCount, setPosterCount] = useState<4 | 5>(4);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signPattern, setSignPattern] = useState<'banner' | 'noren'>('banner');
  const [showSignboard, setShowSignboard] = useState<boolean>(true);
  const [signboardX, setSignboardX] = useState<number>(1.2);
  const [signboardZ, setSignboardZ] = useState<number>(-0.6);
  const [signboardRotation, setSignboardRotation] = useState<number>(45);
  const [leftPanelPattern, setLeftPanelPattern] = useState<'corkboard' | 'poster'>('corkboard');
  const [iceMachineX, setIceMachineX] = useState<number>(0.925);
  const [iceMachineZ, setIceMachineZ] = useState<number>(-2.0);
  const [iceMachineRotation, setIceMachineRotation] = useState<number>(-90);
  const [showcaseX, setShowcaseX] = useState<number>(-0.975);
  const [showcaseZ, setShowcaseZ] = useState<number>(-2.1);
  const [showcaseRotation, setShowcaseRotation] = useState<number>(-90);

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

  const saveGallery = async (newGallery: Record<string, string[]>) => {
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

  // Auto-save initial unsaved signboard state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vibrant-bohr-active-signboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.showSignboard !== undefined) setShowSignboard(parsed.showSignboard);
        if (parsed.signboardX !== undefined) setSignboardX(parsed.signboardX);
        if (parsed.signboardZ !== undefined) setSignboardZ(parsed.signboardZ);
        if (parsed.signboardRotation !== undefined) setSignboardRotation(parsed.signboardRotation);
      } catch (e) {
        console.warn("Failed to load active signboard settings", e);
      }
    }
    const savedLeftPanel = localStorage.getItem('vibrant-bohr-active-left-panel-pattern');
    if (savedLeftPanel === 'poster' || savedLeftPanel === 'corkboard') {
      setLeftPanelPattern(savedLeftPanel);
    }
    const savedIceMachine = localStorage.getItem('vibrant-bohr-active-ice-machine');
    if (savedIceMachine) {
      try {
        const parsed = JSON.parse(savedIceMachine);
        if (parsed.iceMachineX !== undefined) setIceMachineX(parsed.iceMachineX);
        if (parsed.iceMachineZ !== undefined) setIceMachineZ(parsed.iceMachineZ);
        if (parsed.iceMachineRotation !== undefined) setIceMachineRotation(parsed.iceMachineRotation);
      } catch (e) {
        console.warn("Failed to load active ice machine settings", e);
      }
    }
    const savedShowcase = localStorage.getItem('vibrant-bohr-active-showcase');
    if (savedShowcase) {
      try {
        const parsed = JSON.parse(savedShowcase);
        if (parsed.showcaseX !== undefined) setShowcaseX(parsed.showcaseX);
        if (parsed.showcaseZ !== undefined) setShowcaseZ(parsed.showcaseZ);
        if (parsed.showcaseRotation !== undefined) setShowcaseRotation(parsed.showcaseRotation);
      } catch (e) {
        console.warn("Failed to load active showcase settings", e);
      }
    }
  }, []);

  useEffect(() => {
    // Only auto-save to localStorage if we are in the "初期状態" (unsaved state)
    if (!selectedPresetId) {
      localStorage.setItem('vibrant-bohr-active-signboard', JSON.stringify({
        showSignboard,
        signboardX,
        signboardZ,
        signboardRotation
      }));
      localStorage.setItem('vibrant-bohr-active-left-panel-pattern', leftPanelPattern);
      localStorage.setItem('vibrant-bohr-active-ice-machine', JSON.stringify({
        iceMachineX,
        iceMachineZ,
        iceMachineRotation
      }));
      localStorage.setItem('vibrant-bohr-active-showcase', JSON.stringify({
        showcaseX,
        showcaseZ,
        showcaseRotation
      }));
    }
  }, [showSignboard, signboardX, signboardZ, signboardRotation, leftPanelPattern, iceMachineX, iceMachineZ, iceMachineRotation, showcaseX, showcaseZ, showcaseRotation, selectedPresetId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [presetsRes, galleryRes] = await Promise.all([
          fetch('/api/presets').catch(() => ({ ok: false, json: () => [] })),
          fetch('/api/gallery').catch(() => ({ ok: false, json: () => [] }))
        ]);

        if (presetsRes.ok) {
          const data = await presetsRes.json();
          if (data && data.length > 0) {
            setLayoutPresets(data);
          } else {
            const savedPresets = localStorage.getItem('vibrant-bohr-presets');
            if (savedPresets) {
              const parsed = JSON.parse(savedPresets);
              if (parsed && parsed.length > 0) {
                setLayoutPresets(parsed);
                savePresets(parsed);
              }
            }
          }
        } else {
          throw new Error("Presets API failed");
        }

        if (galleryRes.ok) {
          const data = await galleryRes.json();
          if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
            if (Array.isArray(data)) {
              setTemplateGallery({ "": data });
            } else {
              setTemplateGallery(data);
            }
          } else {
            const savedGallery = localStorage.getItem('vibrant-bohr-gallery');
            if (savedGallery) {
              const parsed = JSON.parse(savedGallery);
              if (Array.isArray(parsed)) {
                if (parsed.length > 0) {
                  setTemplateGallery({ "": parsed });
                  saveGallery({ "": parsed });
                }
              } else {
                if (parsed && Object.keys(parsed).length > 0) {
                  setTemplateGallery(parsed);
                  saveGallery(parsed);
                }
              }
            }
          }
        } else {
          throw new Error("Gallery API failed");
        }
      } catch (err) {
        console.log("Fallback to localStorage due to API failure");
        const savedPresets = localStorage.getItem('vibrant-bohr-presets');
        if (savedPresets) setLayoutPresets(JSON.parse(savedPresets));
        else setLayoutPresets([]);

        const savedGallery = localStorage.getItem('vibrant-bohr-gallery');
        if (savedGallery) {
          const parsed = JSON.parse(savedGallery);
          if (Array.isArray(parsed)) {
            setTemplateGallery({ "": parsed });
          } else {
            setTemplateGallery(parsed);
          }
        } else {
          setTemplateGallery({});
        }
      }
    };
    loadData();
  }, []);

  const handlePosterClick = (id: string) => {
    setActivePosterId(id);
    setActiveGalleryTab(selectedPresetId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePosterId) {
      resizeAndBase64(file, (base64) => {
        setPosterImages(prev => ({ ...prev, [activePosterId]: base64 }));
        const currentImages = templateGallery[activeGalleryTab] || [];
        const updatedImages = currentImages.includes(base64) ? currentImages : [...currentImages, base64];
        saveGallery({
          ...templateGallery,
          [activeGalleryTab]: updatedImages
        });
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
                  if (preset) {
                    setPosterImages(preset.images);
                    setPosterCount(preset.posterCount || 4);
                    setSignPattern(preset.signPattern || 'banner');
                    setShowSignboard(preset.showSignboard !== undefined ? preset.showSignboard : true);
                    setSignboardX(preset.signboardX !== undefined ? preset.signboardX : 1.2);
                    setSignboardZ(preset.signboardZ !== undefined ? preset.signboardZ : -0.6);
                    setSignboardRotation(preset.signboardRotation !== undefined ? preset.signboardRotation : 45);
                    setLeftPanelPattern(preset.leftPanelPattern || 'corkboard');
                    setIceMachineX(preset.iceMachineX !== undefined ? preset.iceMachineX : 0.925);
                    setIceMachineZ(preset.iceMachineZ !== undefined ? preset.iceMachineZ : -2.0);
                    setIceMachineRotation(preset.iceMachineRotation !== undefined ? preset.iceMachineRotation : -90);
                    setShowcaseX(preset.showcaseX !== undefined ? preset.showcaseX : -0.975);
                    setShowcaseZ(preset.showcaseZ !== undefined ? preset.showcaseZ : -2.1);
                    setShowcaseRotation(preset.showcaseRotation !== undefined ? preset.showcaseRotation : -90);
                  }
                } else {
                  setPosterImages({});
                  setPosterCount(4);
                  setSignPattern('banner');
                  // Revert to local storage auto-saved initial state or default values
                  const saved = localStorage.getItem('vibrant-bohr-active-signboard');
                  if (saved) {
                    try {
                      const parsed = JSON.parse(saved);
                      setShowSignboard(parsed.showSignboard !== undefined ? parsed.showSignboard : true);
                      setSignboardX(parsed.signboardX !== undefined ? parsed.signboardX : 1.2);
                      setSignboardZ(parsed.signboardZ !== undefined ? parsed.signboardZ : -0.6);
                      setSignboardRotation(parsed.signboardRotation !== undefined ? parsed.signboardRotation : 45);
                    } catch (e) {
                      setShowSignboard(true);
                      setSignboardX(1.2);
                      setSignboardZ(-0.6);
                      setSignboardRotation(45);
                    }
                  } else {
                    setShowSignboard(true);
                    setSignboardX(1.2);
                    setSignboardZ(-0.6);
                    setSignboardRotation(45);
                  }
                  const savedLeftPanel = localStorage.getItem('vibrant-bohr-active-left-panel-pattern');
                  setLeftPanelPattern(savedLeftPanel === 'poster' ? 'poster' : 'corkboard');
                  
                  const savedIceMachine = localStorage.getItem('vibrant-bohr-active-ice-machine');
                  if (savedIceMachine) {
                    try {
                      const parsed = JSON.parse(savedIceMachine);
                      setIceMachineX(parsed.iceMachineX !== undefined ? parsed.iceMachineX : 0.925);
                      setIceMachineZ(parsed.iceMachineZ !== undefined ? parsed.iceMachineZ : -2.0);
                      setIceMachineRotation(parsed.iceMachineRotation !== undefined ? parsed.iceMachineRotation : -90);
                    } catch (e) {
                      setIceMachineX(0.925);
                      setIceMachineZ(-2.0);
                      setIceMachineRotation(-90);
                    }
                  } else {
                    setIceMachineX(0.925);
                    setIceMachineZ(-2.0);
                    setIceMachineRotation(-90);
                  }

                  const savedShowcase = localStorage.getItem('vibrant-bohr-active-showcase');
                  if (savedShowcase) {
                    try {
                      const parsed = JSON.parse(savedShowcase);
                      setShowcaseX(parsed.showcaseX !== undefined ? parsed.showcaseX : -0.975);
                      setShowcaseZ(parsed.showcaseZ !== undefined ? parsed.showcaseZ : -2.1);
                      setShowcaseRotation(parsed.showcaseRotation !== undefined ? parsed.showcaseRotation : -90);
                    } catch (e) {
                      setShowcaseX(-0.975);
                      setShowcaseZ(-2.1);
                      setShowcaseRotation(-90);
                    }
                  } else {
                    setShowcaseX(-0.975);
                    setShowcaseZ(-2.1);
                    setShowcaseRotation(-90);
                  }
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
              <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2">
                <button 
                  onClick={() => {
                    if (confirm("現在の表示状態（ポスター・ロゴの組み合わせ）でこのテンプレートを上書き保存しますか？")) {
                      const updatedPresets = layoutPresets.map(p => 
                        p.id === selectedPresetId ? { 
                          ...p, 
                          images: { ...posterImages }, 
                          posterCount, 
                          signPattern,
                          showSignboard,
                          signboardX,
                          signboardZ,
                          signboardRotation,
                          leftPanelPattern,
                          iceMachineX,
                          iceMachineZ,
                          iceMachineRotation,
                          showcaseX,
                          showcaseZ,
                          showcaseRotation
                        } : p
                      );
                      savePresets(updatedPresets);
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex items-center justify-center"
                  title="上書き保存"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                </button>
                <button 
                  onClick={() => {
                    const preset = layoutPresets.find(p => p.id === selectedPresetId);
                    if (preset) {
                      const newName = prompt("新しいテンプレート名を入力してください", preset.name);
                      if (newName && newName !== preset.name) {
                        const updatedPresets = layoutPresets.map(p => 
                          p.id === selectedPresetId ? { ...p, name: newName } : p
                        );
                        savePresets(updatedPresets);
                      }
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center"
                  title="名前の変更"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button 
                  onClick={() => {
                    if (confirm("このテンプレートを削除しますか？")) {
                      const updatedPresets = layoutPresets.filter(p => p.id !== selectedPresetId);
                      savePresets(updatedPresets);
                      
                      const updatedGallery = { ...templateGallery };
                      delete updatedGallery[selectedPresetId];
                      saveGallery(updatedGallery);

                      setSelectedPresetId('');
                      setPosterImages({});
                    }
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center"
                  title="削除"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            )}

            <div className="flex items-center border-l border-gray-200 pl-2 ml-1">
              <button 
                onClick={() => {
                  const name = prompt("新しいテンプレート名を入力してください", `設定 ${layoutPresets.length + 1}`);
                  if (name) {
                    const newPreset: LayoutPreset = { 
                      id: Date.now().toString(), 
                      name, 
                      images: { ...posterImages }, 
                      posterCount, 
                      signPattern,
                      showSignboard,
                      signboardX,
                      signboardZ,
                      signboardRotation,
                      leftPanelPattern,
                      iceMachineX,
                      iceMachineZ,
                      iceMachineRotation,
                      showcaseX,
                      showcaseZ,
                      showcaseRotation
                    };
                    savePresets([...layoutPresets, newPreset]);
                    setSelectedPresetId(newPreset.id);
                  }
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center"
                title="新規保存"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
              </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center justify-center p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
              title="設定"
            >
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
            
            {isSettingsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsSettingsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col gap-4 z-30">
                  {/* 1. ポスター配置 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-500">ポスター配置</span>
                    <select 
                      value={posterCount}
                      onChange={(e) => setPosterCount(Number(e.target.value) as 4 | 5)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <option value={4}>A2 4枚</option>
                      <option value={5}>A2 5枚</option>
                    </select>
                  </div>

                  {/* 看板スタイル */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-500">看板スタイル</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSignPattern('banner')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          signPattern === 'banner'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        看板
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignPattern('noren')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          signPattern === 'noren'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        のれん
                      </button>
                    </div>
                  </div>

                  {/* 左側面・右側パネル */}
                  <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-gray-500">左側面・右側パネル</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setLeftPanelPattern('corkboard')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          leftPanelPattern === 'corkboard'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        コルクボード
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftPanelPattern('poster')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          leftPanelPattern === 'poster'
                            ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        A1ポスター
                      </button>
                    </div>
                  </div>

                  {/* 2. 画像一覧 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-500">画像管理</span>
                    <button 
                      onClick={() => {
                        setActiveGalleryTab(selectedPresetId);
                        setIsTemplateSettingsOpen(true);
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg py-1.5 text-sm font-medium transition-colors"
                    >
                      画像一覧
                    </button>
                  </div>

                  {/* 立て看板設定 */}
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-gray-500">立て看板の設定</span>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
                      <input 
                        type="checkbox" 
                        checked={showSignboard} 
                        onChange={(e) => setShowSignboard(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>看板を表示する</span>
                    </label>
                    
                    {showSignboard && (
                      <div className="flex flex-col gap-2.5 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {/* X slider */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>左右位置 (X)</span>
                            <span className="font-semibold">{signboardX.toFixed(2)}m</span>
                          </div>
                          <input 
                            type="range" 
                            min="-3.0" 
                            max="3.0" 
                            step="0.05"
                            value={signboardX}
                            onChange={(e) => setSignboardX(parseFloat(e.target.value))}
                            className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        {/* Z slider */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>前後位置 (Z)</span>
                            <span className="font-semibold">{signboardZ.toFixed(2)}m</span>
                          </div>
                          <input 
                            type="range" 
                            min="-4.0" 
                            max="1.0" 
                            step="0.05"
                            value={signboardZ}
                            onChange={(e) => setSignboardZ(parseFloat(e.target.value))}
                            className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        {/* Rotation slider */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>回転角度 (Y)</span>
                            <span className="font-semibold">{signboardRotation}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            step="5"
                            value={signboardRotation}
                            onChange={(e) => setSignboardRotation(parseInt(e.target.value))}
                            className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* かき氷器の設定 */}
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-gray-500">かき氷器の設定</span>
                    <div className="flex flex-col gap-2.5 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {/* X slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>左右位置 (X)</span>
                          <span className="font-semibold">{iceMachineX.toFixed(2)}m</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.5" 
                          max="1.5" 
                          step="0.01"
                          value={iceMachineX}
                          onChange={(e) => setIceMachineX(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      {/* Z slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>前後位置 (Z)</span>
                          <span className="font-semibold">{iceMachineZ.toFixed(2)}m</span>
                        </div>
                        <input 
                          type="range" 
                          min="-2.4" 
                          max="0.0" 
                          step="0.05"
                          value={iceMachineZ}
                          onChange={(e) => setIceMachineZ(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      {/* Rotation slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>回転角度 (Y)</span>
                          <span className="font-semibold">{iceMachineRotation}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="-180" 
                          max="180" 
                          step="5"
                          value={iceMachineRotation}
                          onChange={(e) => setIceMachineRotation(parseInt(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 保温器の設定 */}
                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-gray-500">保温器の設定</span>
                    <div className="flex flex-col gap-2.5 mt-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {/* X slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>左右位置 (X)</span>
                          <span className="font-semibold">{showcaseX.toFixed(2)}m</span>
                        </div>
                        <input 
                          type="range" 
                          min="-1.5" 
                          max="-0.5" 
                          step="0.01"
                          value={showcaseX}
                          onChange={(e) => setShowcaseX(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      {/* Z slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>前後位置 (Z)</span>
                          <span className="font-semibold">{showcaseZ.toFixed(2)}m</span>
                        </div>
                        <input 
                          type="range" 
                          min="-2.4" 
                          max="0.0" 
                          step="0.05"
                          value={showcaseZ}
                          onChange={(e) => setShowcaseZ(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      {/* Rotation slider */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>回転角度 (Y)</span>
                          <span className="font-semibold">{showcaseRotation}°</span>
                        </div>
                        <input 
                          type="range" 
                          min="-180" 
                          max="180" 
                          step="5"
                          value={showcaseRotation}
                          onChange={(e) => setShowcaseRotation(parseInt(e.target.value))}
                          className="w-full accent-blue-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. 寸法表示 */}
                  <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showDimensions} 
                        onChange={(e) => setShowDimensions(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span>寸法を表示する</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
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
              posterCount={posterCount}
              signPattern={signPattern}
              showSignboard={showSignboard}
              signboardX={signboardX}
              signboardZ={signboardZ}
              signboardRotation={signboardRotation}
              leftPanelPattern={leftPanelPattern}
              iceMachineX={iceMachineX}
              iceMachineZ={iceMachineZ}
              iceMachineRotation={iceMachineRotation}
              showcaseX={showcaseX}
              showcaseZ={showcaseZ}
              showcaseRotation={showcaseRotation}
            />
            
            {/* Ground / Shadows */}
            <ContactShadows position={[0, 0, -1.2]} opacity={0.4} scale={20} blur={2.5} far={4} />
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

            {/* Folder Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-2 pb-2 scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveGalleryTab('')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  activeGalleryTab === '' 
                    ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                初期状態
              </button>
              {layoutPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setActiveGalleryTab(preset.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                    activeGalleryTab === preset.id 
                      ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-48 p-1">
              {(templateGallery[activeGalleryTab] || []).length > 0 ? (
                (templateGallery[activeGalleryTab] || []).map((templateUrl) => (
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
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-gray-400">
                  このフォルダに画像はありません。アップロードしてください。
                </div>
              )}
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
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800">テンプレート設定</h3>
              <p className="text-sm text-gray-500 mt-1">ポスターに使える画像をフォルダ（テンプレート）ごとに管理します</p>
            </div>

            {/* Folder Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto gap-2 pb-2 scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveGalleryTab('')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  activeGalleryTab === '' 
                    ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                初期状態
              </button>
              {layoutPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setActiveGalleryTab(preset.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${
                    activeGalleryTab === preset.id 
                      ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto max-h-[60vh] p-1">
              {(templateGallery[activeGalleryTab] || []).length > 0 ? (
                (templateGallery[activeGalleryTab] || []).map((templateUrl, idx) => (
                  <div key={idx} className="relative aspect-[1/1.4] rounded-lg overflow-hidden border-2 border-gray-100 bg-gray-50 group">
                    <img src={templateUrl} alt="template" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {
                        const currentImages = templateGallery[activeGalleryTab] || [];
                        const updatedImages = currentImages.filter((_, i) => i !== idx);
                        saveGallery({
                          ...templateGallery,
                          [activeGalleryTab]: updatedImages
                        });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-sm text-gray-400">
                  このフォルダに画像はありません。アップロードしてください。
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-95">
                <span>このフォルダに画像を追加</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      resizeAndBase64(file, (base64) => {
                        const currentImages = templateGallery[activeGalleryTab] || [];
                        const updatedImages = currentImages.includes(base64) ? currentImages : [...currentImages, base64];
                        saveGallery({
                          ...templateGallery,
                          [activeGalleryTab]: updatedImages
                        });
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
