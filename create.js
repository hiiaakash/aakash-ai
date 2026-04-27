// ════════════════════════════════════
//  AAKASH AI v2 — Create (create.js)
//  AI Image + Voice generation handlers
//  Quick create is now in header popup (app.js)
// ════════════════════════════════════

window.createAIImage = async function() {
  const prompt = document.getElementById('imgPrompt')?.value?.trim();
  if (!prompt) { showToast('Describe the image'); return; }
  const imgResult = await generateImage(prompt);
  if (imgResult.ok && imgResult.images?.length) {
    const img = imgResult.images[0];
    const dataUrl = `data:${img.mime};base64,${img.data}`;
    S.notes.unshift({ id:Date.now(), title:'AI Image: '+prompt.slice(0,30), content:'[AI Generated]', folder:'General', uploaded:true, fileData:dataUrl, fileType:'image', fileMime:'image/png', createdAt:new Date().toISOString() });
    saveAll(); showToast('Image saved to Notes!');
  } else { showToast('Image generation failed'); }
};

window.createAIVoice = async function() {
  const text = document.getElementById('voiceText')?.value?.trim();
  if (!text) { showToast('Text likho'); return; }
  const voiceResult = await generateSpeech(text);
  if (voiceResult.ok && voiceResult.audioUrl) {
    const audio = new Audio(voiceResult.audioUrl); audio.play();
  } else if (voiceResult.fallback === 'browser') {
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const hv = voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang === 'en-IN') || voices[0];
    if (hv) u.voice = hv; u.lang = hv?.lang || 'hi-IN';
    speechSynthesis.speak(u);
  } else { showToast('Voice generation failed'); }
};
