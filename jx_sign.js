/*
京喜签到
cron 20 1,8 * * * jx_sign.js
活动入口：京喜APP-我的-京喜签到

已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#京喜签到
20 1,8 * * * jx_sign.js, tag=京喜签到, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "20 1,8 * * *" script-path=jx_sign.js,tag=京喜签到

===============Surge=================
京喜签到 = type=cron,cronexp="20 1,8 * * *",wake-system=1,timeout=3600,script-path=jx_sign.js

============小火箭=========
京喜签到 = type=cron,script-path=jx_sign.js, cronexpr="20 1,8 * * *", timeout=3600, enable=true
 */
const $ = new Env('京喜签到');
const JD_API_HOST = "https://m.jingxi.com/";
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
let UA, UAInfo = {}, isLoginInfo = {};
$.shareCodes = [];
$.blackInfo = {}
$.appId = "0ac98";
const JX_FIRST_RUNTASK = $.isNode() ? (process.env.JX_FIRST_RUNTASK && process.env.JX_FIRST_RUNTASK === 'xd' ? '5' : '1000') : ($.getdata('JX_FIRST_RUNTASK') && $.getdata('JX_FIRST_RUNTASK') === 'xd' ? '5' : '1000')
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
!(async () => {
  $.CryptoJS = $.isNode() ? require("crypto-js") : CryptoJS;
  if (!cookiesArr[0]) {
    $.msg($.name, "【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取", "https://bean.m.jd.com/bean/signIndex.action", { "open-url": "https://bean.m.jd.com/bean/signIndex.action" });
    return;
  }
  await requestAlgo();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.isLogin = true;
      UA = `jdpingou;iPhone;4.13.0;14.4.2;${randomString(40)};network/wifi;model/iPhone10,2;appBuild/100609;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/1;hasOCPay/0;supportBestPay/0;session/${Math.random * 98 + 1};pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`
      UAInfo[$.UserName] = UA
      if (isLoginInfo[$.UserName] === false) {

      } else {
        if (!isLoginInfo[$.UserName]) {
          await TotalBean();
          isLoginInfo[$.UserName] = $.isLogin
        }
      }
      if (i === 0) console.log(`\n正在收集助力码请等待\n`)
      if (!isLoginInfo[$.UserName]) continue
      if (JX_FIRST_RUNTASK === '5') {
        $.signhb_source = '5'
      } else if (JX_FIRST_RUNTASK === '1000') {
        $.signhb_source = '1000'
      }
      await signhb(1)
      await $.wait(500)
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      if (isLoginInfo[$.UserName] === false) {

      } else {
        if (!isLoginInfo[$.UserName]) {
          await TotalBean();
          isLoginInfo[$.UserName] = $.isLogin
        }
      }
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`)
      if (!isLoginInfo[$.UserName]) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, { "open-url": "https://bean.m.jd.com/bean/signIndex.action" })

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`)
        }
        continue
      }
      UA = UAInfo[$.UserName]
      if (JX_FIRST_RUNTASK === '5') {
        console.log(`开始运行喜豆任务`)
        $.taskName = '喜豆'
        $.signhb_source = '5'
        await main()
        console.log(`\n开始运行红包任务`)
        $.taskName = '红包'
        $.signhb_source = '1000'
        await main(false)
      } else if (JX_FIRST_RUNTASK === '1000') {
        console.log(`开始运行红包任务`)
        $.taskName = '红包'
        $.signhb_source = '1000'
        await main()
        console.log(`\n开始运行喜豆任务`)
        $.taskName = '喜豆'
        $.signhb_source = '5'
        await main(false)
      }
    }
  }
})()
    .catch((e) => {
      $.log("", `❌ ${$.name}, 失败! 原因: ${e}!`, "");
    })
    .finally(() => {
      $.done();
    })

