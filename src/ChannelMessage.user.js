// ==UserScript==
// @name test_leak_in_ChannelMessage
// @version 2016.01.17.0
// @description test code for memory leaks in ChannelMessage
// @include http*://*
// @grant unsafeWindow
// ==/UserScript==

if (window.top===window.self) {
  var body = document.getElementsByTagName('body')[0];
  var inputs = document.createElement('div');
  inputs.innerHTML = '<input type="checkbox"> output to console<br>'+
                     'every<input type="text" size="3" style="text-align: right;" value="500">ms<br>'+
                     'size:<input type="text" size="3" style="text-align: right;" value="1000">KB<br>'+
                     '<div>status</div><br>'+
                     '<button>start</button>';
  var stat = inputs.getElementsByTagName('div')[0];
  var button = inputs.getElementsByTagName('button')[0];
  body.appendChild(inputs);
  
  var ifr_wrapper = document.createElement('div');
  ifr_wrapper.innerHTML = '<iframe name="childWindow"></iframe>'
  var ifr = ifr_wrapper.childNodes[0];
  body.appendChild(ifr);
  ifr.addEventListener("load", iframeLoaded, false);
  var childWindow = window.open('https://meguca.org/favicon.ico','childWindow');
  
  var total_num = 0;
  var total_size = 0;

  function iframeLoaded() {
    button.onclick = function(e) {
      e.preventDefault();
          
      var channel = new MessageChannel();
      childWindow.postMessage('Open channel...', '*', [channel.port2]);
//      childWindow.postMessage('Open channel...', [channel.port2], '*'); // also work.
  
      var data = body.innerHTML;
      channel.port1.onmessage = handleMessage;
      function handleMessage(e) {
        var out = inputs.getElementsByTagName('input')[0].checked;
        var interval = parseInt(inputs.getElementsByTagName('input')[1].value,10);
        var size = parseInt(inputs.getElementsByTagName('input')[2].value,10)*1024;
        if (data.length*2<size) {
          while (data.length*2<size) data += body.innerHTML;
          console.log('Data length: '+data.length);
        }
        if (out) console.log('parent: got a message.');
        total_size += data.length*2;
        total_num++;
        stat.textContent = 'sent: '+total_num+' messages, '+total_size.toLocaleString()+' Bytes.'
        setTimeout(function(){
          if (out) console.log('send to child');
          channel.port1.postMessage(JSON.stringify([out, interval, data]));},interval) // send data
      }
    }
  }
} else {
  //ifr.innerHTML = '<div>sub iframe</div><div>status</div>'+
  //  '<script>'+
  //    'var stat = document.getElementsByTagName("div")[1];'+
  //    'onmessage = function(e) {'+
  //       'console.log("echo to parent");'+
  //       'setTimeout(function(){e.ports[0].postMessage(e.data);},5000) // echo'+
  //    '}'+
  //  '</script>';

  onmessage = function(e) {
    var port = e.ports[0];
    function port_message(e) {
      var val = JSON.parse(e.data);
      var out = val[0];
      var interval = val[1];
      if (out) console.log("child: got a message.");
      setTimeout(function(){
        if (out) console.log("echo to parent");
        port.postMessage(e.data);},interval) // echo
    }
    window.onmessage = null;
    port.onmessage = port_message;
    e.ports[0].postMessage(e.data); // echo
  }
}

