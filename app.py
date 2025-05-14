from flask import Flask, request, jsonify
from flask_cors import CORS
from solve import solve_max_flow

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.get_json()
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    startNode = data.get('startNode')
    endNode = data.get('endNode')

    # Debug: Log the incoming data
    print("Received data:", {
        "edges": edges,
        "nodes": nodes,
        "startNode": startNode,
        "endNode": endNode
    })

    if startNode is None or endNode is None:
        return jsonify({"error": "Please set both start and end nodes"}), 400

    # Format edges as a list of dictionaries to match solve_max_flow's expectation
    formatted_edges = []
    for edge in edges:
        from_node = edge.get('from')
        to_node = edge.get('to')
        cap = edge.get('cap', 10)  # Default capacity if not provided
        if from_node is not None and to_node is not None:
            formatted_edges.append({
                "from": from_node,
                "to": to_node,
                "cap": cap
            })

    # Pass formatted edges to solve_max_flow
    model, results = solve_max_flow(formatted_edges, nodes, startNode, endNode)

    if model.status == 2:  # GRB.OPTIMAL
        # Map results back to the original edge names
        mapped_results = []
        for var_name, value in results:
            if var_name.startswith('flow_'):
                mapped_results.append([var_name, str(value)])
            else:
                print(f"Unexpected variable name: {var_name}")
        print("Returning results:", mapped_results)
        return jsonify({
            "results": mapped_results,
            "objective": model.ObjVal,
            "objective_label": "Maximum Flow Value"
        })
    else:
        return jsonify({"error": "No feasible solution found"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)