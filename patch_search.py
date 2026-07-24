import re
with open("src/components/KanbanBoard.tsx", "r") as f:
    text = f.read()

# Remove the search input wrapper and its parent container if necessary
old_search = """      {/* Search & High Density Filter Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الملف، العميل، نوع الخامة، الأبعاد..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-md pr-3 pl-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>

        {/* Dense Printer Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full md:w-auto pb-1 md:pb-0">"""

new_search = """      {/* High Density Filter Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex flex-col md:flex-row items-center justify-start gap-3 shrink-0">
        
        {/* Dense Printer Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full pb-1 md:pb-0">"""

text = text.replace(old_search, new_search)
with open("src/components/KanbanBoard.tsx", "w") as f:
    f.write(text)
