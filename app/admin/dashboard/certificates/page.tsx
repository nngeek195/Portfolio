'use client';

import { useState, useEffect } from 'react';
import { Award, PlusCircle, Trash2, Upload, Loader2, X, ExternalLink } from 'lucide-react';
import ItemModal from '@/components/ItemModal';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Turns plain text into safe, paragraph-wrapped HTML for storage in `description`.
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildDescriptionHtml(issuer: string, dateIssued: string, credentialUrl: string, notes: string) {
  const metaLines: string[] = [];
  if (issuer) metaLines.push(`<p class="mb-1"><strong>Issued by:</strong> ${escapeHtml(issuer)}</p>`);
  if (dateIssued) metaLines.push(`<p class="mb-1"><strong>Date:</strong> ${escapeHtml(dateIssued)}</p>`);
  if (credentialUrl) {
    metaLines.push(
      `<p class="mb-1"><strong>Credential:</strong> <a href="${credentialUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">${escapeHtml(credentialUrl)}</a></p>`
    );
  }
  const metaHtml = metaLines.length ? `<div class="mb-4 text-sm text-slate-400">${metaLines.join('')}</div>` : '';
  const bodyHtml = notes
    ? notes.split('\n').filter(Boolean).map((line) => `<p class="mb-2">${escapeHtml(line)}</p>`).join('')
    : '';
  return metaHtml + bodyHtml;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [dateIssued, setDateIssued] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'curated_content'));
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.category === 'certificate') items.push({ id: docSnap.id, ...data });
      });
      items.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
      setCertificates(items);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portfolio_preset');

    try {
      // "auto" handles both images and PDF certificate scans/exports.
      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`;
      const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
      const uploadData = await response.json();

      if (uploadData.secure_url) {
        setImageUrl(uploadData.secure_url);
      } else {
        alert(uploadData.error?.message || 'Failed to upload certificate image.');
      }
    } catch (error) {
      console.error('Error uploading certificate image:', error);
      alert('Failed to upload to Cloudinary.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const resetForm = () => {
    setTitle('');
    setIssuer('');
    setDateIssued('');
    setCredentialUrl('');
    setNotes('');
    setImageUrl(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a certificate title.');
      return;
    }
    if (!imageUrl) {
      alert('Please upload a certificate image or PDF.');
      return;
    }

    setIsSaving(true);
    try {
      const id = `cert-${Date.now()}`;
      // If no credential URL was entered, use the uploaded certificate file itself
      // as the destination — that way every certificate is clickable somewhere.
      const finalCredentialUrl = credentialUrl.trim() || imageUrl;
      const docData = {
        id,
        title: title.trim(),
        description: buildDescriptionHtml(issuer.trim(), dateIssued, finalCredentialUrl || '', notes.trim()),
        mediaUrls: [imageUrl],
        credentialUrl: finalCredentialUrl,
        issuer: issuer.trim() || null,
        dateIssued: dateIssued || null,
        category: 'certificate',
        publishedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'curated_content', id), docData);
      resetForm();
      fetchCertificates();
    } catch (error) {
      console.error('Failed to save certificate:', error);
      alert('Failed to save certificate.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this certificate from your live portfolio?')) return;
    setIsDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteDoc(doc(db, 'curated_content', id));
      setCertificates((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert('Failed to remove certificate.');
    } finally {
      setIsDeleting((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10 border-b border-gray-800 pb-6 flex items-center gap-4">
        <div className="p-3 bg-emerald-950/30 rounded-lg text-emerald-400">
          <Award size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Certificates</h1>
          <p className="text-slate-400">Add and manage certificates manually — no scraping involved.</p>
        </div>
      </div>

      {/* Add Certificate Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-12">
        <h2 className="text-lg font-bold text-slate-200 mb-6">Add a New Certificate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="w-full bg-black text-white border border-gray-700 rounded-lg p-3 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">Issuing Organization</label>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. Amazon Web Services"
              className="w-full bg-black text-white border border-gray-700 rounded-lg p-3 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">Date Issued</label>
            <input
              type="date"
              value={dateIssued}
              onChange={(e) => setDateIssued(e.target.value)}
              className="w-full bg-black text-white border border-gray-700 rounded-lg p-3 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400 mb-2 block">Credential URL</label>
            <input
              type="text"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
              placeholder="Optional — leave blank to link to the uploaded file instead"
              className="w-full bg-black text-white border border-gray-700 rounded-lg p-3 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-slate-400 mb-2 block">Notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra context about this certificate..."
            className="w-full bg-black text-white border border-gray-700 rounded-lg p-3 outline-none focus:border-emerald-500 custom-scrollbar"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-slate-400 mb-2 block">Certificate Image / PDF *</label>
          <div className="flex items-center gap-4">
            {imageUrl && (
              <div className="relative w-32 h-24 rounded-lg border border-gray-700 overflow-hidden bg-black">
                {imageUrl.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-full flex items-center justify-center text-emerald-400 text-xs font-bold">PDF Attached</div>
                ) : (
                  <img src={imageUrl} alt="Certificate preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <label className={`flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition-colors ${isUploadingImage ? 'opacity-70 pointer-events-none' : ''}`}>
              {isUploadingImage ? <Loader2 className="animate-spin text-emerald-400" size={18} /> : <Upload size={18} className="text-slate-300" />}
              <span className="text-sm text-slate-300 font-medium">
                {isUploadingImage ? 'Uploading...' : imageUrl ? 'Replace File' : 'Upload File'}
              </span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-8 py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : <><PlusCircle size={20} /> Add Certificate</>}
        </button>
      </div>

      {/* Existing Certificates */}
      <h2 className="text-xl font-bold text-white mb-6">Published Certificates</h2>
      {isLoading ? (
        <div className="text-emerald-400">Loading certificates...</div>
      ) : certificates.length === 0 ? (
        <div className="text-gray-500 text-center py-10 bg-gray-900 border border-gray-800 rounded-xl">No certificates added yet.</div>
      ) : (
        <div className="space-y-4">
          {certificates.map((item) => (
            <div key={item.id} className="bg-black border border-gray-800 p-6 rounded-lg flex flex-col sm:flex-row gap-6 justify-between items-center hover:border-red-900/50 transition-colors">
              <div className="flex-1 flex items-center gap-4 cursor-pointer" onClick={() => setSelectedItem(item)}>
                {item.mediaUrls?.[0] && (
                  <img src={item.mediaUrls[0]} alt={item.title} className="w-16 h-16 rounded-lg object-cover border border-gray-800" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{item.title}</h3>
                  {item.issuer && <p className="text-sm text-slate-400">{item.issuer}</p>}
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline inline-flex items-center gap-1 mt-1"
                    >
                      Verify <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                disabled={isDeleting[item.id]}
                className="flex items-center gap-2 bg-red-950/30 hover:bg-red-900 text-red-500 hover:text-white border border-red-900 font-bold px-4 py-2 rounded transition-all disabled:opacity-50"
              >
                {isDeleting[item.id] ? 'Removing...' : <><Trash2 size={18} /> Remove</>}
              </button>
            </div>
          ))}
        </div>
      )}

      <ItemModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} type="certificate" data={selectedItem} />
    </div>
  );
}