from flask import Flask, render_template, request, redirect, url_for, session
from solve import solve_max_flow

app = Flask(__name__)
app.secret_key = 'supersecretkey'

@app.route('/')
def index():
    nodes =  [{'id': 0, 'x': 259, 'y': 181}, {'id': 1, 'x': 492, 'y': 207}, {'id': 2, 'x': 337, 'y': 440}, {'id': 3, 'x': 622, 'y': 389}]
    edges1 = [[0, 1, 12.2], [1, 2, 15.6], [2, 3, 3.2]]
    edges = [{}, {}, {}]
    for i in range(3):
        edges[i]["from"] = edges1[i][0]
        edges[i]["to"] = edges1[i][1]
        edges[i]["cap"] = edges1[i][2]
    if(session.get("nodes") != None and session.get("edges")!= None and session.get("startNode") !=None and session.get("endNode") !=None):
        edges = session.get("edges")
        nodes = session.get("nodes")
        startNode = session.get("startNode") 
        endNode = session.get("endNode") 
    print(edges)
    startNode = 0
    endNode = 3
    return render_template('graph.html', edges=edges, nodes=nodes, startNode=startNode, endNode=endNode)

@app.route('/solve', methods=['POST'])
def solve():
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

    if model.status == 2:  # GRB.OPTIMAL
        return render_template('solution.html', 
                               results=results, 
                               objective=model.ObjVal,
                               objective_label=objective_label)
    else:
        return "No feasible solution found", 400

if __name__ == '__main__':
    app.run(debug=True)