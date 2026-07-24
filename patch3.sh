sed -i '135,168c\
          {/* Key Specs Grid */}\
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">\
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">\
              <span className="text-zinc-400 flex items-center gap-1">\
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />\
                الأبعاد\
              </span>\
              {!isEditing ? (\
                <strong className="text-zinc-100 block text-sm">{job.dimensions || '\''غير محدد'\''}</strong>\
              ) : (\
                <input type="text" value={editForm.dimensions || '\'\'\''} onChange={e => setEditForm({...editForm, dimensions: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />\
              )}\
            </div>\
\
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">\
              <span className="text-zinc-400 flex items-center gap-1">\
                <Hash className="w-3.5 h-3.5 text-blue-400" />\
                الكمية\
              </span>\
              {!isEditing ? (\
                <strong className="text-zinc-100 block text-sm">{job.quantity || 1} قطعة</strong>\
              ) : (\
                <input type="number" value={editForm.quantity || 1} onChange={e => setEditForm({...editForm, quantity: Number(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" min="1" />\
              )}\
            </div>\
\
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">\
              <span className="text-zinc-400 flex items-center gap-1">\
                <Layers className="w-3.5 h-3.5 text-amber-400" />\
                الخامة\
              </span>\
              {!isEditing ? (\
                <strong className="text-zinc-100 block text-sm">{job.material || '\''عادية'\''}</strong>\
              ) : (\
                <input type="text" value={editForm.material || '\'\'\''} onChange={e => setEditForm({...editForm, material: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />\
              )}\
            </div>\
\
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">\
              <span className="text-zinc-400 flex items-center gap-1">\
                <User className="w-3.5 h-3.5 text-emerald-400" />\
                العميل\
              </span>\
              {!isEditing ? (\
                <strong className="text-zinc-100 block text-sm">{job.customerName || '\''عميل'\''}</strong>\
              ) : (\
                <input type="text" value={editForm.customerName || '\'\'\''} onChange={e => setEditForm({...editForm, customerName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-blue-500" />\
              )}\
            </div>\
          </div>' src/components/JobDetailsModal.tsx
