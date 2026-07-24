sed -i '/import { QuickSimulatorBar }/d' src/App.tsx
sed -i '/import { NewJobModal }/d' src/App.tsx
sed -i '/const handleAddJob =/,+20d' src/App.tsx
sed -i '/const handleAddQuickJob =/,+19d' src/App.tsx
sed -i '/<QuickSimulatorBar/,+4d' src/App.tsx
sed -i '/<NewJobModal/,+5d' src/App.tsx
sed -i '/const \[isNewJobOpen/d' src/App.tsx
sed -i '/const \[selectedPrinterForNewJob/d' src/App.tsx
