import gurobipy as gp
from gurobipy import GRB

class Solver:
    def __init__(self, data):
        self.data = data
        self.villes = data['villes']
        self.model = None
        self.x_U = None
        self.y = None
        # Create a mapping of city names to indices
        self.city_indices = {city: idx for idx, city in enumerate(self.villes)}
        
    def build_model(self):
        # Create model
        self.model = gp.Model("Selection d'usines et entrepôts")
        
        # Create variables
        self.x_U = self.model.addVars(self.villes, vtype=GRB.BINARY, name="usine")
        self.y = self.model.addVars(self.villes, vtype=GRB.BINARY, name="entrepot_ville")
        
        # Add a variable to track budget utilization
        self.budget_utilization = self.model.addVar(name="budget_utilization")
        
        # Set objective: maximize profitability and budget utilization
        # Using a small weight (0.001) for budget utilization to make it secondary to profitability
        self.model.setObjective(
            gp.quicksum(self.data['rentabilite_usine'][self.city_indices[i]] * self.x_U[i] for i in self.villes) +
            gp.quicksum(self.data['rentabilite_entrepot'][self.city_indices[i]] * self.y[i] for i in self.villes) +
            0.001 * self.budget_utilization,
            GRB.MAXIMIZE
        )
        
        # Add constraints
        self._add_constraints()
    
    def _add_constraints(self):
        # Budget constraint - must not exceed total budget, but track utilization
        total_cost = gp.quicksum(self.data['couts_usine'][self.city_indices[i]] * self.x_U[i] for i in self.villes) + \
                     gp.quicksum(self.data['couts_entrepot'][self.city_indices[i]] * self.y[i] for i in self.villes)
        
        # Set budget_utilization equal to the total cost (to maximize in objective)
        self.model.addConstr(self.budget_utilization == total_cost, "Budget_Utilization")
        
        # Don't exceed budget
        self.model.addConstr(total_cost <= self.data['budget_total'], "Budget_Limit")
        
        # Warehouse-factory linkage
        for i in self.villes:
            self.model.addConstr(self.y[i] <= self.x_U[i], name=f"Entrepot_Liaison_{i}")
        
        if len(self.villes) > 1:
            self.model.addConstr(
                gp.quicksum(self.y[i] for i in self.villes) >= 1,
                name="Min_One_Entrepot_If_Factory"
            )
        
        # Distance constraints for factories
        distances = self.data['distances']
        distance_min = self.data['distance_min_usines']
        
        for i in range(len(self.villes)):
            for j in range(i+1, len(self.villes)):
                ville_i = self.villes[i]
                ville_j = self.villes[j]
                distance_ij = distances.get(tuple(sorted((ville_i, ville_j))), float('inf'))
                
                # Factory minimum distance constraint
                if distance_ij < distance_min:
                    self.model.addConstr(self.x_U[ville_i] + self.x_U[ville_j] <= 1, 
                                        name=f"Dist_Min_Usines_{ville_i}_{ville_j}")
                
                # Warehouse minimum distance constraint - fixed at 30 km
                if distance_ij < 30:  # Fixed 30 km distance for warehouses
                    self.model.addConstr(self.y[ville_i] + self.y[ville_j] <= 1, 
                                        name=f"Dist_Min_Entrepots_{ville_i}_{ville_j}")
    
    def solve(self):
        self.model.optimize()
        return self._format_results()
    
    def _format_results(self):
        if self.model.status == GRB.OPTIMAL:
            results = {
                'usines': [ville for ville in self.villes if self.x_U[ville].x > 0.5],
                'entrepots': [ville for ville in self.villes if self.y[ville].x > 0.5],
                'profitabilite': self.model.objVal,
                'budget_utilise': sum(
                    self.data['couts_usine'][self.city_indices[ville]] * self.x_U[ville].x +
                    self.data['couts_entrepot'][self.city_indices[ville]] * self.y[ville].x
                    for ville in self.villes
                )
            }
            return results
        return None