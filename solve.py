import gurobipy as gp
from gurobipy import GRB

def solve_max_flow(edges, nodes, start, end):
    # Validate inputs
    if not isinstance(edges, list):
        raise ValueError("Edges must be a list")
    for edge in edges:
        if not isinstance(edge, dict) or 'from' not in edge or 'to' not in edge or 'cap' not in edge:
            raise ValueError(f"Invalid edge format: {edge}. Expected dict with 'from', 'to', and 'cap' keys")

    # Create Gurobi model
    model = gp.Model("max_flow")
    
    # Convert start and end to strings to match node IDs
    start = str(start)
    end = str(end)
    
    # Add variables for edges (flow <= capacity)
    flow_vars = {}
    for edge in edges:
        u = str(edge['from'])  # Ensure node IDs are strings
        v = str(edge['to'])
        cap = edge['cap']
        var_name = f"flow_{u}_{v}"
        flow_var = model.addVar(lb=0, ub=cap, name=var_name)
        flow_vars[(u, v)] = flow_var
    
    # Flow conservation constraints (for non-source/sink nodes)
    node_ids = {str(node['id']) for node in nodes}  # Ensure node IDs are strings
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
    
    # Objective: Maximize flow from source
    source_outflow = gp.quicksum(
        flow_vars[(start, v)] 
        for (u, v) in flow_vars 
        if u == start
    )
    model.setObjective(source_outflow, GRB.MAXIMIZE)
    
    # Solve the model
    model.optimize()
    
    # Extract results (active flows > 0.001)
    results = [
        (var.VarName, round(var.X, 3))
        for var in model.getVars()
        if var.X > 0.001
    ] if model.status == GRB.OPTIMAL else []
    
    return model, results