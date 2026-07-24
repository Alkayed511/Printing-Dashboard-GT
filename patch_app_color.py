with open("src/App.tsx", "r") as f:
    text = f.read()

get_color_fn = """
  const getBannerColorClass = () => {
    switch (config.notificationColor) {
      case 'blue': return 'bg-blue-600';
      case 'green': return 'bg-emerald-600';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-600';
      default: return 'bg-red-500';
    }
  };

  return (
"""
text = text.replace("  return (\n", get_color_fn)

old_banner = """<div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between shadow-md z-50">"""
new_banner = """<div className={`${getBannerColorClass()} text-white px-4 py-2 flex items-center justify-between shadow-md z-50 transition-colors`}>"""
text = text.replace(old_banner, new_banner)

with open("src/App.tsx", "w") as f:
    f.write(text)
