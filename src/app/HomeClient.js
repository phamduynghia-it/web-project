"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function HomeClient({ templates }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(tpl => 
    tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tpl.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 bg-gray-900/80 p-6 rounded-2xl shadow-lg border border-gray-800 backdrop-blur-sm gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Template Library
          </h1>
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Tìm kiếm mẫu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-center text-gray-300 mb-8">Tất cả mẫu</h2>
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTemplates.map((tpl) => (
                <div key={tpl.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-gray-700 transition-all group">
                  <div className="h-48 relative flex items-center justify-center bg-gray-800 text-gray-400 font-mono text-lg group-hover:bg-gray-700 transition-colors">
                    <img 
                      src={`/thumbnails/${tpl.id}.jpg`} 
                      alt={tpl.name} 
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="relative z-0">Preview {tpl.name}</span>
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-bold text-white text-lg mb-1">{tpl.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{tpl.description}</p>
                    <Link href={`/builder/${tpl.id}`} className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
                      Mở
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-gray-500 mt-12 text-lg">
               Không tìm thấy mẫu nào phù hợp.
             </div>
          )}
        </section>
      </div>
    </main>
  );
}
