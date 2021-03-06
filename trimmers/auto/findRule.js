const { removeHash, removeTrailingSlash, useHttp, useHttps } = require('../tools');
const { URL } = require('url');
const { userAgent } = require('../../config');
const agent = require('superagent');
const cheerio = require('cheerio');
const checkSamePage = require('./checkSamePage');
const saveRule = require('./saveRule');
const applyRules = require('./applyRules');

async function findRule(url, rules) {
  let originalWebpage;
  let ruleMethodList;
  let changed = false;
  let ruleQueryPreserveList = [];
  let ruleQueryRemoveList = [];
  const originalUrl = new URL(url);

  if (!rules) {
    changed = true;
    removeHash(url);
    removeTrailingSlash(url);
    ruleMethodList = ['removeHash', 'removeTrailingSlash'];
    try {
      useHttps(url);
      originalWebpage = await agent.get(url.toString()).set('user-agent', userAgent);
      ruleMethodList.push('useHttps');
    } catch (err) {
      try {
        useHttp(url);
        originalWebpage = await agent.get(url.toString()).set('user-agent', userAgent);
        ruleMethodList.push('useHttp');
      } catch (err) {
        return url;
      }
    }
  } else {
    const lists = await applyRules(url, rules);
    ruleQueryPreserveList = lists.ruleQueryPreserveList;
    ruleQueryRemoveList = lists.ruleQueryRemoveList;
    if (checkIfGoodToGo(url, ruleQueryPreserveList)) {
      return url;
    }
    originalWebpage = await agent.get(url.toString()).set('user-agent', userAgent);
  }

  const original$ = cheerio.load(originalWebpage.text);
  const originalTitle = original$('title')[0].children[0].data;
  let lastUrl = new URL(url);
  try {
    if (!url.searchParams) {
      if (changed) {
        await saveRule(url, ruleMethodList, ruleQueryRemoveList, ruleQueryPreserveList);
      }
      return url;
    }

    const queryKeys = [];
    for (const key of url.searchParams.keys()) {
      if (!ruleQueryPreserveList.includes(key)) {
        queryKeys.push(key);
      }
    }

    if (queryKeys.length > 0) {
      changed = true;
    }

    for (const key of queryKeys) {
      lastUrl = new URL(url);
      url.searchParams.delete(key);
      try {
        if (await checkSamePage(url, originalTitle)) {
          ruleQueryRemoveList.push(key);
        } else {
          ruleQueryPreserveList.push(key);
        }
      } catch (err) {
        url = lastUrl;
        ruleQueryPreserveList.push(key);
      }
    }
    lastUrl = new URL(url);
  } catch (err) {
    // Do nothing.
  }

  if (changed) {
    const rules = await saveRule(lastUrl, ruleMethodList, ruleQueryRemoveList, ruleQueryPreserveList);
    await applyRules(originalUrl, rules);
    return originalUrl;
  }

  return lastUrl;
}

function checkIfGoodToGo(url, ruleQueryPreserveList) {
  if (!url.searchParams) return true;

  const keys = url.searchParams.keys();
  for (const key of keys) {
    if (!ruleQueryPreserveList.includes(key)) {
      return false;
    }
  }

  return true;
}

module.exports = findRule;
