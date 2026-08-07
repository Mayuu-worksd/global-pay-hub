const fs = require('fs');

let content = fs.readFileSync('apps/admin/src/App.tsx', 'utf8');

// The magical glowing background (maximalist element)
const backgroundElements = `
      {/* Glow Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-secondary/10 rounded-full mix-blend-screen filter blur-[120px] animate-float pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/5 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none" />
`;

content = content.replace(
  '<div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100">',
  `<div className="min-h-screen bg-background flex flex-col lg:flex-row text-textPrimary relative overflow-hidden font-sans">
${backgroundElements}`
);

// Map colors
content = content.replace(/bg-slate-950/g, 'bg-background/80 backdrop-blur-md');
content = content.replace(/bg-slate-900/g, 'bg-surface/60 backdrop-blur-xl shadow-2xl');
content = content.replace(/bg-slate-850/g, 'bg-white/5');
content = content.replace(/bg-slate-800/g, 'bg-white/10');
content = content.replace(/border-slate-850/g, 'border-white/5');
content = content.replace(/border-slate-800/g, 'border-white/10');
content = content.replace(/text-slate-500/g, 'text-white/40');
content = content.replace(/text-slate-400/g, 'text-textSecondary');
content = content.replace(/text-slate-300/g, 'text-textSecondary');
content = content.replace(/text-slate-200/g, 'text-white/80');
content = content.replace(/text-white/g, 'text-textPrimary');
content = content.replace(/bg-blue-600/g, 'bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-glow-spin shadow-[0_0_20px_rgba(192,38,211,0.4)]');
content = content.replace(/hover:bg-blue-500/g, 'hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] hover:scale-[1.02]');
content = content.replace(/text-blue-500/g, 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary');
content = content.replace(/text-blue-400/g, 'text-accent');
content = content.replace(/bg-blue-500\/10/g, 'bg-primary/20');
content = content.replace(/border-blue-500\/20/g, 'border-primary/30');

// Login Page UI enhancement
content = content.replace(
  '<div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">',
  `<div className="w-full max-w-md bg-surface/70 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(109,40,217,0.15)] p-10 space-y-8 relative z-10 before:absolute before:inset-0 before:rounded-[2rem] before:border before:border-white/5 before:pointer-events-none">`
);

// Sidebar enhancement
content = content.replace(
  '<aside className="w-full lg:w-\\[264px\\] bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0">',
  '<aside className="w-full lg:w-[280px] bg-surface/40 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0 relative z-10">'
);

// Buttons enhancements
content = content.replace(
  'activeTab === item.id\n                  ? "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-glow-spin shadow-[0_0_20px_rgba(192,38,211,0.4)] text-textPrimary shadow-md shadow-blue-500/10"\n                  : "text-textSecondary hover:bg-white/10 hover:text-textPrimary"',
  'activeTab === item.id\n                  ? "bg-gradient-to-r from-primary/80 to-secondary/80 text-white shadow-[0_0_15px_rgba(109,40,217,0.3)] border border-white/10"\n                  : "text-textSecondary hover:bg-white/5 hover:text-white"'
);

// Fix bug with users table filtering
// Originally: {profiles.filter(p => p.role !== "merchant").filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
content = content.replace(
  '{profiles.filter(p => p.role !== "merchant").filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {',
  '{profiles.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {'
);

fs.writeFileSync('apps/admin/src/App.tsx', content);
console.log('Successfully updated App.tsx with maximalist/minimalist theme and fixed filtering bug!');
