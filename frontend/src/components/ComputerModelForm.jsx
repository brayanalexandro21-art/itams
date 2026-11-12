import React, { useState, useRef } from 'react';
import api from '../services/api';
import { Icono } from './Icono';

const ImageUploadZone = ({ label, image, onUpload, onRemove }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Máximo 2MB por imagen');
    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) return alert('Formato no válido');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/computer-models/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpload(response.data.url);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        {uploading ? (
          <p className="text-sm text-gray-500">Subiendo...</p>
        ) : image ? (
          <div className="relative">
            <img src={image} alt={label} className="max-h-32 mx-auto rounded" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
            >
              ×
            </button>
            <p className="text-xs text-gray-400 mt-1">Click o arrastra para cambiar</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500"><Icono e="📷" className="h-4 w-4" /> Arrastra una imagen aquí</p>
            <p className="text-xs text-gray-400">o haz click para examinar</p>
            <p className="text-xs text-gray-400">Máx. 2 MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ComputerModelForm = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    name: '', comments: '', product_number: '', weight: 0, required_units: 1,
    depth: '1', power_connections: 0, power_consumption: 0, is_half_rack: false,
    manufacturer_id: '', photo_front: '', photo_back: '', other_photos: ''
  });
  const [loading, setLoading] = useState(false);
  const otherInputRef = useRef(null);

  const save = async () => {
    if (!form.name.trim()) return alert('Nombre requerido');
    setLoading(true);
    try {
      const response = await api.post('/computer-models', form);
      onCreated(response.data);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear modelo');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMultiple(true);
    try {
      const formData = new FormData();
      files.forEach(f => {
        if (f.size <= 2 * 1024 * 1024) formData.append('images', f);
      });
      const response = await api.post('/computer-models/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const existing = form.other_photos ? form.other_photos.split(',') : [];
      const newPhotos = [...existing, ...response.data.urls].filter(Boolean).join(',');
      setForm(prev => ({ ...prev, other_photos: newPhotos }));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setUploadingMultiple(false);
    }
  };

  const [uploadingMultiple, setUploadingMultiple] = useState(false);
  const otherPhotosList = form.other_photos ? form.other_photos.split(',').filter(Boolean) : [];

  const removeOtherPhoto = (index) => {
    const photos = otherPhotosList.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, other_photos: photos.join(',') }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 bg-blue-50 border-b rounded-t-lg">
          <h3 className="text-lg font-semibold text-blue-800">Nuevo elemento - Modelos de computadores</h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
              <textarea value={form.comments} onChange={(e) => setForm({...form, comments: e.target.value})} className="w-full border rounded px-3 py-2 h-20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Producto</label>
              <input type="text" value={form.product_number} onChange={(e) => setForm({...form, product_number: e.target.value})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({...form, weight: parseFloat(e.target.value) || 0})} className="w-full border rounded px-3 py-2" step="0.1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidades requeridas</label>
              <input type="number" value={form.required_units} onChange={(e) => setForm({...form, required_units: parseInt(e.target.value) || 1})} className="w-full border rounded px-3 py-2" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profundidad</label>
              <select value={form.depth} onChange={(e) => setForm({...form, depth: e.target.value})} className="w-full border rounded px-3 py-2">
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">4</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conexiones de alimentación</label>
              <input type="number" value={form.power_connections} onChange={(e) => setForm({...form, power_connections: parseInt(e.target.value) || 0})} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consumo de energía (W)</label>
              <input type="number" value={form.power_consumption} onChange={(e) => setForm({...form, power_consumption: parseInt(e.target.value) || 0})} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Es medio bastidor</label>
            <select value={form.is_half_rack ? 'yes' : 'no'} onChange={(e) => setForm({...form, is_half_rack: e.target.value === 'yes'})} className="w-full border rounded px-3 py-2">
              <option value="no">No</option>
              <option value="yes">Sí</option>
            </select>
          </div>

          {/* Fotos del Rack */}
          <div className="border-t pt-4">
            <div className="p-3 bg-blue-50 rounded mb-3">
              <h4 className="font-medium text-blue-800 flex items-center gap-2"><Icono e="📸" />Fotos del Rack</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageUploadZone
                label="Cuadro delantero"
                image={form.photo_front}
                onUpload={(url) => setForm({...form, photo_front: url})}
                onRemove={() => setForm({...form, photo_front: ''})}
              />
              <ImageUploadZone
                label="Cuadro posterior"
                image={form.photo_back}
                onUpload={(url) => setForm({...form, photo_back: url})}
                onRemove={() => setForm({...form, photo_back: ''})}
              />
            </div>
          </div>

          {/* Otras fotos */}
          <div>
            <div className="p-3 bg-blue-50 rounded mb-3">
              <h4 className="font-medium text-blue-800 flex items-center gap-2"><Icono e="🖼️" />Otras fotos</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {otherPhotosList.map((photo, i) => (
                <div key={i} className="relative border rounded-lg p-2">
                  <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeOtherPhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 flex items-center justify-center h-28"
                onClick={() => otherInputRef.current?.click()}
              >
                {uploadingMultiple ? (
                  <span className="text-sm text-gray-500">Subiendo...</span>
                ) : (
                  <div>
                    <p className="text-2xl text-gray-300">+</p>
                    <p className="text-xs text-gray-400">Agregar más</p>
                  </div>
                )}
              </div>
              <input ref={otherInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleUpload} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Archivos(s) (2 MB máx.) - Arrastra y suelta o haz click</p>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
          <button onClick={save} disabled={loading} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
            {loading ? 'Creando...' : '+ Añadir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComputerModelForm;