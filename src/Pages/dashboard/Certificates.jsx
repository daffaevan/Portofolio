import { useEffect, useState } from 'react'
import { supabase } from "../../supabase"
import { Award, Upload, Trash2, ImageIcon, Plus, AlertCircle } from 'lucide-react'

const Card = ({ children, className = '' }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
)

const SkeletonCard = () => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10" />
    <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden">
      <div className="w-full aspect-[16/11.5] bg-white/5 animate-pulse" />
    </div>
  </div>
)

const CertCard = ({ cert, onDelete }) => {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Menangani penamaan kolom 'Img' (kapital) maupun 'img' (lowercase)
  const imageUrl = cert?.Img || cert?.img || ''

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-white/5 border border-white/12 rounded-2xl overflow-hidden min-h-[140px] flex items-center justify-center">
        
        {/* Skeleton saat loading dan belum error */}
        {!imgLoaded && !hasError && (
          <div className="absolute inset-0 w-full h-full bg-white/5 animate-pulse" />
        )}

        {/* Tampilan jika gambar gagal dimuat */}
        {hasError ? (
          <div className="p-4 text-center text-xs text-red-400 space-y-1">
            <AlertCircle className="w-5 h-5 mx-auto text-red-400/80 mb-1" />
            <p>Gagal memuat gambar</p>
            <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{imageUrl}</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Certificate"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              console.error("Gagal load URL gambar:", imageUrl)
              setHasError(true)
            }}
            className={`w-full aspect-[16/11.5] object-cover group-hover:scale-105 transition-transform duration-500 ${
              imgLoaded ? 'block' : 'opacity-0'
            }`}
          />
        )}

        {/* Tombol Delete */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button
            onClick={() => onDelete(cert.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs w-full justify-center hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Certificates() {
  const [certs, setCerts] = useState([])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCerts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching certificates:", error.message)
    } else {
      console.log("Data certificates:", data)
      setCerts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { 
    fetchCerts() 
  }, [])

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const uploadImage = async () => {
    if (!file) return
    setUploading(true)

    try {
      // Ambil ekstensi asli & bersihkan karakter spesial/spasi dari nama file
      const fileExt = file.name.split('.').pop() || 'webp'
      const cleanFileName = `cert-${Date.now()}.${fileExt}`

      // Upload ke storage bucket
      const { error: uploadError } = await supabase.storage
        .from('certificate-images')
        .upload(cleanFileName, file)

      if (uploadError) throw uploadError

      // Dapatkan public URL
      const { data } = supabase.storage
        .from('certificate-images')
        .getPublicUrl(cleanFileName)

      const publicUrl = data.publicUrl

      // Coba insert data (menyimpan ke kedua versi properti agar kompatibel dengan tabel)
      const { error: insertError } = await supabase
        .from('certificates')
        .insert([{ Img: publicUrl, img: publicUrl }])

      if (insertError) {
        // Fallback jika salah satu kolom ditolak oleh schema tabel
        const fallbackInsert = await supabase
          .from('certificates')
          .insert([{ Img: publicUrl }])
        
        if (fallbackInsert.error) {
          await supabase.from('certificates').insert([{ img: publicUrl }])
        }
      }

      setFile(null)
      setPreview(null)
      fetchCerts()
    } catch (err) {
      console.error("Upload failed:", err.message)
      alert("Gagal mengunggah sertifikat: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  const deleteCert = async (id) => {
    if (!confirm('Delete this certificate?')) return
    const { error } = await supabase.from('certificates').delete().eq('id', id)
    if (error) {
      console.error("Delete failed:", error.message)
    }
    fetchCerts()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-xl blur opacity-50" />
          <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Certificates</h1>
          <p className="text-gray-500 text-xs">
            {loading ? 'Loading...' : `${certs.length} certificates total`}
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <Card>
        <div className="p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Upload Certificate
          </h2>

          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { 
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]) 
            }}
            className={`flex flex-col items-center justify-center w-full min-h-[160px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
              dragOver ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/12 bg-white/4 hover:border-indigo-500/35 hover:bg-white/7'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-40 object-contain rounded-lg p-2" />
            ) : (
              <div className="text-center space-y-2 p-6">
                <div className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm text-gray-300">Drag & drop or click to upload</p>
                <p className="text-xs text-gray-600">PNG, JPG, WEBP supported</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={e => handleFile(e.target.files?.[0])} 
              className="hidden" 
            />
          </label>

          {file && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-400 truncate flex-1">{file.name}</p>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={uploadImage} 
                  disabled={uploading} 
                  className="relative group/u"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4f52c9] to-[#8644c5] rounded-xl opacity-60 blur group-hover/u:opacity-100 transition duration-300" />
                  <div className="relative flex items-center gap-2 px-4 py-1.5 bg-[#030014] rounded-xl border border-white/10">
                    {uploading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="text-xs text-gray-200">{uploading ? 'Uploading...' : 'Upload'}</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : certs.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <Award className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No certificates yet.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {certs.map(cert => (
            <CertCard key={cert.id} cert={cert} onDelete={deleteCert} />
          ))}
        </div>
      )}
    </div>
  )
}