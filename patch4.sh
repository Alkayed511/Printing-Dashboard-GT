sed -i '186,192c\
          {/* Notes */}\
          {(job.notes || isEditing) && (\
            <div className="p-3.5 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs space-y-1">\
              <strong className="text-amber-300 block">📝 تعليمات المصمم للفني:</strong>\
              {!isEditing ? (\
                <p className="text-zinc-300">{job.notes}</p>\
              ) : (\
                <textarea \
                  value={editForm.notes || '\'\'\''} \
                  onChange={e => setEditForm({...editForm, notes: e.target.value})} \
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 text-sm focus:outline-none focus:border-blue-500 min-h-[60px]" \
                  placeholder="أضف تعليمات هنا..."\
                />\
              )}\
            </div>\
          )}' src/components/JobDetailsModal.tsx
