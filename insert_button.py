with open("src/components/Navbar.tsx", "r") as f:
    text = f.read()

index = text.find("{/* Export */}")
if index != -1:
    new_text = text[:index] + """{/* TV Display Mode */}
          <button
            onClick={() => window.open(window.location.pathname + '?display=true', '_blank')}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold px-2 py-1 rounded-md transition-all text-xs shrink-0"
            title="فتح شاشة العرض للقسم (بدون تحكم)"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">شاشة العرض</span>
          </button>

          """ + text[index:]
    with open("src/components/Navbar.tsx", "w") as f:
        f.write(new_text)
    print("Success")
else:
    print("Not found")