async function main(help = true) {
  $.commonlist = []
  $.bxNum = []
  $.black = false
  $.canHelp = true
  await signhb(2)
  await $.wait(2000)
  if (!$.sqactive && $.signhb_source === '5') {
    console.log(`未选择自提点，跳过执行`)
    return
  }
  if (help) {
    if ($.canHelp) {
      if ($.shareCodes && $.shareCodes.length) {
        console.log(`\n开始内部互助\n`)
        for (let j = 0; j < $.shareCodes.length; j++) {
          if ($.shareCodes[j].num == $.shareCodes[j].domax) {
            $.shareCodes.splice(j, 1)
            j--
            continue
          }
          if ($.shareCodes[j].use === $.UserName) {
            console.log(`不能助力自己`)
            continue
          }
          console.log(`账号 ${$.UserName} 去助力 ${$.shareCodes[j].use} 的互助码 ${$.shareCodes[j].smp}`)
          if ($.shareCodes[j].max) {
            console.log(`您的好友助力已满`)
            continue
          }
          await helpSignhb($.shareCodes[j].smp)
          await $.wait(2000)
          if (!$.black) $.shareCodes[j].num++
          break
        }
      }
    } else {
      console.log(`今日已签到，无法助力好友啦~`)
    }
  }
  if (!$.black) {
    await helpSignhb()
    if ($.commonlist && $.commonlist.length) {
      console.log(`开始做${$.taskName}任务`)
      for (let j = 0; j < $.commonlist.length && !$.black; j++) {
        await dotask($.commonlist[j]);
        await $.wait(2000);
      }
    } else {
      console.log(`${$.taskName}任务已完成`)
    }
    if ($.bxNum && $.bxNum.length) {
      for (let j = 0; j < $.bxNum[0].bxNum; j++) {
        await bxdraw()
        await $.wait(2000)
      }
    }
    if ($.signhb_source === '1000') await SignedInfo()
  } else {
    console.log(`此账号已黑`)
  }
  await $.wait(2000)
}

