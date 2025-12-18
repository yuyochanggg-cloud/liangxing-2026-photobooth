import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Check, Share2, Settings, ArrowLeft, Save, Loader2, Lock, Download } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, addDoc, serverTimestamp, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ==========================================
// 🔥 請在這裡貼上你在 Firebase 複製的設定 🔥
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAcRHOvvEdrSC4lvCO4e8qDiQAt3lTZopc",
  authDomain: "photo-db362.firebaseapp.com",
  projectId: "photo-db362",
  storageBucket: "photo-db362.firebasestorage.app",
  messagingSenderId: "579678920204",
  appId: "1:579678920204:web:8cd5532a617e4233d11829"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- 介面狀態 ---
type ViewState = 'home' | 'admin' | 'user';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<User | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '20268888') { // 後台密碼
      setView('admin');
      setShowAdminLogin(false);
    } else {
      alert('密碼錯誤');
    }
  };

  if (view === 'admin') return <AdminPanel onBack={() => setView('home')} userId={user.uid} />;
  if (view === 'user') return <UserBooth onBack={() => setView('home')} userId={user.uid} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6 relative font-sans">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div>
          <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">📸 良興 AI 拍貼機</h1>
          <p className="text-gray-500">2026 尾牙限定活動</p>
        </div>
        <div className="grid gap-4">
          <button onClick={() => setView('user')} className="flex items-center gap-4 p-5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all">
            <div className="bg-blue-600 text-white p-3 rounded-full"><Camera size={28} /></div>
            <div className="text-left"><h3 className="text-xl font-bold text-gray-800">我是賓客</h3><p className="text-sm text-gray-500">開始拍照</p></div>
          </button>
          <button onClick={() => setShowAdminLogin(true)} className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl transition-all">
            <div className="bg-slate-700 text-white p-3 rounded-full"><Settings size={28} /></div>
            <div className="text-left"><h3 className="text-xl font-bold text-gray-800">工作人員</h3><p className="text-sm text-gray-500">設定圖框</p></div>
          </button>
        </div>
      </div>
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">輸入後台密碼</h3>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="預設: 20268888" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-3 bg-gray-100 rounded-xl">取消</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl">登入</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Admin Panel ---
function AdminPanel({ onBack, userId }: { onBack: () => void, userId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global_config'), (doc) => {
      if (doc.exists()) setCurrentFrame(doc.data().activeFrameUrl);
    });
  }, []);

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const storageRef = ref(storage, `frames/frame_${Date.now()}.png`);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'settings', 'global_config'), { activeFrameUrl: url, updatedAt: serverTimestamp(), updatedBy: userId });
      alert('圖框更新成功！');
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      alert('上傳失敗');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm p-6">
        <button onClick={onBack} className="flex items-center text-gray-600 mb-6"><ArrowLeft size={20} className="mr-2" /> 返回</button>
        <h2 className="text-xl font-bold mb-4">圖框管理</h2>
        <div className="mb-6 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px]">
          {currentFrame ? <img src={currentFrame} className="max-h-60 object-contain" /> : <p className="text-gray-400">無目前圖框</p>}
        </div>
        <input type="file" accept="image/png" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        <button onClick={handleSave} disabled={!selectedFile || isSaving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold disabled:bg-gray-300">
           {isSaving ? '上傳中...' : '確認更換圖框'}
        </button>
      </div>
    </div>
  );
}

// --- User Booth ---
function UserBooth({ onBack, userId }: { onBack: () => void, userId: string }) {
  const [step, setStep] = useState<'camera' | 'preview'>('camera');
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'done'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'settings', 'global_config'), (doc) => {
      if (doc.exists()) setFrameUrl(doc.data().activeFrameUrl);
    });
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: false 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("無法存取相機"); }
  };

  useEffect(() => {
    if (step === 'camera') startCamera();
  }, [step]);

  const handleCaptureClick = () => {
    if (countdown !== null) return;
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else { clearInterval(timer); setCountdown(null); takePhoto(); }
    }, 1000);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !frameUrl) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const targetW = 1080; targetH = 1920;
    canvas.width = targetW; canvas.height = targetH;

    if (ctx) {
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetAspect = targetW / targetH;
      let drawW, drawH, startX, startY;

      if (videoAspect > targetAspect) {
        drawH = targetH; drawW = targetH * videoAspect; startX = (targetW - drawW) / 2; startY = 0;
      } else {
        drawW = targetW; drawH = targetW / videoAspect; startX = 0; startY = (targetH - drawH) / 2;
      }
      ctx.drawImage(video, startX, startY, drawW, drawH);
      const frameImg = new Image();
      frameImg.crossOrigin = "anonymous";
      frameImg.src = frameUrl;
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, targetW, targetH);
        setCapturedImage(canvas.toDataURL('image/png'));
        setStep('preview');
      };
    }
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    setUploadState('uploading');
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const storageRef = ref(storage, `guests/${Date.now()}.png`);
      await uploadBytes(storageRef, blob);
      await addDoc(collection(db, 'photos'), { url: await getDownloadURL(storageRef), createdAt: serverTimestamp() });
      setUploadState('done');
    } catch (e) { alert("上傳失敗"); setUploadState('idle'); }
  };

  const downloadImage = () => {
    if(capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `LiangXing_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  if (step === 'camera') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        <div className="absolute top-0 w-full z-20 p-4"><button onClick={onBack} className="text-white bg-white/20 p-3 rounded-full"><ArrowLeft /></button></div>
        <div className="flex-1 relative overflow-hidden flex items-center justify-center">
          <video ref={videoRef} className="absolute min-w-full min-h-full object-cover" autoPlay playsInline muted />
          {frameUrl && <img src={frameUrl} className="absolute w-full h-full object-cover z-10 pointer-events-none" />}
          {countdown !== null && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"><span className="text-[10rem] text-white animate-bounce">{countdown}</span></div>}
        </div>
        <div className="h-32 bg-black flex items-center justify-center relative z-20">
          <button onClick={handleCaptureClick} disabled={!frameUrl || countdown !== null} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 p-1 active:scale-95 transition-all"><div className="w-full h-full bg-red-500 rounded-full border-2 border-white"></div></button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl">
        <img src={capturedImage!} alt="Result" className="w-full h-auto" />
        <div className="p-4 grid grid-cols-2 gap-3">
          <button onClick={handleUpload} disabled={uploadState !== 'idle'} className={`col-span-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white ${uploadState === 'done' ? 'bg-green-500' : 'bg-blue-600'}`}>{uploadState === 'done' ? '已上傳' : '上傳活動牆'}</button>
          <button onClick={downloadImage} className="py-3 bg-gray-100 font-bold rounded-xl flex items-center justify-center gap-2"><Download size={18} /> 下載</button>
          <button onClick={() => { setStep('camera'); setUploadState('idle'); }} className="py-3 bg-gray-100 font-bold rounded-xl flex items-center justify-center gap-2"><RotateCcw size={18} /> 重拍</button>
        </div>
      </div>
    </div>
  );
}