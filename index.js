function addRow(table, entry) {
  const row = table.insertRow(0);
  const psCell = document.createElement("td");
  const fnCell = document.createElement("td");
  const familyCell = document.createElement("td");
  psCell.innerText = entry.postScriptName;
  fnCell.innerText = entry.fullName;
  familyCell.innerText = entry.family;
  row.appendChild(psCell);
  row.appendChild(fnCell);
  row.appendChild(familyCell);
}

function run(runName, metrics) {
  const runsCount = document.querySelector("#runs-count");
  const runs = parseInt(runsCount.options[runsCount.selectedIndex].value, 10);
  if (runName == 'async') {
    return countAsync(runs, metrics);
  } else if (runName == 'sync'){
    return count(runs, metrics, /*runNameOverride=*/null);
  } else {
    // Priming the cache.
    return count(1, /*metrics=*/null, /*runNameOverride=*/runName);
  }
}

async function runBoth() {
  if (!navigator.fonts) {
    alert("Font Access API not detected. Will not work.");
    return;
  }
  const status = document.querySelector('#status');
  status.innerText = "Running...";
  run('priming cache');

  let metrics = [];
  const promise = run('async', metrics);
  metrics = run('sync', metrics);
  metrics = await promise;

  updateMetricsResults(metrics);
  status.innerText = "";
}

function clearAll() {
  let tbody = document.querySelector("#runs tbody");
  tbody.innerText = "";
}

function updateMetricsResults(metrics) {
  const pre = document.querySelector('#metrics-data');
  pre.innerText = JSON.stringify(metrics);
  insertSaveButton(metrics);
}

function insertSaveButton(data) {
  if (!window.chooseFileSystemEntries) {
    alert("Native Filesystem API not detected. Will not work. Copy/Paste instead.");
    return;
  }

  const saveArea = document.querySelector('#save-area');
  const button = document.createElement("button");
  button.addEventListener('click', ((data) => {
    return async () => {
      const handle = await window.chooseFileSystemEntries({type: "save-file"});
      const writer = await handle.createWritable();
      writer.write(JSON.stringify(data));
      writer.close();
    };
  })(data));
  button.innerText = "Save Data";

  saveArea.innerHTML = ""; // Clear previous results.
  saveArea.appendChild(button);
}

function updateMetrics(testName, elapsed, metrics) {
  let data = {};
  data[testName] = {elapsed_time_ms: elapsed};
  metrics.push(data);
}

function updateRunsTable(runName, count, elapsed) {
  const table = document.querySelector("#runs tbody");
  const row = document.createElement("tr");
  const runsCell = document.createElement("td");
  const countCell = document.createElement("td");
  const elapsedCell = document.createElement("td");
  const perRunElapsedCell = document.createElement("td");
  const bytesCell = document.createElement("td");

  runsCell.innerText = runName;
  countCell.innerText = count;
  elapsedCell.innerText = `${elapsed} ms`; // Already rounded before.
  perRunElapsedCell.innerText = `${(elapsed / count).toFixed(2)} ms`;

  row.appendChild(runsCell);
  row.appendChild(countCell);
  row.appendChild(elapsedCell);
  row.appendChild(perRunElapsedCell);

  table.appendChild(row);
}

function updateElapsed(runName, count, elapsed, metrics = null) {
  elapsedRounded = (elapsed * 1000);

  if (metrics) {
    const testName = `font_enumeration.${runName}`;
    updateMetrics(testName, elapsedRounded, metrics);
  }

}

async function countAsync(runs = 1, metrics = null) {
  const table = document.querySelector("#fonts tbody");
  let overall_start = performance.now();
  for (let i = 0; i < runs; i++) {
    let start = performance.now();
    for await (const entry of navigator.fonts.query()) {
      // NOOP
    }
    let elapsed = performance.now() - start;
    updateElapsed("async", runs, elapsed, metrics);
  }
  let overall_elapsed = performance.now() - overall_start;
  updateRunsTable("async", runs, overall_elapsed.toFixed(2));

  return metrics;
}

function count(runs = 1, metrics = null, runNameOverride = null) {
  return metrics;
}
