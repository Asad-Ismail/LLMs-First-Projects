

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/about/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.BjAYFWtY.js","_app/immutable/chunks/CyzHKt0c.js","_app/immutable/chunks/2EktXFFV.js","_app/immutable/chunks/BK4PQmFm.js"];
export const stylesheets = ["_app/immutable/assets/3.DPezRzM9.css"];
export const fonts = [];
