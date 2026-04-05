import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar/Navbar';

export default function Upload() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('❌ Chỉ hỗ trợ: JPEG, PNG, GIF, WebP, PDF');
      return;
    }

    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('❌ File quá lớn (tối đa 10MB)');
      return;
    }

    setFile(selectedFile);

    // Show preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng chọn file');
      return;
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8081/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      toast.success('✅ Upload thành công!');
      setUploadedFiles([...uploadedFiles, data.file]);
      setFile(null);
      setPreview(null);
      e.target.reset();
    } catch (err) {
      toast.error('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)' }}>
          <h2>⛔ Vui lòng đăng nhập để upload file</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ paddingTop: 40, paddingBottom: 40, maxWidth: 600 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 20 }}>📤 Test Upload File</h1>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Chọn file để upload:
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
              style={{
                display: 'block',
                width: '100%',
                padding: 12,
                border: '2px dashed var(--primary)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            />
            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8 }}>
              📋 Hỗ trợ: JPEG, PNG, GIF, WebP, PDF (tối đa 10MB)
            </p>
          </div>

          {preview && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Preview:</p>
              <img
                src={preview}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  border: '1px solid var(--gray-200)',
                }}
              />
            </div>
          )}

          {file && (
            <div style={{ marginBottom: 16, padding: 12, background: 'var(--gray-50)', borderRadius: 8 }}>
              <p style={{ fontSize: 13, margin: 0 }}>
                <strong>File:</strong> {file.name}
              </p>
              <p style={{ fontSize: 13, margin: '4px 0 0 0', color: 'var(--gray-600)' }}>
                <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Đang upload...' : '✓ Upload'}
          </button>
        </form>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>✅ Files Uploaded ({uploadedFiles.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {uploadedFiles.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: 'var(--gray-50)',
                    borderRadius: 8,
                    border: '1px solid var(--gray-200)',
                  }}
                >
                  <p style={{ fontWeight: 600, margin: '0 0 4px 0', wordBreak: 'break-all' }}>
                    {f.filename}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '0 0 8px 0' }}>
                    Size: {(f.size / 1024).toFixed(2)} KB • Type: {f.mimetype}
                  </p>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      color: 'var(--primary)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    🔗 View File
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
