

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/faq/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.Dd507gVJ.js","_app/immutable/chunks/CyzHKt0c.js","_app/immutable/chunks/2EktXFFV.js","_app/immutable/chunks/BK4PQmFm.js"];
export const stylesheets = ["_app/immutable/assets/5.CNDvwfT3.css"];
export const fonts = [];
