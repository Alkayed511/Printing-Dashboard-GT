with open("src/App.tsx", "r") as f:
    text = f.read()

old_ack = """  // Acknowledge new order alerts & stop sound
  const handleAcknowledgeAlert = useCallback(() => {
    unacknowledgedJobs.forEach((j) => seenJobIdsRef.current.add(j.id));
    jobs.forEach((j) => seenJobIdsRef.current.add(j.id));
    setUnacknowledgedJobs([]);
  }, [jobs, unacknowledgedJobs]);"""

new_ack = """  // Acknowledge new order alerts & stop sound
  const handleAcknowledgeAlert = useCallback(() => {
    setUnacknowledgedJobs([]);
  }, []);"""

old_effect = """    const newJobs = jobs.filter(
      (j) => j.status === 'pending' && !seenJobIdsRef.current.has(j.id)
    );

    if (newJobs.length > 0) {
      setUnacknowledgedJobs((prev) => {
        const combined = [...prev];
        newJobs.forEach((nj) => {
          if (!combined.find((c) => c.id === nj.id)) combined.push(nj);
        });
        return combined;
      });"""

new_effect = """    const newJobs = jobs.filter(
      (j) => j.status === 'pending' && !seenJobIdsRef.current.has(j.id)
    );

    if (newJobs.length > 0) {
      newJobs.forEach(j => seenJobIdsRef.current.add(j.id));
      setUnacknowledgedJobs((prev) => {
        const combined = [...prev];
        newJobs.forEach((nj) => {
          if (!combined.find((c) => c.id === nj.id)) combined.push(nj);
        });
        return combined;
      });"""

text = text.replace(old_ack, new_ack)
text = text.replace(old_effect, new_effect)

with open("src/App.tsx", "w") as f:
    f.write(text)
