'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Save, Image as ImageIcon, Timer } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MediaManager() {
  const [images, setImages] = useState<string[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(5);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const UPLOAD_PRESET = 'portfolio_preset'; 

  // Load existing images and settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profile');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profileImages) setImages(data.profileImages);
          if (data.intervalSeconds) setIntervalSeconds(data.intervalSeconds);
        }
      } catch (error) {
        console.error("Error fetching media settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.secure_url) {
        setImages(prev => [...prev, data.secure_url]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image to Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const saveToFirestore = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), { 
        profileImages: images,
        intervalSeconds: intervalSeconds
      }, { merge: true });
      alert('Profile images and settings successfully synced to live site!');
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      alert('Failed to save to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Media Showcase</h1>
        <button 
          onClick={saveToFirestore}
          disabled={isSaving}
          className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-2 rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Sync to Live Site'}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-800 pb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-cyan-950/30 rounded-full border border-cyan-900">
              <ImageIcon className="text-cyan-400" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200">Profile Image Carousel</h2>
              <p className="text-slate-400 text-sm">Manage hero section images.</p>
            </div>
          </div>
          
          {/* Timer Settings */}
          <div className="flex items-center gap-4 bg-black p-4 rounded-lg border border-gray-800">
            <Timer className="text-gray-400" size={20} />
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Rotation Speed (Sec)</label>
              <input 
                type="number" 
                min="2" max="20"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="bg-gray-900 text-white border border-gray-700 rounded p-1.5 outline-none focus:border-cyan-500 w-20 text-center"
              />
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-8 relative">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="border-2 border-dashed border-gray-700 hover:border-cyan-500 bg-black rounded-xl p-8 text-center transition-colors">
            {isUploading ? (
              <span className="text-cyan-400 font-semibold animate-pulse">Uploading to Cloudinary...</span>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="text-gray-500" size={32} />
                <span className="text-slate-400 font-semibold">Click or drag image to upload</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {images.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-700 aspect-square bg-black">
              <img src={url} alt={`Profile ${idx}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No images uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}