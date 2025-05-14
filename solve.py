import gurobipy as gp
from gurobipy import GRB

def solve_max_flow(edges, nodes, start, end):
    if not isinstance(edges, list):
        raise ValueError("Edges must be a list")
    for edge in edges:
        if not isinstance(edge, dict) or 'from' not in edge or 'to' not in edge or 'cap' not in edge:
            raise ValueError(f"Invalid edge format: {edge}. Expected dict with 'from', 'to', and 'cap' keys")

    model = gp.Model("max_flow")
    start = str(start)
    end = str(end)
    
    flow_vars = {}
    for edge in edges:
        u = str(edge['from'])  
        v = str(edge['to'])
        cap = edge['cap']
        var_name = f"flow_{u}_{v}"
        flow_var = model.addVar(lb=0, ub=cap, name=var_name)
        flow_vars[(u, v)] = flow_var
    
    node_ids = {str(node['id']) for node in nodes}  
    for node in node_ids:
        if node == start or node == end:
            continue
        
        inflow = gp.quicksum(
            flow_vars[(u, node)] 
            for (u, v) in flow_vars 
            if v == node
        )
        
        outflow = gp.quicksum(
            flow_vars[(node, v)] 
            for (u, v) in flow_vars 
            if u == node
        )
        
        model.addConstr(inflow == outflow, name=f"conservation_{node}")
    
    source_outflow = gp.quicksum(
        flow_vars[(start, v)] 
        for (u, v) in flow_vars 
        if u == start
    )
    model.setObjective(source_outflow, GRB.MAXIMIZE)
    
    model.optimize()
    
    results1 = [
        (var.VarName, round(var.X, 3))
        for var in model.getVars()
        if var.X > 0.001
    ] if model.status == GRB.OPTIMAL else []
    results = []
    for i in results1 :
        print(i)
        temp = i[0].split('_')
        results.append({'from' : temp[1], 'to' : temp[2], 'cap' : i[1]})
    print(results) 
    return model, results