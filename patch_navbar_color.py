with open("src/components/Navbar.tsx", "r") as f:
    text = f.read()

get_color_fn = """
  const getBellColorClass = () => {
    switch (config.notificationColor) {
      case 'blue': return 'bg-blue-600 border-blue-500 hover:bg-blue-500';
      case 'green': return 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500';
      case 'orange': return 'bg-orange-500 border-orange-400 hover:bg-orange-400';
      case 'purple': return 'bg-purple-600 border-purple-500 hover:bg-purple-500';
      default: return 'bg-red-600 border-red-500 hover:bg-red-500';
    }
  };
"""

text = text.replace("  const adjustDate = (days: number) => {", get_color_fn + "\n  const adjustDate = (days: number) => {")

text = text.replace("? 'bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-md animate-pulse'",
                    "? `${getBellColorClass()} text-white shadow-md animate-pulse`")

with open("src/components/Navbar.tsx", "w") as f:
    f.write(text)
