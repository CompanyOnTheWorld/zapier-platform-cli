const readline = require('readline');

const Table = require('cli-table2');
const colors = require('colors/safe');
const _ = require('lodash');


const rewriteLabels = (rows, columnDefs) => {
  return rows.map((row) => {
    const consumptionRow = {};
    columnDefs.forEach((columnDef) => {
      const [label, key] = columnDef;
      let val = row[key];
      consumptionRow[label] = val;
    });
    return consumptionRow;
  });
};

// Wraps the cli-table2 library. Rows is an array of objects, columnDefs
// an ordered sub-array [[label, key, (optional_default)], ...].
const makeTable = (rows, columnDefs) => {
  const table = new Table({
    style: {
      compact: true,
      head: ['bold']
    }
  });

  const numColumns = columnDefs.length + 1;

  rows.forEach((row, index) => {
    table.push([{colSpan: 2, content: `= ${index + 1} =`}]);

    columnDefs.forEach((columnDef) => {
      const consumptionRow = {};
      const [label, key, _default] = columnDef;
      const val = String(_.get(row, key || label, _default || '')).trim();

      if (val) {
        consumptionRow['    ' + label] = val;
        table.push(consumptionRow);
      }
    });

    if (index < rows.length - 1) {
      table.push([{colSpan: 2, content: '  '}]);
    }
  });

  return table.toString().trim();
};

const printData = (rows, columnDefs, ifEmptyMessage) => {
  if (rows && !rows.length) {
    console.log(ifEmptyMessage);
  } else if (global.argOpts.json) {
    console.log(prettyJSONstringify(rewriteLabels(rows, columnDefs)));
  } else if (global.argOpts['json-raw']) {
    console.log(prettyJSONstringify(rows));
  } else {
    console.log(makeTable(rows, columnDefs));
  }
};

const prettyJSONstringify = (obj) => {
  return JSON.stringify(obj, null, '  ');
};

let spinner;
let currentIter = 0;
const spinSpeed = 80;
// const spinTransitions = [
//   '   ',
//   '.  ',
//   '.. ',
//   '...',
// ];
// const spinTransitions = [
//   ' \\',
//   ' |',
//   ' /',
//   ' -',
// ];
const spinTransitions = [
  ' ⠃',
  ' ⠉',
  ' ⠘',
  ' ⠰',
  ' ⠤',
  ' ⠆',
];
const finalTransition = ' -'; // spinTransitions[0];

const clearSpinner = () => {
  process.stdout.write('\x1b[?25h'); // set cursor to white...
  clearInterval(spinner);
};

const writeNextSpinnerTick = (final = false) => {
  readline.moveCursor(process.stdout, -spinTransitions[currentIter].length, 0);
  currentIter++;
  if (currentIter >= spinTransitions.length) { currentIter = 0; }
  process.stdout.write(final ? finalTransition : spinTransitions[currentIter]);
};

const printStarting = (msg) => {
  process.stdout.write('  ' + msg + spinTransitions[currentIter]);
  clearSpinner();
  process.stdout.write('\x1b[?25l'); // set cursor to black...
  spinner = setInterval(() => {
    writeNextSpinnerTick();
  }, spinSpeed);
};

const printDone = (success = true) => {
  if (!spinner) { return; }
  clearSpinner();
  writeNextSpinnerTick(true);
  console.log(success ? colors.green(' done!') : colors.red(' fail!'));
};

// Get input from a user.
const getInput = (question) => {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

module.exports = {
  makeTable,
  printData,
  prettyJSONstringify,
  clearSpinner,
  printStarting,
  printDone,
  getInput,
};
