    var desktop = (function(){
      function get_permission(){
        if (Notification && Notification.permission !== 'granted') {
          Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
              Notification.permission = status;
            }
          });
        }
        return Notification && Notification.permission==='granted';
      }
      get_permission();

      var dtns = [];
      function show(obj){
        if (dtns.length < pref.notify.desktop.limit)
          if (Notification.permission === 'granted' || get_permission()) show_1(obj);
      }

      function show_1(obj){
        var dtn = new Notification(obj.title, obj);
        dtn.onclick = win_focus;
        var id = setTimeout(close_1, pref.notify.desktop.lifetime*1000);
        dtns[dtns.length] = [dtn, id];
      }
      function close_1(){dtns.shift()[0].close();}
      function win_focus(){window.focus();for (var i=dtns.length-1;i>=0;i--) if (dtns[i][0]===this || i==0) {if (dtns[i][1]) clearTimeout(dtns[i][1]);dtns.splice(i,1);break;}}
      return {
        show : show,
      }
    })();


var pref = {notify: {desktop: {lifetime:2.5, limit:30},
                    },
           };

var count = 0;
function make_dt(){
  desktop.show({body: 'count = '+count,
                title: 'crash_test',
                tag: count});
  setTimeout(make_dt,1000);
  count++;
}
make_dt();
