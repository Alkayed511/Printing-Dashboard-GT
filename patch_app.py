with open("src/App.tsx", "r") as f:
    text = f.read()

# Fix pointer events based on settings
old_main = """<main className={`flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0 ${isDisplayMode ? 'pointer-events-none' : ''}`}>"""
new_main = """<main className={`flex-1 w-full px-2 sm:px-3 py-2 overflow-hidden flex flex-col min-h-0 ${isDisplayMode && config.disableMouseInDisplayMode ? 'pointer-events-none' : ''}`}>"""
text = text.replace(old_main, new_main)

# Add theme color wrapper
old_return = """    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none">"""
new_return = """    <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none theme-${config.themeColor || 'orange'}`}>"""
text = text.replace(old_return, new_return)

with open("src/App.tsx", "w") as f:
    f.write(text)
