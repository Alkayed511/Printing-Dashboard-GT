import re
with open("src/App.tsx", "r") as f:
    text = f.read()

# Remove classes from div
old_wrapper = """    <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none primary-${config.themeColor || 'orange'} secondary-${config.secondaryColor || 'blue'}`}>"""
new_wrapper = """    <div className={`h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-blue-500 selection:text-white dir-rtl text-right select-none`}>"""
text = text.replace(old_wrapper, new_wrapper)

# Add useEffect for theme
old_effect = """  useEffect(() => {
    fetchConfig();
  }, []);"""

new_effect = """  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('primary-orange', 'primary-blue', 'primary-green', 'primary-purple', 'primary-rose');
    root.classList.remove('secondary-orange', 'secondary-blue', 'secondary-green', 'secondary-purple', 'secondary-rose');
    root.classList.add(`primary-${config.themeColor || 'orange'}`);
    root.classList.add(`secondary-${config.secondaryColor || 'blue'}`);
  }, [config.themeColor, config.secondaryColor]);"""

text = text.replace(old_effect, new_effect)
with open("src/App.tsx", "w") as f:
    f.write(text)
