from gurobipy import Model, GRB
from gurobipy import Model, GRB
from gurobipy import Model, GRB

def solve_max_flow(edges, nodes, start, end):
    model = Model("MaxFlow")
    x = {}
    edge_count = {}  # To count occurrences of the same edge

    # Create variables for edges
    for from_node, to_node, cap, _ in edges:
        # Ensure cap is a number (float or int)
        print(cap)
        print(type(cap))
        cap = float(cap)  # Convert to float if it's not already
        # Handle duplicate edges by giving them a unique name
        edge_key = (from_node, to_node)
        if edge_key not in edge_count:
            edge_count[edge_key] = 0
        edge_count[edge_key] += 1

        # Unique variable name using the edge count
        var_name = f"x_{from_node}_{to_node}_{edge_count[edge_key]}"
        x[(from_node, to_node, edge_count[edge_key])] = model.addVar(lb=0, ub=cap, name=var_name)

    # Objective: maximize total outflow from source
    model.setObjective(
        sum(var for (i, j, k), var in x.items() if i == start),
        GRB.MAXIMIZE
    )

    # Flow conservation constraints
    for node in nodes:
        if node in (start, end):
            continue
        inflow = sum(var for (i, j, k), var in x.items() if j == node)
        outflow = sum(var for (i, j, k), var in x.items() if i == node)

        model.addConstr(inflow == outflow)

    model.optimize()

    results = [
        (var.VarName, var.X)
        for var in model.getVars()
        if var.X > 0.001
    ]

    return model, results

def solve_min_cost(edges, nodes, start, end):
    model = Model("MinCostFlow")
    x = {}

    for from_node, to_node, cap, cost in edges:
        x[(from_node, to_node)] = model.addVar(lb=0, ub=cap, name=f"x_{from_node}_{to_node}")

    # Flow conservation
    for node in nodes:
        inflow = sum(x[(i, j)] for (i, j, _, _) in edges if j == node)
        outflow = sum(x[(i, j)] for (i, j, _, _) in edges if i == node)
        rhs = 0
        if node == start:
            rhs = -1
        elif node == end:
            rhs = 1
        model.addConstr(outflow - inflow == rhs)

    # Objective: minimize cost
    model.setObjective(
        sum(cost * x[(i, j)] for (i, j, _, cost) in edges),
        GRB.MINIMIZE
    )

    model.optimize()

    results = [
        (var.VarName, var.X)
        for var in model.getVars()
        if var.X > 0.001
    ]

    return model, results
