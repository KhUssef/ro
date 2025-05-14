from flask import Flask, request, jsonify
from flask_cors import CORS
from solve import solve_max_flow

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/api/solve', methods=['POST'])
def solve():
    print()
    data = request.get_json()    
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    startNode = data.get('startNode')
    endNode = data.get('endNode')
    session["nodes"] = nodes
    session["edges"] = edges
    session["startNode"] = startNode
    session["endNode"] = endNode
    print(edges, nodes, startNode, endNode)
    if startNode==None or endNode==None:
        return "Please set both start and end nodes", 400

    
    model, results = solve_max_flow(edges, nodes, startNode, endNode)
    objective_label = "Maximum Flow Value"
    print('model',model, 'result',results)
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