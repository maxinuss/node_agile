const bunyan = require('bunyan');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const targetElementId = "sendMessageButton";

const logger = bunyan.createLogger({ name: "myapp" });

try {
  const sampleFile = fs.readFileSync('./samples/sample.html');
  const dom = new JSDOM(sampleFile);

  const button = dom.window.document.getElementById(targetElementId)
  logger.info(`Successfully found element. Element Text: ${button.textContent}`);
  const array = Array.prototype.slice.apply(button.attributes);
  logger.info(array.map(attr => `${attr.name} = ${attr.value}`).join(', '));
} catch (err) {
  logger.error('Error trying to find element by id', err);
}
