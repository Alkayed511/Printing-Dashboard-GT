sed -i '/<BarChart3 className="w-3.5 h-3.5" \/>/,/<\/button>/!b;//!d;/<\\/button>/a\
          <button\
            onClick={() => setActiveTab('\''settings'\'')}\
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${\
              activeTab === '\''settings'\''\
                ? '\''bg-blue-600 text-white shadow-sm'\''\
                : '\''text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'\''\
            }`}\
          >\
            <Settings className="w-3.5 h-3.5" />\
            <span>الإعدادات</span>\
          </button>' src/components/Navbar.tsx
sed -i 's/onClick={onOpenConfig}/onClick={() => setActiveTab('\''settings'\'')}/g' src/components/Navbar.tsx
