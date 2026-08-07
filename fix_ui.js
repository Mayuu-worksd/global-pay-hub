const fs = require('fs');

let content = fs.readFileSync('apps/admin/src/App.tsx', 'utf8');

// The button has this class currently (since animate-glow-spin made it spin!):
// "w-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-glow-spin shadow-[0_0_20px_rgba(192,38,211,0.4)] text-textPrimary rounded-xl py-2.5 text-sm font-bold hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] hover:scale-[1.02] transition-colors"

// Let's just find the login button and explicitly replace it!
content = content.replace(
  /<button\s+type="submit"\s+className="[^"]*">/g,
  '<button type="submit" className="w-full bg-[#ccff00] text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[4px] hover:translate-x-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#b3e600] uppercase font-black text-xl tracking-[0.2em] py-4 transition-all rounded-none">'
);

// Fix the input fields to be maximalist/neo-brutalist
content = content.replace(
  /className="w-full bg-background\/80 backdrop-blur-md border border-white\/5 rounded-xl px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-primary\/30 font-medium"/g,
  'className="w-full bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 text-lg font-bold focus:outline-none focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all rounded-none placeholder:text-gray-500"'
);

// Fix the Login Box container
content = content.replace(
  /<div className="w-full max-w-md bg-surface\/70 backdrop-blur-2xl rounded-\[2rem\] border border-white\/10 shadow-\[0_0_50px_rgba\(109,40,217,0\.15\)\] p-10 space-y-8 relative z-10 before:absolute before:inset-0 before:rounded-\[2rem\] before:border before:border-white\/5 before:pointer-events-none">/g,
  '<div className="w-full max-w-md bg-white border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] p-10 space-y-8 relative z-10 rounded-none">'
);

// Replace the main layout background with a massive, vibrant color
content = content.replace(
  /<div className="min-h-screen bg-background flex flex-col lg:flex-row text-textPrimary relative overflow-hidden font-sans">/g,
  '<div className="min-h-screen bg-[#FF0080] flex flex-col lg:flex-row text-black relative overflow-hidden font-sans">'
);

// Fix text colors in the login form
content = content.replace(
  /<h1 className="font-display text-3xl font-extrabold text-textPrimary tracking-tight">/g,
  '<h1 className="font-display text-5xl font-black text-black tracking-tighter uppercase drop-shadow-[4px_4px_0px_rgba(204,255,0,1)]">'
);
content = content.replace(
  /<p className="text-xs font-semibold uppercase tracking-wider text-accent">/g,
  '<p className="text-sm font-black uppercase tracking-widest text-black bg-[#ccff00] inline-block px-2 py-1 border-2 border-black">'
);
content = content.replace(
  /<label className="text-xs font-semibold text-white font-bold drop-shadow-md">/g,
  '<label className="text-sm font-black text-black uppercase tracking-wider">'
);

// We'll also remove the animated orbs because they clash with the brutalist style
content = content.replace(
  /\{\/\* Glow Effects \*\/\}\n\s*<div className="fixed top-0 left-1\/4 w-96 h-96 [^>]+>\n\s*<div className="fixed bottom-0 right-1\/4 [^>]+>\n\s*<div className="fixed top-1\/2 left-1\/2 [^>]+>/g,
  '{/* Removed Glow Effects */}'
);

fs.writeFileSync('apps/admin/src/App.tsx', content);

let indexContent = fs.readFileSync('apps/admin/index.html', 'utf8');

// Replace background color with super bright pink
indexContent = indexContent.replace(/background-color: #09090b;/g, `
        background-color: #FF0080;
        background-image: 
          radial-gradient(#000 15%, transparent 16%),
          radial-gradient(#000 15%, transparent 16%);
        background-size: 30px 30px;
        background-position: 0 0, 15px 15px;
`);
fs.writeFileSync('apps/admin/index.html', indexContent);

console.log('Neo-brutalist Maximalist Theme Applied!');