// 查询信息
function signhb(type = 1) {
  let body = '';
  if ($.signhb_source === '5') body = `type=0&signhb_source=${$.signhb_source}&smp=&ispp=1&tk=`
  return new Promise((resolve) => {
    $.get(taskUrl("signhb/query", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} query签到 API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1])
          if ($.signhb_source === '5') {
            $.sqactive = '';
            if (!data.sqactive) return
            $.sqactive = data.sqactive
          }
          const {
            smp,
            commontask,
            sharetask,
            signlist = []
          } = data
          let domax, helppic, status
          if (sharetask) {
            domax = sharetask.domax
            helppic = sharetask.helppic
            status = sharetask.status
          }
          let helpNum = 0
          if (helppic) helpNum = helppic.split(";").length - 1
          switch (type) {
            case 1:
              if (status === 1) {
                let max = false
                if (helpNum == domax) max = true
                $.shareCodes.push({
                  'use': $.UserName,
                  'smp': smp,
                  'num': helpNum || 0,
                  'max': max,
                  'domax': domax
                })
              }
              break
            case 2:
              for (let key of Object.keys(signlist)) {
                let vo = signlist[key]
                if (vo.istoday === 1) {
                  if (vo.status === 1 && data.todaysign === 1) {
                    console.log(`今日已签到`)
                    $.canHelp = false
                  } else {
                    console.log(`今日未签到`)
                  }
                }
              }
              console.log(`【签到互助码】${smp}`)
              if (helpNum) console.log(`已有${helpNum}人助力`)
              if (commontask) {
                for (let i = 0; i < commontask.length; i++) {
                  if (commontask[i].task && commontask[i].status != 2) {
                    $.commonlist.push(commontask[i].task)
                  }
                }
              }
              console.log(`可开启宝箱${data.baoxiang_left}个`)
              $.bxNum.push({
                'bxNum': data.baoxiang_left
              })
              break
            default:
              break
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 签到 助力
function helpSignhb(smp = '') {
  return new Promise((resolve) => {
    $.get(taskUrl("signhb/query", `type=1&signhb_source=${$.signhb_source}&smp=${smp}&ispp=1&tk=`), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} query助力 API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1])
          const {
            signlist = []
          } = data
          for (let key of Object.keys(signlist)) {
            let vo = signlist[key]
            if (vo.istoday === 1) {
              if (vo.status === 1 && data.todaysign === 1) {
                // console.log(`今日已签到`)
              } else {
                console.log(`此账号已黑`)
                $.black = true
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 任务
function dotask(task) {
  let body;
  if ($.signhb_source === '5') {
    body = `task=${task}&signhb_source=${$.signhb_source}&ispp=1&sqactive=${$.sqactive}&tk=`
  } else {
    body = `task=${task}&signhb_source=${$.signhb_source}&ispp=1&tk=`
  }
  return new Promise((resolve) => {
    $.get(taskUrl("signhb/dotask", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} dotask API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1])
          if (data.ret === 0) {
            console.log($.signhb_source === '5' ? `完成任务 获得${data.sendxd}喜豆` : `完成任务 获得${data.sendhb}红包`);
          } else if (data.ret === 1003) {
            console.log(`此账号已黑`);
            $.black = true;
          } else {
            console.log(JSON.stringify(data));
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

// 宝箱
function bxdraw() {
  let body;
  if ($.signhb_source === '5') {
    body = `ispp=1&sqactive=${$.sqactive}&tk=`
  } else {
    body = `ispp=1&tk=`
  }
  return new Promise((resolve) => {
    $.get(taskUrl("signhb/bxdraw", body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err));
          console.log(`${$.name} bxdraw API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1])
          if (data.ret === 0) {
            console.log($.signhb_source === '5' ? `开启宝箱 获得${data.sendxd}喜豆` : `开启宝箱 获得${data.sendhb}红包`);
          } else {
            console.log(JSON.stringify(data));
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 双签
function SignedInfo() {
  return new Promise(resolve => {
    $.get(JDtaskUrl("SignedInfo", `_=${Date.now()}`), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} SignedInfo API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          const { data: { jd_sign_status, jx_sign_status, double_sign_status } } = data
          if (data.retCode === 0) {
            if (double_sign_status === 0) {
              if (jd_sign_status === 1 && jx_sign_status === 1) {
                await IssueReward()
              } else {
                console.log(`京东或京喜未签到，无法双签`)
              }
            } else {
              console.log(`已完成双签`)
            }
          } else {
            console.log(JSON.stringify(data))
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function IssueReward() {
  return new Promise(resolve => {
    $.get(JDtaskUrl("IssueReward"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(JSON.stringify(err))
          console.log(`${$.name} IssueReward API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.retCode === 0){
            console.log(`双签成功：获得${data.data.jx_award}京豆`)
          } else {
            console.log(`任务完成失败，错误信息${JSON.stringify(data)}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function taskUrl(functionId, body = '') {
  let url = ``
  if (body) {
    url = `${JD_API_HOST}fanxiantask/${functionId}?${body}`;
    url += `&_stk=${getStk(url)}`;
    url += `&_ste=1&h5st=${decrypt(Date.now(), '', '', url)}&_=${Date.now() + 2}&sceneval=2&g_login_type=1&callback=jsonpCBK${String.fromCharCode(Math.floor(Math.random() * 26) + "A".charCodeAt(0))}&g_ty=ls`;
  } else {
    url = `${JD_API_HOST}fanxiantask/${functionId}?_=${Date.now() + 2}&sceneval=2&g_login_type=1&callback=jsonpCBK${String.fromCharCode(Math.floor(Math.random() * 26) + "A".charCodeAt(0))}&g_ty=ls`;
  }
  return {
    url,
    headers: {
      "Host": "m.jingxi.com",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": UA,
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Referer": "https://st.jingxi.com/",
      "Cookie": cookie
    }
  }
}
function JDtaskUrl(functionId, body = '') {
  let url = `https://wq.jd.com/jxjdsignin/${functionId}?${body ? `${body}&` : ''}sceneval=2&g_login_type=1&g_ty=ajax`
  return {
    url,
    headers: {
      "Host": "wq.jd.com",
      "Accept": "application/json",
      "Origin": "https://wqs.jd.com",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Referer": "https://wqs.jd.com/",
      "Cookie": cookie
    }
  }
}
function getStk(url) {
  let arr = url.split('&').map(x => x.replace(/.*\?/, "").replace(/=.*/, ""))
  return encodeURIComponent(arr.filter(x => x).sort().join(','))
}
function randomString(e) {
  e = e || 32;
  let t = "abcdef0123456789", a = t.length, n = "";
  for (let i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a));
  return n
}

function TotalBean() {
  return new Promise(resolve => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        "Host": "me-api.jd.com",
        "Accept": "*/*",
        "User-Agent": "ScriptableWidgetExtension/185 CFNetwork/1312 Darwin/21.0.0",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cookie": cookie
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            console.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
/*
修改时间戳转换函数，京喜工厂原版修改
 */
Date.prototype.Format = function (fmt) {
  var e,
      n = this, d = fmt, l = {
        "M+": n.getMonth() + 1,
        "d+": n.getDate(),
        "D+": n.getDate(),
        "h+": n.getHours(),
        "H+": n.getHours(),
        "m+": n.getMinutes(),
        "s+": n.getSeconds(),
        "w+": n.getDay(),
        "q+": Math.floor((n.getMonth() + 3) / 3),
        "S+": n.getMilliseconds()
      };
  /(y+)/i.test(d) && (d = d.replace(RegExp.$1, "".concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
  for (var k in l) {
    if (new RegExp("(".concat(k, ")")).test(d)) {
      var t, a = "S+" === k ? "000" : "00";
      d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : ("".concat(a) + l[k]).substr("".concat(l[k]).length))
    }
  }
  return d;
}

async function requestAlgo() {
  $.fingerprint = await generateFp();
  const options = {
    "url": `https://cactus.jd.com/request_algo?g_ty=ajax`,
    "headers": {
      'Authority': 'cactus.jd.com',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
      'Content-Type': 'application/json',
      'Origin': 'https://st.jingxi.com',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Referer': 'https://st.jingxi.com/',
      'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7'
    },
    'body': JSON.stringify({
      "version": "3.0",
      "fp": $.fingerprint,
      "appId": $.appId.toString(),
      "timestamp": Date.now(),
      "platform": "web",
      "expandParams": ""
    })
  }
  return new Promise(async resolve => {
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`request_algo 签名参数API请求失败，请检查网路重试`)
        } else {
          if (data) {
            // console.log(data);
            data = JSON.parse(data);
            if (data['status'] === 200) {
              $.token = data.data.result.tk;
              let enCryptMethodJDString = data.data.result.algo;
              if (enCryptMethodJDString) $.enCryptMethodJD = new Function(`return ${enCryptMethodJDString}`)();
              // console.log(`获取签名参数成功！`)
              // console.log(`fp: ${$.fingerprint}`)
              // console.log(`token: ${$.token}`)
              // console.log(`enCryptMethodJD: ${enCryptMethodJDString}`)
            } else {
              // console.log(`fp: ${$.fingerprint}`)
              console.log('request_algo 签名参数API请求失败')
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function decrypt(time, stk, type, url) {
  stk = stk || (url ? getUrlData(url, '_stk') : '')
  if (stk) {
    const timestamp = new Date(time).Format("yyyyMMddhhmmssSSS");
    let hash1 = '';
    if ($.fingerprint && $.token && $.enCryptMethodJD) {
      hash1 = $.enCryptMethodJD($.token, $.fingerprint.toString(), timestamp.toString(), $.appId.toString(), $.CryptoJS).toString($.CryptoJS.enc.Hex);
    } else {
      const random = '5gkjB6SpmC9s';
      $.token = `tk01wcdf61cb3a8nYUtHcmhSUFFCfddDPRvKvYaMjHkxo6Aj7dhzO+GXGFa9nPXfcgT+mULoF1b1YIS1ghvSlbwhE0Xc`;
      $.fingerprint = 5287160221454703;
      const str = `${$.token}${$.fingerprint}${timestamp}${$.appId}${random}`;
      hash1 = $.CryptoJS.SHA512(str, $.token).toString($.CryptoJS.enc.Hex);
    }
    let st = '';
    stk.split(',').map((item, index) => {
      st += `${item}:${getUrlData(url, item)}${index === stk.split(',').length -1 ? '' : '&'}`;
    })
    const hash2 = $.CryptoJS.HmacSHA256(st, hash1.toString()).toString($.CryptoJS.enc.Hex);
    // console.log(`\nst:${st}`)
    // console.log(`h5st:${["".concat(timestamp.toString()), "".concat(fingerprint.toString()), "".concat($.appId.toString()), "".concat(token), "".concat(hash2)].join(";")}\n`)
    return encodeURIComponent(["".concat(timestamp.toString()), "".concat($.fingerprint.toString()), "".concat($.appId.toString()), "".concat($.token), "".concat(hash2), "".concat("3.0"), "".concat(time)].join(";"))
  } else {
    return '20210318144213808;8277529360925161;10001;tk01w952a1b73a8nU0luMGtBanZTHCgj0KFVwDa4n5pJ95T/5bxO/m54p4MtgVEwKNev1u/BUjrpWAUMZPW0Kz2RWP8v;86054c036fe3bf0991bd9a9da1a8d44dd130c6508602215e50bb1e385326779d'
  }
}

/**
 * 获取url参数值
 * @param url
 * @param name
 * @returns {string}
 */
function getUrlData(url, name) {
  if (typeof URL !== "undefined") {
    let urls = new URL(url);
    let data = urls.searchParams.get(name);
    return data ? data : '';
  } else {
    const query = url.match(/\?.*/)[0].substring(1)
    const vars = query.split('&')
    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=')
      if (pair[0] === name) {
        // return pair[1];
        return vars[i].substr(vars[i].indexOf('=') + 1);
      }
    }
    return ''
  }
}
/**
 * 模拟生成 fingerprint
 * @returns {string}
 */
function generateFp() {
  let e = "0123456789";
  let a = 13;
  let i = '';
  for (; a--; )
    i += e[Math.random() * e.length | 0];
  return (i + Date.now()).slice(0,16)
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
