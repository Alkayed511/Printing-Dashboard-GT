sed -i '91,96c\
          </div>\
          <div className="flex items-center gap-2">\
            {!isEditing ? (\
              <button onClick={() => setIsEditing(true)} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors" title="تعديل البيانات">\
                <Edit3 className="w-5 h-5" />\
              </button>\
            ) : (\
              <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors" title="حفظ التعديلات">\
                <Save className="w-5 h-5" />\
              </button>\
            )}\
            <button\
              onClick={onClose}\
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"\
            >\
              <X className="w-5 h-5" />\
            </button>\
          </div>' src/components/JobDetailsModal.tsx
