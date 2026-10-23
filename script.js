const TOWNS = {
  "Chitipa": { x: 300, y: 60 },
  "Karonga": { x: 285, y: 150 },
  "Rumphi": { x: 270, y: 240 },
  "Mzuzu": { x: 255, y: 330 },
  "Nkhata Bay": { x: 350, y: 370 },
  "Kasungu": { x: 235, y: 470 },
  "Nkhotakota": { x: 350, y: 500 },
  "Ntchisi": { x: 265, y: 545 },
  "Dowa": { x: 205, y: 545 },
  "Mchinji": { x: 120, y: 590 },
  "Lilongwe": { x: 205, y: 620 },
  "Salima": { x: 330, y: 630 },
  "Dedza": { x: 225, y: 700 },
  "Ntcheu": { x: 235, y: 760 },
  "Balaka": { x: 265, y: 815 },
  "Mangochi": { x: 370, y: 790 },
  "Liwonde": { x: 315, y: 835 },
  "Zomba": { x: 330, y: 880 },
  "Blantyre": { x: 255, y: 915 },
  "Mulanje": { x: 330, y: 940 },
  "Chikwawa": { x: 190, y: 960 },
  "Nsanje": { x: 160, y: 1030 }
};

const ROADS = [
  ["Chitipa", "Karonga", 105],
  ["Karonga", "Rumphi", 105],
  ["Rumphi", "Mzuzu", 65],
  ["Mzuzu", "Nkhata Bay", 56],
  ["Mzuzu", "Kasungu", 220],
  ["Kasungu", "Nkhotakota", 90],
  ["Kasungu", "Dowa", 80],
  ["Kasungu", "Lilongwe", 130],
  ["Nkhotakota", "Salima", 100],
  ["Ntchisi", "Dowa", 50],
  ["Dowa", "Lilongwe", 55],
  ["Lilongwe", "Salima", 100],
  ["Mchinji", "Lilongwe", 110],
  ["Lilongwe", "Dedza", 85],
  ["Dedza", "Ntcheu", 55],
  ["Ntcheu", "Balaka", 100],
  ["Salima", "Mangochi", 140],
  ["Mangochi", "Balaka", 100],
  ["Mangochi", "Liwonde", 70],
  ["Balaka", "Liwonde", 40],
  ["Liwonde", "Zomba", 50],
  ["Balaka", "Blantyre", 140],
  ["Zomba", "Blantyre", 65],
  ["Zomba", "Mulanje", 90],
  ["Blantyre", "Mulanje", 55],
  ["Blantyre", "Chikwawa", 50],
  ["Chikwawa", "Nsanje", 90]
];

const svg = document.getElementById("roadMap");
const roadElements = {};
const townElements = {};

function createSvgElement(tag, attributes) {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    tag
  );

  for (const key in attributes) {
    element.setAttribute(key, attributes[key]);
  }

  return element;
}

function drawRoads() {
  ROADS.forEach(([townA, townB, distance]) => {
    const pointA = TOWNS[townA];
    const pointB = TOWNS[townB];

    const line = createSvgElement("line", {
      x1: pointA.x,
      y1: pointA.y,
      x2: pointB.x,
      y2: pointB.y,
      class: "road"
    });

    svg.appendChild(line);

    roadElements[`${townA}-${townB}`] = line;
    roadElements[`${townB}-${townA}`] = line;

    const middleX = (pointA.x + pointB.x) / 2;
    const middleY = (pointA.y + pointB.y) / 2;

    const label = createSvgElement("text", {
      x: middleX,
      y: middleY - 5,
      class: "road-label"
    });

    label.textContent = distance;
    svg.appendChild(label);
  });
}

function drawTowns() {
  for (const town in TOWNS) {
    const point = TOWNS[town];

    const circle = createSvgElement("circle", {
      cx: point.x,
      cy: point.y,
      r: 9,
      class: "town"
    });

    svg.appendChild(circle);

    const label = createSvgElement("text", {
      x: point.x,
      y: point.y - 15,
      class: "town-label"
    });

    label.textContent = town;
    svg.appendChild(label);

    townElements[town] = circle;
  }
}

function buildGraph() {
  const graph = {};

  for (const town in TOWNS) {
    graph[town] = [];
  }

  ROADS.forEach(([townA, townB, distance]) => {
    graph[townA].push({ town: townB, distance });
    graph[townB].push({ town: townA, distance });
  });

  return graph;
}

