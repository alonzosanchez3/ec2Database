const LoremIpsum = require('lorem-ipsum').LoremIpsum;
const db = require('./postgres.js');
const contains = require('validator/lib/contains');
const fs = require('fs');
const filename = 'summary.csv';
const stream = fs.createWriteStream(filename);
const fastcsv = require('fast-csv')
const args = require('minimist')(process.argv.slice(2));


const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 6,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 8
  },
  suffix: " "
});

const createSummary = () => {
  // for (let i = 0; i < 100; i++) {
  const paragraphLength = Math.floor(Math.random() * 2 + 2);
  const shortSummarySentenceLength = Math.floor(Math.random() * 4 + 3);
  const copyrightWordsLength = Math.floor(Math.random() * 2 + 2);
  let summary = lorem.generateParagraphs(paragraphLength);
  summary = summary.replace(/\n/g,' ');
  let short_summary = lorem.generateSentences(shortSummarySentenceLength);
  short_summary = short_summary.replace(/\n/g,' ');
  const year = Math.floor(Math.random() * 81) + 1940;
  const copyright = '©' + year + ' ' + lorem.generateWords(copyrightWordsLength) + ' (P)' + (year + Math.floor(Math.random() * 5 + 4)) + ' ' + lorem.generateWords(copyrightWordsLength);
  let row = `${summary},${short_summary},${copyright}\n`;
  return row;
  // }
};

function writeToCsvFile() {
  let rows = 1000;
  for (let index = 0; index <= rows; index++) {
    stream.write(createSummary(), 'utf-8')
  }
  stream.end();
}

function seedDatabase() {
  let csvData = [];
  return (
    fastcsv
    .parse()
    .validate((data) => !contains(data[0], ','))
    .on('data', (data) => {
      csvData.push(data);
    })
    .on('data-invalid', (row, rowNumber) =>
      console.log(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`)
    )
  )
  .on('end', () => {
    const query = "COPY summary (summary, short_summary, copyright) FROM '/Users/alonzosanchez/sdc/ec2database/summary.csv' WITH (FORMAT CSV, DELIMITER ',');"


    db.connect((err,client, done) => {
      if (err) throw err;

      try {
        client.query(query, (err, res) => {
          if(err) {
            console.log('err here', err.stack)
          } else {
            console.log('inserted data')
          }
        });

      } finally {
        done();
      }
    })
  })
}
async function seed() {
  await writeToCsvFile();
  let stream = fs.createReadStream(filename);
  stream.pipe(seedDatabase())
}

seed();