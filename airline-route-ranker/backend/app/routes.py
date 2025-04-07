# Sort routes by total duration
sorted_routes = sorted(routes, key=lambda x: x["total_duration"])

# Add a secondary sort by price to ensure consistent ordering
# when multiple routes have the same duration
sorted_routes = sorted(sorted_routes, 
                       key=lambda x: (
                           x["total_duration"],  # Primary: duration (lowest first)
                           float(x.get("price", {}).get("amount", "9999")),  # Secondary: price (lowest first) 
                           "-".join(x.get("operating_flight_numbers", []))  # Tertiary: flight numbers (for stability)
                       ))

# Limit to the requested number of routes
top_routes = sorted_routes[:max_routes] 