function dijkstra(graph, source, destination) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const priorityQueue = [];

  for (const town in graph) {
    distances[town] = Infinity;
    previous[town] = null;
  }

  distances[source] = 0;
  priorityQueue.push({ town: source, distance: 0 });

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => a.distance - b.distance);

    const { town: currentTown, distance: currentDistance } =
      priorityQueue.shift();

    if (visited.has(currentTown)) {
      continue;
    }

    visited.add(currentTown);

    if (currentTown === destination) {
      break;
    }

    graph[currentTown].forEach(neighbour => {
      const newDistance = currentDistance + neighbour.distance;

      if (newDistance < distances[neighbour.town]) {
        distances[neighbour.town] = newDistance;
        previous[neighbour.town] = currentTown;

        priorityQueue.push({
          town: neighbour.town,
          distance: newDistance
        });
      }
    });
  }

  if (distances[destination] === Infinity) {
    return {
      found: false,
      distance: null,
      path: []
    };
  }

  const path = [];
  let current = destination;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    found: true,
    distance: distances[destination],
    path
  };
}

function clearRouteHighlight() {
  for (const town in townElements) {
    townElements[town].classList.remove(
      "source-town",
      "destination-town",
      "route-town"
    );
  }

  for (const road in roadElements) {
    roadElements[road].classList.remove("route-road");
  }
}

function highlightRoute(path, source, destination) {
  clearRouteHighlight();

  townElements[source].classList.add("source-town");
  townElements[destination].classList.add("destination-town");

  for (let i = 0; i < path.length - 1; i++) {
    const townA = path[i];
    const townB = path[i + 1];

    roadElements[`${townA}-${townB}`].classList.add("route-road");
    townElements[townA].classList.add("route-town");
    townElements[townB].classList.add("route-town");
  }

  townElements[source].classList.add("source-town");
  townElements[destination].classList.add("destination-town");
}

function populateTownDropdowns() {
  const sourceSelect = document.getElementById("source");
  const destinationSelect = document.getElementById("destination");

  for (const town in TOWNS) {
    const sourceOption = document.createElement("option");
    sourceOption.value = town;
    sourceOption.textContent = town;
    sourceSelect.appendChild(sourceOption);

    const destinationOption = document.createElement("option");
    destinationOption.value = town;
    destinationOption.textContent = town;
    destinationSelect.appendChild(destinationOption);
  }
}

function showError(message) {
  const errorBox = document.getElementById("errorBox");
  const resultBox = document.getElementById("resultBox");

  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resultBox.classList.add("hidden");
  document.getElementById("resultSection").classList.remove("hidden");
}

function showResult(distance, path) {
  const errorBox = document.getElementById("errorBox");
  const resultBox = document.getElementById("resultBox");
  const distanceText = document.getElementById("distanceText");
  const routeText = document.getElementById("routeText");
  const townCountText = document.getElementById("townCountText");

  errorBox.classList.add("hidden");
  resultBox.classList.remove("hidden");
  document.getElementById("resultSection").classList.remove("hidden");

  distanceText.textContent = `Shortest distance: ${distance} km`;
  routeText.textContent = `Route: ${path.join(" → ")}`;
  townCountText.textContent = `Towns on route: ${path.length}`;
}

function resetMap() {
  document.getElementById("routeForm").reset();
  document.getElementById("resultSection").classList.add("hidden");
  document.getElementById("errorBox").classList.add("hidden");
  document.getElementById("resultBox").classList.add("hidden");
  clearRouteHighlight();
}

document.addEventListener("DOMContentLoaded", () => {
  const graph = buildGraph();

  drawRoads();
  drawTowns();
  populateTownDropdowns();

  document.getElementById("routeForm").addEventListener("submit", event => {
    event.preventDefault();

    const source = document.getElementById("source").value;
    const destination = document.getElementById("destination").value;

    if (!source) {
      showError("Please select a source town.");
      return;
    }

    if (!destination) {
      showError("Please select a destination town.");
      return;
    }

    if (source === destination) {
      clearRouteHighlight();
      townElements[source].classList.add("source-town");
      townElements[destination].classList.add("destination-town");
      showResult(0, [source]);
      return;
    }

    const result = dijkstra(graph, source, destination);

    if (!result.found) {
      showError(`No route was found from ${source} to ${destination}.`);
      return;
    }

    highlightRoute(result.path, source, destination);
    showResult(result.distance, result.path);
  });

  document.getElementById("resetButton").addEventListener("click", resetMap);
});