from flask import Flask, render_template, request, redirect, url_for, session
from solve import solve_max_flow, solve_min_cost

app = Flask(__name__)
app.secret_key = 'supersecretkey'

@app.route('/')
def index():
    nodes =  [{'id': 0, 'x': 259, 'y': 181}, {'id': 1, 'x': 492, 'y': 207}, {'id': 2, 'x': 337, 'y': 440}, {'id': 3, 'x': 622, 'y': 389}]
    edges = [[0, 1, 12, 0], [1, 2, 15, 0], [2, 3, 3, 0]]
    startNode = 0
    endNode = 3
    if 'nodes' in session.keys() and 'edges' in session.keys():
        nodes = session["nodes"]
        edges = session["edges"]
    return render_template('graph.html', edges=edges, nodes=nodes, startNode=startNode, endNode=endNode)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.get_json()
    problem_type = request.args.get('type', 'max-flow')
    
    edges = data.get('edges', [])
    nodes = data.get('nodes', [])
    start = data.get('startNode')
    end = data.get('endNode')
    session["nodes"] = nodes
    session["edges"] = edges
    session["start"] = start
    session["end"] = end
    print(edges, nodes, start, end)
    if start==None or end==None:
        return "Please set both start and end nodes", 400

    if problem_type == 'max-flow':
        model, results = solve_max_flow(edges, nodes, start, end)
        objective_label = "Maximum Flow Value"
    else:
        model, results = solve_min_cost(edges, nodes, start, end)
        objective_label = "Minimum Cost"

    if model.status == 2:  # GRB.OPTIMAL
        return render_template('solution.html', 
                               results=results, 
                               objective=model.ObjVal,
                               objective_label=objective_label)
    else:
        return "No feasible solution found", 400

if __name__ == '__main__':
    app.run(debug=True)