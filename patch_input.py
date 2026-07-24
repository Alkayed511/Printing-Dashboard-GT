with open("src/components/KanbanBoard.tsx", "r") as f:
    text = f.read()

old_input = """          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الملف، العميل، نوع الخامة، الأبعاد..."
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-md pr-9 pl-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-xs text-zinc-400 hover:text-white"
            >"""

new_input = """          <input
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
            >"""

text = text.replace(old_input, new_input)
with open("src/components/KanbanBoard.tsx", "w") as f:
    f.write(text)
