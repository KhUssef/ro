const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const statusMessage = document.getElementById('status-message');
const capacityInput = document.getElementById('capacity-input');
let currentRightClickNode = null;

let nodes = tempnodes.map(node => {
  return{
    'id' : 'n'+ node.id,
    'x' : node.x,
    'y' : node.y
  }
})
let edges = tempedges.map(edge => {
  return {
    'to' : 'n' + edge[0],
    'from' : "n" + edge[1],
    'capacity' : parseInt(edge[2]),
    'cost' : parseInt(edge[3])

  }
})
// Grid configuration
let gridSize = parseInt(document.getElementById('grid-size').value);
let gridSpacing;

// Edge creation state
let edgeCreationActive = false;
let edgecreationmenu = false;
let edgeFromNode = null;
let edgeToNode = null;
let tempEdgeToX = null;
let tempEdgeToY = null;
// Calculate grid spacing based on canvas size
function calculateGridSpacing() {
  return Math.min(canvas.width, canvas.height) / gridSize;
}
document.getElementById('start-node').textContent = `Start Node: ${startNode}`;
document.getElementById('end-node').textContent = `End Node: ${endNode}`;
draw();
document.getElementById('nodes-count').textContent = nodes.length;
document.getElementById('edges-count').textContent = edges.length;

// Initialize the grid
function initGrid() {
  gridSpacing = calculateGridSpacing();
  draw();
}

// Update grid size when selection changes
function updateGridSize() {
  gridSize = parseInt(document.getElementById('grid-size').value);
  gridSpacing = calculateGridSpacing();
  edges = []; // Reset edges on grid size change
  nodes = [];
  startNode = null;
  endNode = null;
  draw();
}

// Snap coordinates to grid intersection
function snapToGrid(x, y) {
  const snapX = Math.round(x / gridSpacing) * gridSpacing;
  const snapY = Math.round(y / gridSpacing) * gridSpacing;
  return { x: snapX, y: snapY };
}

// Check if point is already occupied by a node
function isPointOccupied(x, y) {
  return nodes.some(node => node.x === x && node.y === y);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // If we're in edge creation mode
  if (edgeCreationActive) {
    // Find if we clicked on a node
    const clickedNode = nodes.find(n => Math.hypot(n.x - x, n.y - y) < 10);
    
    if (clickedNode && clickedNode.id !== edgeFromNode.id) {
      // We've selected the destination node
      edgeToNode = clickedNode;
      
      // Position the capacity input form near the middle of the edge
      const midX = (edgeFromNode.x + edgeToNode.x) / 2;
      const midY = (edgeFromNode.y + edgeToNode.y) / 2;
      
      // Adjust position to be relative to the viewport
      const canvasRect = canvas.getBoundingClientRect();
      capacityInput.style.left = (canvasRect.left + midX) + 'px';
      capacityInput.style.top = (canvasRect.top + midY - 30) + 'px';
      
      // Show/hide cost input based on problem type
      const isMinCost = document.querySelector('input[value="min-cost"]').checked;
      document.getElementById('cost-input-container').style.display = isMinCost ? 'block' : 'none';
      edgecreationmenu = true;
      // Display the capacity input form
      capacityInput.style.display = 'block';
      document.getElementById('capacity-value').focus();
      
      // Hide the status message
      statusMessage.style.display = 'none';
    } else {
      // Cancel edge creation if clicked on same node or empty space
      cancelEdgeCreation();
    }
  } else {
    // Normal mode - add a new node at grid intersection
    const snapped = snapToGrid(x, y);
    
    // Only add if the position is a grid intersection and not already occupied
    if (!isPointOccupied(snapped.x, snapped.y)) {
      const node = { id: "n" + nodes.length, x: snapped.x, y: snapped.y };
      nodes.push(node);
      
      // Update node count display
      document.getElementById('nodes-count').textContent = nodes.length;
      
      draw();
    }
  }
});

