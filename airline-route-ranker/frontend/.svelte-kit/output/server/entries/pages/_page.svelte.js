import { p as push, f as attr, e as escape_html, h as attr_class, i as bind_props, c as pop, j as stringify, k as copy_payload, l as assign_payload, m as ensure_array_like } from "../../chunks/index.js";
import { h as fallback } from "../../chunks/utils.js";
import "../../chunks/api.js";
function AirportInput($$payload, $$props) {
  push();
  let label = fallback($$props["label"], "");
  let value = fallback($$props["value"], "");
  let placeholder = fallback($$props["placeholder"], "");
  let icon = fallback($$props["icon"], "");
  let classes = fallback($$props["classes"], "");
  let searchTerm = "";
  let showSuggestions = false;
  $$payload.out += `<div class="relative w-full"><label class="block text-white text-sm font-bold mb-2 text-center"${attr("for", label.replace(/\s+/g, "-"))}>${escape_html(label)}</label> <div class="relative">`;
  if (icon) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="absolute left-2 top-1/2 -translate-y-1/2"><img${attr("src", icon)}${attr("alt", label)} class="h-6 w-6"></span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <input type="text"${attr("id", label.replace(/\s+/g, "-"))}${attr("value", searchTerm)}${attr("placeholder", placeholder)}${attr_class(`shadow appearance-none border rounded w-full py-2 ${stringify(icon ? "pl-10" : "pl-3")} pr-3 text-gray-700 bg-white/90 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-accent focus:border-transparent ${stringify(classes)}`)} autocomplete="off"${attr("aria-expanded", showSuggestions)} aria-autocomplete="list" aria-haspopup="listbox"${attr("aria-controls", `${label.replace(/\s+/g, "-")}-suggestions`)} role="combobox"> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { label, value, placeholder, icon, classes });
  pop();
}
function _page($$payload, $$props) {
  push();
  let origin = "AMS";
  let destination = "LHE";
  const defaultDate = /* @__PURE__ */ new Date();
  defaultDate.setDate(defaultDate.getDate() + 28);
  let travelDate = defaultDate.toISOString().split("T")[0];
  let originAirportName = "Amsterdam Airport Schiphol";
  let destinationAirportName = "Lahore Allama Iqbal International";
  const airportNames = {
    // Major International Hubs
    "AMS": "Amsterdam Airport Schiphol",
    "LHR": "London Heathrow",
    "CDG": "Paris Charles de Gaulle",
    "FRA": "Frankfurt Airport",
    "JFK": "New York John F. Kennedy",
    "LAX": "Los Angeles International",
    "ORD": "Chicago O'Hare International",
    "ATL": "Atlanta Hartsfield-Jackson",
    "DXB": "Dubai International",
    "HKG": "Hong Kong International",
    "SIN": "Singapore Changi",
    "ICN": "Seoul Incheon International",
    "PEK": "Beijing Capital International",
    "PVG": "Shanghai Pudong International",
    "NRT": "Tokyo Narita International",
    "HND": "Tokyo Haneda International",
    "SYD": "Sydney Kingsford Smith",
    "MEL": "Melbourne Airport",
    "IST": "Istanbul Airport",
    "MUC": "Munich Airport",
    "BCN": "Barcelona El Prat",
    "MAD": "Madrid Barajas",
    "FCO": "Rome Fiumicino",
    "LGW": "London Gatwick",
    "MXP": "Milan Malpensa",
    "BRU": "Brussels Airport",
    "VIE": "Vienna International",
    "ZRH": "Zurich Airport",
    "CPH": "Copenhagen Airport",
    "ARN": "Stockholm Arlanda",
    "OSL": "Oslo Gardermoen",
    "HEL": "Helsinki Vantaa",
    // Middle East & Africa
    "LHE": "Lahore Allama Iqbal International",
    "KHI": "Karachi Jinnah International",
    "ISB": "Islamabad International",
    "DEL": "Delhi Indira Gandhi International",
    "BOM": "Mumbai Chhatrapati Shivaji",
    "MAA": "Chennai International",
    "BLR": "Bengaluru Kempegowda International",
    "CCU": "Kolkata Netaji Subhas Chandra Bose",
    "HYD": "Hyderabad Rajiv Gandhi International",
    "DOH": "Doha Hamad International",
    "AUH": "Abu Dhabi International",
    "RUH": "Riyadh King Khalid International",
    "JED": "Jeddah King Abdulaziz International",
    "CAI": "Cairo International",
    "JNB": "Johannesburg O.R. Tambo",
    "CPT": "Cape Town International",
    "NBO": "Nairobi Jomo Kenyatta",
    "ADD": "Addis Ababa Bole International",
    "LOS": "Lagos Murtala Muhammed",
    // Asia Pacific
    "BKK": "Bangkok Suvarnabhumi",
    "DMK": "Bangkok Don Mueang",
    "KUL": "Kuala Lumpur International",
    "CGK": "Jakarta Soekarno-Hatta",
    "MNL": "Manila Ninoy Aquino International",
    "SGN": "Ho Chi Minh City Tan Son Nhat",
    "HAN": "Hanoi Noi Bai International",
    "TPE": "Taipei Taiwan Taoyuan",
    "CAN": "Guangzhou Baiyun International",
    "CTU": "Chengdu Shuangliu International",
    "XIY": "Xi'an Xianyang International",
    "PNH": "Phnom Penh International",
    "REP": "Siem Reap International",
    "HKT": "Phuket International",
    "DPS": "Bali Ngurah Rai International",
    "AKL": "Auckland Airport",
    "CHC": "Christchurch International",
    "WLG": "Wellington International",
    "BNE": "Brisbane International",
    "PER": "Perth Airport",
    "ADL": "Adelaide Airport",
    // North America
    "YYZ": "Toronto Pearson International",
    "YVR": "Vancouver International",
    "YUL": "Montreal Trudeau International",
    "YYC": "Calgary International",
    "SFO": "San Francisco International",
    "DFW": "Dallas/Fort Worth International",
    "MIA": "Miami International",
    "SEA": "Seattle-Tacoma International",
    "BOS": "Boston Logan International",
    "IAD": "Washington Dulles International",
    "DCA": "Washington Reagan National",
    "EWR": "Newark Liberty International",
    "IAH": "Houston George Bush Intercontinental",
    "PHX": "Phoenix Sky Harbor International",
    "MSP": "Minneapolis−Saint Paul International",
    "DTW": "Detroit Metropolitan Wayne County",
    "PHL": "Philadelphia International",
    "CLT": "Charlotte Douglas International",
    "LAS": "Las Vegas Harry Reid International",
    "DEN": "Denver International",
    "SAN": "San Diego International",
    "TPA": "Tampa International",
    "MCO": "Orlando International",
    "PDX": "Portland International",
    "MEX": "Mexico City International",
    "CUN": "Cancún International",
    "GDL": "Guadalajara International",
    // Latin America & Caribbean
    "GRU": "São Paulo Guarulhos International",
    "EZE": "Buenos Aires Ezeiza International",
    "SCL": "Santiago International",
    "BOG": "Bogotá El Dorado International",
    "LIM": "Lima Jorge Chávez International",
    "PTY": "Panama City Tocumen International",
    "MDE": "Medellín José María Córdova",
    "UIO": "Quito Mariscal Sucre International",
    "MVD": "Montevideo Carrasco International",
    "CCS": "Caracas Simón Bolívar International",
    "GIG": "Rio de Janeiro Galeão International",
    "BSB": "Brasília International",
    "CNF": "Belo Horizonte Tancredo Neves",
    "HAV": "Havana José Martí International",
    "SJU": "San Juan Luis Muñoz Marín",
    "SJO": "San José Juan Santamaría",
    "MBJ": "Montego Bay Sangster International",
    "PUJ": "Punta Cana International",
    "AUA": "Aruba Queen Beatrix International",
    "CUR": "Curaçao International",
    // European Regional
    "LIS": "Lisbon Humberto Delgado",
    "OPO": "Porto Francisco Sá Carneiro",
    "DUB": "Dublin Airport",
    "ATH": "Athens Eleftherios Venizelos",
    "SKG": "Thessaloniki Macedonia",
    "WAW": "Warsaw Chopin",
    "KRK": "Kraków John Paul II",
    "PRG": "Prague Václav Havel",
    "BUD": "Budapest Ferenc Liszt",
    "OTP": "Bucharest Henri Coandă",
    "SOF": "Sofia Airport",
    "KEF": "Reykjavík Keflavík",
    "RIX": "Riga International",
    "TLL": "Tallinn Lennart Meri",
    "VNO": "Vilnius International",
    "KBP": "Kyiv Boryspil International",
    "LED": "St. Petersburg Pulkovo",
    "SVO": "Moscow Sheremetyevo",
    "DME": "Moscow Domodedovo",
    "ZAG": "Zagreb International",
    "BEG": "Belgrade Nikola Tesla",
    "TXL": "Berlin Tegel (historical)",
    "BER": "Berlin Brandenburg",
    "HAM": "Hamburg Airport",
    "DUS": "Düsseldorf Airport",
    "STR": "Stuttgart Airport",
    "PMI": "Palma de Mallorca",
    "IBZ": "Ibiza Airport",
    "AGP": "Málaga-Costa del Sol",
    "NCE": "Nice Côte d'Azur",
    "MRS": "Marseille Provence",
    "LYS": "Lyon–Saint-Exupéry",
    "TLS": "Toulouse–Blagnac",
    "EDI": "Edinburgh Airport",
    "GLA": "Glasgow Airport",
    "BHX": "Birmingham Airport",
    "MAN": "Manchester Airport",
    "BRS": "Bristol Airport",
    "LBA": "Leeds Bradford",
    "BFS": "Belfast International",
    "ORK": "Cork Airport",
    "SNN": "Shannon Airport",
    "NAP": "Naples International",
    "PSA": "Pisa International",
    "VCE": "Venice Marco Polo",
    "BLQ": "Bologna Guglielmo Marconi",
    "CTA": "Catania-Fontanarossa"
  };
  let availableDates = [];
  let selectedCachedDate = null;
  if (origin) {
    const upperOrigin = origin.toUpperCase();
    originAirportName = airportNames[upperOrigin] || `Airport ${upperOrigin}`;
  }
  if (destination) {
    const upperDest = destination.toUpperCase();
    destinationAirportName = airportNames[upperDest] || `Airport ${upperDest}`;
  }
  let $$settled = true;
  let $$inner_payload;
  function $$render_inner($$payload2) {
    $$payload2.out += `<div class="min-h-screen bg-sky-dark bg-[url('/starry-sky.svg')] bg-cover bg-fixed bg-opacity-90 svelte-hnei5y"><header class="py-3 bg-gradient-to-r from-sky-dark/80 via-sky-dark/90 to-sky-dark/80 border-b border-sky-accent/30 sticky top-0 z-10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] svelte-hnei5y"><div class="container mx-auto px-4 flex justify-between items-center svelte-hnei5y"><div class="flex-1 flex justify-start svelte-hnei5y"><div class="hidden md:flex bg-white/5 hover:bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md svelte-hnei5y"><a href="/" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium svelte-hnei5y">Home</a></div></div> <div class="flex items-center gap-3 justify-center flex-1 svelte-hnei5y"><div class="bg-gradient-to-br from-sky-accent/30 to-flight-primary/30 rounded-full p-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse-slow backdrop-blur-sm border border-sky-accent/20 svelte-hnei5y"><img src="/plane-takeoff.svg" alt="Flight Ranking" class="h-7 w-7 transform -rotate-12 hover:rotate-0 transition-transform duration-500 svelte-hnei5y"></div> <h1 class="text-2xl font-bold text-white text-shadow-md bg-clip-text bg-gradient-to-r from-white via-white to-sky-accent/90 svelte-hnei5y"><span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary svelte-hnei5y">Flight</span> Reliability Rankings</h1></div> <nav class="hidden md:flex gap-6 justify-end flex-1 svelte-hnei5y"><div class="flex gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md svelte-hnei5y"><a href="/about" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium svelte-hnei5y">About</a> <span class="text-sky-accent/50 svelte-hnei5y">|</span> <a href="/faq" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium svelte-hnei5y">FAQ</a> <span class="text-sky-accent/50 svelte-hnei5y">|</span> <a href="/contact" class="text-white/90 hover:text-sky-accent transition-colors text-sm font-medium svelte-hnei5y">Contact</a></div></nav> <button class="md:hidden text-white flex-1 flex justify-end svelte-hnei5y"><div class="bg-white/5 hover:bg-white/15 p-2 rounded-lg transition-all duration-300 border border-white/10 shadow-sm hover:shadow-md svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" class="svelte-hnei5y"></path></svg></div></button></div></header> <div class="container mx-auto p-4 flex flex-col items-center justify-start pt-12 svelte-hnei5y" style="min-height: calc(100vh - 80px);"><div class="text-center mb-10 max-w-2xl px-4 animate-[fadeIn_0.8s_ease-in-out] svelte-hnei5y" style="animation: fadeIn 0.8s ease-in-out;"><h2 class="text-white text-2xl md:text-4xl font-medium mb-4 text-shadow-md svelte-hnei5y"><span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-accent to-flight-primary font-bold svelte-hnei5y">Know</span> Before You Go</h2> <p class="text-cloud-light/90 leading-relaxed text-sm md:text-base mb-6 svelte-hnei5y">Find the most reliable flights for your route</p> <div class="flex flex-wrap justify-center gap-2 mt-5 svelte-hnei5y"><div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" class="svelte-hnei5y"></path></svg> <span class="svelte-hnei5y">Route-Specific</span></div> <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" class="svelte-hnei5y"></path></svg> <span class="svelte-hnei5y">Daily Updates</span></div> <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" class="svelte-hnei5y"></path></svg> <span class="svelte-hnei5y">Avoid Delays</span></div> <div class="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 border border-white/10 shadow-sm svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-flight-success svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" class="svelte-hnei5y"></path></svg> <span class="svelte-hnei5y">Includes Connections</span></div></div></div> <div class="w-full max-w-2xl p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)] svelte-hnei5y"><div class="flex flex-col gap-4 svelte-hnei5y"><div class="text-center svelte-hnei5y"><h3 class="text-white font-semibold text-xl text-shadow-sm svelte-hnei5y">Compare Route Reliability</h3></div> <div class="flex flex-col md:flex-row gap-4 items-start justify-center svelte-hnei5y"><div class="w-full md:w-5/12 relative svelte-hnei5y">`;
    AirportInput($$payload2, {
      label: "From",
      placeholder: "Airport Code (e.g., AMS)",
      icon: "/plane-takeoff.svg",
      classes: "shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow",
      get value() {
        return origin;
      },
      set value($$value) {
        origin = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> <div class="text-[10px] text-white/70 text-center mt-1 svelte-hnei5y">${escape_html(originAirportName)}</div></div> <div class="hidden md:flex justify-center items-center w-10 h-10 mt-7 svelte-hnei5y"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-accent svelte-hnei5y" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" class="svelte-hnei5y"></path></svg></div> <div class="w-full md:w-5/12 relative svelte-hnei5y">`;
    AirportInput($$payload2, {
      label: "To",
      placeholder: "Airport Code (e.g., LHE)",
      icon: "/plane-landing.svg",
      classes: "shadow-md focus:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-shadow",
      get value() {
        return destination;
      },
      set value($$value) {
        destination = $$value;
        $$settled = false;
      }
    });
    $$payload2.out += `<!----> <div class="text-[10px] text-white/70 text-center mt-1 svelte-hnei5y">${escape_html(destinationAirportName)}</div></div></div> <div class="flex flex-col items-center -mt-3 svelte-hnei5y"><div class="w-full max-w-[140px] svelte-hnei5y"><div class="text-[10px] text-white/70 mb-0.5 text-center svelte-hnei5y">Date (Optional)</div> <input type="date"${attr("value", travelDate)}${attr("min", (/* @__PURE__ */ new Date()).toISOString().split("T")[0])}${attr("max", (() => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() + 90);
      return d.toISOString().split("T")[0];
    })())} class="w-full py-1 px-1.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-accent/50 shadow-sm [color-scheme:dark] svelte-hnei5y"></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    if (availableDates.length > 1) {
      $$payload2.out += "<!--[-->";
      const each_array = ensure_array_like(availableDates.filter((d) => d !== selectedCachedDate));
      $$payload2.out += `<div class="mt-2 text-xs text-white/80 text-center px-3 py-2 bg-white/10 rounded-md backdrop-blur-sm svelte-hnei5y"><div class="font-medium mb-1 svelte-hnei5y">Other cached dates available:</div> <div class="flex flex-wrap justify-center gap-1 max-w-[300px] svelte-hnei5y"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let date = each_array[$$index];
        $$payload2.out += `<button class="bg-white/10 hover:bg-white/20 rounded px-2 py-0.5 text-[10px] backdrop-blur-sm transition-colors svelte-hnei5y">${escape_html(new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</button>`;
      }
      $$payload2.out += `<!--]--></div></div>`;
    } else {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> <div class="flex justify-center mt-1 svelte-hnei5y"><button${attr("disabled", origin.length !== 3 || destination.length !== 3, true)} class="bg-gradient-to-r from-flight-primary to-sky-accent hover:from-sky-accent hover:to-flight-primary text-white font-bold py-2.5 px-8 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg svelte-hnei5y">`;
    {
      $$payload2.out += "<!--[!-->";
      $$payload2.out += `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 svelte-hnei5y" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" class="svelte-hnei5y"></path></svg> <span class="svelte-hnei5y">Find Reliable Routes</span>`;
    }
    $$payload2.out += `<!--]--></button></div></div></div> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--> `;
    {
      $$payload2.out += "<!--[!-->";
    }
    $$payload2.out += `<!--]--></div></div>`;
  }
  do {
    $$settled = true;
    $$inner_payload = copy_payload($$payload);
    $$render_inner($$inner_payload);
  } while (!$$settled);
  assign_payload($$payload, $$inner_payload);
  pop();
}
export {
  _page as default
};
