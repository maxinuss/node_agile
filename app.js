const bunyan = require('bunyan');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const targetElementId = "make-everything-ok-button";

const logger = bunyan.createLogger({ name: "myapp" });


try {
  let baseFileName = process.argv[2];
  let diffFileName = process.argv[3];

  const baseFile = fs.readFileSync(baseFileName);
  const baseFileDom = new JSDOM(baseFile);
  const baseButton = baseFileDom.window.document.getElementById(targetElementId);

  const diffFile = fs.readFileSync(diffFileName);
  const diffFileDom = new JSDOM(diffFile);

  let baseFeatures = extractFeatures(baseButton);

  let actualBest = { score: 0, element: null };
  let result = findBestMatch(actualBest, diffFileDom.window.document.getElementsByTagName('html')[0], baseFeatures);

  console.log('Score: ', actualBest.score);
  console.log('Path: ', getPath(actualBest.element));
  console.log('Features: ', extractFeatures(actualBest.element));

  function findBestMatch(actualBest, element, features) {
    let score = compareFeatures(features, extractFeatures(element));

    if(score > actualBest.score) {
      actualBest.score = score;
      actualBest.element = element;
    }

    for (let i=0; i < element.children.length; i++) {
      let child = element.children[i];

      findBestMatch(actualBest, child, features);
    }
  }

  function compareFeatures(features1, features2) {
    let score = features1.reduce((accum, f) => { return accum + getFeatureScore(f, features2) }, 0);
    //console.log(score);
    return score;
  }

  function getFeatureScore(feature, features) {

    for (let i=0; i < features.length; i++) {
      if (features[i].tagName && features[i].tagName === feature.tagName) {
        //console.log(feature);
        return feature.weight;
      }

      if (features[i].attrName && features[i].attrName === feature.attrName &&
        features[i].attrValue === feature.attrValue) {
        //console.log(feature);
        return feature.weight;
      }
    }

    return 0;
  }

  function extractFeatures(element) {
    let features = [];
    features.push({ tagName: element.tagName, weight: 5 });

    for (let i=0; i < element.attributes.length; i++) {
      let weight = 1;
      let attrName = element.attributes[i].name;
      if (attrName === 'class') {
        weight = 3;
      }
      if (attrName === 'id') {
        weight = 5;
      }

      features.push({ attrName: attrName, attrValue: element.attributes[i].value, weight: weight });
    }

    return features;
  }

  function getPath(element) {
    let parent = element;
    let path = [];
    while(parent != null) {
      path.push(parent);
      parent = parent.parentElement;
    }

    return path.reverse().map((elm) => {
      let index = '';
      if(elm.parentElement != null) {
        let siblings = elm.parentElement.children;
        let siblingsSameTag = [];
        for (let i=0; i<siblings.length; i++)
          if (siblings[i].tagName===elm.tagName)
            siblingsSameTag.push(siblings[i]);
        let i = siblingsSameTag.indexOf(elm);
        if (siblingsSameTag.length > 1)
          index = '[' + i + ']';
      }

      return elm.tagName + index;
    }).join(' > ');
  }
} catch (err) {
  logger.error('Error trying to find element by id', err);
}