// Track mouse movement for temporary edge drawing
canvas.addEventListener('mousemove', (e) => {
  if (edgeCreationActive & !edgecreationmenu) {
    const rect = canvas.getBoundingClientRect();
    tempEdgeToX = e.clientX - rect.left;
    tempEdgeToY = e.clientY - rect.top;
    draw();
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  
  // If we're in edge creation mode, cancel it
  if (edgeCreationActive) {
    cancelEdgeCreation();
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  currentRightClickNode = nodes.find(n => Math.hypot(n.x - x, n.y - y) < 10);
  if (currentRightClickNode) {
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.innerHTML = `<div id="context-menu-content">
      <button onclick="setStart('${currentRightClickNode.id}')">Set as Start</button>
      <button onclick="setEnd('${currentRightClickNode.id}')">Set as End</button>
      <button onclick="deleteNode('${currentRightClickNode.id}')">Delete Node</button>
      <button onclick="startEdgeCreation('${currentRightClickNode.id}')">Add Edge From</button>
    </div>`;
    menu.style.display = 'block';
  }
});

document.body.addEventListener('click', (e) => {
  // Hide the context menu when clicking outside
  if (!menu.contains(e.target) && e.target !== menu) {
    menu.style.display = 'none';
  }
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  drawGrid();
  
  // Draw edges
  drawAllEdges();
  
  // Draw temporary edge during creation
  if (edgeCreationActive && edgeFromNode && tempEdgeToX !== null) {
    ctx.beginPath();
    ctx.moveTo(edgeFromNode.x, edgeFromNode.y);
    ctx.lineTo(tempEdgeToX, tempEdgeToY);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
  }
  
  // Draw nodes
  for (const node of nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
    
    // Set node color based on if it's start or end
    if (node.id === startNode) {
      ctx.fillStyle = '#4CAF50'; // Green for start
    } else if (node.id === endNode) {
      ctx.fillStyle = '#F44336'; // Red for end
    } else {
      ctx.fillStyle = '#90CAF9'; // Light blue for regular nodes
    }
    
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
}

function drawGrid() {
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  
  // Draw vertical lines
  for (let x = 0; x <= canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = 0; y <= canvas.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw grid points (intersections)
  ctx.fillStyle = '#e0e0e0';
  for (let x = 0; x <= canvas.width; x += gridSpacing) {
    for (let y = 0; y <= canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function drawAllEdges() {
  // Group edges by their endpoints
  const edgeGroups = {};
  
  // Index edges by their from-to combination
  for (const edge of edges) {
    const key = `${edge.from}-${edge.to}`;
    if (!edgeGroups[key]) {
      edgeGroups[key] = [];
    }
    edgeGroups[key].push(edge);
  }
  
  // Process edge groups
  for (const key in edgeGroups) {
    const [fromId, toId] = key.split('-');
    const from = nodes.find(n => n.id === fromId);
    const to = nodes.find(n => n.id === toId);
    
    if (!from || !to) continue;
    
    // Check if there are reverse edges (to-from)
    const reverseKey = `${toId}-${fromId}`;
    const hasBidirectional = edgeGroups[reverseKey] && edgeGroups[reverseKey].length > 0;
    
    // Draw the edge(s)
    if (hasBidirectional) {
      // Draw bidirectional edges
      drawBidirectionalEdge(from, to, edgeGroups[key][0], edgeGroups[reverseKey][0]);
    } else {
      // Draw normal edge
      drawDirectionalEdge(from, to, edgeGroups[key][0]);
    }
  }
}

function drawDirectionalEdge(from, to, edge) {
  // Calculate direction
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Adjust start and end points to be at the edge of nodes
  const nodeRadius = 10;
  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);
  
  // Draw the edge line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  
  // Draw arrowhead
  const headlen = 10;
  ctx.beginPath();
  ctx.moveTo(endX - headlen * Math.cos(angle - Math.PI/6), endY - headlen * Math.sin(angle - Math.PI/6));
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI/6), endY - headlen * Math.sin(angle + Math.PI/6));
  ctx.fillStyle = '#2c3e50';
  ctx.fill();
  
  // Draw capacity/cost label
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const isMinCost = document.querySelector('input[value="min-cost"]').checked;
  
  // Draw a white background for the text
  const label = isMinCost ? `cap: ${edge.capacity}, cost: ${edge.cost}` : `cap: ${edge.capacity}`;
  ctx.font = '11px Arial';
  const textWidth = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(midX - textWidth/2 - 4, midY - 8, textWidth + 8, 16);
  
  // Draw the text
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  ctx.fillText(label, midX, midY);
  ctx.textAlign = 'start';
}
function drawBidirectionalEdge(from, to, forwardEdge, reverseEdge) {
  // Calculate direction
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const perpAngle = angle + Math.PI/2;
  
  const nodeRadius = 10;
  const headlen = 10;
  
  // Calculate single line points
  const startX = from.x + nodeRadius * Math.cos(angle);
  const startY = from.y + nodeRadius * Math.sin(angle);
  const endX = to.x - nodeRadius * Math.cos(angle);
  const endY = to.y - nodeRadius * Math.sin(angle);
  
  // Draw single line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw half-arrowhead at the end (pointing right)
  ctx.beginPath();
  ctx.moveTo(endX - headlen * Math.cos(angle - Math.PI/6), endY - headlen * Math.sin(angle - Math.PI/6));
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw half-arrowhead at the start (pointing left)
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(startX + headlen * Math.cos(angle - Math.PI/6), startY + headlen * Math.sin(angle - Math.PI/6));
  ctx.stroke();
  
  // Determine if we need to show costs
  const isMinCost = document.querySelector('input[value="min-cost"]').checked;
  
  // Calculate offset for labels
  const offsetX = 12 * Math.cos(perpAngle);
  const offsetY = 12 * Math.sin(perpAngle);
  
  // Draw forward edge label (top)
  const forwardMidX = (from.x + to.x) / 2 + offsetX;
  const forwardMidY = (from.y + to.y) / 2 + offsetY;
  const forwardLabel = isMinCost ? `cap: ${forwardEdge.capacity}, cost: ${forwardEdge.cost}` : `cap: ${forwardEdge.capacity}`;
  
  ctx.font = '11px Arial';
  const forwardTextWidth = ctx.measureText(forwardLabel).width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(forwardMidX - forwardTextWidth/2 - 4, forwardMidY - 8, forwardTextWidth + 8, 16);
  
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  ctx.fillText(forwardLabel, forwardMidX, forwardMidY);
  
  // Draw reverse edge label (bottom)
  const reverseMidX = (from.x + to.x) / 2 - offsetX;
  const reverseMidY = (from.y + to.y) / 2 - offsetY;
  const reverseLabel = isMinCost ? `cap: ${reverseEdge.capacity}, cost: ${reverseEdge.cost}` : `cap: ${reverseEdge.capacity}`;
  
  const reverseTextWidth = ctx.measureText(reverseLabel).width;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(reverseMidX - reverseTextWidth/2 - 4, reverseMidY - 8, reverseTextWidth + 8, 16);
  
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  ctx.fillText(reverseLabel, reverseMidX, reverseMidY);
  ctx.textAlign = 'start';
}

function deleteNode(id) {
  const index = nodes.findIndex(n => n.id === id);
  if (index >= 0) nodes.splice(index, 1);
  
  // Remove any edges connected to this node
  const edgesToRemove = edges.filter(e => e.from === id || e.to === id);
  for (const edge of edgesToRemove) {
    const edgeIndex = edges.indexOf(edge);
    if (edgeIndex >= 0) edges.splice(edgeIndex, 1);
  }
  
  // Update start/end nodes if necessary
  if (startNode === id) {
    startNode = null;
    document.getElementById('start-node').textContent = 'Start Node: Not set';
  }
  if (endNode === id) {
    endNode = null;
    document.getElementById('end-node').textContent = 'End Node: Not set';
  }
  
  // Update statistics
  document.getElementById('nodes-count').textContent = nodes.length;
  document.getElementById('edges-count').textContent = edges.length;
  document.getElementById('context-menu-content').remove();
  
  draw();
}

function setStart(id) {
  startNode = id;
  document.getElementById('start-node').textContent = `Start Node: ${id}`;
  document.getElementById('context-menu-content').remove();
  draw();
}

function setEnd(id) {
  endNode = id;
  document.getElementById('end-node').textContent = `End Node: ${id}`;
  document.getElementById('context-menu-content').remove();
  draw();
}
function startEdgeCreation(fromId) {
  // Hide the context menu
  menu.style.display = 'none';
  
  // Set edge creation mode
  edgeCreationActive = true;
  edgeFromNode = nodes.find(n => n.id === fromId);
  
  // Show status message
  statusMessage.textContent = `Creating edge from ${fromId}. Click on destination node.`;
  statusMessage.style.display = 'block';
  
  // Change cursor to indicate edge creation mode
  canvas.style.cursor = 'crosshair';
  document.getElementById('context-menu-content').remove();
}

function cancelEdgeCreation() {
  edgeCreationActive = false;
  edgeFromNode = null;
  edgeToNode = null;
  tempEdgeToX = null;
  tempEdgeToY = null;
  statusMessage.style.display = 'none';
  capacityInput.style.display = 'none';
  canvas.style.cursor = 'default';
  draw();
}
document.getElementById("capacity-input").addEventListener("keydown", function(event) {
    if (event.key !== "Enter") return; // Only trigger on Enter key
    event.preventDefault(); // Prevent default behavior (like form submission)
    confirmEdge(); // Call your function
});


function confirmEdge() {
  if (!edgeFromNode || !edgeToNode) return;
  
  const capacity = parseInt(document.getElementById('capacity-value').value) || 0;
  document.getElementById('capacity-value').value = 0
  const isMinCost = document.querySelector('input[value="min-cost"]').checked;
  const cost = isMinCost ? (parseInt(document.getElementById('cost-value').value) || 0) : 0;
  document.getElementById('cost-value').value = 0
  edgecreationmenu = false;
  
  // Check if there's already an edge from edgeFromNode to edgeToNode
  const existingEdgeIndex = edges.findIndex(e => 
    e.from === edgeFromNode.id && e.to === edgeToNode.id
  );
  
  // Create or update the edge
  const edge = {
    from: edgeFromNode.id,
    to: edgeToNode.id,
    capacity: capacity,
    cost: cost
  };
  
  if (existingEdgeIndex !== -1) {
    // Override the existing edge
    edges[existingEdgeIndex] = edge;
  } else {
    // Add new edge
    edges.push(edge);
  }
  
  // Update edge count (only if it's a new edge)
  if (existingEdgeIndex === -1) {
    document.getElementById('edges-count').textContent = edges.length;
  }
  
  // Reset the edge creation state
  cancelEdgeCreation();
  
  // Redraw the graph
  draw();
}

function solveProblem() {
    if (!startNode || !endNode) {
      alert("Please set both start and end nodes before solving.");
      return;
    }
  
    const problemType = document.querySelector('input[name="problem-type"]:checked').value;
  
    fetch('/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodes: nodes.map(node => {
            return{
              'id': parseInt(node.id.slice(1)),
              'x': parseInt(node.x),
              'y': parseInt(node.y)
            }
          }),  // use map to return a new array
          edges: edges.map(edge => {  // use map for edges as well
            return [
              parseInt(edge.from.slice(1)),
              parseInt(edge.to.slice(1)),
              parseInt(edge.capacity),
              parseInt(edge.cost)
            ];
          }),
          startNode: parseInt(startNode.slice(1)),
          endNode: parseInt(endNode.slice(1)),
          type: problemType
        })
      })
      .then(response => response.text())  // because Flask returns HTML
      .then(html => {
        document.open();
        document.write(html);
        document.close();
      })
      .catch(error => console.error('Error:', error));
      
  }
  

// Listen for problem type changes
document.querySelectorAll('input[name="problem-type"]').forEach(radio => {
  radio.addEventListener('change', () => {
    draw(); // Redraw to update edge labels based on problem type
  });
});

// ESC key cancels edge creation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && edgeCreationActive) {
    cancelEdgeCreation();
  }
});

// Adjust canvas size when window resizes
window.addEventListener('resize', function() {
  // Keep the canvas square but adjust to container size
  const containerWidth = canvas.parentElement.clientWidth - 40; // Accounting for padding
  canvas.width = containerWidth;
  canvas.height = containerWidth;
  
  // Recalculate grid spacing
  gridSpacing = calculateGridSpacing();
  
  draw();
});

// Initial setup
function init() {
  // Set initial canvas size
  const containerWidth = canvas.parentElement.clientWidth - 40;
  canvas.width = containerWidth;
  canvas.height = containerWidth;
  
  initGrid();
}

// Initialize on page load
window.onload = init;