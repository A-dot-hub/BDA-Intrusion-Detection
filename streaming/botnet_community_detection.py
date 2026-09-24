import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities
import matplotlib.pyplot as plt
import random
import networkx as nx
from networkx.algorithms.community import greedy_modularity_communities
import matplotlib
matplotlib.use('Agg') # Forces matplotlib to render to a file instead of a UI window
import matplotlib.pyplot as plt
import random

print("[*] Initializing Graph Analytics Engine...")
G = nx.Graph()

# 1. Simulate Normal Network Traffic (Random, loose connections)
print("[*] Ingesting normal background traffic logs...")
normal_ips = [f"192.168.1.{i}" for i in range(1, 20)]
for _ in range(30):
    src = random.choice(normal_ips)
    dst = random.choice(normal_ips)
    if src != dst:
        G.add_edge(src, dst)

# 2. Simulate Botnet Traffic (Command & Control Star Topology)
# A single C2 server controlling multiple infected bot machines
print("[*] Ingesting suspicious distributed traffic (simulated botnet)...")
c2_server = "104.16.207.165" # Using an IP from your MapReduce baseline
bot_ips = [f"10.0.0.{i}" for i in range(1, 15)]

# The bots communicate with the C2 server
for bot in bot_ips:
    G.add_edge(bot, c2_server)
    
# Some bots communicate with each other (peer-to-peer mesh)
for _ in range(10):
    G.add_edge(random.choice(bot_ips), random.choice(bot_ips))

print(f"\n[+] Network Graph Built: {G.number_of_nodes()} Nodes (IPs) and {G.number_of_edges()} Edges (Connections).")

# 3. Perform Community Detection
print("\n[*] Running Community Detection Algorithm (Greedy Modularity)...")
communities = list(greedy_modularity_communities(G))

print(f"[+] Detected {len(communities)} distinct sub-networks (communities).")

# 4. Analyze Results and Flag Botnets
botnet_community = None
for i, community in enumerate(communities):
    print(f"\n--- Community {i + 1} ---")
    print(f"Size: {len(community)} nodes")
    
    # If the C2 server is in this community, flag it
    if c2_server in community:
        botnet_community = community
        print(f"[CRITICAL] Command & Control Server ({c2_server}) found in this cluster!")
        print(f"[ALERT] Flagging {len(community) - 1} connected IPs as compromised bots.")
    else:
        print("[OK] Normal traffic cluster.")

# 5. Visualize the Topology
print("\n[*] Generating Topology Visualization...")
plt.figure(figsize=(10, 8))

# Assign colors: Red for the botnet, Green for normal traffic
node_colors = []
for node in G.nodes():
    if botnet_community and node in botnet_community:
        node_colors.append('red')
    else:
        node_colors.append('lightgreen')

# Draw the graph
pos = nx.spring_layout(G, k=0.15, iterations=20)
nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=300, alpha=0.8)
nx.draw_networkx_edges(G, pos, width=1.0, alpha=0.5)

# Only label the C2 server for clarity
labels = {c2_server: c2_server}
nx.draw_networkx_labels(G, pos, labels, font_size=10, font_weight="bold")

plt.title("Network Topology: Botnet Community Detection")
plt.axis("off")

# Save the plot instead of trying to open a window
output_image = "botnet_topology.png"
plt.savefig(output_image, format="PNG", dpi=300)
print(f"[+] Network topology mapped and saved as '{output_image}'.")
