import { h as attr_class, e as escape_html, n as clsx, f as attr, c as pop, p as push } from "../../../chunks/index.js";
import "../../../chunks/api.js";
function _page($$payload, $$props) {
  push();
  let isNameValid, isEmailValid, isSubjectValid, isMessageValid, isFormValid;
  let name = "";
  let email = "";
  let subject = "";
  let message = "";
  let isSubmitting = false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  console.log("Contact form component loaded");
  isNameValid = name.trim().length >= 2;
  isEmailValid = emailRegex.test(email);
  isSubjectValid = subject.trim().length >= 3;
  isMessageValid = message.trim().length >= 10;
  isFormValid = isNameValid && isEmailValid && isSubjectValid && isMessageValid;
  $$payload.out += `<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90 svelte-bzzcj2"><header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]"><div class="container mx-auto px-4 flex justify-between items-center"><div class="flex-1 flex justify-start"><div class="hidden md:flex bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md"><a href="/" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Home</a></div></div> <div class="flex items-center gap-3 justify-center flex-1"><div class="bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20"><img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-7 w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500"></div> <h1 class="text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90"><span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary">Flight</span> Reliability Rankings</h1></div> <nav class="hidden md:flex gap-6 justify-end flex-1"><div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md"><a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">About</a> <span class="text-sky-accent/50">|</span> <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">FAQ</a> <span class="text-sky-accent/50">|</span> <a href="/contact" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium">Contact</a></div></nav> <button class="md:hidden text-white flex-1 flex justify-end" aria-label="Open navigation menu"><div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg></div></button></div></header> <div class="container mx-auto p-4 flex flex-col items-center justify-start pt-12" style="min-height: calc(100vh - 80px);"><div class="text-center mb-10 max-w-2xl px-4 animate-[fadeIn_0.8s_ease-in-out]"><h2 class="text-white text-2xl md:text-4xl font-medium mb-4 text-shadow-md"><span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold">Get in Touch</span></h2> <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base mb-6">Have questions or feedback? We'd love to hear from you!</p></div> `;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"><form class="space-y-6"><div><label for="name" class="block text-sm font-medium text-white mb-1">Your Name `;
    if (name.length > 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span${attr_class(clsx(isNameValid ? "text-green-400" : "text-red-400"))}>(${escape_html(isNameValid ? "✓" : "min 2 chars")})</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> <input type="text" id="name"${attr("value", name)} required minlength="2" class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50" placeholder="Enter your name"></div> <div><label for="email" class="block text-sm font-medium text-white mb-1">Email Address `;
    if (email.length > 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span${attr_class(clsx(isEmailValid ? "text-green-400" : "text-red-400"))}>(${escape_html(isEmailValid ? "✓" : "valid email required")})</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> <input type="email" id="email"${attr("value", email)} required class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50" placeholder="your@email.com"></div> <div><label for="subject" class="block text-sm font-medium text-white mb-1">Subject `;
    if (subject.length > 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span${attr_class(clsx(isSubjectValid ? "text-green-400" : "text-red-400"))}>(${escape_html(isSubjectValid ? "✓" : "min 3 chars")})</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> <input type="text" id="subject"${attr("value", subject)} required minlength="3" class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50" placeholder="What's this about?"></div> <div><label for="message" class="block text-sm font-medium text-white mb-1">Message `;
    if (message.length > 0) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<span${attr_class(clsx(isMessageValid ? "text-green-400" : "text-red-400"))}>(${escape_html(isMessageValid ? "✓" : "min 10 chars")})</span>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></label> <textarea id="message" required minlength="10" rows="5" class="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-accent/50 resize-none" placeholder="Your message here...">`;
    const $$body = escape_html(message);
    if ($$body) {
      $$payload.out += `${$$body}`;
    }
    $$payload.out += `</textarea></div> `;
    {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="flex justify-center pt-2"><button type="submit"${attr("disabled", !isFormValid || isSubmitting, true)} class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2.5 px-8 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg">`;
    {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> <span>Send Message</span>`;
    }
    $$payload.out += `<!--]--></button></div></form></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  pop();
}
export {
  _page as default
};
