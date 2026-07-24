import re
with open("src/App.tsx", "r") as f:
    text = f.read()

old_interval = """  useEffect(() => {
    if (config.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchFiles();
      }, config.autoRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.autoRefreshInterval, fetchFiles]);"""

new_interval = """  useEffect(() => {
    if (config.autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchFiles();
        fetchConfig();
      }, config.autoRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [config.autoRefreshInterval, fetchFiles, fetchConfig]);"""

text = text.replace(old_interval, new_interval)

with open("src/App.tsx", "w") as f:
    f.write(text)
