from flask import Flask, request, jsonify
from flask_cors import CORS
from solve import solve_max_flow
from ROOOOOOOO import Solver

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

    model, results = solve_max_flow(formatted_edges, nodes, startNode, endNode)

    if model.status == 2:  
        
        print("Returning results:", results)
        return jsonify({
            "results": results,
            "objective": model.ObjVal,
            "objective_label": "Maximum Flow Value"
        })
    else:
        return jsonify({"error": "No feasible solution found"}), 400
@app.route('/solve', methods=['POST'])
def solve_optimization():
    try:
        data = request.get_json()
        
        print("Received data:", data)
        
        required_fields = [
            'villes', 'couts_usine', 'couts_entrepot',
            'rentabilite_usine', 'rentabilite_entrepot',
            'budget_total', 'distances', 'distance_min_usines'
        ]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        distances = {}
        for d in data['distances']:
            key = tuple(sorted((d['from'], d['to'])))
            distances[key] = d['distance']
        data['distances'] = distances
        
        print("Data after distances conversion:", data)
        
        try:
            solver = Solver(data)
            solver.build_model()
            results = solver.solve()
        except Exception as solver_error:
            print("Solver error:", str(solver_error))
            print("Traceback:", traceback.format_exc())
            return jsonify({"error": f"Solver error: {str(solver_error)}"}), 500
        
        if results:
            return jsonify({
                "usines_construites": results['usines'],
                "entrepots_construits": results['entrepots'],
                "profitabilite_totale": results['profitabilite'],
                "budget_utilise": results['budget_utilise'],
                "budget_total": data['budget_total']
            })
        else:
            return jsonify({"error": "Aucune solution optimale trouvée"}), 400
            
    except Exception as e:
        print("General error:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True, port=5000)