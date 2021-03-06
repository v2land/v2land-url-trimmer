const { removeAllQueries, removeHash, useHttps } = require('../../tools');
const { getPathname } = require('../../utils');
const agent = require('superagent');
const cheerio = require('cheerio');
const { URL } = require('url');
const { userAgent } = require('../../../config');

const board = {
  'news_gov_bbs': 'gov',
  'news2_bbs': 'news',
  'tech_bbs': 'tech',
  'money_bbs': 'money',
  'ent2_bbs': 'ent',
  'sports2_bbs': 'sports',
};

async function mobileNeteaseUrlTrimmer(url) {
  removeAllQueries(url);
  removeHash(url);
  useHttps(url);
  const pathname = getPathname(url);
  const response = await agent.get(url.toString()).set('user-agent', userAgent);
  const $ = cheerio.load(response.text);
  const boardId = $('html').attr('data-boardid');

  const time = $('span')[0].children[0].data.split(' ');
  const date = time[0].split('-').slice(-2).join('');
  const hour = time[1].split(':')[0];

  if (Object.keys(board).includes(boardId)) {
    url = new URL(`https://${board[boardId]}.163.com/18/${date}/${hour}/${pathname[2]}`);
    return require('./news.163.com.site').trimmer(url);
  }

  if (boardId === 'dy_wemedia_bbs') {
    return new URL(`http://dy.163.com/v2/article/detail/${pathname[2]}`);
  }

  return url;
}

module.exports = {
  trimmer: mobileNeteaseUrlTrimmer,
  domains: ['c.m.163.com'],
};
