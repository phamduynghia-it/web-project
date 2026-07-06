"use client";

import { useState } from "react";
import Link from "next/link";

export default function BuilderClient({ templateId, config }) {
  // Khởi tạo state dựa trên giá trị mặc định của config
  const initialState = {};
  config.fields.forEach((field) => {
    initialState[field.name] = field.default || "";
  });

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [repoLink, setRepoLink] = useState("");

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      // Nếu không phải ảnh (ví dụ nhạc/video), trả về base64 bình thường
      if (!file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Giới hạn kích thước tối đa 1200px
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // Nén với chất lượng 0.7 cho jpeg
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (name, file) => {
    if (!file) return;
    const compressedBase64 = await compressImage(file);
    handleChange(name, compressedBase64);
  };

  const handleArrayFileChange = async (name, index, file) => {
    if (!file) return;
    const compressedBase64 = await compressImage(file);
    const newArray = [...(formData[name] || [])];
    newArray[index] = compressedBase64;
    handleChange(name, newArray);
  };

  const handleArrayChange = (name, index, value) => {
    const newArray = [...(formData[name] || [])];
    newArray[index] = value;
    handleChange(name, newArray);
  };

  const handleAddArrayItem = (name) => {
    const newArray = [...(formData[name] || []), ""];
    handleChange(name, newArray);
  };

  const handleRemoveArrayItem = (name, index) => {
    const newArray = [...(formData[name] || [])];
    newArray.splice(index, 1);
    handleChange(name, newArray);
  };

  const handleDeploy = async () => {
    setLoading(true);
    setRepoLink("");
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          data: formData,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        if (result.success) {
          setRepoLink(result.url);
        } else {
          alert("Lỗi: " + result.message);
        }
      } else {
        if (response.status === 413) {
          throw new Error("Dung lượng file quá lớn (vượt quá giới hạn 4.5MB). Vui lòng chọn ảnh có kích thước nhỏ hơn hoặc ít ảnh lại.");
        } else if (response.status === 504) {
          throw new Error("Máy chủ phản hồi quá lâu (Timeout). Quá trình deploy mất nhiều thời gian, vui lòng thử lại.");
        } else {
          throw new Error(`Lỗi hệ thống: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (err) {
      alert(err.message || "Đã xảy ra lỗi hệ thống khi deploy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 flex justify-center items-center font-sans">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 relative">
        <Link 
          href="/" 
          className="absolute top-6 left-6 text-gray-400 hover:text-white flex items-center gap-2 font-semibold transition-colors bg-gray-800/50 hover:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-700/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại
        </Link>
        
        <div className="text-center mb-8 mt-6">
          <h2 className="text-3xl font-bold text-white mb-2">Cấu hình: {config.name}</h2>
          <p className="text-gray-400">{config.description}</p>
        </div>

        <div className="space-y-6">
          {config.fields.map((field) => {
            return (
              <div key={field.name} className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/50">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  {field.label}
                </label>

                {field.type === "text" && (
                  <input
                    type="text"
                    value={formData[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                )}

                {field.type === "number" && (
                  <input
                    type="number"
                    value={formData[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                )}

                {field.type === "color" && (
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={formData[field.name]}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-14 h-14 p-1 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer"
                    />
                    <span className="text-gray-400 font-mono">{formData[field.name]}</span>
                  </div>
                )}

                {field.type === "textarea" && (
                  <textarea
                    rows={5}
                    value={formData[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                )}

                {(field.type === "image" || field.type === "audio") && (
                  <div>
                    <input
                      type="file"
                      accept={field.type === "image" ? "image/*" : "audio/*, video/*, .mp3, .wav, .m4a, .mp4"}
                      onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                      className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-600 file:text-white
                        hover:file:bg-blue-500 file:transition-colors file:cursor-pointer"
                    />
                    {formData[field.name] && formData[field.name].startsWith("data:") && (
                      <p className="mt-2 text-xs text-green-400">✓ Đã chọn file ({Math.round(formData[field.name].length / 1024)} KB)</p>
                    )}
                  </div>
                )}

                {field.type === "text-array" && (
                  <div className="space-y-3">
                    {(formData[field.name] || []).map((val, idx) => (
                      <div key={idx} className="flex gap-2">
                        <textarea
                          rows={2}
                          value={val}
                          onChange={(e) => handleArrayChange(field.name, idx, e.target.value)}
                          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                          placeholder="Nhập nội dung (nhấn Enter để xuống dòng)"
                        />
                        <button
                          onClick={() => handleRemoveArrayItem(field.name, idx)}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddArrayItem(field.name)}
                      className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                      + Thêm dòng
                    </button>
                  </div>
                )}

                {field.type === "image-array" && (
                  <div className="space-y-3">
                    {(formData[field.name] || []).map((val, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-800 border border-gray-600 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Ảnh {idx + 1}</span>
                          <button
                            onClick={() => handleRemoveArrayItem(field.name, idx)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded hover:bg-red-500/30 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleArrayFileChange(field.name, idx, e.target.files[0])}
                          className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-600 file:text-white
                            hover:file:bg-blue-500 file:transition-colors file:cursor-pointer"
                        />
                        {val && val.startsWith("data:") && (
                          <img src={val} alt={`preview ${idx}`} className="mt-2 h-24 w-24 object-cover rounded-md border border-gray-600" />
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddArrayItem(field.name)}
                      className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-colors border border-gray-600"
                    >
                      + Thêm ảnh
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={handleDeploy}
            disabled={loading}
            className="w-full mt-8 py-3.5 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Đang xử lý & Tải lên GitHub..." : "Tạo Thiệp Ngay"}
          </button>

          {repoLink && (
            <div className="mt-6 p-5 bg-green-900/40 border border-green-800 text-green-300 rounded-xl text-center">
              <p className="font-semibold mb-2 text-xl">🎉 Tạo thiệp thành công!</p>
              
              <div className="flex justify-center gap-3 mt-4">
                <a
                  href={repoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors shadow-lg"
                >
                  Mở link thiệp
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(repoLink);
                    alert("Đã copy link thành công!");
                  }}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
              </div>
              <p className="text-xs text-green-500/70 mt-3">Lưu ý: Bạn copy link này dán xuống công cụ tạo QR bên dưới nhé.</p>

              <div className="mt-8 border-t border-green-800/50 pt-6">
                <h3 className="font-bold text-lg text-white mb-4">Tạo mã QR Trái Tim 💖</h3>
                <div className="w-full bg-white rounded-xl overflow-hidden shadow-2xl" style={{ height: "650px" }}>
                  <iframe 
                    src="https://taoanhdep.com/tao-ma-qr-code-hinh-trai-tim/" 
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    title="Tạo mã QR"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
