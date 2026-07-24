import re
with open("src/App.tsx", "r") as f:
    text = f.read()

old_wrapper = """    <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none theme-${config.themeColor || 'orange'}`}>"""
new_wrapper = """    <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none primary-${config.themeColor || 'orange'} secondary-${config.secondaryColor || 'blue'}`}>"""
text = text.replace(old_wrapper, new_wrapper)
with open("src/App.tsx", "w") as f:
    f.write(text)
