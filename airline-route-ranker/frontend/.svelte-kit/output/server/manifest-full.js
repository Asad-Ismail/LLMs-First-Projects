export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["plane-landing.svg","plane-takeoff.svg","starry-sky.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.DLZtPNDW.js",app:"_app/immutable/entry/app.BNsqg8xF.js",imports:["_app/immutable/entry/start.DLZtPNDW.js","_app/immutable/chunks/CnQNSSMN.js","_app/immutable/chunks/2EktXFFV.js","_app/immutable/chunks/DH45dyJF.js","_app/immutable/entry/app.BNsqg8xF.js","_app/immutable/chunks/2EktXFFV.js","_app/immutable/chunks/e9gZCKO6.js","_app/immutable/chunks/CyzHKt0c.js","_app/immutable/chunks/C3XHkgg4.js","_app/immutable/chunks/WA5n7srb.js","_app/immutable/chunks/DH45dyJF.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/about",
				pattern: /^\/about\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/contact",
				pattern: /^\/contact\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/faq",
				pattern: /^\/faq\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
