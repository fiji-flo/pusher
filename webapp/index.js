'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const ts = $('#ts');
  const utcOffset = (new Date()).getTimezoneOffset() * 60000;
  const vapidKey = '';
  const b = $('#subscription');
  const setReg = (e) => {
    e && console.log(e);
    console.log('subscribe');
    b.classList.remove('checked');
    b.onclick = () => {
      subscribePush('/push', {}, vapidKey)
        .then(setUnreg).catch(setReg);
    };
  };
  const setUnreg = (e) => {
    e && console.log(e);
    console.log('unsubscribe');
    b.classList.add('checked');
    b.onclick = () => {
      unsubscribePush('/push')
        .then(setReg).catch(setUnreg);
    };
  };
  const sent = () => {
    $('#title').value = '';
    $('#body').value = '';
  };
  const problem = (err) => {
    alert(`unable to create reminder: ${err}`);
  }
  const r = $('.reminder');
  r.onclick = () => {
    remind('/push', {
      title: $('#title').value,
      body: $('#body').value,
      ts: (new Date($('#ts').value)).getTime() + utcOffset
    }).then(sent).catch(problem);
  };

  setUpPush('sw.js').then(b => { b ? setUnReg() : setReg(); }).catch(setUnreg);
})();
