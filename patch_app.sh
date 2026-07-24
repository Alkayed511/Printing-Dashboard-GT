sed -i '/<NewOrderNotification/,+4d' src/App.tsx
sed -i '/unacknowledgedCount={unacknowledgedJobs.length}/c\        unacknowledgedJobs={unacknowledgedJobs}\n        onDismissNotification={(id) => {\n          seenJobIdsRef.current.add(id);\n          setUnacknowledgedJobs(prev => prev.filter(j => j.id !== id));\n        }}\n        onDismissAllNotifications={handleAcknowledgeAlert}' src/App.tsx
