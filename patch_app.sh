sed -i '167a\
    setSelectedJobDetails((prev) => prev && prev.id === id ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev);' src/App.tsx
