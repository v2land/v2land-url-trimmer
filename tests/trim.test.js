const testcases = require('./testcases');
const trimmer = require('../index');
const expect = require('expect');

describe('Test URL trimmer', async function() {
  for (const testcase of Object.keys(testcases)) {
    it('#url: ' + testcase, async function() {
      const result = await trimmer.trim(testcase);
      console.log(result.toString());
      expect(result.toString()).toEqual(testcases[testcase]);
    }).timeout(10000);
  }
});
